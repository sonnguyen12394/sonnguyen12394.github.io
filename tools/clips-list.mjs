#!/usr/bin/env node
// v120 Âm thanh thu sẵn A1–B1: gom mọi câu chữ app sẽ đọc to ở cấp Pre-A1–B1 (từ, câu ví dụ, câu thoại hai giọng, câu giao tiếp,
// từ của cặp âm, phần Pre-A1 cố định) → content/clips.json. tools/clips-audio.cjs thu các câu này bằng Kokoro thành a/c/<khoá>.mp3;
// app.js (say / sayLines) phát tệp thu sẵn khi có, không có thì dùng giọng máy như trước.
// Đọc từ app ĐANG CHẠY (như engine-dump): nhiều nội dung được bổ sung lúc chạy. Chạy lại khi nội dung đọc to của A1–B1 đổi:
//   node tools/clips-list.mjs && KOKORO_DIR=… SHERPA_DIR=… node tools/clips-audio.cjs
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8096;
const srv = spawn(process.execPath, [join(ROOT, 'tools/serve.mjs'), String(PORT)], { stdio: 'ignore' });
try {
  await new Promise(r => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => window.ELREADY === true, null, { timeout: 30000 });
  /* global detailAll */
  await page.waitForFunction(() => detailAll(), null, { timeout: 60000 });
  const list = await page.evaluate(() => {
    /* global UNITS, DIALOGUES, FUNCTIONS, SOUNDS, PA_LET, PA_DAYS, PA_MON, PA_CLASS, PA_PHON, PA_CVC, PA_VOW, numWord, clipKey */
    const LV = ['A1', 'A2', 'B1'], out = new Map();
    // v: giọng (0 = người A / giọng chính, 1 = người B); src: nguồn để soát.
    const add = (t, v, src) => { if (!t) return; const k = clipKey(t, v); if (!out.has(k)) out.set(k, { k, t: String(t).trim(), v, src }); };
    for (const u of UNITS) if (LV.includes(u.level)) for (const w of u.words || []) { add(w.word, 0, 'word'); add(w.ex, 0, 'ex'); }
    for (const d of DIALOGUES) if (LV.includes(d.lv)) for (const l of d.lines || []) add(l.t, l.s === 'B' ? 1 : 0, 'dlg');
    for (const f of FUNCTIONS) if (LV.includes(f.lv)) for (const e of f.exps || []) add(e.t, 0, 'fn');
    for (const s of SOUNDS) for (const p of s.pairs) { add(p[0], 0, 'snd'); add(p[2], 0, 'snd'); }
    PA_LET.forEach(L => add('Letter ' + L + '.', 0, 'pa'));
    for (let n = 0; n <= 100; n++) add(numWord(n) + '.', 0, 'pa');
    PA_DAYS.forEach(d => add(d + '.', 0, 'pa')); PA_MON.forEach(m => add(m + '.', 0, 'pa'));
    PA_CLASS.forEach(([en]) => add(en, 0, 'pa'));
    PA_PHON.flat().forEach(w => add(w + '.', 0, 'pa')); PA_CVC.forEach(w => add(w + '.', 0, 'pa'));
    PA_VOW.forEach(([, , ex]) => add(ex.split(', ').join('. ') + '.', 0, 'pa'));
    return [...out.values()];
  });
  await browser.close();
  list.sort((a, b) => (a.k < b.k ? -1 : 1));
  writeFileSync(join(ROOT, 'content/clips.json'), JSON.stringify(list, null, 0).replace(/\},\{/g, '},\n{') + '\n');
  const by = {}; for (const x of list) by[x.src] = (by[x.src] ?? 0) + 1;
  console.log(`clips-list: ${list.length} câu`, by, `${list.reduce((a, x) => a + x.t.length, 0)} ký tự`);
} finally { srv.kill(); }
