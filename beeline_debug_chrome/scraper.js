const { fetchLastParsedNumber, savePhonesToLocalDB, updateStartNumber } = require('./database');
const { initBrowser } = require('./browser');
const { attachResponseListener } = require('./response_listener');
const { getCursor, searchNumber, delay, InputVanishedError, clickElementByText } = require('./helper');

const MAX_RETRIES = 100;
const RETRY_DELAY = 5000;

async function runBeeline(region) {
  let retries = 0;
  const tag = `[${region}]`;

  while (retries < MAX_RETRIES) {
    let start = 0;
    let browser;
    let chromeProcess;

    try {
      start = (await fetchLastParsedNumber("beeline", region)) ?? 0;
      console.log(`${tag} Attempt ${retries + 1}/${MAX_RETRIES}. Starting from number: ${start}`);

      console.log(`${tag} Initializing browser...`);
      let { browser: br, page, chromeProcess: proc } = await initBrowser(region);
      browser = br;
      chromeProcess = proc;
      console.log(`${tag} Browser initialized.`);

      console.log(`${tag} Attaching response listener...`);
      const { waitForPatternResponse } = await attachResponseListener(
        page, region, savePhonesToLocalDB, updateStartNumber
      );
      console.log(`${tag} Response listener attached.`);

      const url = `https://${region}.beeline.ru/customers/products/mobile/services/details/nomer-na-vybor/krasivie-nomera/?filter=lyuboe-chislo`;
      console.log(`${tag} Navigating to ${url}`);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      console.log(`${tag} Page loaded.`);

      const inputSel = "input[data-t-id=components-UnlockedInput]";
      const buttonSel = 'details[data-t-id="pagesContainers-ExpandingContainer"] section p';
      await page.waitForSelector(inputSel, { visible: true, timeout: 60000 });
      console.log(`${tag} Input selector found.`);

      const cursor = getCursor(page);

      for (let i = start; i <= 999; i++) {
        const pad = i.toString().padStart(3, "0");
        const padTag = `${tag}[${pad}]`;
        const MAX_RELOADS = 3;
        let reloadAttempt = 0;

        try {
          console.log(`${padTag} Attempting to click "все"...`);

          await clickElementByText(page, cursor, 'p', 'все');
          console.log(`${padTag} Clicked "все".`);
        } catch (e) {
          console.log(`${padTag} Could not click "все" (maybe not present?): ${e.message}`);
          // Continue anyway, as it might not be a critical error
        }

        while (reloadAttempt < MAX_RELOADS) {
          try {
            console.log(`${padTag} Calling searchNumber...`);
            await searchNumber(page, cursor, inputSel, buttonSel, pad);

            console.log(`${padTag} Waiting for response...`);
            await waitForPatternResponse(pad);
            console.log(`${padTag} Response received! Moving to next number.`);

            break; // Success! Exit while loop, go to next 'i'
          } catch (e) {
            console.log(`${padTag} ERROR: ${e.message}`);
            if (e instanceof InputVanishedError || e.message.includes("Timeout waiting for response")) {
              reloadAttempt++;
              console.log(`${padTag} Reload attempt ${reloadAttempt}/${MAX_RELOADS}.`);
              if (reloadAttempt >= MAX_RELOADS) {
                throw new Error(`Failed to find input after ${MAX_RELOADS} reloads. Restarting browser.`);
              }
              await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
              await page.waitForSelector(inputSel, { visible: true, timeout: 60000 });
            } else {
              console.log(`${padTag} Unrecoverable error.`);
              throw e; // Unrecoverable error
            }
          }
        }
      }
      console.log(`${tag} Finished all numbers.`);
      break;
    } catch (e) {
      console.log(`${tag} MAIN CATCH ERROR: ${e.message}`);
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`${tag} Retrying in ${RETRY_DELAY / 1000}s...`);
        await delay(RETRY_DELAY);
      }
    } finally {
      console.log(`${tag} Cleaning up...`);
      if (browser) {
        await browser.disconnect();
        console.log(`${tag} Browser disconnected.`);
      }
      if (chromeProcess) {
        chromeProcess.kill();
        console.log(`${tag} Chrome process killed.`);
      }
    }
  }

  if (retries >= MAX_RETRIES) {
    console.log(`${tag} Max retries reached. Exiting.`);
  }
}

(async () => {
  const regions = ["kazan"];
  if (regions.length === 0) {
    console.log('[MAIN] No regions to process.');
    return;
  }

  console.log(`[MAIN] Starting scraper for ${regions.length} region(s).`);
  for (const [idx, region] of regions.entries()) {
    runBeeline(region).catch((e) => {
      console.log(`[${region}] FATAL, UNCAUGHT ERROR: ${e.message}`);
    });
    if (idx < regions.length - 1) {
      console.log(`[MAIN] Waiting 30s before starting next region...`);
      await delay(30000);
    }
  }
})();

