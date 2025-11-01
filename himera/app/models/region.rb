# app/models/region.rb
class Region < ApplicationRecord
  has_many :region_masks, dependent: :destroy

  scope :yota, -> { where(operator: 'yota') }
  scope :beeline, -> { where(operator: 'beeline') }
  scope :t2, -> { where(operator: 't2') }
end