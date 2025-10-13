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
  const maxConsecutiveErrors = 1;

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
  page.on("request", (req) => {
    const url = req.url();
    const resourceType = req.resourceType();

    // 1. Handle Yota search API.
    // YOU WONT SEE IT CHANGED IN NETWORK TAB. BUT IT DOES INTERCEPT
    if (url.includes("/yws-api/number/search")) {
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

    try {
      const status = res.status();
      if (status !== 200) throw new Error(`HTTP ${status}`);

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
          // ✅ Less than 10 results → move to next mask
          currentMaskIndex++;
          currentOffset = 0;
          await updateScrapingState("yota", region, currentOffset, currentMaskIndex);
          // console.log(`[${region}] Saved ${phonesToSave.length} phones. Moving to mask ${currentMaskIndex}`);
        } else {
          // ✅ Full batch of 10 → continue with next offset
          currentOffset += 10;
          await updateScrapingState("yota", region, currentOffset, currentMaskIndex);
          // console.log(`[${region}] ✅ Saved ${phonesToSave.length} phones (mask=${currentMaskIndex}, offset=${currentOffset})`);
        }
      } else {
        // ✅ No results at all → move to next mask
        currentMaskIndex++;
        currentOffset = 0;
        await updateScrapingState("yota", region, currentOffset, currentMaskIndex);
        // console.log(`[${region}] No phones found. Moving to mask ${currentMaskIndex}`);
      }

      if (currentMaskIndex >= endMask) {
        console.log(`[${region}] 🎉 Finished all masks.`);
      }

      consecutiveErrors = 0;

      const btn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll("button"))
          .find(el => {
            const text = el.textContent.trim();
            return text === "Показать еще" || text === "Загрузить другие номера";
          });
      });

      if (btn) {
        await page.evaluate((el) => el.removeAttribute("disabled"), btn);
        // console.log("🔘 Clicking Load More button after response...");
        await btn.click();
      }
    } catch (err) {
      consecutiveErrors++;
      console.error(`[${region}][${proxyType}] Response error #${consecutiveErrors}:`, err.message);

      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error(`[${region}] ❌ ${consecutiveErrors} consecutive errors. Triggering restart...`);
        // Instead of throw, emit event
        page.emit("fatal-error", new Error("Too many consecutive errors in intercept"));
      }
    }
  });
}

module.exports = { setupInterceptors };