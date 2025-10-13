# app/services/phone_passport_saver.rb
class PhonePassportSaver
  # Entry point for the service
  def self.save_passports(phone_datum, new_passports_from_api)
    new(phone_datum, new_passports_from_api).save
  end

  def initialize(phone_datum, new_passports_from_api)
    @phone_datum = phone_datum
    @new_passports_from_api = new_passports_from_api
  end

  def save
    saved_count = 0
    @new_passports_from_api.each do |new_passport|
      # First, ensure the passport meets basic model validations before processing
      new_passport.valid?
      unless new_passport.errors.empty?
        Rails.logger.warn "Skipping new PhonePassport (number: #{new_passport.passport_number.inspect}) due to model validation error: #{new_passport.errors.full_messages.to_sentence}"
        next # Skip to next passport
      end

      # Default status, can be overridden by validator result
      new_passport.status = 'new' if new_passport.new_record? && new_passport.status.nil?

      begin
        # Call the external validation service
        validation_result = PassportValidator.validate_passport_and_get_result(new_passport)

        # Update passport status based on the validation result
        if validation_result[:error]
          new_passport.status = 'validation_api_error' # Or 'validation_failed'
          Rails.logger.error "PassportValidator API error for #{new_passport.passport_number}: #{validation_result[:message]}"
        elsif validation_result[:status_code] == 0
          new_passport.status = 'invalid'
          Rails.logger.info "Passport #{new_passport.passport_number} marked as INVALID."
        elsif validation_result[:status_code] == 1
          new_passport.status = 'valid'
          Rails.logger.info "Passport #{new_passport.passport_number} marked as VALID."
        else
          new_passport.status = 'validation_unknown_response' # For unexpected status codes
          Rails.logger.warn "PassportValidator returned unknown status for #{new_passport.passport_number}: #{validation_result[:status_code].inspect}"
        end

        new_passport.save! # Save the passport with its determined status
        saved_count += 1
        Rails.logger.info "Created/Updated PhonePassport: #{new_passport.inspect}"

      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.warn "Skipping PhonePassport (number: #{new_passport.passport_number.inspect}) due to validation error during save: #{e.message}"
      rescue ActiveRecord::RecordNotUnique => e
        Rails.logger.warn "Skipping PhonePassport (number: #{new_passport.passport_number.inspect}) due to database unique constraint violation: #{e.message}"
      rescue => e
        Rails.logger.error "Failed to save PhonePassport for PhoneDatum ID #{@phone_datum.id}, Passport: '#{new_passport.passport_number}'. Unexpected error: #{e.message}"
        raise # Re-raise to trigger rollback if called within a transaction
      end
    end

    Rails.logger.info "PhonePassportSaver finished. Saved/updated #{saved_count} passports for PhoneDatum ID #{@phone_datum.id}."
  rescue => e
    Rails.logger.error "PhonePassportSaver failed for PhoneDatum ID #{@phone_datum.id}: #{e.message}"
    raise # Re-raise to trigger rollback if called within a transaction
  end
end