// Test harness: serves the repo root over Node http and drives system Chrome
// through playwright-core installed OUTSIDE the repo (the site has no npm).
// See tests/README.md for the one-time setup.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MODULES = process.env.SJ_TEST_MODULES || path.join(os.homedir(), '.cache/studiojoe-tests/node_modules');
const { chromium } = require(path.join(MODULES, 'playwright-core'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.cjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.md': 'text/markdown',
};

function serve() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end('not found');
    }
    const size = fs.statSync(file).size;
    const type = MIME[path.extname(file)] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? +range[1] : 0;
      const end = range[2] ? +range[2] : size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r(server)));
}

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) passed++; else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || detail === undefined ? '' : '  ' + JSON.stringify(detail)}`);
}

async function withSite(fn) {
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  try { await fn({ base, browser }); }
  catch (e) { check('uncaught: ' + e.message, false); }
  finally { await browser.close(); server.close(); }
}

function done() {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
}

module.exports = { withSite, check, done };
