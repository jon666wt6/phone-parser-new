const { initBrowser } = require('./browser');
const { delay } = require('./helper'); // We only need delay from helper

// --- ADD THIS IMPORT ---
const { solveAndClickCoordinatesCaptcha } = require('./captcha/smart-captcha-solver');

// --- SCRIPT IS NOW A SIMPLE TEST HARNESS ---

const REGION = "pskov";
// URL constructed from your href info (after decoding)
const TEST_URL = "https://pskov.beeline.ru/customers/products/krasivie-nomera/?categories=bronzovie_serebryanie_zolotie&filter=lyubimoe-chislo";

// This selector is from your captchaSolver.js, it finds the visible captcha iframe
const IFRAME_SELECTOR = '.SmartCaptcha-Overlay.SmartCaptcha-Overlay_visible iframe[src^="https://smartcaptcha.yandexcloud"]';

// These selectors are for the images *inside* the iframe
const CAPTCHA_IMG_SELECTOR = '.AdvancedCaptcha-Image';
const TASK_IMG_SELECTOR = '.AdvancedCaptcha-TaskImage';

(async () => {
  console.log(`[${REGION}] Starting captcha test...`);
  let browser;

  try {
    console.log("🚀 Launching browser...");
    let { browser: br, page } = await initBrowser(REGION);
    browser = br;

    // Set timeout to 0 (infinite) so waitForSelector can wait forever
    page.setDefaultTimeout(0); 

    console.log(`Navigating to ${TEST_URL}...`);
    await page.goto(TEST_URL, { waitUntil: "domcontentloaded" });

    console.log("✅ Page loaded. Waiting for captcha to appear...");

    // Wait indefinitely for the captcha iframe to become visible
    const iframeHandle = await page.waitForSelector(IFRAME_SELECTOR, { visible: true });
    console.log("🕵️ Captcha iframe detected!");
    
    const iframe = await iframeHandle.contentFrame();
    if (!iframe) {
      throw new Error("Could not get iframe content frame.");
    }

    // Wait for the images inside the iframe to be ready
    // We use the iframe's context to wait for selectors
    await iframe.waitForSelector(CAPTCHA_IMG_SELECTOR, { visible: true });
    await iframe.waitForSelector(TASK_IMG_SELECTOR, { visible: true });
    console.log("🖼️ Captcha images found inside iframe.");

    // Extract the src URLs from the images
    const captchaImageUrl = await iframe.evaluate((sel) => document.querySelector(sel).src, CAPTCHA_IMG_SELECTOR);
    const taskImageUrl = await iframe.evaluate((sel) => document.querySelector(sel).src, TASK_IMG_SELECTOR);

    if (!captchaImageUrl || !taskImageUrl) {
      throw new Error("Could not extract image URLs from captcha.");
    }

    console.log("🤖 Calling captcha solver...");
    // Pass the page (for clicking) and the two image URLs
    await solveAndClickCoordinatesCaptcha(page, captchaImageUrl, taskImageUrl);

    console.log("🎉 Solver finished.");
    console.log("Script will now wait for 1 hour. Press Ctrl+C to exit.");
    await delay(3600 * 1000); // Wait 1 hour

  } catch (e) {
    console.error(`[${REGION}] fatal test error:`, e);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed.");
    }
  }
})();