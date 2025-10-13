# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 0) do
  create_schema "pgsodium"
  create_schema "realtime"
  create_schema "storage"

  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "pgcrypto"

  create_table "auth", id: false, force: :cascade do |t|
    t.string "phone", limit: 20, null: false
    t.string "password", limit: 255, null: false
    t.boolean "auth_status", default: false
    t.string "type", limit: 20
    t.jsonb "meta"
    t.string "pb_b_id", limit: 255
    t.string "cabinet_session", limit: 255
    t.string "process_id", limit: 255
    t.timestamptz "created_at", default: -> { "CURRENT_TIMESTAMP" }

    t.unique_constraint ["phone"], name: "auth_phone_key"
  end

  create_table "banks", id: :serial, force: :cascade do |t|
    t.string "bank_name", limit: 255, default: "pochta", null: false
    t.string "card_number", limit: 16
    t.string "card_mask", limit: 8
    t.string "tail_mask", limit: 4
    t.string "description", limit: 100
    t.datetime "created_at", precision: nil, default: -> { "now()" }
    t.datetime "updated_at", precision: nil, default: -> { "now()" }
    t.string "status", limit: 20, default: "new", null: false
    t.integer "sort_order"
    t.string "vendor", limit: 20
    t.index ["bank_name", "description"], name: "idx_name_phone_mask"
    t.index ["bank_name", "tail_mask"], name: "idx_name_tail_mask"
    t.index ["card_number"], name: "unique_card_number", unique: true
  end

  create_table "donation_token", primary_key: "token", id: :text, force: :cascade do |t|
    t.timestamptz "created_at", default: -> { "now()" }
    t.text "status", default: "new"
  end

  create_table "masks", id: false, force: :cascade do |t|
    t.string "tail_mask", limit: 10
    t.string "bank_name", limit: 20, default: "pochta"
    t.string "phonenumber", limit: 20
    t.string "firstname", limit: 20
    t.string "surname", limit: 20
    t.string "lastname", limit: 20
    t.datetime "created_at", precision: nil, default: -> { "CURRENT_TIMESTAMP" }
    t.string "status", limit: 20, default: "not_found"

    t.unique_constraint ["phonenumber", "tail_mask"], name: "masks_phonenumber_tail_mask_key"
  end

  create_table "mixplat_url", id: :serial, force: :cascade do |t|
    t.string "hash", limit: 20, null: false
    t.string "name", limit: 200
    t.string "status", limit: 20, default: "new", null: false
    t.timestamptz "created_at", default: -> { "now()" }

    t.unique_constraint ["hash"], name: "mixplat_url_hash_unique"
  end

  create_table "performance", id: :serial, force: :cascade do |t|
    t.string "type", limit: 30, null: false
    t.integer "count", null: false
    t.datetime "created_at", precision: nil, default: -> { "now()" }, null: false
  end

  create_table "phone_data", id: :serial, force: :cascade do |t|
    t.integer "phone_id", null: false
    t.jsonb "himera_info"
    t.timestamptz "created_at", default: -> { "now()" }
    t.timestamptz "updated_at", default: -> { "now()" }
    t.index ["phone_id"], name: "idx_phone_data_phone_id"
    t.unique_constraint ["phone_id"], name: "phone_data_phone_id_key"
  end

  create_table "phone_passports", id: :serial, force: :cascade do |t|
    t.string "passport_number", limit: 255, null: false
    t.integer "phone_datum_id", null: false
    t.timestamptz "created_at", default: -> { "CURRENT_TIMESTAMP" }
    t.timestamptz "updated_at", default: -> { "CURRENT_TIMESTAMP" }
    t.string "status", limit: 255, default: "new"
    t.integer "phone_user_id"
    t.jsonb "himera_credit"
  end

  create_table "phone_users", id: :serial, force: :cascade do |t|
    t.date "birthday"
    t.integer "data_count"
    t.timestamptz "created_at", default: -> { "now()" }
    t.timestamptz "updated_at", default: -> { "now()" }
    t.string "firstname", limit: 30
    t.string "lastname", limit: 30
    t.string "middlename", limit: 30
    t.integer "phone_datum_id", null: false
    t.string "max_year", limit: 255
    t.string "status", limit: 255, default: "new"
    t.string "pochta_status", limit: 255, default: "new"
  end

  create_table "phones", force: :cascade do |t|
    t.string "phonenumber", limit: 13
    t.string "status", limit: 10
    t.string "region", limit: 30
    t.string "operator", limit: 10
    t.string "price", limit: 10
    t.datetime "created_at", precision: nil, default: -> { "CURRENT_TIMESTAMP" }
    t.datetime "updated_at", precision: nil
    t.text "pochta_status", default: "new"
    t.string "pam", limit: 40
    t.string "sbp_status", limit: 100, default: "new", null: false
    t.string "sbp_pam", limit: 50
    t.text "sbp_banks", array: true
    t.index ["pochta_status"], name: "idx_phones_pochta_status"
    t.index ["status", "operator"], name: "idx_phones_status_operator"
    t.index ["status"], name: "idx_phones_status"
    t.unique_constraint ["phonenumber"], name: "unique_phonenumber"
  end

  create_table "proxies", id: :serial, force: :cascade do |t|
    t.string "url", limit: 100, null: false
    t.string "status", limit: 10
    t.string "username", limit: 100
    t.string "password", limit: 100
    t.string "type", limit: 10
    t.datetime "updated_at", precision: nil
    t.datetime "blocked_at", precision: nil
    t.datetime "created_at", precision: nil, default: -> { "now()" }
    t.datetime "yota_blocked_at", precision: nil
    t.boolean "rotating", default: false, null: false
    t.index ["url"], name: "proxy_url", unique: true
  end

  create_table "regions", id: :serial, force: :cascade do |t|
    t.string "region", limit: 30, null: false
    t.datetime "created_at", precision: nil
    t.string "operator", limit: 10
    t.boolean "processing", default: false
    t.string "full_name", limit: 100
    t.integer "mask_length", default: 4
    t.string "price", limit: 20
    t.string "mask"
    t.integer "last_parsed_number"
  end

  create_table "responses", force: :cascade do |t|
    t.string "phonenumber", null: false
    t.string "type", null: false
    t.string "status", default: "pending", null: false
    t.text "data"
    t.string "surname"
    t.string "name"
    t.string "middle_name"
    t.date "birth_date"
    t.bigint "fssp_phonenumber"
    t.text "total_debt"
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["phonenumber"], name: "index_responses_on_phonenumber"
  end

  create_table "stream_phones", force: :cascade do |t|
    t.uuid "stream_id", null: false
    t.string "phonenumber", null: false
    t.datetime "created_at", precision: nil, null: false
    t.datetime "updated_at", precision: nil, null: false
    t.index ["stream_id", "phonenumber"], name: "index_stream_phones_on_stream_id_and_phonenumber", unique: true
  end

  create_table "streams", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.bigint "user_id", null: false
    t.datetime "created_at", precision: nil
    t.index ["user_id"], name: "index_streams_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username", null: false
    t.text "avatar_url"
    t.decimal "balance", precision: 15, scale: 2, default: "0.0"
    t.datetime "created_at", precision: nil
    t.index ["username"], name: "index_users_on_username", unique: true
  end

  create_table "vendors", id: :serial, force: :cascade do |t|
    t.string "type", limit: 20, default: "donation-alerts", null: false
    t.string "description", limit: 100
    t.integer "rate", null: false
    t.string "name", limit: 100
    t.jsonb "data"
    t.string "amount_sum", array: true
  end

  create_table "vtb_users", id: :serial, force: :cascade do |t|
    t.string "fio", limit: 255, null: false
    t.date "birthday"
    t.string "phone", limit: 20
    t.string "oblast", limit: 255
    t.string "email", limit: 255
  end

  add_foreign_key "phone_data", "phones", name: "phone_data_phone_id_fkey", on_delete: :cascade
  add_foreign_key "phone_passports", "phone_data", name: "fk_phone_passports_phone_data", on_delete: :cascade
  add_foreign_key "phone_passports", "phone_users", name: "fk_phone_passports_phone_users", on_delete: :nullify
  add_foreign_key "phone_users", "phone_data", name: "fk_phone_users_phone_data", on_delete: :cascade
  add_foreign_key "responses", "phones", column: "phonenumber", primary_key: "phonenumber", name: "fk_responses_on_phonenumber"
  add_foreign_key "stream_phones", "phones", column: "phonenumber", primary_key: "phonenumber", name: "fk_stream_phones_on_phonenumber"
  add_foreign_key "stream_phones", "streams", name: "fk_stream_phones_on_stream_id"
  add_foreign_key "streams", "users", name: "fk_streams_on_user_id"
end
