# app/models/phone_user.rb
class PhoneUser < ApplicationRecord
  belongs_to :phone_datum
  has_many :phone_passports, dependent: :destroy

  # possible statuses: new, match, no_match
  scope :with_status, ->(status) { where(status: status) }
  scope :new_status, -> { with_status('new') }
  scope :matches, -> { with_status('match') }
  scope :no_matches, -> { with_status('no_match') }

  # possible pochta_statuses: pochta_match, pochta_no_match
  scope :with_pochta_status, ->(pochta_status) { where(pochta_status: pochta_status) }
  scope :pochta_new_status, -> { with_pochta_status('new') }
  scope :pochta_matches, -> { with_pochta_status('match') }
  scope :pochta_no_matches, -> { with_pochta_status('no_match') }

  validates :firstname, :lastname, :birthday, presence: true
  validates :middlename, presence: true, allow_nil: true

  before_validation :normalize_person_fields

  private

  def normalize_person_fields
    self.firstname = self.firstname.to_s.strip.upcase.to_s
    self.lastname = self.lastname.to_s.strip.upcase.to_s
    self.middlename = self.middlename.to_s.strip.upcase.to_s
    self.birthday = self.birthday.to_s.strip

    self.firstname = nil if self.firstname.blank?
    self.lastname = nil if self.lastname.blank?
    self.middlename = nil if self.middlename.blank?
    self.birthday = nil if self.birthday.blank?
  end
end