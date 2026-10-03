#!/usr/bin/env node
// Trích dữ liệu học nền từ app ĐANG CHẠY (CANDO được bổ sung lúc chạy bằng nhiều lệnh push, nên đọc tĩnh app.js sẽ thiếu):
// mở app bằng Chromium headless, đọc CANDO (kèm hoạt động của từng tham chiếu qua cdActs), UNITS, GPOINTS → content/engine/src/app-dump.json.
// tools/engine-gen.mjs dựng đồ thị từ tệp này. Chạy lại khi nội dung học nền trong app.js đổi:
//   node tools/engine-dump.mjs && node --experimental-strip-types tools/engine-gen.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8097;
const srv = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs'), String(PORT)], { stdio: 'ignore' });
try {
  await new Promise(r => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => window.ELREADY === true, null, { timeout: 30000 });
  // Chi tiết A2–C2 (bài đọc, bài nghe) tải ngầm sau khi mở; cdActs của tham chiếu rd/ls cần chúng.
  /* global detailAll */
  await page.waitForFunction(() => detailAll(), null, { timeout: 60000 });
  const dump = await page.evaluate(() => ({
    /* global CANDO, UNITS, GPOINTS, cdActs */
    cando: CANDO.map(c => ({
      id: c.id, lv: c.lv, grp: c.grp, grp0: c.grp0 || null, vi: c.vi, en: c.en,
      refs: c.ref.map(r => ({ t: r.t, acts: cdActs(r, c.lv).map(a => ({ at: a.at, t: a.t })) })),
    })),
    units: UNITS.map(u => ({ id: u.id, level: u.level, title: u.title, vi: u.vi || '', words: (u.words || []).length })),
    gpoints: GPOINTS.map(p => ({ id: p.id, level: p.level, title: p.title, vi: p.vi || '' })),
  }));
  await browser.close();
  mkdirSync(join(ROOT, 'content/engine/src'), { recursive: true });
  writeFileSync(join(ROOT, 'content/engine/src/app-dump.json'), JSON.stringify(dump, null, 1) + '\n');
  console.log(`engine-dump: ${dump.cando.length} Can-Do, ${dump.units.length} unit, ${dump.gpoints.length} điểm ngữ pháp`);
} finally {
  srv.kill();
}
