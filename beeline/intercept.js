const fs = require('fs');
const path = require('path');

const attachIntercept = (page, region, savePhones, updateStartNumber) => {
  const blockTypeList = ['image', 'font'];
  const blockUrlList = ['cdn.diginetica.net', 'top-fwz1.mail', 'mc.yandex.ru', 'vk.com', 'abt.s3.yandex.net', 'yandex.ru', 'autocomplete.diginetica.net/_health', 'favicon'];

  const beeline9321Css = fs.readFileSync(path.join(__dirname, './assets/css/9321.8b2e93b.css'), 'utf8');
  const carnicaCss = fs.readFileSync(path.join(__dirname, './assets/css/carnica.8b2e93b.css'), 'utf8');
  const commonCss = fs.readFileSync(path.join(__dirname, './assets/css/common.8b2e93b.css'), 'utf8');
  const componentsCss = fs.readFileSync(path.join(__dirname, './assets/css/components.8b2e93b.css'), 'utf8');
  const FancyNumberV1 = fs.readFileSync(path.join(__dirname, './assets/css/FancyNumberV1.8b2e93b.css'), 'utf8');
  const vendorCss = fs.readFileSync(path.join(__dirname, './assets/css/vendor.8b2e93b.css'), 'utf8');
  const searchJson = fs.readFileSync(path.join(__dirname, './assets/json/search.json'), 'utf8');
  const defcodesJson = fs.readFileSync(path.join(__dirname, './assets/json/defcodes.json'), 'utf8');

  const bee8215Js = fs.readFileSync(path.join(__dirname, './assets/js/8215.8b2e93b.js'), 'utf8');
  const bee9321Js = fs.readFileSync(path.join(__dirname, './assets/js/9321.8b2e93b.js'), 'utf8');
  const carnicaJs = fs.readFileSync(path.join(__dirname, './assets/js/carnica.8b2e93b.js'), 'utf8');
  const commonJs = fs.readFileSync(path.join(__dirname, './assets/js/common.8b2e93b.js'), 'utf8');
  const componentsJs = fs.readFileSync(path.join(__dirname, './assets/js/components.8b2e93b.js'), 'utf8');
  const FancyNumberV1Js = fs.readFileSync(path.join(__dirname, './assets/js/FancyNumberV1.8b2e93b.js'), 'utf8');
  const runtimeJs = fs.readFileSync(path.join(__dirname, './assets/js/runtime.8b2e93b.js'), 'utf8');
  const vendorJs = fs.readFileSync(path.join(__dirname, './assets/js/vendor.8b2e93b.js'), 'utf8');
  const InlineWidgetHost = fs.readFileSync(path.join(__dirname, './assets/js/InlineWidgetHost.js'), 'utf8');
  const loaderJs = fs.readFileSync(path.join(__dirname, './assets/js/loader.js'), 'utf8');
  const headJs = fs.readFileSync(path.join(__dirname, './assets/js/headjs.js'), 'utf8');
  const adperfJs = fs.readFileSync(path.join(__dirname, './assets/js/adperf_conversion.js'), 'utf8');
  const beecakeJs = fs.readFileSync(path.join(__dirname, './assets/js/bee-cake.js'), 'utf8');

  page.removeAllListeners('request');
  page.removeAllListeners('response');

  page.on('request', (request) => {
    try {
      const resourceType = request.resourceType();
      const url = request.url();
      const postData = request.postData() || '';
      const contentLength = postData.length;

      if (url.includes('9321.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: beeline9321Css }); }
      if (url.includes('carnica.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: carnicaCss }); }
      if (url.includes('common.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: commonCss }); }
      if (url.includes('components.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: componentsCss }); }
      if (url.includes('FancyNumberV1.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: FancyNumberV1 }); }
      if (url.includes('vendor.8b2e93b.css')) { return request.respond({ status: 200, contentType: 'text/css', body: vendorCss }); }

      if (url.includes('8215.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: bee8215Js }); }
      if (url.includes('9321.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: bee9321Js }); }
      if (url.includes('carnica.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: carnicaJs }); }
      if (url.includes('common.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: commonJs }); }
      if (url.includes('components.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: componentsJs }); }
      if (url.includes('FancyNumberV1.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: FancyNumberV1Js }); }
      if (url.includes('runtime.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: runtimeJs }); }
      if (url.includes('vendor.8b2e93b.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: vendorJs }); }
      if (url.includes('InlineWidgetHost.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: InlineWidgetHost }); }
      if (url.includes('flocktory.com/v2/loader.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: loaderJs }); }

      if (url.includes('bundles/lk/headjs')) { return request.respond({ status: 200, contentType: 'application/javascript', body: headJs }); }
      if (url.includes('advertiserv2/adperf_conversion.js')) { return request.respond({ status: 200, contentType: 'application/javascript', body: adperfJs }); }
      if (url.includes('code.bee-cake.ru')) { return request.respond({ status: 200, contentType: 'application/javascript', body: beecakeJs }); }

      if (url.includes('fancynumber/search/?rule=9')) { return request.respond({ status: 200, contentType: 'application/json; charset=utf-8', body: searchJson }); }
      if (url.includes('fancynumber/defcodes')) { return request.respond({ status: 200, contentType: 'application/json; charset=utf-8', body: defcodesJson }); }

      if (url.includes('beeline.ru/login/gettoken')) { return request.respond({ status: 200 }); }
      if (url.includes('texts/?key=side-menu-data')) { return request.respond({ status: 200 }); }
      if (url.includes('api/texts/curtain-icon')) { return request.respond({ status: 200 }); }

      // Block specific URLs
      if (blockUrlList.some((blocked) => url.includes(blocked))) {
        return request.abort();
      }

      // Block specific resource types
      if (blockTypeList.includes(resourceType)) {
        return request.abort();
      }

      // Otherwise, allow the request
      request.continue();
    } catch (error) {
      console.error(`[ERROR] Failed to handle request: ${error.message}`);
    }
  });

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