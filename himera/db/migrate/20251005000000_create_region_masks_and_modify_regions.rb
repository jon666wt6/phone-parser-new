# db/migrate/20251005000000_create_region_masks_and_modify_regions.rb

class CreateRegionMasksAndModifyRegions < ActiveRecord::Migration[8.0]
  def change
    # 1. Create the new table to store individual masks and their status
    create_table :region_masks do |t|
      t.references :region, null: false, foreign_key: true
      t.string :mask, null: false
      t.integer :last_parsed_number, null: false, default: 0
      t.boolean :is_complete, null: false, default: false

      t.timestamps
    end

    # 2. Add a unique index to prevent duplicate masks for the same region
    add_index :region_masks, [:region_id, :mask], unique: true

    # 3. Add an index for efficiently finding the next available mask
    add_index :region_masks, [:region_id, :is_complete]

    # 4. Remove the old, now-redundant columns from the regions table
    # We keep `mask_length` as it's useful for generating the masks.
    remove_column :regions, :last_parsed_number, :integer
    remove_column :regions, :mask, :string
  end
end