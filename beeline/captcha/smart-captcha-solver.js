// helpers/captchaSolver.js

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sharp = require("sharp");

const API_KEY = "d7818b50582dde08d6af24817c3cd17a";
const RUCAPTCHA_IN_URL = "https://rucaptcha.com/in.php";
const RUCAPTCHA_RES_URL = "https://rucaptcha.com/res.php";

async function getImageBase64FromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  const imageBuffer = await response.buffer();
  return imageBuffer.toString("base64");
}

async function resizeBase64Image(base64String, width, height) {
  const imageBuffer = Buffer.from(base64String, "base64");
  const resizedBuffer = await sharp(imageBuffer)
    .resize(width, height)
    .toBuffer();
  return resizedBuffer.toString("base64");
}

async function solveAndClickCoordinatesCaptcha(page, captchaImageUrl, taskImageUrl) {
  console.log("⚙️ Processing images for RuCaptcha API...");
  const captchaImageBase64 = await getImageBase64FromUrl(captchaImageUrl);
  const taskImageBase64 = await getImageBase64FromUrl(taskImageUrl);
  const resizedTaskImageBase64 = await resizeBase64Image(taskImageBase64, 300, 35);
  console.log("✅ Images processed successfully.");

  console.log("📤 Sending captcha to RuCaptcha API...");
  const formData = new URLSearchParams();
  formData.append("method", "base64");
  formData.append("coordinatescaptcha", "1");
  formData.append("key", API_KEY);
  formData.append("body", captchaImageBase64);
  formData.append("imginstructions", resizedTaskImageBase64);
  formData.append("json", "1");

  const inResponse = await fetch(RUCAPTCHA_IN_URL, { method: "POST", body: formData });
  const inJson = await inResponse.json();

  if (inJson.status !== 1) {
    throw new Error(`RuCaptcha in.php failed: ${inJson.request}`);
  }
  const captchaId = inJson.request;
  console.log(`✔ Captcha sent. Request ID: ${captchaId}`);

  console.log("⏳ Waiting for solver (polling every 5 seconds)...");
  let solution = null;
  for (let i = 0; i < 24; i++) { // Poll for 2 minutes max
    await new Promise(r => setTimeout(r, 5000));
    const resUrl = `${RUCAPTCHA_RES_URL}?key=${API_KEY}&action=get&id=${captchaId}&json=1`;
    const resResponse = await fetch(resUrl);
    const resJson = await resResponse.json();

    if (resJson.status === 1) {
      solution = resJson.request;
      break;
    }
    if (resJson.request !== "CAPCHA_NOT_READY") {
      throw new Error(`RuCaptcha res.php failed: ${resJson.request}`);
    }
    process.stdout.write(".");
  }
  console.log(""); // New line after polling

  if (!solution) {
    throw new Error("Captcha solving timed out.");
  }

  console.log("✅ Captcha solved! Coordinates received:", solution);

  console.log("🖱️ Clicking the solution coordinates on the captcha image...");
  const iframeSelector = '.SmartCaptcha-Overlay.SmartCaptcha-Overlay_visible iframe[src^="https://smartcaptcha.yandexcloud"]';
  const iframeHandle = await page.waitForSelector(iframeSelector);
  const iframe = await iframeHandle.contentFrame();
  const imageElement = await iframe.waitForSelector(".AdvancedCaptcha-ImageWrapper img");
  const box = await imageElement.boundingBox();

  if (!box) {
    throw new Error("Could not get bounding box for captcha image element.");
  }

  for (const coord of solution) {
    const clickX = box.x + parseInt(coord.x, 10);
    const clickY = box.y + parseInt(coord.y, 10);
    await page.mouse.click(clickX, clickY);
    console.log(`  > Clicked at { x: ${clickX}, y: ${clickY} }`);
    await new Promise(r => setTimeout(r, 500));
  }

  const buttonSelector = '.CaptchaButton-ProgressWrapper';
  await iframe.waitForSelector(buttonSelector, { visible: true, timeout: 5000 });
  await iframe.click(buttonSelector);
  console.log("✅ Captcha submission button clicked successfully.");

  console.log("🎉 Captcha submitted successfully!");
}

module.exports = { solveAndClickCoordinatesCaptcha };
