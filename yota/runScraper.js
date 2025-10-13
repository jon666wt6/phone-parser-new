// scraper/runScraper.js
const {
  fetchProxyByType,
  fetchLastScrapingState,
  blockProxy,
} = require("./database");
const { initializeBrowserSession } = require("./helpers/browser");

const operator = "yota";

async function runScraper(regions, proxyType) {
  console.log("[runScraper] Starting main loop with", regions.length, "regions");
  while (true) {
    let browser = null;
    let currentProxy = null;

    // 🎲 Pick a random region from our pool
    const regionInfo = regions[Math.floor(Math.random() * regions.length)];
    const { region, mask_length } = regionInfo;

    try {
      console.log(`\n[${region}] =====================================`);
      console.log(`[${region}] Starting new scraping session...`);
      console.debug(`[${region}] Fetching last scraping state...`);

      const { lastMaskIndex, lastOffset } = await fetchLastScrapingState(
        operator,
        region
      );

      console.debug(
        `[${region}] Last state — MaskIndex: ${lastMaskIndex}, Offset: ${lastOffset}`
      );
      console.debug(`[${region}] Initializing browser with proxyType=${proxyType}`);

      const { browser: newBrowser, page, proxy } =
        await initializeBrowserSession(
          proxyType,
          lastMaskIndex,
          lastOffset,
          region,
          mask_length
        );

      browser = newBrowser;
      currentProxy = proxy;

      console.info(
        `[${region}] Browser session started on proxy: ${proxy?.id || "N/A"} (${proxy?.host || "unknown"})`
      );

      const fatalErrorPromise = new Promise((_, reject) =>
        page.once("fatal-error", (err) => {
          console.error(`[${region}] ⚠️ Fatal error emitted by page!`, err);
          reject(err);
        })
      );

      console.log(`[${region}] Scraper running — waiting for fatal errors...`);

      await Promise.race([
        new Promise(() => {}), // stay alive indefinitely
        fatalErrorPromise, // rejection triggers restart
      ]);
    } catch (error) {
      console.error(`[${region}] ❌ Scraper error:`, error.message);
      if (error.stack) {
        console.debug(`[${region}] Stack:`, error.stack);
      }

      if (currentProxy?.id) {
        console.warn(`[${region}] Blocking proxy ID ${currentProxy.id} due to error...`);
        await blockProxy(currentProxy.id);
      }

      if (browser) {
        console.log(`[${region}] Closing browser...`);
        await browser.close().catch((err) =>
          console.error(`[${region}] Error closing browser:`, err)
        );
      }

      console.log(`[${region}] Restarting in 60s — random region next.`);
      await new Promise((r) => setTimeout(r, 60_000));
    }
  }
}

module.exports = { runScraper };