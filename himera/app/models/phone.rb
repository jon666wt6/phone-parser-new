# app/models/phone.rb
class Phone < ApplicationRecord
  has_many :phone_users, dependent: :destroy
  has_one :phone_datum, class_name: 'PhoneDatum', dependent: :destroy

  scope :without_phone_datum, -> { where.missing(:phone_datum) }
  scope :with_pochta_pam, -> { where.not(pam: nil) }
  scope :with_sbp_pam, -> { where.not(sbp_pam: nil) }
  scope :with_phone_datum, -> { joins(:phone_datum) }
  scope :with_userbox_explain, -> { joins(:phone_datum).where.not(phone_data: { userbox_explain: nil }) }

  scope :_new, -> { where(status: 'new') }
  scope :exported, -> { where(status: 'exported') }

  scope :yota, -> { where(operator: 'yota') }
  scope :beeline, -> { where(operator: 'beeline') }
  scope :t2, -> { where(operator: 't2') }
end