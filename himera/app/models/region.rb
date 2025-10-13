# app/models/region.rb
class Region < ApplicationRecord
  has_many :region_masks, dependent: :destroy
end