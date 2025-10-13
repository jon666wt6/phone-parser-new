# app/services/credit_rating/orchestrator_service.rb
require 'set'
require 'thread'

module CreditRating
  class OrchestratorService
    def self.process_phone(phone)
      new.run_for_phone(phone)
    end

    def self.process_phones(phones_collection, num_threads: 5)
      Rails.logger.info "→ [CreditRating::OrchestratorService] Starting processing of #{phones_collection.count} phones using #{num_threads} threads."

      threads = []
      phone_queue = Queue.new
      phones_collection.each { |phone| phone_queue << phone }

      num_threads.times do |i|
        threads << Thread.new do
          # Create a new instance of the service for each thread.
          # This ensures that any instance variables (though there aren't many
          # in your current `run_for_phone` method) are not shared.
          orchestrator_instance = new
          Thread.current[:name] = "CreditRating_Orchestrator_#{i+1}" # Name the thread for logging
          Rails.logger.debug "Thread #{Thread.current[:name]} started."

          until phone_queue.empty?
            phone = nil
            begin
              phone = phone_queue.pop(true) # pop(true) means raise an exception if empty
            rescue ThreadError
              # Queue is empty for this thread, break out of loop
              break
            end

            Rails.logger.info "Thread #{Thread.current[:name]} processing phone: #{phone.phonenumber}"
            orchestrator_instance.run_for_phone(phone)
          end
          Rails.logger.debug "Thread #{Thread.current[:name]} finished."
        end
      end

      # Wait for all threads to complete
      threads.each(&:join)
      Rails.logger.info "← [CreditRating::OrchestratorService] Finished processing all phones."
    end

    def run_for_phone(phone)
      unless phone.is_a?(Phone)
        Rails.logger.error "Input must be a Phone object. Received: #{phone.class}"
        return false
      end

      Rails.logger.info "--- Starting Credit Rating Orchestration for Phone: #{phone.phonenumber} ---"

      begin
        combinations = CreditRating::CombinationFinderService.find_and_print(phone)

        return true if combinations.empty?

        processed_passport_ids = Set.new
        successful_fio_keys = Set.new

        combinations.each do |user, passport|
          fio_key = [user.lastname, user.firstname, user.middlename].compact.join('|').mb_chars.downcase.to_s

          if processed_passport_ids.include?(passport.id)
            Rails.logger.info "Skipping combination for Passport ID #{passport.id} as it was already processed in this run."
            next
          end

          if successful_fio_keys.include?(fio_key)
            Rails.logger.info "Skipping combination for FIO '#{fio_key}' as it already had a successful credit match."
            next
          end

          CreditRating::HimeraService.run_search_for_user_and_passport(user, passport)

          passport.reload
          if passport.status == 'match'
            Rails.logger.info "FIO '#{fio_key}' had a successful match with Passport ID #{passport.id}. It will not be used for further searches."
            successful_fio_keys.add(fio_key)
            processed_passport_ids.add(passport.id)
          end
        end

        Rails.logger.info "--- Finished Credit Rating Orchestration for Phone: #{phone.phonenumber} ---"
        true
      rescue => e
        Rails.logger.error "❌ An error occurred during credit rating orchestration for Phone #{phone.phonenumber}: #{e.message}"
        false
      end
    end
  end
end