# app/services/himera_data_processor.rb
class HimeraDataProcessor
  def self.process(phone_datum)
    new(phone_datum).call
  end

  def initialize(phone_datum)
    @phone_datum = phone_datum
    @himera_info = phone_datum.himera_info
  end

  def call
    return unless @himera_info.is_a?(Hash)

    process_persons
    process_passports

    true # Indicate success
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Transaction failed for PhoneDatum ID #{@phone_datum.id}: #{e.message}"
    false
  rescue => e
    Rails.logger.error "Unexpected error processing PhoneDatum ID #{@phone_datum.id}: #{e.message}"
    false
  end

  private

  def process_persons
    persons = @himera_info["persons"]
    return unless persons.is_a?(Array)

    persons.each do |person_data|
      create_phone_user(person_data)
    end
  end

  def process_passports
    passports = @himera_info["passports"]
    return unless passports.is_a?(Array)

    passports.each do |passport_number|
      create_phone_passport(passport_number)
    end
  end

  def create_phone_user(person_data)
    return unless person_data.is_a?(Hash)

    birthday = begin
                 Date.strptime(person_data["BirthDate"], '%d.%m.%Y')
               rescue ArgumentError
                 nil
               end

    @phone_datum.phone_users.find_or_create_by!(
      firstname: person_data["Firstname"].upcase,
      lastname: person_data["Lastname"].upcase,
      middlename: person_data["Middlename"].upcase,
      birthday: birthday
    ) do |user|
      user.data_count = person_data["DataCount"]
      user.max_year = person_data["MaxYear"]
    end
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Failed to create PhoneUser for PhoneDatum ID #{@phone_datum.id}, Data: #{person_data.inspect}. Error: #{e.message}"
  end

  def create_phone_passport(passport_number)
    return unless passport_number.is_a?(String)

    cleaned_passport_number = passport_number.gsub(/\s+/, '') # Remove all whitespace characters

    @phone_datum.phone_passports.find_or_create_by!(passport_number: cleaned_passport_number)
    # The default status 'new' will be applied by the database or model default
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Failed to create PhonePassport for PhoneDatum ID #{@phone_datum.id}, Passport: '#{passport_number}' (cleaned to '#{cleaned_passport_number}'). Error: #{e.message}"
    # Optionally re-raise or handle more gracefully
  end
end