# app/services/userbox/explain.rb
require "net/http"
require "json"
require "uri"

module Userbox
  class Explain
    API_BASE = "https://api.usersbox.ru/v1".freeze
    TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkX2F0IjoxNzM1NTM5NDExLCJhcHBfaWQiOjE3MzU1Mzk0MTF9.64nORgzPCrFyk2diBAzo5k1XvzX0AnavgjxQACsNKHw".freeze
    THREADS_COUNT = 2

    def initialize(phones)
      # Always eager load phone_datum to avoid N+1
      @phones =
        if phones.is_a?(ActiveRecord::Relation)
          phones.includes(:phone_datum).to_a
        else
          Array(phones).tap do |arr|
            ActiveRecord::Associations::Preloader.new.preload(arr, :phone_datum)
          end
        end
    end

    def call
      queue = Queue.new
      @phones.each { |phone| queue << phone }

      threads = Array.new(THREADS_COUNT) do
        Thread.new do
          while (phone = queue.pop(true) rescue nil)
            process_phone(phone)
          end
        end
      end

      threads.each(&:join)
    end

    private

    def process_phone(phone)
      datum = phone.phone_datum || phone.build_phone_datum

      # Skip if already fetched
      return if datum.userbox_explain.present?

      puts "[explain] #{phone.phonenumber || phone.id} ▶ request"
      response = fetch_explain(phone.phonenumber)

      if response
        datum.update!(userbox_explain: response)
        puts "[explain] #{phone.phonenumber} → saved JSON"
      else
        puts "[explain] #{phone.phonenumber} → saved error JSON"
      end
    rescue => e
      puts "❌ [explain] #{phone.phonenumber} error: #{e.class} – #{e.message}"
    end

    def fetch_explain(phone_number)
      uri = URI("https://api.usersbox.ru/v1/explain?q=#{ERB::Util.url_encode(phone_number)}")
      req = Net::HTTP::Get.new(uri)
      req["Authorization"] = TOKEN # if needed: "Bearer #{TOKEN}"

      res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
        http.request(req)
      end

      return nil unless res.is_a?(Net::HTTPSuccess)
      JSON.parse(res.body)
    rescue => e
      puts "❌ [http] #{phone_number} – #{e.class}: #{e.message}"
      nil
    end
  end
end