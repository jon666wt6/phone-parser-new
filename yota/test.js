// testBrowserSession.js
//
// Quick diagnostic: launch Chrome with your actual proxy
// and navigate to https://www.yota.ru/phone-number

const { initializeBrowserSession } = require("./helpers/browser");

async function main() {
  const proxyType = "lightning";
  const region = "2082";
  const mask_length = 10;
  const lastMaskIndex = 0;
  const lastOffset = 0;

  console.log("[TEST] Starting Puppeteer test with proxyType:", proxyType);

  try {
    const { browser, page, proxy } = await initializeBrowserSession(
      proxyType,
      lastMaskIndex,
      lastOffset,
      region,
      mask_length
    );

    console.log("[TEST] Browser launched successfully!");
    console.log(
      `[TEST] Using Proxy: ${proxy.url}${proxy.username ? ` (auth: ${proxy.username})` : ""}`
    );

    console.log("[TEST] Navigating to https://www.yota.ru/phone-number ...");

    await new Promise((r) => setTimeout(r, 600_000)); // open for 10 min

    console.log("[TEST] ✅ Page loaded successfully!");

    await browser.close();
    console.log("[TEST] Browser closed cleanly. Proxy and Puppeteer config are fine.");
  } catch (err) {
    console.error("[TEST] ❌ Test failed:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();