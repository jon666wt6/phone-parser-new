// page-logic.js

// Helper function to get a random integer
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to get the Yandex cookie
function getYandexCookie() {
  return (
    document.cookie.split("; ").find((row) => row.startsWith("_ym_uid="))?.split("=")[1] || ""
  );
}

// Helper function to generate the required X-User-Hash
async function generateXUserHash() {
  const userAgent = window.__SCRAPER_USER_AGENT__ || navigator.userAgent;
  const afs = window.__env?.AFS || "";
  const yandexCookie = getYandexCookie();
  const now = Math.floor(Date.now() / 1000);

  const input = `${userAgent}${afs}${now}${yandexCookie}`;
  const hashBuffer = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(input)
  );
  let hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const Kt = now.toString(16);
  const On = Kt.length.toString(16);
  const pn = getRandomInt(16, 127);

  let Ot = hashHex + On + pn.toString(16);
  Ot = Ot.slice(0, pn - 1) + Kt + Ot.slice(pn - 1);

  return btoa(Ot);
}

async function fetchNumbers(region, mask, offset) {
  const xUserHash = await generateXUserHash();
  // Use the offset parameter in the API URL
  const apiUrl = `https://www.yota.ru/yws-api/number/search?region=${region}&searchType=adaptiveSearch&offset=${offset}&mask=${mask}`;

  const response = await fetch(apiUrl, {
    headers: {
      accept: "application/json",
      "accept-language": "en-GB,en;q=0.9",
      priority: "u=1, i",
      "sec-ch-ua": '"Not.A/Brand";v="99", "Chromium";v="136"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-user-hash": xUserHash,
    },
    referrer: "https://www.yota.ru/phone-number",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });

  if (!response.ok) {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    throw new Error(`${response.status}`);
  }

  return response.json();
}