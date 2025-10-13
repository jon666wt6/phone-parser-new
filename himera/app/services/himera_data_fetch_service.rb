# app/services/himera_data_fetch_service.rb
require 'net/http'
require 'net/https'
require 'json'
require 'uri'
require 'ostruct'

class HimeraDataFetchService
  SHORT_DATA_URL = URI("https://himera-search.biz/closed-data/getShortDataByPhone")
  USE_PROXY = false
  THREAD_POOL_SIZE = 5

  def self.process_phones(phones)
    new.process_multiple_phones_parallel(phones)
  end

  def process_multiple_phones_parallel(phones_collection)
    total_phones = phones_collection.size
    processed_count = 0
    skipped_existing = 0
    api_calls_made = 0
    db_updates_success = 0
    failures = 0

    mutex = Mutex.new
    queue = Queue.new
    phones_collection.each { |phone| queue << phone }

    Rails.logger.info "Starting parallel processing for #{total_phones} phones with #{THREAD_POOL_SIZE} threads..."

    # Prepare shared auth/token (so we don’t request token per thread)
    batch_himera_auth_agent, batch_himera_api_token =
      if HimeraDataFetchService::USE_PROXY
        [HimeraAuthService.get_proxy_agent, HimeraAuthService.get_token]
      else
        [OpenStruct.new(address: nil, port: nil, username: nil, password: nil), HimeraAuthService.get_token]
      end

    workers = THREAD_POOL_SIZE.times.map do
      Thread.new do
        while (phone = queue.pop(true) rescue nil)
          begin
            if phone.phone_datum.present? && phone.phone_datum.himera_info.present?
              Rails.logger.info "🔄 [DB:#{phone.phonenumber}] himera_info already exists. Skipping API call."
              mutex.synchronize do
                skipped_existing += 1
                processed_count += 1
              end
              next
            end

            himera_info_data = get_short_data_from_api(phone.phonenumber, batch_himera_auth_agent, batch_himera_api_token)

            ActiveRecord::Base.transaction do
              phone_datum = phone.phone_datum || phone.build_phone_datum
              phone_datum.himera_info = himera_info_data
              phone_datum.save!

              new_phone_users_from_api = (himera_info_data["persons"] || []).map do |person_data|
                phone_datum.phone_users.new(
                  firstname: person_data["Firstname"],
                  lastname: person_data["Lastname"],
                  middlename: person_data["Middlename"],
                  birthday: person_data["BirthDate"],
                  data_count: person_data["DataCount"],
                  max_year: person_data["MaxYear"]
                )
              end

              new_phone_passports_from_api = (himera_info_data["passports"] || []).map do |passport_number_str|
                cleaned_passport_number = passport_number_str.to_s.gsub(/\s+/, "")
                phone_datum.phone_passports.new(passport_number: cleaned_passport_number)
              end

              PhoneDataSaver.save_users(phone_datum, new_phone_users_from_api)
              PhonePassportSaver.save_passports(phone_datum, new_phone_passports_from_api)
            end

            Rails.logger.info "✅ [DB:#{phone.phonenumber}] himera_info processed successfully."

            mutex.synchronize do
              api_calls_made += 1
              db_updates_success += 1
              processed_count += 1
            end
          rescue => e
            Rails.logger.error "❌ Failed to process Phone #{phone.phonenumber}: #{e.message}"
            mutex.synchronize do
              failures += 1
              processed_count += 1
            end
          end
        end
      end
    end

    workers.each(&:join)

    Rails.logger.info "\n--- Parallel Processing Summary ---"
    Rails.logger.info "Total phones attempted: #{total_phones}"
    Rails.logger.info "Processed (total): #{processed_count}"
    Rails.logger.info "Skipped (himera_info already exists): #{skipped_existing}"
    Rails.logger.info "Himera API calls made: #{api_calls_made}"
    Rails.logger.info "Database himera_info updates/inserts: #{db_updates_success}"
    Rails.logger.info "Total failures (API/DB errors): #{failures}"
    Rails.logger.info "------------------------"

    {
      total_phones: total_phones,
      processed_count: processed_count,
      skipped_existing: skipped_existing,
      api_calls_made: api_calls_made,
      db_updates_success: db_updates_success,
      failures: failures
    }
  end

  # Fetches short data from Himera API (no changes needed here)
  def get_short_data_from_api(phone_number, agent, token)
    Rails.logger.info "→ [API:#{phone_number}] Fetching short data..."

    http = if agent && agent.address && agent.port
             Net::HTTP.new(SHORT_DATA_URL.host, SHORT_DATA_URL.port, agent.address, agent.port)
           else
             Net::HTTP.new(SHORT_DATA_URL.host, SHORT_DATA_URL.port)
           end

    http.use_ssl = (SHORT_DATA_URL.scheme == 'https')

    if agent&.username && agent&.password
      http.proxy_user = agent.username
      http.proxy_pass = agent.password
    end

    request = Net::HTTP::Post.new(SHORT_DATA_URL.request_uri, 'Content-Type' => 'application/json', 'Authorization' => token)
    request.body = { phone_number: phone_number }.to_json

    response = http.request(request)
    text_response = response.body

    unless response.is_a?(Net::HTTPSuccess)
      raise "API call failed for #{phone_number} with status #{response.code}: #{text_response}"
    end

    if text_response.to_s.strip.empty?
      raise "API call for #{phone_number} returned empty response."
    end

    js = JSON.parse(text_response)

    Rails.logger.info "  ✅ [API:#{phone_number}] Short data fetched successfully."
    js
  rescue JSON::ParserError => e
    raise "API for #{phone_number} returned invalid JSON: #{text_response.inspect}. Error: #{e.message}"
  rescue StandardError => e
    Rails.logger.error "  ❌ [API:#{phone_number}] Error fetching short data: #{e.message}"
    raise
  end
end