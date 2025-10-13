# app/services/passport_validator.rb
require 'net/http'
require 'net/https'
require 'json'
require 'uri'
require 'ostruct'

class PassportValidator
  VALIDATION_URL = URI("https://rc-cloud.ru/pssprt/get_info")
  AUTH_TOKEN = "cG9zaGVsX25haHVpX3BpZG9yYXNfaGFja2VybWFu".freeze

  # --- Configuration for Retries and Timeouts ---
  API_TIMEOUT_SECONDS = 20
  MAX_RETRIES = 3
  RETRY_DELAY_SECONDS = 1
  RETRYABLE_ERRORS = [
    Net::OpenTimeout,
    Net::ReadTimeout,
    SocketError,
    Errno::ECONNRESET,
    Errno::ECONNREFUSED,
    Errno::EHOSTUNREACH
  ].freeze
  # ------------------------------------------------

  # Class method to initiate validation for a single PhonePassport
  # Returns a hash like { status_code: 1/0/nil, message: "...", error: true/false }
  def self.validate_passport_and_get_result(phone_passport)
    new.validate(phone_passport)
  end

  def initialize
    @proxy_agent = create_proxy_agent
  end

  def validate(phone_passport)
    Rails.logger.info "→ [PassportValidator:#{phone_passport.id}] Requesting validation for #{phone_passport.passport_number}"

    cleaned_passport_number = phone_passport.passport_number.to_s.gsub(/\s+/, '')
    unless cleaned_passport_number.length == 10
      Rails.logger.warn "→ [PassportValidator:#{phone_passport.id}] Passport number not 10 digits after cleaning: '#{cleaned_passport_number}'. Cannot validate."
      return { status_code: nil, message: "Passport number format invalid for API.", error: true }
    end

    series = cleaned_passport_number[0..3]
    number = cleaned_passport_number[4..9]

    params = {
      token: AUTH_TOKEN,
      series: series,
      number: number
    }

    retries = 0
    begin
      response_data = fetch_api_response(VALIDATION_URL, params)

      if response_data.is_a?(Hash) && response_data.key?("status")
        Rails.logger.info "   [PassportValidator:#{phone_passport.id}] API responded with status: #{response_data["status"]}"
        return { status_code: response_data["status"], message: "API response received.", error: false }
      else
        Rails.logger.warn "   [PassportValidator:#{phone_passport.id}] Unexpected API response structure: #{response_data.inspect}"
        return { status_code: nil, message: "Unexpected API response structure.", error: true }
      end
    rescue *RETRYABLE_ERRORS => e
      retries += 1
      if retries <= MAX_RETRIES
        Rails.logger.warn "   [PassportValidator:#{phone_passport.id}] API call failed (#{e.class}). Retrying #{retries}/#{MAX_RETRIES} in #{RETRY_DELAY_SECONDS}s..."
        sleep RETRY_DELAY_SECONDS
        retry # Jumps back to the beginning of the 'begin' block
      else
        Rails.logger.error "❌ [PassportValidator:#{phone_passport.id}] Error during API call after #{MAX_RETRIES} retries: #{e.message}"
        return { status_code: nil, message: "API call failed after retries: #{e.message}", error: true }
      end
    rescue => e # Catches non-retryable errors
      Rails.logger.error "❌ [PassportValidator:#{phone_passport.id}] Unrecoverable error during API call: #{e.message}"
      return { status_code: nil, message: "API call failed: #{e.message}", error: true }
    end
  end

  private

  def create_proxy_agent
    proxy = Proxy.where(type: 'lightning').order('RANDOM()').first

    unless proxy&.url && proxy.username && proxy.password
      Rails.logger.error "Failed to fetch a valid 'lightning' proxy from database."
      raise "No valid 'lightning' proxy found in the database." # Re-raise if no proxy available
    end

    uri = URI.parse("http://#{proxy.url}")
    OpenStruct.new(
      address: uri.host,
      port: uri.port || 80,
      username: proxy.username,
      password: proxy.password
    )
  end

  def fetch_api_response(url, params)
    http = Net::HTTP.new(url.host, url.port, @proxy_agent.address, @proxy_agent.port)
    http.use_ssl = (url.scheme == 'https')

    # --- Set Timeouts ---
    http.open_timeout = API_TIMEOUT_SECONDS # Time to wait for connection to open
    http.read_timeout = API_TIMEOUT_SECONDS # Time to wait for response data
    # --------------------

    if @proxy_agent.username && @proxy_agent.password
      http.proxy_user = @proxy_agent.username
      http.proxy_pass = @proxy_agent.password
    end

    request = Net::HTTP::Post.new(url.request_uri)
    request.set_form_data(params)

    response = http.request(request)
    text_response = response.body

    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.error "API call failed: Status #{response.code}, Response: #{text_response.inspect}"
      raise "API call failed with status #{response.code}"
    end

    if text_response.to_s.strip.empty?
      raise "API call returned empty response."
    end

    JSON.parse(text_response)
  rescue JSON::ParserError => e
    Rails.logger.error "API returned invalid JSON: #{text_response.inspect}. Error: #{e.message}"
    raise "API returned invalid JSON: #{e.message}"
  end
end