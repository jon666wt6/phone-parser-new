# frozen_string_literal: true

class ExportPhones
  EXPORT_DIR = Rails.root.join("exports")

  def initialize(scope: Phone.where.not(status: "exported"), filename: default_filename)
    @scope = scope
    @filename = filename
  end

  def call
    ensure_export_dir!
    phones = @scope.to_a

    return puts("✅ No phones to export") if phones.empty?

    File.open(file_path, "w") do |f|
      phones.each { |phone| f.puts(phone.phonenumber) }
    end

    puts "📦 Exported #{phones.size} phones → #{file_path}"

    # Mark as exported
    Phone.where(id: phones.map(&:id)).update_all(status: "exported", updated_at: Time.current)
    puts "🔄 Updated status to 'exported' for #{phones.size} phones."

    file_path
  rescue StandardError => e
    Rails.logger.error("❌ PhoneExportService failed: #{e.message}")
    raise
  end

  private

  def ensure_export_dir!
    FileUtils.mkdir_p(EXPORT_DIR) unless Dir.exist?(EXPORT_DIR)
  end

  def default_filename
    "phones_export_#{Time.zone.now.strftime('%Y%m%d_%H%M%S')}.txt"
  end

  def file_path
    EXPORT_DIR.join(@filename)
  end
end