const puppeteer = require("puppeteer");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { fetchProxyByType } = require("./database");

const AUTOMATION_PROFILE_DIR_NAME = "automation_profile";
const DEBUGGING_PORT = 9222;

function getChromeExecutablePath() {
  const platform = os.platform();
  switch (platform) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "linux":
      return "/usr/bin/google-chrome";
    default:
      throw new Error(`Unsupported platform detected: ${platform}`);
  }
}

async function initBrowser(region) {
  const chromePath = getChromeExecutablePath();
  const profilePath = path.join(__dirname, AUTOMATION_PROFILE_DIR_NAME);

  if (!fs.existsSync(profilePath)) {
    throw new Error(`Automation profile not found at '${profilePath}'. Please run the setup script first.`);
  }

  const proxy = await fetchProxyByType('lightning');
  if (!proxy || !proxy.url) {
    throw new Error(`Failed to fetch a valid proxy for region ${region}.`);
  }

  const chromeArgs = [
    // `--headless=new`,
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    `--remote-debugging-port=${DEBUGGING_PORT}`,
    `--user-data-dir=${profilePath}`,
    `--proxy-server=${proxy.url}`,
    "--no-first-run",
    "--no-default--browser-check",
  ];

  const chromeProcess = spawn(chromePath, chromeArgs);

  await new Promise((resolve) => setTimeout(resolve, 5000));

  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${DEBUGGING_PORT}`,
    defaultViewport: null,
  });

  const page = (await browser.pages())[0];
  if (!page) {
    throw new Error(`Could not connect to any page.`);
  }

  if (proxy.username && proxy.password) {
    await page.authenticate({
      username: proxy.username,
      password: proxy.password,
    });
  }

  await page.setViewport({ width: 1920, height: 1080 });

  return { browser, page, chromeProcess };
}

module.exports = { initBrowser };

