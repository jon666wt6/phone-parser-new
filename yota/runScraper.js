// scraper/runScraper.js
const {
  fetchProxyByType,
  fetchLastScrapingState,
  blockProxy,
} = require("./database");
const { initializeBrowserSession } = require("./helpers/browser");

const operator = "yota";

async function runScraper(regions, proxyType) {
  while (true) {
    let browser = null;
    let currentProxy = null;

    // 🎲 Pick a random region from our pool
    const regionInfo = regions[Math.floor(Math.random() * regions.length)];
    const { region, mask_length } = regionInfo;

    try {
      console.log(`[${region}] Starting new scraping session...`);
      const { lastMaskIndex, lastOffset } = await fetchLastScrapingState(
        operator,
        region
      );

      const { browser: newBrowser, page, proxy } =
        await initializeBrowserSession(proxyType, lastMaskIndex, lastOffset, region, mask_length);

      browser = newBrowser;
      currentProxy = proxy;

      const fatalErrorPromise = new Promise((_, reject) =>
        page.once("fatal-error", reject)
      );

      await Promise.race([
        new Promise(() => {}), // stay alive indefinitely
        fatalErrorPromise, // rejection triggers restart
      ]);
    } catch (error) {
      if (currentProxy?.id) {
        await blockProxy(currentProxy.id);
      }

      if (browser) {
        await browser.close().catch((err) =>
          console.error(`[${region}] Error closing browser:`, err)
        );
      }

      // 🌀 Random new region next time
      console.log(`[${region}] Restarting in 1s... random region next`);
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }
}

module.exports = { runScraper };