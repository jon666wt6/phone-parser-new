// helpers/browser.js
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { setupInterceptors } = require("./intercept-search");
const { fetchProxyByType } = require("../database");

async function initializeBrowserSession(proxyType, lastMaskIndex, lastOffset, region, mask_length) {
  let proxy = await fetchProxyByType(proxyType);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      `--proxy-server=${proxy.url}`,
      "--window-size=1920,1080",
      "--disable-features=RemoteFonts",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--auto-open-devtools-for-tabs",
    ],
  });

  const [page] = await browser.pages();
  await page.setViewport({ width: 1920, height: 1080 });

  if (proxy.username && proxy.password) {
    await page.authenticate({ username: proxy.username, password: proxy.password });
  }

  await setupInterceptors(page, region, mask_length, proxyType, { lastMaskIndex, lastOffset });

  try {
    await page.goto("https://www.yota.ru/phone-number", { timeout: 20000 });
  } catch (error) {
    await browser.close().catch((e) => console.error("Error closing failed browser:", e));
    throw new Error("Browser setup failed: Could not load the initial page.");
  }

  const pageLogicScript = fs.readFileSync(path.resolve(__dirname, "page-logic.js"), "utf8");
  await page.addScriptTag({ content: pageLogicScript });

  return { browser, page, proxy };
}

module.exports = { initializeBrowserSession };