# app/services/phone_data_saver.rb
require 'text'

class PhoneDataSaver
  FUZZY_DISTANCE_THRESHOLD = 2

  # Entry point for the service
  def self.save_users(phone_datum, new_users_from_api)
    new(phone_datum, new_users_from_api).save
  end

  def initialize(phone_datum, new_users_from_api)
    @phone_datum = phone_datum
    @new_users_from_api = new_users_from_api
    @canonical_users = []
  end

  def save
    # Iterate through each new user from the API response
    @new_users_from_api.each do |new_user|
      # Normalize the new user's fields before comparison
      new_user.send(:normalize_person_fields) # Call the private normalization method

      # Find if there's a fuzzy match in our current list of canonical users
      existing_match = find_fuzzy_match_for(new_user, @canonical_users)

      if existing_match
        # A duplicate was found. Decide which one is better based on data_count.
        if new_user.data_count.to_i > existing_match.data_count.to_i
          # The new user is more reliable. Update the existing one with the new data.
          Rails.logger.info "Merging new user data (DataCount: #{new_user.data_count}) into existing PhoneUser ID #{existing_match.id} (DataCount: #{existing_match.data_count})."
          existing_match.assign_attributes(
            firstname: new_user.firstname,
            lastname: new_user.lastname,
            middlename: new_user.middlename,
            data_count: new_user.data_count,
            max_year: new_user.max_year
            # Birthday should already match, statuses default to new
          )
        else
          # The existing user is more or equally reliable. Discard the new one.
          Rails.logger.info "Discarding new user (DataCount: #{new_user.data_count}) as it's a duplicate of existing PhoneUser ID #{existing_match.id} (DataCount: #{existing_match.data_count})."
        end
      else
        # No duplicate found. This new user is unique so far. Add it to our list.
        @canonical_users << new_user
      end
    end

    # After iterating and merging, save all records in the canonical list.
    # This will update modified records and create new ones.
    @canonical_users.each do |user|
      user.save! # Use save! to raise an error if any validation (like presence) fails
    end

    Rails.logger.info "PhoneDataSaver finished. Saved/updated #{@canonical_users.count} canonical users for PhoneDatum ID #{@phone_datum.id}."
  end

  private

  def find_fuzzy_match_for(new_user, existing_users)
    existing_users.find do |existing_user|
      # Birthday must be an exact match for a fuzzy FIO comparison
      next false unless new_user.birthday == existing_user.birthday

      is_a_fuzzy_match?(new_user, existing_user)
    end
  end

  def is_a_fuzzy_match?(user1, user2)
    # Prepare normalized FIO parts for comparison
    u1_first = user1.firstname.to_s
    u1_middle = user1.middlename.to_s
    u1_last = user1.lastname.to_s

    u2_first = user2.firstname.to_s
    u2_middle = user2.middlename.to_s
    u2_last = user2.lastname.to_s

    # 1. Check for exact match (already normalized)
    return true if (u1_first == u2_first && u1_middle == u2_middle && u1_last == u2_last)

    # 2. Check for swapped Firstname/Lastname
    return true if (u1_first == u2_last && u1_last == u2_first && u1_middle == u2_middle)

    # 3. Check for Levenshtein distance
    first_dist = Text::Levenshtein.distance(u1_first, u2_first)
    last_dist = Text::Levenshtein.distance(u1_last, u2_last)
    # Middle name is optional for distance check; only compare if both are present
    middle_dist = (u1_middle.present? && u2_middle.present?) ? Text::Levenshtein.distance(u1_middle, u2_middle) : 0

    (first_dist <= FUZZY_DISTANCE_THRESHOLD &&
     last_dist <= FUZZY_DISTANCE_THRESHOLD &&
     middle_dist <= FUZZY_DISTANCE_THRESHOLD)
  end
end