#!/usr/bin/env node
// Đo Lighthouse (điện thoại, mạng 4G chậm giả lập) trên bản build đang có, qua máy chủ nén gzip như GitHub Pages.
// Yêu cầu 10.3: cả 4 mục (Performance, Accessibility, Best Practices, SEO) ≥ 90. Chạy 3 lần, lấy trung vị từng mục.
// Dùng Chromium của Playwright. Thoát mã 1 nếu chưa đạt.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8097, URL = `http://localhost:${PORT}/`, RUNS = Number(process.env.LH_RUNS || 3), MIN = 0.9;
const srv = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const scores = { performance: [], accessibility: [], 'best-practices': [], seo: [] };
mkdirSync(join(ROOT, '.lh'), { recursive: true });
try {
  for (let i = 0; i < RUNS; i++) {
    // Mỗi lần một hồ sơ trình duyệt mới: đo đúng lần mở đầu tiên (chưa có tiến độ, chưa có bộ nhớ đệm).
    const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
    let r;
    try { r = await lighthouse(URL, {
      port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: Object.keys(scores),
      // Font Google bị chặn ở máy không có mạng ngoài; CI có mạng nên vẫn đo đủ. Chặn thì không tính lỗi mạng ngoài vào điểm.
      blockedUrlPatterns: process.env.LH_BLOCK_FONTS ? ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] : [],
    }); } finally { await chrome.kill(); }
    for (const k of Object.keys(scores)) scores[k].push(r.lhr.categories[k].score);
    writeFileSync(join(ROOT, `.lh/run-${i + 1}.json`), r.report);
    const a = r.lhr.audits;
    console.log(`lần ${i + 1}: ` + Object.keys(scores).map(k => `${k} ${Math.round(r.lhr.categories[k].score * 100)}`).join(' · ') +
      ` | FCP ${a['first-contentful-paint'].displayValue} · LCP ${a['largest-contentful-paint'].displayValue} · TBT ${a['total-blocking-time'].displayValue} · CLS ${a['cumulative-layout-shift'].displayValue}`);
  }
} finally { srv.kill(); }
const med = xs => [...xs].sort((p, q) => p - q)[Math.floor(xs.length / 2)];
let ok = true;
for (const [k, xs] of Object.entries(scores)) { const m = med(xs); if (m < MIN) ok = false; console.log(`${m >= MIN ? '✓' : '✗'} ${k}: ${Math.round(m * 100)} (trung vị ${RUNS} lần, cần ≥ ${MIN * 100})`); }
process.exit(ok ? 0 : 1);
