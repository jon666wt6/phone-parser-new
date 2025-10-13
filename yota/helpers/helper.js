// helpers/helper.js
const fs = require("fs");
const path = require("path");
const TwoCaptcha = require("@2captcha/captcha-solver")
const solver = new TwoCaptcha.Solver("d7818b50582dde08d6af24817c3cd17a")

function parseAndPrepareData(apiResponse, region, operator) {
  if (!apiResponse || !Array.isArray(apiResponse.numbers)) {
    return [];
  }
  return apiResponse.numbers.flatMap((category) => {
    const price = category.classPrice;
    const phonesInGroup = category.phones || [];
    return phonesInGroup.map((phoneNumber) => ({
      phonenumber: phoneNumber,
      region: region,
      operator: operator,
      status: "available",
      price: price,
    }));
  });
}

async function solveCaptcha(page, captchaData) {
  const { id: captchaId, img: captchaImgBase64WithPrefix } = captchaData;
  if (!captchaId || !captchaImgBase64WithPrefix) {
    throw new Error("Interceptor: Invalid captcha data received.");
  }

  console.log(`[INTERCEPTOR] Captcha detected. ID: ${captchaId}`);

  // Strip off the data URI prefix once,
  // so we can re-use the pure base64 string below.
  const rawBase64 = captchaImgBase64WithPrefix.replace(/^data:image\/jpeg;base64,/, "");

  // Try exactly once: ask the solver, submit, and on success save the image.
  console.log(`[INTERCEPTOR] Sending captcha to solver service...`);
  let solution;
  try {
    const res = await solver.imageCaptcha({ body: rawBase64 });
    solution = res.data;  // adjust if your client returns elsewhere
  } catch (err) {
    console.error(`[INTERCEPTOR] Captcha solver service failed.`, err);
    throw new Error("Captcha solver service failed.");
  }

  if (!solution) {
    throw new Error("Solver returned an empty solution.");
  }
  console.log(`[INTERCEPTOR] Got solution: "${solution}". Submitting...`);

  const isCorrect = await page.evaluate(
    (id, answer) => {
      return fetch("https://www.yota.ru/yws-api/number/captcha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, answer }),
      }).then((r) => r.ok);
    },
    captchaId,
    solution
  );

  if (!isCorrect) {
    console.log(`[INTERCEPTOR] Solution was incorrect. Cannot retry automatically in interceptor.`);
    throw new Error("Captcha solution was incorrect.");
  }

  console.log(`[INTERCEPTOR] Captcha solution accepted.`);

  try {
    const outDir = path.resolve(process.cwd(), "captchas");
    fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, `${solution}.jpg`);
    // write the raw base64 as a JPEG
    fs.writeFileSync(outPath, rawBase64, "base64");
    console.log(`[INTERCEPTOR] Saved solved captcha image to ${outPath}`);
  } catch (fsErr) {
    console.error(`[INTERCEPTOR] Failed to save captcha image:`, fsErr);
  }

  return; // Success!
}

module.exports = { parseAndPrepareData, solveCaptcha };
