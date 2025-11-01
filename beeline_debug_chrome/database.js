const { Client } = require('pg');

// PostgreSQL local connection details
const settings = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "app_production",
};

const dbClient = new Client(settings);

(async () => {
  try {
    await dbClient.connect();
  } catch (err) {
    console.error("[DB] Connection error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();

async function fetchProxyByType(proxyType) {
  try {
    // Start a transaction
    await dbClient.query('BEGIN');

    // Atomic SELECT and UPDATE to fetch one proxy of the given type
    const query = `
      WITH selected_proxy AS (
        SELECT *
        FROM proxies
        WHERE type = $1
        ORDER BY updated_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE proxies
      SET updated_at = NOW()
      FROM selected_proxy
      WHERE proxies.id = selected_proxy.id
      RETURNING selected_proxy.*;
    `;

    const result = await dbClient.query(query, [proxyType]);

    if (result.rows.length > 0) {
      // This now includes *all* fields from the proxies table
      const proxy = result.rows[0];

      // Commit the transaction
      await dbClient.query('COMMIT');

      return proxy;
    } else {
      // No proxies found, rollback
      await dbClient.query('ROLLBACK');
      throw new Error('No available proxies found');
    }
  } catch (error) {
    // Rollback in case of any error
    await dbClient.query('ROLLBACK');
    console.error('Error fetching proxy:', error.message);
    throw error;
  }
}

async function savePhonesToLocalDB(phones, region, digits) {
  if (!Array.isArray(phones) || phones.length === 0) {
    return;
  }

  // --- Deduplication Step ---
  const phoneMap = new Map();
  phones.forEach((phone) => {
    const originalPhoneNumber = String(phone.phonenumber);
    const correctedPhoneNumber = originalPhoneNumber.startsWith('7')
      ? originalPhoneNumber
      : '7' + originalPhoneNumber;
    // Use the corrected phone number as the key. If a duplicate key is set,
    // the Map automatically keeps the latest one encountered.
    // We also store the corrected number within the object for consistency later.
    phoneMap.set(correctedPhoneNumber, {
      ...phone, // Spread original phone data
      phonenumber: correctedPhoneNumber, // Ensure the object has the corrected number
      price: phone.price ?? 0, // Ensure price has a default value
    });
  });
  // Get the unique phone objects from the Map's values
  const uniquePhones = Array.from(phoneMap.values());
  // --- End Deduplication ---

  // If after deduplication there are no phones left
  if (uniquePhones.length === 0) {
    // console.log(`[${region}][${digits}] No unique phones found after deduplication.`);
    return;
  }

  try {
    // Construct the query using the deduplicated array
    const query = `
      INSERT INTO phones (phonenumber, region, operator, status, price, updated_at)
      VALUES ${uniquePhones
        .map(
          (_, i) =>
            `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`
        )
        .join(', ')}
      ON CONFLICT (phonenumber) DO NOTHING
      RETURNING phonenumber;
    `;

    const nowTimestamp = new Date();

    // Flatten the deduplicated array into values
    const values = uniquePhones.flatMap((phone) => {
      // We already corrected the phonenumber and added default price during deduplication
      return [
        phone.phonenumber, // Already corrected
        phone.region,
        phone.operator,
        phone.status,
        phone.price, // Already defaulted
        nowTimestamp,
      ];
    });

    // Execute the query
    const result = await dbClient.query(query, values);

    if (result.rowCount > 0) {
      // Update log to show original count vs unique count processed
      console.log(
        `Region: \u001b[92m${region}\u001b[0m Digits: ${digits} Found: ${uniquePhones.length} Inserted: \u001b[92m${result.rowCount}\u001b[0m`
      );
    } else {
      // console.log(`[${region}][${digits}] Found: ${phones.length}, Unique: ${uniquePhones.length}. No rows inserted or updated.`);
    }
  } catch (error) {
    console.error(
      `[${region}][${digits}] Error saving/updating phones (Unique count: ${uniquePhones.length}):`,
      error.message
    );
    // console.error('Error details:', error);
  }
}



// Update the start number in the regions table
async function updateStartNumber(operator, region, startNumber) {
  try {
    const query = `
      UPDATE regions
      SET last_parsed_number = $1
      WHERE region = $2 AND operator = $3
      RETURNING *
    `;
    const result = await dbClient.query(query, [startNumber, region, operator]);

    return result.rows;
  } catch (error) {
    console.error(`Error updating start number for region ${region} with operator ${operator}:`, error.message);
    return null;
  }
}

async function fetchLastParsedNumber(operator, region) {
  try {
    const query = `
      SELECT last_parsed_number
      FROM regions
      WHERE region = $1 AND operator = $2
      LIMIT 1;
    `;
    const result = await dbClient.query(query, [region, operator]);

    if (result.rows.length > 0 && result.rows[0].last_parsed_number !== null) {
      // Ensure it's returned as an integer
      return parseInt(result.rows[0].last_parsed_number, 10);
    } else {
      // Return 0 if no record found or last_parsed_number is null,
      // so the loop starts from the beginning for new regions.
      console.log(`[${region}] No last parsed number found, starting from 0.`);
      return 0;
    }
  } catch (error) {
    console.error(`[${region}] Error fetching start number for operator ${operator}:`, error.message);
    // Return null or 0 on error? Returning 0 might be safer to avoid skipping.
    return 0;
  }
}

async function fetchRegionsByOperator(operator) {
  try {
    const query = `
      SELECT region
      FROM regions
      WHERE operator = $1
        AND processing = true;
    `;
    const result = await dbClient.query(query, [operator]);
    // Return an array of region strings
    return result.rows.map((row) => row.region);
  } catch (error) {
    console.error(`Error fetching regions for operator ${operator}:`, error.message);
    throw error;
  }
}

module.exports = { fetchProxyByType, fetchLastParsedNumber, savePhonesToLocalDB, updateStartNumber, fetchRegionsByOperator };
