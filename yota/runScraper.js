// scraper/runScraper.js
const { fetchProxyByType, fetchLastScrapingState, blockProxy } = require("./database");
const { selectRegion } = require("./helpers/select");
const { initializeBrowserSession } = require("./helpers/browser");

const operator = "yota";

// Cooldown periods in milliseconds: 1s, 1m, 10m
const cooldowns = [ 1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000,
                    1_000, 5_000, 10_000, 30_000, 60_000, 120_000, 300_000, 3600_000 ];
let cooldownIndex = 0;

async function runScraper(regions, proxyType) {
  while (true) {
    let browser = null;
    let currentProxy = null;

    // This object will track if we had any success during this session
    const sessionState = { hasFoundNumbers: false };

    // 🎲 Pick a random region from our pool
    const regionInfo = regions[Math.floor(Math.random() * regions.length)];
    const { region, mask_length, full_name } = regionInfo;

    try {
      console.log(`[${region}] Starting new scraping session...`);
      const { lastMaskIndex, lastOffset } = await fetchLastScrapingState(operator, region);

      const {
        browser: newBrowser,
        page,
        proxy,
      } = await initializeBrowserSession(proxyType, lastMaskIndex, lastOffset, region, mask_length, sessionState);

      browser = newBrowser;
      currentProxy = proxy;

      await selectRegion(page, full_name);

      const fatalErrorPromise = new Promise((_, reject) =>
        page.once("fatal-error", reject),
      );

      // This will hang here until a fatal error is emitted
      await Promise.race([new Promise(() => {}), fatalErrorPromise]);
    } catch (error) {
      if (currentProxy?.id) {
        await blockProxy(currentProxy.id);
      }
      console.log(`[${region}][${proxyType}] FATAL ERROR ${error.message}`);

      // If the session found numbers before failing, it's not a "true" failure.
      // Reset the cooldown counter for the next potential error.
      if (sessionState.hasFoundNumbers) {
        console.log(`[${region}] Session was successful before failing. Resetting cooldown.`,);
        cooldownIndex = 0;
      }

      // Select the cooldown period. Clamp to the max value if we exceed the array length.
      const waitTime = cooldowns[Math.min(cooldownIndex, cooldowns.length - 1)];
      console.log(`[${region}] Applying cooldown of ${waitTime / 1000}s (level ${cooldownIndex}).`,);

      // Increment the index for the *next* failure.
      cooldownIndex++;

      if (browser) {
        await browser.close().catch((err) =>
            console.error(`[${region}] Error closing browser:`, err),
          );
      }

      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
}

module.exports = { runScraper };