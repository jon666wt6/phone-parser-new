const puppeteer = require('puppeteer-extra');
const { KnownDevices } = require('puppeteer'); // <-- You correctly import this
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetchProxyByType } = require('./database');
puppeteer.use(StealthPlugin());

async function initBrowser(region) {
  const proxy = await fetchProxyByType('1986');
  if (!proxy || !proxy.url) throw new Error('Proxy missing');

  const mobileDevice = KnownDevices['Pixel 5'];

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    args: [
      `--proxy-server=${proxy.url}`,
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-gpu',
      '--ignore-certificate-errors'
    ],
  });
  const [page] = await browser.pages();

  if (proxy.username && proxy.password)
    await page.authenticate({ username: proxy.username, password: proxy.password });

  await page.emulate(mobileDevice);

  return { browser, page };
}

module.exports = { initBrowser };