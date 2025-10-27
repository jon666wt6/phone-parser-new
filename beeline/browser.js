const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetchProxyByType } = require('./database');

puppeteer.use(StealthPlugin());

async function initBrowser(region) {
  const proxy = await fetchProxyByType('lightning');
  if (!proxy || !proxy.url) throw new Error('Proxy missing');
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--proxy-server=${proxy.url}`,
      '--window-size=1920,1080',
      '--no-sandbox',
      '--disable-gpu',
      '--ignore-certificate-errors'
    ],
    defaultViewport: { width: 1920, height: 1080 }
  });
  const [page] = await browser.pages();

  if (proxy.username && proxy.password)
    await page.authenticate({ username: proxy.username, password: proxy.password });

  return { browser, page };
}

module.exports = { initBrowser };