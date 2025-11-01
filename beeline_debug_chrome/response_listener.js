// response_listener.js

// This Map will store the 'resolve' function for each pending promise
// Key: pattern (e.g., "001"), Value: resolve (a function)
const pendingResponses = new Map();

async function attachResponseListener(page, region, savePhones, updateStartNumber) {
  page.removeAllListeners('response');

  page.on("response", async (response) => {
    let pattern;
    try {
      const url = response.url();
      const m = url.match(/fancynumber\/search\/\?.*pattern=(\d+)/);
      if (!m || !url.includes(`https://${region}.beeline.ru`)) {
        return;
      }

      pattern = m[1];
      if (!response.ok()) {
        return;
      }

      const txt = await response.text();
      let data;
      try {
        data = JSON.parse(txt);
      } catch {
        return;
      }

      const phones = [];
      const desiredGroups = data?.data?.listByRule?.filter(
        (g) => g.result === "EXACT" || g.result === "SML"
      );

      desiredGroups?.forEach((group) =>
        group?.list?.forEach((c) =>
          c?.numbers?.forEach((p) =>
            p?.value &&
            phones.push({
              phonenumber: `7${p.value}`, region, operator: "beeline",
              status: "new", price: c.price ?? 0,
            })
          )
        )
      );

      if (phones.length > 0) {
        await savePhones(phones, region, pattern);
      }
      await updateStartNumber("beeline", region, pattern);

      // --- THIS IS THE NEW LOGIC ---
      // Check if we have a pending promise for this pattern
      const resolve = pendingResponses.get(pattern);
      if (resolve) {
        resolve(); // This "unpauses" the for loop
        pendingResponses.delete(pattern); // Clean up the map
      }
      // --- END NEW LOGIC ---

    } catch (e) {
      // If something fails, we should still resolve the promise to avoid a hang
      // but maybe with an error (or just resolve it to try again)
      if (pattern && pendingResponses.has(pattern)) {
        pendingResponses.get(pattern)(); // Unpause on error too
        pendingResponses.delete(pattern);
      }
    }
  });

  // This is the new function we'll return to the scraper
  const waitForPatternResponse = (pattern, timeout = 15000) => {
    return new Promise((resolve, reject) => {
      // Set up a timeout in case the response never comes
      const timer = setTimeout(() => {
        pendingResponses.delete(pattern); // Clean up on timeout
        reject(new Error(`Timeout waiting for response for pattern ${pattern}`));
      }, timeout);

      // Store the resolve function, but wrap it to also clear the timeout
      pendingResponses.set(pattern, () => {
        clearTimeout(timer);
        resolve();
      });
    });
  };

  // Return the function so the scraper can use it
  return { waitForPatternResponse };
}

module.exports = { attachResponseListener };