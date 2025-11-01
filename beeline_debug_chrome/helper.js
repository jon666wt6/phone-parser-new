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

  // Click "найти красоту" key after typing
  await clickElementByText(page, cursor, 'p', 'найти красоту');

  await delay(250 + Math.random() * 200);
}

async function clickElementByText(page, cursor, elementType, text) {
  let element;
  try {
    // Construct an XPath query to find the element by its exact text
    const xpath = `//${elementType}[text()='${text}']`;

    // Wait for the element to exist and be visible
    element = await page.waitForSelector(`xpath/${xpath}`, {
      visible: true,
      timeout: 10000, // 10-second timeout
    });

    if (!element) {
      throw new Error(); // Trigger the catch block
    }

    // Use ghost-cursor to click
    await cursor.click(element);

  } catch (e) {
    throw new Error(
      `Could not find or click element <${elementType}> with text "${text}".`
    );
  }
}

module.exports = {
  getCursor,
  searchNumber,
  delay,
  InputVanishedError,
  clickElementByText
};