# app/models/phone_datum.rb
class PhoneDatum < ApplicationRecord
  has_many :phone_users, dependent: :destroy
  has_many :phone_passports, dependent: :destroy # Add this line

  belongs_to :phone
end