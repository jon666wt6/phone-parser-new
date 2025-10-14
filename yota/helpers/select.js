async function selectRegion(page, regionName) {
  console.log(`🌍 Selecting region: "${regionName}"`);

  try {
    await new Promise((r) => setTimeout(r, 4000));

    await page.waitForSelector(".header-region", { visible: true, timeout: 15000 });
    await page.click(".header-region");

    await page.waitForFunction(
      () => document.querySelectorAll("div").length > 100,
      { timeout: 15000 }
    );

    await new Promise((r) => setTimeout(r, 1000));

    const clicked = await page.evaluate((targetName) => {
      const el = [...document.querySelectorAll("div")].find(
        (d) => d.textContent.trim() === targetName
      );
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.click();
      return true;
    }, regionName);

    if (!clicked) {
      throw new Error(`Region "${regionName}" not found in DOM`);
    }

    return true;
  } catch (err) {
    console.error(`❌ Error selecting region "${regionName}":`, err.message);
    throw err;
  }
}

module.exports = { selectRegion };