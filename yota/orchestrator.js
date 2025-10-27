// scraper/orchestrator.js
const { fetchRegionsByOperator } = require("./database");
const { runScraper } = require("./runScraper");

const operator = "yota";

async function orchestrate() {
  const proxyConfig = {
    "1986": 2,
    "proxy6": 2,
    "lightning": 3,
    "asocks": 3,
  };

  console.log("[ORCH] Proxy configuration:", proxyConfig);

  const totalCount = Object.values(proxyConfig).reduce((a, b) => a + b, 0);
  const regions = await fetchRegionsByOperator(operator, totalCount * 2);

  console.log(`[ORCH] Fetched ${regions.length} regions to process.`);

  const delayBetweenStarts = 5000;
  const scraperPromises = [];

  for (const [proxyType, amount] of Object.entries(proxyConfig)) {
    for (let i = 0; i < amount; i++) {
      console.log(`[ORCH] Launching scraper ${scraperPromises.length + 1}: proxyType=${proxyType}`);

      // each scraper gets full region list
      scraperPromises.push(runScraper(regions, proxyType));
      await new Promise((r) => setTimeout(r, delayBetweenStarts));
    }
  }

  console.log(`[ORCH] All ${scraperPromises.length} scrapers launched. Monitoring...`);

  await Promise.all(scraperPromises);
}

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("\n[ORCH] 🛑 Caught SIGINT, shutting down gracefully...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("\n[ORCH] 🛑 Caught SIGTERM, shutting down gracefully...");
  process.exit(0);
});

orchestrate().catch((error) => {
  console.error("[ORCH] Unexpected orchestrator error:", error);
  process.exit(1);
});