const { createCursor } = require('ghost-cursor');

function getCursor(page) {
  return createCursor(page);
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class InputVanishedError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputVanishedError";
  }
}

async function searchNumber(page, cursor, inputSelector, buttonSelector, num) {
  let input;
  try {
    // Use waitForSelector with a reasonable timeout. If it fails, we know the input is gone.
    input = await page.waitForSelector(inputSelector, {
      visible: true,
      timeout: 15000, // Wait up to 15 seconds for the input
    });
  } catch (e) {
    // If waitForSelector times out, throw our specific, catchable error.
    throw new InputVanishedError(
      `Input selector '${inputSelector}' vanished or did not become visible.`
    );
  }

  // Clear the input field reliably
  await input.click({ clickCount: 3 });
  await input.press("Backspace");

  await input.type(num, { delay: 100 + Math.random() * 50 });

  // Wait for the button to be clickable (visible and not disabled)
  const btn = await page.waitForSelector(buttonSelector, {
    visible: true,
    timeout: 60000,
  });

  await cursor.move(btn);
  await delay(200 + Math.random() * 200);
  await cursor.click(btn);

  await delay(3000 + Math.random() * 2000);
}

module.exports = { getCursor, searchNumber, delay, InputVanishedError };