// helpers/browser.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require('random-useragent');
const fs = require("fs");
const path = require("path");
const { setupInterceptors } = require("./intercept-search");
const { fetchProxyByType } = require("../database");

puppeteer.use(StealthPlugin());

async function initializeBrowserSession(proxyType, lastMaskIndex, lastOffset, region, mask_length, sessionState) {
  let proxy = await fetchProxyByType(proxyType);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome',
    args: [
      `--proxy-server=${proxy.url}`,
      "--window-size=1920,1080",
      "--disable-features=RemoteFonts",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      // "--auto-open-devtools-for-tabs",
    ],
  });

  const [page] = await browser.pages();

  // ✅ Generate a realistic Windows/Chrome user agent
  const userAgent = randomUseragent.getRandom(ua => {
    return ua.osName === 'Windows' && ua.browserName === 'Chrome';
  });
  await page.setUserAgent(userAgent);

  // ✅ Add Russian language headers to match the user profile
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
  });

  // ✅ Randomize viewport slightly to avoid identical fingerprints
  const width = 1920 + Math.floor(Math.random() * 80);
  const height = 1080 + Math.floor(Math.random() * 80);
  await page.setViewport({ width, height });

  if (proxy.username && proxy.password) {
    await page.authenticate({ username: proxy.username, password: proxy.password });
  }

  await setupInterceptors(page, region, mask_length, sessionState, proxyType, { lastMaskIndex, lastOffset });

  try {
    await page.goto("https://www.yota.ru/phone-number", { timeout: 20000 });
  } catch (error) {
    await browser.close().catch((e) => console.error("Error closing failed browser:", e));
    throw new Error("Browser setup failed: Could not load the initial page.");
  }

  return { browser, page, proxy };
}

module.exports = { initializeBrowserSession };