const fs = require('fs');
const path = require('path');

function loadAssets(subfolder, contentType) {
  const folderPath = path.resolve(__dirname, 'assets', subfolder);
  const assets = {};

  if (!fs.existsSync(folderPath)) {
    console.warn(`[Assets] Directory not found, skipping: ${folderPath}`);
    return assets;
  }

  try {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        assets[file] = {
          content: fs.readFileSync(filePath, 'utf8'),
          contentType: contentType,
        };
      }
    }
  } catch (err) {
    console.error(`[Assets] Error reading directory ${folderPath}:`, err);
  }

  return assets;
}

const attachIntercept = (page, region, savePhones, updateStartNumber) => {
  const blockTypeList = ['font', 'image'];
  const blockUrlList = [
    'cdn.diginetica.net',
    'top-fwz1.mail',
    'abt.s3.yandex.net',
    'yandex.ru',
    'autocomplete.diginetica.net/_health',
    'favicon',
    '/images'
  ];

  const cssAssets = loadAssets('stylesheets', 'text/css');
  const jsAssets = loadAssets('javascript', 'application/javascript');
  const jsonAssets = loadAssets('json', 'application/json; charset=utf-8');

  const allAssets = { ...cssAssets, ...jsAssets, ...jsonAssets };
  console.log(`[Assets] Loaded ${Object.keys(allAssets).length} local asset overrides.`);

  page.removeAllListeners('request');
  page.removeAllListeners('response');

  page.on('request', (request) => {
    try {
      const resourceType = request.resourceType();
      const url = request.url();

      for (const [fileName, asset] of Object.entries(allAssets)) {
        if (url.includes(fileName)) {
          return request.respond({
            status: 200,
            contentType: asset.contentType,
            body: asset.content,
          });
        }
      }

      if (url.includes('beeline.ru/login/gettoken')) { return request.respond({ status: 200 }); }
      if (url.includes('texts/?key=side-menu-data')) { return request.respond({ status: 200 }); }
      if (url.includes('api/texts/curtain-icon')) { return request.respond({ status: 200 }); }

      if (blockUrlList.some((blocked) => url.includes(blocked))) {
        return request.abort();
      }
      if (blockTypeList.includes(resourceType)) {
        return request.abort();
      }

      request.continue();
    } catch (error) {
      console.error(`[ERROR] Failed to handle request: ${error.message}`);
    }
  });

  // --- Response handler remains unchanged ---
  page.on("response", async (response) => {
    const url = response.url();
    const m = url.match(/fancynumber\/search\/\?.*pattern=(\d+)/);
    if (!m || !url.includes(`https://${region}.beeline.ru`)) return;
    const pattern = m[1];
    if (!response.ok()) return;
    const txt = await response.text();
    let data;
    try {
      data = JSON.parse(txt);
    } catch {
      return;
    }
    const phones = [];
    // Filter for both 'EXACT' and 'SML' groups
    const desiredGroups = data?.data?.listByRule?.filter(
      (g) => g.result === "EXACT" || g.result === "SML"
    );

    // Iterate over each of the found groups (e.g., first EXACT, then SML)
    desiredGroups?.forEach((group) =>
      group?.list?.forEach((c) =>
        c?.numbers?.forEach((p) =>
          p?.value &&
          phones.push({
            phonenumber: `7${p.value}`,
            region,
            operator: "beeline",
            status: "new",
            price: c.price ?? 0,
          })
        )
      )
    );

    if (phones.length > 0) {
      await savePhones(phones, region, pattern);
    }
    await updateStartNumber("beeline", region, pattern);
  });
};

module.exports = { attachIntercept };