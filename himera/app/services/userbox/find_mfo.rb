# app/services/userbox/find_mfo.rb
module Userbox
  class FindMfo
    SOURCES = %w[zaymer_ru mfogate_ru mfo].freeze

    def initialize(phones)
      # Ensure we always eager load phone_datum to avoid N+1
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
      @phones.each do |phone|
        datum = phone.phone_datum
        next unless datum&.userbox_explain.present?

        if has_mfo_source?(datum.userbox_explain)
          datum.update!(has_mfo: true)
          puts "[mfo] #{phone.phonenumber || phone.id} → has_mfo ✅"
        else
          puts "[mfo] #{phone.phonenumber || phone.id} → no mfo"
        end
      end
    end

    private

    def has_mfo_source?(explain_json)
      items = explain_json.dig("data", "items")
      return false unless items.is_a?(Array)

      items.any? do |item|
        source = item.dig("source", "database")
        SOURCES.include?(source)
      end
    end
  end
end