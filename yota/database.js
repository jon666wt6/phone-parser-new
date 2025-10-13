// yota/database.js
const { Client } = require("pg");

const settings = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "app_development",
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
    if (typeof proxyType !== "string" || proxyType.trim() === "") {
      throw new Error("proxyType must be a non-empty string");
    }
    await dbClient.query("BEGIN");

    const query = `
      WITH selected_proxy AS (
        SELECT *
        FROM proxies
        WHERE type = $1
          AND ((yota_blocked_at IS NULL OR yota_blocked_at < NOW() - INTERVAL '5 minutes')
                OR rotating = TRUE)
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
      const proxy = result.rows[0];
      await dbClient.query("COMMIT");
      return proxy;
    } else {
      console.debug(`[fetchProxyByType] No available proxies for type="${proxyType}", rolling back`);
      await dbClient.query("ROLLBACK");
      throw new Error(`No available proxy found for type: ${proxyType}`);
    }
  } catch (error) {
    console.error(`[fetchProxyByType] Error fetching proxy for type="${proxyType}":`, error.message);
    try {
      await dbClient.query("ROLLBACK");
      console.debug("[fetchProxyByType] Transaction rolled back");
    } catch (rbErr) {
      console.error("[fetchProxyByType] Error rolling back transaction:", rbErr.message);
    }
    throw error;
  }
}

function normalizePhoneNumber(phoneNumber) {
  const phoneStr = String(phoneNumber);
  return phoneStr.startsWith("7") ? phoneStr : `7${phoneStr}`;
}

async function savePhonesToLocalDB(phones, region, digits, currentOffset, proxyType) {
  try {
    const query = `
      INSERT INTO phones (phonenumber, region, operator, status, price)
      VALUES ${phones
        .map(
          (_, i) =>
            `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
        )
        .join(", ")}
      ON CONFLICT (phonenumber) DO NOTHING
      RETURNING phonenumber;
    `;

    const values = phones.flatMap((phone) => [
      normalizePhoneNumber(phone.phonenumber),
      phone.region,
      phone.operator,
      "new",
      phone.price,
    ]);

    const result = await dbClient.query(query, values);

    const RED = "\u001b[91m";
    const GREEN = "\u001b[92m";
    const RESET = "\u001b[0m";
    const savedColor = result.rowCount === 0 ? RED : GREEN;

    console.log(
      `Region: ${GREEN}${region}${RESET} Proxy: ${GREEN}${proxyType}${RESET} Digits: ${digits} Offset: ${currentOffset} ` +
        `Saved: ${savedColor}${result.rowCount}${RESET}/${phones.length} phones`
    );
  } catch (error) {
    console.error("Error saving phones:", error.message);
  }
}

async function fetchLastScrapingState(operator, region) {
  try {
    const query = `
      SELECT last_parsed_number, mask
      FROM regions
      WHERE region = $1 AND operator = $2
      LIMIT 1;
    `;
    const result = await dbClient.query(query, [region, operator]);

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        lastMaskIndex: parseInt(row.mask, 10) || 0,
        lastOffset: parseInt(row.last_parsed_number, 10) || 0,
      };
    } else {
      console.log(`[${region}] No state found, starting from index 0, offset 0.`);
      return { lastMaskIndex: 0, lastOffset: 0 };
    }
  } catch (error) {
    console.error(
      `[${region}] Error fetching scraping state for operator ${operator}:`,
      error.message
    );
    return { lastMaskIndex: 0, lastOffset: 0 };
  }
}

async function updateScrapingState(operator, region, maskIndex, offset) {
  try {
    const query = `
      UPDATE regions
      SET last_parsed_number = $1, mask = $2
      WHERE region = $3 AND operator = $4
    `;
    const params = [maskIndex, offset, region, operator];
    await dbClient.query(query, params);
  } catch (error) {
    console.error(
      `[DB] Error updating state for region ${region}:`,
      error.message
    );
  }
}

async function fetchRegionsByOperator(operator, limit) {
  try {
    const query = `
      SELECT region, mask_length
      FROM regions
      WHERE operator = $1
        AND processing = true
      ORDER BY (mask::int) ASC
      LIMIT $2;
    `;
    const result = await dbClient.query(query, [operator, limit]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching regions for operator ${operator}:`, error.message);
    throw error;
  }
}

async function blockProxy(proxyId) {
  try {
    if (typeof proxyId !== "number" || proxyId <= 0) {
      throw new Error("proxyId must be a positive number");
    }
    const query = `
      UPDATE proxies
      SET yota_blocked_at = NOW()
      WHERE id = $1;
    `;
    const result = await dbClient.query(query, [proxyId]);
  } catch (error) {
    console.error(
      `[blockProxy] Error blocking proxy ID ${proxyId}:`,
      error.message
    );
  }
}

module.exports = {
  fetchProxyByType,
  savePhonesToLocalDB,
  updateScrapingState,
  fetchLastScrapingState,
  fetchRegionsByOperator,
  blockProxy,
};