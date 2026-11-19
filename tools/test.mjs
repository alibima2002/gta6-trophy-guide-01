// Playwright checks for the Leonida Trophy Guide.
// Serves app/ on localhost, drives it in Chromium, and prints PASS/FAIL per
// check with a summary count. Exits 1 when any check fails.
//
// Uses playwright-core with the Chromium build already cached on this
// machine (~/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome).

import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const appRoot = join(repoRoot, 'app');
const CHROME = `${process.env.HOME}/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome`;

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

let passed = 0;
let failed = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) { passed += 1; console.log(`PASS ${name}`); }
  else { failed += 1; failures.push(name); console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}

const server = await serve();
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;
let browser;
try {
  browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const externalRequests = [];
  page.on('request', (req) => {
    if (!req.url().startsWith(base) && !req.url().startsWith('data:')) externalRequests.push(req.url());
  });
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err)));

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#rows tr');

  // 1. All 55 trophies render.
  check('55 rows render', (await page.locator('#rows tr').count()) === 55);

  // 2. Fresh progress is 0 of 55.
  check('fresh progress 0/55', (await page.locator('#progress-count').textContent()) === '0 of 55 earned');

  // 3. Ticking a trophy updates progress and survives a reload.
  await page.locator('#rows tr[data-trophy-id="17"] input[type="checkbox"]').check();
  check('progress 1/55 after tick', (await page.locator('#progress-count').textContent()) === '1 of 55 earned');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#rows tr');
  check('progress persists after reload', (await page.locator('#progress-count').textContent()) === '1 of 55 earned');

  // 4. Kind filter: Story shows 16.
  await page.locator('#kind').selectOption('story');
  check('kind filter Story shows 16', (await page.locator('#rows tr').count()) === 16);
  await page.locator('#kind').selectOption('all');

  // 5. Grade filter: silver shows 6.
  await page.locator('#grade').selectOption('silver');
  check('grade filter silver shows 6', (await page.locator('#rows tr').count()) === 6);
  await page.locator('#grade').selectOption('all');

  // 6. Search "bank" finds Maximum Withdrawal (and at least one more).
  await page.locator('#search').fill('bank');
  const bankRows = await page.locator('#rows tr').count();
  const bankNames = await page.locator('#rows tr').allTextContents();
  check(
    'search "bank" finds Maximum Withdrawal',
    bankRows >= 2 && bankNames.some((t) => t.includes('Maximum Withdrawal')),
    `${bankRows} rows`,
  );
  await page.locator('#search').fill('');

  // 7. Spoiler mask: hidden trophy masked while spoilers are on, revealed when off.
  const maskedText = await page.locator('#rows tr[data-trophy-id="2"]').textContent();
  check(
    'spoilers on masks Just Like Paradise',
    maskedText.includes('Hidden trophy') && !maskedText.includes('Just Like Paradise'),
  );
  await page.locator('#spoilers').uncheck();
  const revealedText = await page.locator('#rows tr[data-trophy-id="2"]').textContent();
  check('spoilers off reveals Just Like Paradise', revealedText.includes('Just Like Paradise'));
  await page.locator('#spoilers').check();

  // 8. Missable-only shows exactly Positive Mental Attitude.
  await page.locator('#missable-only').check();
  const missRows = await page.locator('#rows tr').count();
  const missText = await page.locator('#rows tr').allTextContents();
  check(
    'missable-only shows 1 row',
    missRows === 1 && missText[0].includes('Positive Mental Attitude'),
    `${missRows} rows`,
  );
  await page.locator('#missable-only').uncheck();

  // 9. Hide earned hides the one earned trophy.
  await page.locator('#hide-earned').check();
  check('hide-earned shows 54', (await page.locator('#rows tr').count()) === 54);
  await page.locator('#hide-earned').uncheck();

  // 10. Guide pane opens with name, PSN target and sources.
  await page.locator('#rows tr[data-trophy-id="17"]').click();
  const paneText = await page.locator('#detail-card').textContent();
  check(
    'guide pane shows The Shootist with target and sources',
    paneText.includes('The Shootist') &&
      paneText.includes('PSN tracks 0/42') &&
      paneText.includes('Exophase') &&
      paneText.includes('PSNProfiles'),
  );

  // 11. Roadmap view: 7 stages, 55 trophies across them, stage 1 has 16.
  await page.locator('#tab-roadmap').click();
  const stageCount = await page.locator('.roadmap-stage').count();
  const stageItems = await page.locator('.roadmap-stage .stage-list li').count();
  const stage1Items = await page.locator('.roadmap-stage').first().locator('.stage-list li').count();
  check('roadmap has 7 stages covering 55 trophies', stageCount === 7 && stageItems === 55, `${stageCount} stages, ${stageItems} items`);
  check('roadmap stage 1 has 16 trophies', stage1Items === 16, `${stage1Items} items`);
  const roadmapText = await page.locator('#roadmap-view').textContent();
  check(
    'roadmap masks unearned hidden trophies',
    roadmapText.includes('Hidden trophy') && !roadmapText.includes('Top Of The World, Ma'),
  );

  // 12. Missables view shows the flagged trophy and the save advice.
  await page.locator('#tab-missables').click();
  const missViewText = await page.locator('#missables-view').textContent();
  check(
    'missables view flags Positive Mental Attitude + save advice',
    missViewText.includes('Positive Mental Attitude') && missViewText.includes('manual save'),
  );

  // 13. Export / import round-trip restores the earned tick.
  await page.locator('#tab-checklist').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const exported = JSON.parse((await import('node:fs')).readFileSync(downloadPath, 'utf8'));
  check('export holds the earned trophy', Array.isArray(exported.earned) && exported.earned.includes(17), JSON.stringify(exported.earned));
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#reset').click();
  await page.waitForTimeout(200);
  check('reset clears progress', (await page.locator('#progress-count').textContent()) === '0 of 55 earned');
  await page.locator('#import').setInputFiles(downloadPath);
  await page.waitForTimeout(300);
  check('import restores progress', (await page.locator('#progress-count').textContent()) === '1 of 55 earned');

  // 14. No request leaves the app's own server.
  check('no external requests', externalRequests.length === 0, externalRequests.join(', '));

  // 15. No page errors.
  check('no page errors', pageErrors.length === 0, pageErrors.join(' | '));

  await browser.close();
} finally {
  if (browser) await browser.close().catch(() => {});
  server.close();
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failures.length) console.log('Failed:', failures.join(', '));
process.exit(failed ? 1 : 0);
