# app/services/passport_batch_validator.rb
class PassportBatchValidator
  THREAD_POOL_SIZE = 5

  def initialize(passports)
    @passports = passports
  end

  def call
    queue = Queue.new
    @passports.each { |passport| queue << passport }

    workers = THREAD_POOL_SIZE.times.map do
      Thread.new do
        while (passport = queue.pop(true) rescue nil)
          validate_and_update(passport)
        end
      end
    end

    workers.each(&:join)
  end

  private

  def validate_and_update(passport)
    validation_result =
      PassportValidator.validate_passport_and_get_result(passport)

    if validation_result[:error]
      passport.status = "validation_api_error"
      Rails.logger.error(
        "PassportValidator API error for #{passport.passport_number}: " \
        "#{validation_result[:message]}"
      )
    elsif validation_result[:status_code] == 0
      passport.status = "invalid"
      Rails.logger.info("Passport #{passport.passport_number} marked as INVALID.")
    elsif validation_result[:status_code] == 1
      passport.status = "valid"
      Rails.logger.info("Passport #{passport.passport_number} marked as VALID.")
    else
      passport.status = "validation_unknown_response"
      Rails.logger.warn(
        "PassportValidator returned unknown status for " \
        "#{passport.passport_number}: #{validation_result[:status_code].inspect}"
      )
    end

    passport.save!
  rescue => e
    Rails.logger.error(
      "Unexpected error validating passport #{passport.passport_number}: #{e.message}"
    )
    passport.update!(status: "validation_unexpected_error")
  end
end