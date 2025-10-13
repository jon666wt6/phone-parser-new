# app/services/himera_auth_service.rb
require 'net/http'
require 'net/https' # Required for HTTPS
require 'json'
require 'uri'
require 'ostruct'

class HimeraAuthService
  LOGIN_URL = URI("https://himera-search.biz/api/v1/rest/auth/login")
  CREDENTIALS = {
    username: "montecristofe@gmail.com",
    password: "muzEri9LB4shrxI@",
  }.freeze

  TOKEN_CACHE_KEY = 'himera_auth_token'.freeze
  TOKEN_EXPIRY_BUFFER_MINUTES = 5

  def self.get_token
    new.token
  end

  def self.get_proxy_agent
    new.create_proxy_agent
  end

  def token
    cached_data = Rails.cache.read(TOKEN_CACHE_KEY)

    if cached_data.is_a?(Hash) && cached_data[:token] && cached_data[:expires_at]
      expires_at = Time.parse(cached_data[:expires_at])
      if expires_at - TOKEN_EXPIRY_BUFFER_MINUTES.minutes > Time.current
        Rails.logger.info "⚡️ Using cached Himera token (expires #{expires_at})"
        return cached_data[:token]
      end
    end

    Rails.logger.info "🔐 Fetching new Himera token..."
    fetch_new_token
  rescue StandardError => e
    Rails.logger.error "Failed to fetch Himera token: #{e.message}"
    raise # Re-raise the exception to indicate failure
  end

  # Making create_proxy_agent a public instance method
  # Alternatively, it could be a public class method (`self.create_proxy_agent`)
  # if it doesn't rely on instance variables of HimeraAuthService.
  # For now, let's keep it an instance method and call `new.create_proxy_agent` from the class method.
  def create_proxy_agent
    proxy = Proxy.find_by(type: 'lightning') # Assuming Proxy.inheritance_column = nil is set

    unless proxy&.url && proxy.username && proxy.password
      raise "Failed to fetch valid 'lightning' proxy from database."
    end

    uri = URI.parse("http://#{proxy.url}")

    OpenStruct.new(
      address: uri.host,
      port: uri.port || 80,
      username: proxy.username,
      password: proxy.password
    )
  end

  private # Everything below this line is private

  def fetch_new_token
    proxy_agent = create_proxy_agent # This now calls the public instance method from within the instance

    http = Net::HTTP.new(LOGIN_URL.host, LOGIN_URL.port, proxy_agent.address, proxy_agent.port)
    http.use_ssl = (LOGIN_URL.scheme == 'https')

    if proxy_agent.username && proxy_agent.password
      http.proxy_user = proxy_agent.username
      http.proxy_pass = proxy_agent.password
    end

    request = Net::HTTP::Post.new(LOGIN_URL.request_uri, 'Content-Type' => 'application/json')
    request.body = CREDENTIALS.to_json

    response = http.request(request)
    body = JSON.parse(response.body)

    unless response.is_a?(Net::HTTPSuccess) && body['token'] && body['expires_at']
      Rails.logger.error "❌ Himera Login failed: Status #{response.code}, Body: #{JSON.pretty_generate(body)}"
      raise "Himera login failed with status #{response.code}"
    end

    token_data = {
      token: body['token'],
      expires_at: body['expires_at']
    }

    expires_at_time = Time.parse(body['expires_at'])

    Rails.cache.write(TOKEN_CACHE_KEY, token_data, expires_in: expires_at_time - Time.current)

    Rails.logger.info "✅ New Himera token received, expires #{body['expires_at']}"
    token_data[:token]
  end
end