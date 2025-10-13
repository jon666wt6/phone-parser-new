# app/services/credit_rating/combination_finder_service.rb
module CreditRating
  class CombinationFinderService
    def self.find_and_print(phone)
      new(phone).find_and_print
    end

    def initialize(phone)
      @phone = phone
    end

    def find_and_print
      phone_with_associations = Phone.includes(phone_datum: [:phone_users, :phone_passports])
                                     .find_by(id: @phone.id)

      phone_datum = phone_with_associations&.phone_datum
      return [] unless phone_datum

      # Filter the eager-loaded collections in Ruby (this is very fast).
      matched_users = phone_datum.phone_users.sort_by { |user| user.data_count.to_i }
                                             .reverse

      passports_to_process = phone_datum.phone_passports.select { |passport| passport.status == 'valid' && passport.himera_credit.nil? }

      if matched_users.empty? || passports_to_process.empty?
        Rails.logger.info "No valid combinations of matched users and unprocessed valid passports found for PhoneDatum ID #{phone_datum.id}."
        return []
      end

      combinations = matched_users.product(passports_to_process)

      puts "Found #{combinations.count} potential credit rating combinations to process for Phone: #{@phone.phonenumber}"
      combinations.each do |user, passport|
        fio = [user.lastname, user.firstname, user.middlename].compact.join(' ')
        puts "  - FIO: #{fio}, Birthday: #{user.birthday}, Passport: #{passport.passport_number}"
      end
      puts "--------------------------------------------------"

      combinations
    end
  end
end