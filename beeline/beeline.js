const { fetchLastParsedNumber, savePhonesToLocalDB, updateStartNumber, fetchRegionsByOperator } = require('./database');
const { initBrowser } = require('./browser');
const { attachIntercept } = require('./intercept');
const { getCursor, searchNumber, delay, InputVanishedError } = require('./helper');

// "severnaya-osetiya", "pskovskaya-obl", "ivanovskaya-obl", "kurganskaya-obl", "mariy-el", "mordoviya", "chuvashiya", "kirovskaya-obl",
// "orlovskaya-obl", "bryanskaya-obl", "tambovskaya-obl", "penzenskaya-obl", "ulyanovskaya-obl", "smolenskaya", "zabaykalskiy-kr", "buryatiya",
// "evreyskaya-ao", "amurskaya-obl", "altayskiy-kr", "kyzyl", "nazran", "gorno-altaysk", "elista", "cherkessk", "groznyy", "makhachkala", "nalchik",
// "vladikavkaz", "pskov", "ivanovo", "kineshma", "shuya", "vichuga", "kokhma", "kurgan", "yoshkar-ola", "saransk", "cheboksary", "kirov", "orel",
// "mtsensk", "bryansk", "tambov", "penza", "ulyanovsk", "dimitrovgrad", "smolensk", "vyazma", "yartsevo", "safonovo",
// "chita", "ulan-ude", "birobidzhan", "blagoveshchensk", "barnaul", "saratov", "balakovo", "engels", "balashov", "kiselevsk",
// "novokuznetsk", "belovo", "myski", "achinsk", "dzerzhinsk", "arzamas", "balahna", "vyksa", "shchekino", "uzlovaya",
// "novomoskovsk", "aleksin", "bogoroditsk", "orekhovo-zuevo", "shatura", "likino-dulevo", "egorevsk", "tagil", "magnitogorsk",
// "volzhsky", "zhigulevsk", "nerekhta", "tutaev", "georgievsk", "vidyaevo", "murmashi", "kashira", "holmsk", "korsakov", "dolinsk", "kurchatov",

const MAX_RETRIES = 100;
const RETRY_DELAY = 5000;

async function runBeeline(region) {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    const start = (await fetchLastParsedNumber("beeline", region)) ?? 0;
    console.log(`[${region}] attempt ${retries + 1}/${MAX_RETRIES} start ${start}`);
    let browser;

    try {
      let { browser: br, page } = await initBrowser(region);
      browser = br;

      await page.setRequestInterception(true);
      attachIntercept(page, region, savePhonesToLocalDB, updateStartNumber);

      const url = `https://${region}.beeline.ru/customers/products/mobile/services/details/nomer-na-vybor/krasivie-nomera/?filter=lyubimoe-chislo`;
      console.log(`[${region}] goto ${url}`);

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      const inputSel = "input[data-t-id=components-UnlockedInput]";
      const buttonSel = 'details[data-t-id="pagesContainers-ExpandingContainer"] section p';
      await page.waitForSelector(inputSel, { visible: true, timeout: 60000 });

      const cursor = getCursor(page);
      console.log(`[${region}] loop`);

      for (let i = start; i <= 999; i++) {
        const pad = i.toString().padStart(3, "0");
        const tag = `[${region}][${pad}]`;
        const MAX_RELOADS = 5;
        let reloadAttempt = 0;

        // --- NEW RELOAD LOGIC ---
        while (reloadAttempt < MAX_RELOADS) {
          try {
            await searchNumber(page, cursor, inputSel, buttonSel, pad);
            break; // Success! Exit the while loop and go to the next 'i'.
          } catch (e) {
            if (e instanceof InputVanishedError) {
              reloadAttempt++;
              console.log(`${tag} ${e.message} Attempting page reload ${reloadAttempt}/${MAX_RELOADS}.`);

              if (reloadAttempt >= MAX_RELOADS) {
                // If we've exceeded reload attempts, throw a new error to trigger a full browser restart.
                throw new Error(`Failed to find input after ${MAX_RELOADS} reloads. Restarting browser.`);
              }

              // Reload the page and wait for it to be ready again.
              await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
              await page.waitForSelector(inputSel, { visible: true, timeout: 60000 });
            } else {
              // It's a different, unrecoverable error. Throw it up to the main catch block.
              console.log(`${tag} Unrecoverable error: ${e.message}`);
              throw e;
            }
          }
        }
      }
      console.log(`[${region}] done`);
      break; // Exit the main while loop on success
    } catch (e) {
      console.log(`[${region}] err ${e.message}`);
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`[${region}] retry in ${RETRY_DELAY / 1000}s`);
        await delay(RETRY_DELAY);
      }
    } finally {
      if (browser) await browser.close();
    }
  }
  if (retries >= MAX_RETRIES)
    console.log(`[${region}] max retries reached`);
}

(async () => {
  // Fetch once at startup
  const regions = ["severnaya-osetiya"];
  if (regions.length === 0) {
    console.log('No regions to process for beeline.');
    return;
  }

  console.log(`start ${regions.length} regions`);
  for (const [idx, region] of regions.entries()) {
    runBeeline(region).catch((e) =>
      console.log(`[${region}] fatal ${e.message}`)
    );
    // stagger launches a bit
    if (idx < regions.length - 1) {
      await delay(30000);
    }
  }
})();
