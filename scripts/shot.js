// Screenshot helper (playwright-core, bundled local chromium).
// Usage: node scripts/shot.js [outfile] [width] [height] [url]
const { chromium } = require('playwright-core');

const out = process.argv[2] || 'shot.png';
const width = Number(process.argv[3] || 1280);
const height = Number(process.argv[4] || 900);
const url = process.argv[5] || 'http://localhost:3100/';

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: out });
  await browser.close();
  console.log('saved', out);
})().catch((e) => { console.error(e); process.exit(1); });