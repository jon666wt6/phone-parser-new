// scripts/run-browser.js
const fs = require("fs");
const path = require("path");
const { initializeBrowserSession } = require("../helpers/browser");

(async () => {
  try {
    const { browser, page, proxy } = await initializeBrowserSession("lightning");

    console.log("✅ Browser session started with proxy:", proxy.url);

    // Enable request interception
    // await page.setRequestInterception(true);

    // page.on("request", (req) => {
    //   const url = req.url();

    //   // Match the specific request
    //   if (
    //     url.startsWith(
    //       "https://www.yota.ru/yws-api/number/search?"
    //     )
    //   ) {
    //     const newUrl = "https://www.yota.ru/yws-api/number/search?region=2082&searchType=adaptiveSearch&offset=0&mask=123";

    //     console.log("🔄 Intercepted request → Rewriting to:", newUrl);

    //     // Continue with modified URL but same headers/method/body
    //     req.continue({
    //       url: newUrl,
    //       method: req.method(),
    //       headers: req.headers(),
    //       postData: req.postData(),
    //     });
    //   } else {
    //     req.continue();
    //   }
    // });

    // Inject page-logic.js if you still need it
    const pageLogicScript = fs.readFileSync(
      path.resolve(__dirname, "../helpers/page-logic.js"),
      "utf8"
    );
    await page.addScriptTag({ content: pageLogicScript });

    console.log("📜 page-logic.js injected");

    console.log("⏳ Waiting forever... Press Ctrl+C to exit.");
    await new Promise(() => {}); // keep alive forever
  } catch (err) {
    console.error("❌ Failed to start browser session:", err);
    process.exit(1);
  }
})();