module Export
  module DataService
    def self.export_matched_phone_passports_today(output_directory: nil)
      require "csv"

      Rails.logger.info "Starting export of today's matched PhonePassports..."

      start_of_today = Time.zone.now.all_day
      output_dir = output_directory || Rails.root.join("tmp")

      FileUtils.mkdir_p(output_dir) unless File.directory?(output_dir)

      output_file_name =
        "phone_passport_matches_#{Date.current.strftime('%Y%m%d')}.csv"
      output_file_path = File.join(output_dir, output_file_name)

      matched_phone_passports =
        PhonePassport
          .where(created_at: start_of_today)
          .where(status: "match")
          .includes(:phone_user, phone_datum: :phone) # ✅ eager load phone + operator
          .order(
            Arel.sql(
              "CASE WHEN jsonb_typeof(himera_credit->'score') = 'number' " \
              "THEN CAST(himera_credit->>'score' AS INTEGER) ELSE NULL END DESC NULLS LAST"
            ),
            :id
          )

      CSV.open(output_file_path, "wb") do |csv|
        csv << [
          "Phone",
          "Operator", # ✅ new column
          "Credit Score",
          "Passport",
          "Birthday",
          "First Name",
          "Last Name",
          "Middle Name",
          "Inquiries All Time Count"
        ]

        matched_phone_passports.each do |phone_passport|
          himera_credit = phone_passport.himera_credit || {}
          phone_user = phone_passport.phone_user
          phone = phone_passport.phone_datum&.phone

          inquiries_all_time_count =
            himera_credit.dig("inquiries", "all_time_count")

          csv << [
            phone&.phonenumber,
            phone&.operator, # ✅ added operator
            himera_credit["score"],
            phone_passport.passport_number,
            phone_user&.birthday,
            phone_user&.firstname,
            phone_user&.lastname,
            phone_user&.middlename,
            inquiries_all_time_count
          ]
        end
      end

      Rails.logger.info "Data successfully saved to: #{output_file_path}"
      output_file_path
    rescue => e
      Rails.logger.error "Error during data export: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      nil
    end
  end
end