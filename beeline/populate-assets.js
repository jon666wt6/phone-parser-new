const fs = require("fs");
const path = require("path");
const { initBrowser } = require("./browser");

async function saveAsset(url, content, folder) {
  const fileName = path.basename(url.split("?")[0]); // Extract file name from URL
  const filePath = path.join(folder, fileName);

  try {
    fs.mkdirSync(folder, { recursive: true }); // Ensure the folder exists
    fs.writeFileSync(filePath, content); // Save the file
    console.log(`✅ Saved asset: ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to save asset: ${filePath}`, err);
  }
}

async function populateAssets(targetUrl) {
  let proccess;
  proccess = { instanceId: "populate-assets", test: true, proxies: ['lightning'] };
  let browser = null;

  try {
    const region = 'pskov';
    const url = `https://${region}.beeline.ru/customers/products/mobile/services/details/nomer-na-vybor/krasivie-nomera/?filter=lyubimoe-chislo`;
    const { browser: newBrowser, page } = await initBrowser(region);
    browser = newBrowser;

    // attach page and browser to proccess object
    proccess.page = page;
    proccess.browser = browser;

    // Intercept network requests only if the saveAssetsFlag is passed
    if (true) {
      console.log("🔍 Intercepting network requests to save assets...");
      page.on("response", async (response) => {
        try {
          const url = response.url();
          const contentType = response.headers()["content-type"];

          if (contentType) {
            if (contentType.includes("javascript")) {
              const content = await response.text();
              saveAsset(url, content, path.join(__dirname, "assets/javascript"));
            } else if (contentType.includes("text/css")) {
              const content = await response.text();
              saveAsset(url, content, path.join(__dirname, "assets/stylesheets"));
            } else if (contentType.includes("image")) {
              const buffer = await response.buffer();
              saveAsset(url, buffer, path.join(__dirname, "assets/images"));
            } else {
              console.log(`Skipping unsupported asset: ${url}`);
            }
          }
        } catch (err) {
          console.error(`❌ Error processing response: ${response.url()}`, err);
        }
      });
    }

    // Navigate to the target URL
    try {
      await page.goto(targetUrl, { waitUntil: "networkidle2" });
      console.log(`✅ Finished loading: ${targetUrl}`);
    } catch (err) {
      console.error(`❌ Navigation error: ${err.message}`);
    }

    // Keep the browser open for 10 minutes to allow asset collection
    await new Promise((resolve) => setTimeout(resolve, 600000));
  } catch (err) {
    console.error(`❌ Critical error: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error("❌ Failed to close browser", err);
      }
    }
  }
}

// Entry point
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error("❌ Please provide a URL as the first argument.");
  process.exit(1);
}

populateAssets(targetUrl);