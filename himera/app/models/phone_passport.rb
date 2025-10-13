# app/models/phone_passport.rb
class PhonePassport < ApplicationRecord
  belongs_to :phone_datum
  belongs_to :phone_user, optional: true
  validates :passport_number, presence: true, length: { is: 10, message: "should be 10 symbols long" }

  validates :status, presence: true, inclusion: {
    in: %w[new match no_match valid invalid validation_api_error validation_unknown_response]
  }

  scope :with_status, ->(status) { where(status: status) }
  scope :valid_status, -> { with_status('valid') }
  scope :invalid_status, -> { with_status('invalid') }
  scope :new_status, -> { with_status('new') }
  scope :matches, -> { with_status('match') }
  scope :no_matches, -> { with_status('no_match') }
  scope :validation_api_error, -> { with_status('validation_api_error') }

  validate :validate_series_range

  private

  def validate_series_range
    return unless passport_number.present? && passport_number.length == 10

    series_part = passport_number[2..3] # Get the 3rd and 4th characters (0-indexed)

    # Check if the part consists of digits and convert to integer
    if series_part =~ /^\d{2}$/
      series_value = series_part.to_i
      # Check if the integer value is within the desired range (0 to 30 inclusive)
      unless series_value >= 0 && series_value <= 30
        errors.add(:passport_number, "series (3rd and 4th digits) must be between 00 and 30")
      end
    else
      # If the 3rd and 4th characters are not even digits
      errors.add(:passport_number, "series (3rd and 4th digits) must be numeric")
    end
  end
end
