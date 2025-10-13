# app/services/himera_credit_rating_service.rb
require 'net/http'
require 'net/https'
require 'json'
require 'uri'
require 'ostruct'

module CreditRating
  class HimeraService
    FULL_CREDIT_URL = URI("https://himera-search.biz/closed-data/getFullCreditRating")

    # Class method to initiate the credit rating search for a specific PhoneUser and PhonePassport
    def self.run_search_for_user_and_passport(phone_user, phone_passport)
      new.run_search(phone_user, phone_passport)
    end

    def initialize
      # HimeraAuthService handles its own caching
      @auth_agent = HimeraAuthService.get_proxy_agent # Get the proxy agent once
      @api_token =  HimeraAuthService.get_token       # Get the token once
    end

    def run_search(phone_user, phone_passport)
      unless phone_user.is_a?(PhoneUser) && phone_passport.is_a?(PhonePassport)
        Rails.logger.error "Inputs must be PhoneUser and PhonePassport objects. Received: #{phone_user.class}, #{phone_passport.class}"
        return false
      end

      Rails.logger.info "→ [CreditRating:#{phone_user.id}/#{phone_passport.id}] Starting credit rating search."

      # Essential user data for the API call
      user_data = {
        lastname: phone_user.lastname,
        firstname: phone_user.firstname,
        middlename: phone_user.middlename,
        # Ensure birthday is in 'DD.MM.YYYY' format for API or convert it
        # If phone_user.birthday is a Date object, format it: phone_user.birthday.strftime('%d.%m.%Y')
        birthday: phone_user.birthday.is_a?(Date) ? phone_user.birthday.strftime('%d.%m.%Y') : phone_user.birthday.to_s
      }

      # Basic validation for essential user data
      unless user_data[:firstname].present? && user_data[:middlename].present? &&
             user_data[:lastname].present? && user_data[:birthday].present?
        Rails.logger.warn "→ [CreditRating:#{phone_user.id}/#{phone_passport.id}] Invalid user data (missing name/birthday). Skipping credit search."
        return false
      end

      # Remove spaces from passport number before sending to API
      passport_number_for_api = phone_passport.passport_number.to_s.gsub(/\s+/, '')

      # Validation for passport number
      unless passport_number_for_api.length == 10
        Rails.logger.warn "→ [CreditRating:#{phone_user.id}/#{phone_passport.id}] Passport number not 10 symbols after cleaning: '#{passport_number_for_api}'. Skipping API call."
        return false
      end

      Rails.logger.info "→ [CreditRating:#{phone_user.id}/#{phone_passport.id}] attempting full credit with passport #{passport_number_for_api}"

      request_body = user_data.merge(passport: passport_number_for_api).to_json

      begin
        response_data = fetch_api_response(FULL_CREDIT_URL, request_body)

        # Store response in the PhonePassport's himera_credit column
        phone_passport.himera_credit = response_data

        # Check for status=1 in the response
        if response_data.is_a?(Hash) && response_data["status"] == 1
          Rails.logger.info "   [CreditRating:#{phone_user.id}/#{phone_passport.id}] ✔️ status=1, success!"
          # Update PhonePassport: link to PhoneUser and set status
          phone_passport.phone_user = phone_user # Ensure explicit link if not already set (it should be)
          phone_passport.status = 'match'        # Set status to 'match'
          # No need to break loop as we only process one passport
        else
          Rails.logger.warn "   [CreditRating:#{phone_user.id}/#{phone_passport.id}] No status=1 for passport #{passport_number_for_api}. Status: #{response_data.is_a?(Hash) ? response_data["status"] : 'N/A'}"
          phone_passport.status = 'no_match' # Set status to 'no_match' or 'api_fail' if you want
        end

        # Save the PhonePassport, including the himera_credit and updated status/phone_user_id
        unless phone_passport.save
          Rails.logger.error "❌ Failed to save PhonePassport #{phone_passport.id}: #{phone_passport.errors.full_messages.to_sentence}"
          return false # Indicate failure
        end

        Rails.logger.info "✅ [CreditRating:#{phone_user.id}/#{phone_passport.id}] Credit rating search complete and passport updated."
        true # Indicate overall success
      rescue => e
        Rails.logger.error "❌ Failed to run credit rating search for PhoneUser ID #{phone_user.id}, Passport ID #{phone_passport.id}: #{e.message}"
        false
      end
    end

    private

    def fetch_api_response(url, body)
      http = Net::HTTP.new(url.host, url.port, @auth_agent.address, @auth_agent.port)
      http.use_ssl = (url.scheme == 'https')

      if @auth_agent.username && @auth_agent.password
        http.proxy_user = @auth_agent.username
        http.proxy_pass = @auth_agent.password
      end

      request = Net::HTTP::Post.new(url.request_uri, 'Content-Type' => 'application/json', 'Authorization' => @api_token)
      request.body = body

      response = http.request(request)
      text_response = response.body

      unless response.is_a?(Net::HTTPSuccess)
        raise "API call failed with status #{response.code}: #{text_response}"
      end

      if text_response.to_s.strip.empty?
        raise "API call returned empty response."
      end

      JSON.parse(text_response)
    rescue JSON::ParserError => e
      raise "API returned invalid JSON: #{text_response.inspect}. Error: #{e.message}"
    rescue StandardError => e
      Rails.logger.error "Error during API call: #{e.message}"
      raise # Re-raise
    end
  end
end
