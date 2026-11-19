// Regenerates the entry's screenshots in screenshots/.
// Serves app/ on localhost, seeds 13 of 55 trophies as earned, and takes
// four 1280x800 JPEG shots (quality 82), one per view. Prints each file's
// size and fails when one is over the 256 KiB gate cap.
//
// Uses playwright-core with the Chromium build already cached on this
// machine (~/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome).

import { createServer } from 'node:http';
import { createReadStream, statSync, rmSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const appRoot = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;

// A fixed, spread-out seed: story progress, one silver, one gold, side and
// collectible trophies — 13 of 55 earned, as the house guides seed theirs.
const SEEDED_EARNED = [2, 3, 4, 5, 8, 14, 15, 16, 17, 25, 30, 33, 42];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function serve() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      let pathname = '/';
      try {
        pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
      } catch { res.writeHead(400).end(); return; }
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(join(appRoot, normalize(pathname)));
      if (file !== appRoot && !file.startsWith(appRoot + sep)) { res.writeHead(403).end(); return; }
      try {
        const stats = statSync(file);
        if (!stats.isFile()) throw new Error('not a file');
        res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'content-length': stats.size });
        createReadStream(file).pipe(res);
      } catch { res.writeHead(404).end(); }
    });
    server.listen(0, '127.0.0.1', () => resolveServer(server));
  });
}

const server = await serve();
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;
let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.addInitScript((seed) => {
    localStorage.setItem('gta6-trophy-guide-v1', JSON.stringify({ earned: seed, spoilers: true }));
  }, SEEDED_EARNED);
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#rows tr');

  // Drop the starter's screenshots; the four below replace them.
  for (const old of ['1-checklist.jpg', '2-silver.jpg', '3-bronze.jpg']) {
    rmSync(join(shotsDir, old), { force: true });
  }

  // 1. Checklist with the guide pane open on The Shootist, spoilers on.
  // The click scrolls the detail pane into view, so scroll back to the top
  // before the shot: the cover shows the header, progress and filters.
  await page.locator('#rows tr[data-trophy-id="17"]').click();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(shotsDir, '1-checklist.jpg'), type: 'jpeg', quality: 82 });

  // 2. Platinum roadmap.
  await page.locator('#tab-roadmap').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shotsDir, '2-roadmap.jpg'), type: 'jpeg', quality: 82 });

  // 3. Missables view.
  await page.locator('#tab-missables').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shotsDir, '3-missables.jpg'), type: 'jpeg', quality: 82 });

  // 4. Checklist with spoilers off and the kind filter on Story.
  await page.locator('#tab-checklist').click();
  await page.locator('#spoilers').uncheck();
  await page.locator('#kind').selectOption('story');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(shotsDir, '4-spoilers-off.jpg'), type: 'jpeg', quality: 82 });

  await browser.close();
} finally {
  if (browser) await browser.close().catch(() => {});
  server.close();
}

import { readdirSync } from 'node:fs';
let ok = true;
for (const file of readdirSync(shotsDir).sort()) {
  const size = statSync(join(shotsDir, file)).size;
  const withinCap = size <= 262144;
  if (!withinCap) ok = false;
  console.log(`${file}: ${size} bytes${withinCap ? '' : ' — OVER 256 KiB CAP'}`);
}
if (!ok) process.exit(1);
