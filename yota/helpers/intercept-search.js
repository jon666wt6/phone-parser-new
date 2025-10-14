// helpers/intercept-search.js
const fs = require("fs");
const path = require("path");
const { parseAndPrepareData } = require("./helper");
const { savePhonesToLocalDB, updateScrapingState } = require("../database");

function buildSearchUrl(region, mask, offset) {
  return `https://www.yota.ru/yws-api/number/search?region=${region}&searchType=adaptiveSearch&offset=${offset}&mask=${mask}`;
}

async function setupInterceptors(page, region, mask_length, proxyType, state) {
  let { lastMaskIndex, lastOffset } = state;
  let currentMaskIndex = lastMaskIndex;
  let currentOffset = lastOffset;
  const endMask = 10 ** mask_length;

  // Track consecutive errors
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 2;

  // Block lists
  const blockTypeList = ["image", "font", "stylesheet"];
  const blockUrlList = [".svg", ".ico", "mail.ru", "mc.yandex.ru", "vk.com", "rum/events", "favicon", "uaas.yandex.ru"];

  // --- Load all JS overrides dynamically ---
  const jsFolder = path.resolve(process.cwd(), "assets", "javascript");
  let jsFiles = {};
  if (fs.existsSync(jsFolder)) {
    jsFiles = fs.readdirSync(jsFolder).reduce((acc, file) => {
      acc[file] = fs.readFileSync(path.join(jsFolder, file), "utf8");
      return acc;
    }, {});
  }

  await page.setRequestInterception(true);
  let searchRequestCount = 0;
  page.on("request", (req) => {
    const url = req.url();
    const resourceType = req.resourceType();

    // 1. Handle Yota search API.
    // YOU WONT SEE IT CHANGED IN NETWORK TAB. BUT IT DOES INTERCEPT
    if (url.includes("/yws-api/number/search")) {
      searchRequestCount += 1;

      // ✅ Let the first request pass through untouched
      if (searchRequestCount <= 1) {
        console.log("🟡 [response] Skipping first search response (normal init)");
        return req.continue();
      }

      // 🚀 Modify subsequent requests
      const mask = currentMaskIndex.toString().padStart(mask_length, "0");
      const newUrl = buildSearchUrl(region, mask, currentOffset);

      return req.continue({
        url: newUrl,
        method: req.method(),
        headers: req.headers(),
        postData: req.postData(),
      });
    }

    // 2. Serve local JS overrides dynamically
    for (const [fileName, content] of Object.entries(jsFiles)) {
      if (url.includes(fileName)) {
        return req.respond({
          status: 200,
          contentType: "application/javascript",
          body: content,
        });
      }
    }

    // 3. Block unwanted resources
    if (blockUrlList.some((blocked) => url.includes(blocked))) return req.abort();
    if (blockTypeList.includes(resourceType)) return req.abort();

    // 4. Default: allow
    req.continue();
  });

  // --- Response Interceptor ---
  page.on("response", async (res) => {
    if (!res.url().includes("/yws-api/number/search")) return;
    if (searchRequestCount <= 1) return;

    try {
      const status = res.status();
      if (status !== 200) {
        throw new Error(`Request failed with HTTP status ${status}`);
      }

      const rawData = await res.json();
      const phonesToSave = parseAndPrepareData(rawData, region, "yota");

      if (phonesToSave.length > 0) {
        await savePhonesToLocalDB(
          phonesToSave,
          region,
          currentMaskIndex.toString().padStart(mask_length, "0"),
          currentOffset,
          proxyType
        );

        if (phonesToSave.length < 10) {
          currentMaskIndex++;
          currentOffset = 0;
        } else {
          currentOffset += 10;
          if (currentOffset >= 490) {
            currentOffset = 0;
            currentMaskIndex++;
          }
        }
      } else {
        currentMaskIndex++;
        currentOffset = 0;
      }

      await updateScrapingState("yota", region, currentOffset, currentMaskIndex);
      if (currentMaskIndex >= endMask) {
        console.log(`[${region}] 🎉 Finished all masks.`);
        return; // Stop processing if we are done
      }

      // Reset error count on success
      consecutiveErrors = 0;
    } catch (err) {
      consecutiveErrors++;
      console.error(
        `[${region}][${proxyType}] Response error #${consecutiveErrors}:`,
        err.message
      );

      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(
          `[${region}][${proxyType}] ❌ Reached max consecutive errors. Triggering restart...`
        );
        page.emit("fatal-error", new Error("Too many consecutive API errors"));
        return; // 🛑 IMPORTANT: Stop execution here on fatal error
      }
    }

    // --- This block now runs after BOTH success and recoverable errors ---
    try {
      const loadMoreButton = await page.evaluateHandle(() => {
        return [...document.querySelectorAll("button")].find((el) => {
          const text = el.textContent.trim();
          return text === "Показать еще" || text === "Загрузить другие номера";
        });
      });

      if (loadMoreButton && loadMoreButton.asElement()) {
        await page.evaluate((el) => el.removeAttribute("disabled"), loadMoreButton);
        await loadMoreButton.click();
      } else {
        console.warn(`[${region}] Could not find "Load More" button to click.`);
      }
    } catch (clickErr) {
      console.error(
        `[${region}] Failed to click "Load More" button, triggering restart.`,
        clickErr.message
      );
      page.emit("fatal-error", new Error("Could not click the next page button"));
    }
  });
}

module.exports = { setupInterceptors };