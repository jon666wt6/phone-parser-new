# app/services/userbox/export.rb
require "csv"
require "fileutils"

module Userbox
  class Export
    def initialize(phones, output_directory: nil)
      @phones =
        if phones.is_a?(ActiveRecord::Relation)
          phones.includes(:phone_datum).to_a
        else
          Array(phones).tap do |arr|
            ActiveRecord::Associations::Preloader.new.preload(arr, :phone_datum)
          end
        end

      @output_dir = output_directory || Rails.root.join("tmp")
      FileUtils.mkdir_p(@output_dir) unless File.directory?(@output_dir)
    end

    def call
      timestamp = Time.zone.now.strftime("%Y%m%d_%H%M%S")
      output_file_name = "userbox_mfo_#{timestamp}.txt"
      output_file_path = File.join(@output_dir, output_file_name)

      phones_with_mfo = @phones.select { |p| p.phone_datum&.has_mfo }

      CSV.open(output_file_path, "wb") do |csv|
        csv << ["phonenumber"] # header row

        phones_with_mfo.each do |phone|
          csv << [phone.phonenumber]
        end
      end

      Rails.logger.info "✅ Userbox MFO export saved to: #{output_file_path}"
      output_file_path
    rescue => e
      Rails.logger.error "❌ Error during Userbox::Export: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      nil
    end
  end
end