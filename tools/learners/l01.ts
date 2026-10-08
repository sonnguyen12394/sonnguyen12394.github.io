// Bot người học L01 — Người mới hoàn toàn (Cold-Start Beginner).
// Bot chơi app qua giao diện thật (Chromium, màn hình điện thoại), như một người dùng: mở app, làm theo điều app bảo, chơi tháp,
// đọc phản hồi, quay lại mỗi ngày. Bot KHÔNG đọc trạng thái bên trong để quyết định học gì.
//
// Người học ẩn (ground truth) để đo app có đoán đúng hay không:
//   - Mỗi nút năng lực có kỹ năng thật s ∈ [0,1], khởi tạo theo cấp CEFR và loại nút (biết ít từ A1, ngữ pháp yếu hơn từ vựng,
//     gần như không biết B1+). Hồ sơ không đồng đều có chủ đích (từ vựng > ngữ pháp > chức năng giao tiếp).
//   - Xác suất đúng: câu chọn = s + (1 − s)/số phương án (đoán); câu tự gõ = s^1.4 (nhớ lại khó hơn nhận ra).
//     Câu đã gặp được cộng "quen mặt" +0,15 (học vẹt câu cụ thể), câu mới thì không → đo được transfer thật.
//   - Học: thấy đáp án sau khi sai +10% phần còn thiếu, trả lời đúng +4%, đọc bí kíp +20%.
//   - Quên: phần đã học suy giảm về mức ban đầu theo e^(−Δngày / S); S tăng gấp đôi sau mỗi lần nhớ đúng cách ngày.
//   - "Thật sự biết" một nút = s hiệu dụng ≥ 0,8.
// Bot chỉ dùng EM.peek() (câu đang hiện + đáp án) làm "trí nhớ" của người học: biết đáp án khi và chỉ khi tung xúc xắc theo s.
// Giới hạn trung thực: đây là người học mô phỏng; mô hình học / quên do bot đặt ra, nên "mức tăng" của bot không chứng minh
// hiệu quả học trên người thật. Điều bot đo tốt: app có đoán đúng trình độ ẩn, có công nhận nhầm, có chọn đúng chỗ thiếu không.
//
// Chạy: node --experimental-strip-types --no-warnings tools/learners/l01.ts [--days 45] [--seed 1] [--out reports/learners/L01]

import { chromium, devices, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const arg = (k: string, d: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1]! : d; };
const DAYS = Number(arg('days', '45')), SEED = Number(arg('seed', '1')), OUT = arg('out', 'reports/learners/L01'), PORT = Number(arg('port', '8098'));
const SCHEDULE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 35, 44].filter(d => d <= DAYS);

// ---------- ngẫu nhiên có hạt giống ----------
let _s = SEED >>> 0;
const rnd = () => { _s = (_s + 0x6d2b79f5) >>> 0; let t = _s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- người học ẩn ----------
const gf = readdirSync('data/engine').find(f => /^graph\..*\.json$/.test(f))!;
const G = JSON.parse(readFileSync(join('data/engine', gf), 'utf8')) as { nodes: { id: string; kind: string; cefr: string; vi: string }[] };
const NODE = new Map(G.nodes.map(n => [n.id, n]));
const PRIOR: Record<string, Record<string, number>> = {
  u: { 'Pre-A1': 0.75, A1: 0.6, A2: 0.3, B1: 0.1, B2: 0.04, C1: 0.02 },
  g: { 'Pre-A1': 0.5, A1: 0.35, A2: 0.15, B1: 0.05, B2: 0.02, C1: 0.01 },
  ph: { 'Pre-A1': 0.4, A1: 0.3, A2: 0.2, B1: 0.1, B2: 0.05, C1: 0.05 },
  fn: { 'Pre-A1': 0.35, A1: 0.25, A2: 0.1, B1: 0.05, B2: 0.02, C1: 0.01 },
};
interface K { p: number; s: number; S: number; last: number; seen: Set<string> }
const mind = new Map<string, K>();
function k(node: string): K {
  let x = mind.get(node);
  if (!x) {
    const n = NODE.get(node), pre = node.split(':')[0]!, base = (PRIOR[pre] ?? PRIOR.fn!)[n?.cefr ?? 'A2'] ?? 0.1;
    const p = Math.max(0, Math.min(0.95, base + (rnd() - 0.5) * 0.3));
    x = { p, s: p, S: 2, last: 0, seen: new Set() };
    mind.set(node, x);
  }
  return x;
}
const eff = (x: K, day: number) => x.p + (x.s - x.p) * Math.exp(-Math.max(0, day - x.last) / x.S);
const knows = (node: string, day: number) => eff(k(node), day) >= 0.8;
function learn(node: string, day: number, gain: number, recalled = false): void {
  const x = k(node), cur = eff(x, day);
  if (recalled && day - x.last >= 1) x.S = Math.min(120, x.S * 2);
  x.s = cur + gain * (1 - cur); x.last = day;
}
function pCorrect(node: string, day: number, item: string, opts?: number): number {
  const x = k(node), s = Math.min(1, eff(x, day) + (x.seen.has(item) ? 0.15 : 0));
  return opts ? s + (1 - s) / opts : Math.pow(s, 1.4);
}

// ---------- ghi nhận ----------
interface Row { day: number; sess: string; run: string; game?: string; gap?: string; node: string; level: number; item: string; novel: boolean; opts: number; pTrue: number; trueKnow: boolean; ok: boolean; dunno: boolean; appState?: string; appM?: number; appN?: number; ms: number }
const rows: Row[] = [];
const screens: { day: number; sess: string; where: string; text: string }[] = [];
const events: { day: number; sess: string; what: string; info?: unknown }[] = [];
const ends: { day: number; sess: string; m: unknown; truth: Record<string, number>; snaps: number; q: unknown }[] = [];
let DAY = 0, SESS = '';
const note = (what: string, info?: unknown) => { events.push({ day: DAY, sess: SESS, what, ...(info !== undefined ? { info } : {}) }); };

// ---------- trình duyệt ----------
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function main(): Promise<void> {
  const srv = spawn('node', ['tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
  await sleep(800);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block' });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await ctx.route(/supabase\.co/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  try {
    for (const day of SCHEDULE) {
      DAY = day; SESS = `S${String(SCHEDULE.indexOf(day) + 1).padStart(3, '0')}`;
      await session(page, day);
    }
  } finally {
    const st = await page.evaluate(() => (window as any).eval('st')).catch(() => null);   // eslint-disable-line @typescript-eslint/no-explicit-any
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'rows.json'), JSON.stringify(rows));
    writeFileSync(join(OUT, 'screens.json'), JSON.stringify(screens, null, 1));
    writeFileSync(join(OUT, 'events.json'), JSON.stringify(events, null, 1));
    writeFileSync(join(OUT, 'ends.json'), JSON.stringify(ends));
    writeFileSync(join(OUT, 'state.json'), JSON.stringify({ e: st?.e ?? null, errors, mind: [...mind].map(([n, x]) => ({ n, p: +x.p.toFixed(2), s: +eff(x, DAY).toFixed(2), seen: x.seen.size })) }));
    await browser.close(); srv.kill();
    console.log(`L01: ${rows.length} câu trả lời, ${SCHEDULE.length} phiên, lỗi trang ${errors.length} → ${OUT}`);
  }
}

const text = (page: Page) => page.evaluate(() => ((document.querySelector('main') ?? document.body) as HTMLElement).innerText.replace(/\n{2,}/g, '\n').trim());
async function shot(page: Page, where: string): Promise<string> { const t = await text(page); screens.push({ day: DAY, sess: SESS, where, text: t.slice(0, 1500) }); return t; }
const visible = async (page: Page, sel: string) => (await page.locator(sel).filter({ visible: true }).count()) > 0;
const btn = (page: Page, name: RegExp | string) => page.getByRole('button', { name, exact: typeof name === 'string' }).filter({ visible: true }).first();
async function click(page: Page, name: RegExp | string): Promise<boolean> {
  const b = btn(page, name);
  if (!(await b.count())) return false;
  await b.click(); await sleep(120); return true;
}

async function setDay(page: Page, day: number): Promise<void> {
  await page.evaluate(d => { const w = window as any, st = w.eval('st'); st.offset = d; w.eval('save()'); }, day);   // eslint-disable-line @typescript-eslint/no-explicit-any
}
async function waitReady(page: Page): Promise<void> {
  await page.waitForFunction(() => (window as any).ELREADY === true, null, { timeout: 30000 });   // eslint-disable-line @typescript-eslint/no-explicit-any
  await sleep(300);
}

async function session(page: Page, day: number): Promise<void> {
  if (day === 0) { await page.goto(`http://localhost:${PORT}/`); await waitReady(page); await onboarding(page); }
  else {
    await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 }).catch(() => {});   // eslint-disable-line @typescript-eslint/no-explicit-any
    await setDay(page, day); await page.reload(); await waitReady(page);
  }
  // Mở app: màn đầu tiên là gì, có bảo làm gì không.
  const t0 = await shot(page, 'open');
  note('open', { first: t0.split('\n').slice(0, 3).join(' | ') });
  // Người học vâng lời: xem "Lộ trình hôm nay" và làm việc app đề xuất trước (nếu là việc làm được ngay), rồi chơi tháp.
  await followToday(page);
  const floors = day === 0 ? 2 : 2 + (rnd() < 0.3 ? 1 : 0);
  for (let f = 0; f < floors; f++) await playFloor(page);
  // Cuối phiên: ảnh chụp mastery của app và kỹ năng thật của bot trên mọi nút đã gặp (để so app đoán đúng tới đâu).
  const e = await page.evaluate(() => { const st = (window as any).eval('st'); return { m: st.e.m, snaps: st.e.ev.snap.length, q: st.e.q }; });   // eslint-disable-line @typescript-eslint/no-explicit-any
  const truth: Record<string, number> = {};
  for (const n of new Set([...Object.keys(e.m ?? {}), ...mind.keys()])) truth[n] = +eff(k(n), day).toFixed(3);
  ends.push({ day, sess: SESS, m: e.m, truth, snaps: e.snaps, q: e.q });
}

async function onboarding(page: Page): Promise<void> {
  const t = await shot(page, 'hello');
  note('hello', { words: t.split(/\s+/).length });
  if (!(await click(page, 'Bắt đầu'))) { note('stuck', 'không thấy nút Bắt đầu'); return; }
  await sleep(500);
  const intro = await shot(page, 'diag-intro');
  note('diag-intro', { words: intro.split(/\s+/).length });
  if (!(await click(page, /Bắt đầu dò/))) { note('stuck', 'không thấy nút Bắt đầu dò'); return; }
  let n = 0;
  for (; n < 80; n++) {
    await sleep(80);
    if (await visible(page, 'h1:has-text("App đã đặt mục tiêu"), h2:has-text("App đã đặt mục tiêu")')) break;
    const pk = await peek(page);
    if (!pk) { if (await click(page, /Xem kết quả|Tiếp|Đi tiếp/)) continue; break; }
    await answer(page, pk);
  }
  const res = await shot(page, 'diag-result');
  note('diag-result', { probes: n, head: res.split('\n').slice(0, 6).join(' | ') });
  await click(page, /Bắt đầu leo tháp/);
  await sleep(400);
}

interface Peek { run: string; node: string; level: number; id: string; prompt: string; opts?: string[]; ans?: number; accept?: string[]; game?: string; gap?: string }
const peek = (page: Page): Promise<Peek | null> => page.evaluate(() => { const w = window as any; try { return w.eval('EM') ? w.eval('EM').peek() : null; } catch { return null; } });   // eslint-disable-line @typescript-eslint/no-explicit-any

// Trả lời như người học ẩn. Đúng/sai quyết định bằng xúc xắc theo s; sai thì chọn phương án nhiễu hoặc "Không biết".
async function answer(page: Page, q: Peek): Promise<void> {
  const node = q.node, x = k(node), nOpts = q.opts?.length ?? 0, p = pCorrect(node, DAY, q.id, nOpts || undefined);
  const novel = !x.seen.has(q.id), truth = knows(node, DAY), t0 = Date.now();
  let ok = rnd() < p, dunno = false;
  if (!ok && eff(x, DAY) < 0.25 && rnd() < 0.4) dunno = true;
  const act = { diag: 'dans', quest: 'qans', measure: 'xans', micro: 'mans', probe: 'pans', xfer: 'xans', tout: 'tans' }[q.run] ?? 'qans';
  if (q.opts) {
    let i = dunno ? -1 : ok ? q.ans! : (() => { const w = q.opts!.map((_, j) => j).filter(j => j !== q.ans); return w[Math.floor(rnd() * w.length)] ?? -1; })();
    if (i < 0) dunno = true;
    const sel = `[data-e="${act}"][data-i="${i}"]`;
    if (!(await page.locator(sel).filter({ visible: true }).count())) { note('stuck', { why: 'không thấy nút trả lời', sel, run: q.run }); return; }
    await page.locator(sel).filter({ visible: true }).first().click();
    ok = !dunno && i === q.ans;
  } else {
    if (dunno) await page.locator(`[data-e="${act}"][data-i="-1"]`).filter({ visible: true }).first().click();
    else {
      const right = q.accept?.[0] ?? '', typed = ok ? right : wrongType(right);
      await page.locator('input[name="a"]').filter({ visible: true }).first().fill(typed);
      await page.locator('input[name="a"]').filter({ visible: true }).first().press('Enter');
      ok = ok && !!right;
    }
  }
  await sleep(100);
  const app = await page.evaluate(([n, lv]) => { const w = window as any; try { const s = w.ELCORE.stat(w.eval('st'), n, Math.max(1, Math.min(5, lv))); return { state: s.state, m: s.m, n: s.n }; } catch { return null; } }, [node, q.level] as const);   // eslint-disable-line @typescript-eslint/no-explicit-any
  rows.push({ day: DAY, sess: SESS, run: q.run, ...(q.game ? { game: q.game } : {}), ...(q.gap ? { gap: q.gap } : {}), node, level: q.level, item: q.id, novel, opts: nOpts, pTrue: +p.toFixed(2), trueKnow: truth, ok, dunno, ...(app ? { appState: app.state, appM: +(+app.m).toFixed(2), appN: app.n } : {}), ms: Date.now() - t0 });
  x.seen.add(q.id);
  // Học từ chính lượt này: nhớ đúng (luyện truy hồi) hoặc thấy đáp án khi sai (đo không hiện đáp án thì không học).
  if (q.run !== 'measure' && q.run !== 'diag') learn(node, DAY, ok ? 0.04 : 0.1, ok);
  else if (ok) learn(node, DAY, 0.02, true);
}
function wrongType(right: string): string {
  const r = rnd();
  if (r < 0.4) return right.length > 3 ? right.slice(0, -2) : 'x';
  if (r < 0.7) return right.split('').reverse().join('');
  return 'idk';
}

async function playFloor(page: Page): Promise<void> {
  const home = await shot(page, 'tower');
  if (!(await click(page, /Leo tầng/))) { note('stuck', { why: 'không thấy nút leo tầng', home: home.slice(0, 200) }); return; }
  let steps = 0;
  for (; steps < 40; steps++) {
    await sleep(60);
    if (await visible(page, 'h1:has-text("Qua tầng"), h1:has-text("Hết tim")')) break;
    const pk = await peek(page);
    if (pk?.run === 'camp') {
      await shot(page, 'camp');
      if (pk.node) learn(pk.node, DAY, 0.2);
      note('camp', { node: pk.node, title: pk.prompt });
      if (await visible(page, '[data-e="qcheck"]')) await page.locator('[data-e="qcheck"]').first().click();   // "Thử ngay 1 câu"
      else await page.locator('[data-e="qnext"]').first().click();
      continue;
    }
    if (pk) { await answer(page, pk); await feedback(page); continue; }
    if (await visible(page, '[data-e="qnext"]')) { await page.locator('[data-e="qnext"]').first().click(); continue; }
    note('stuck', { why: 'tầng: không có câu, không có nút đi tiếp', text: (await text(page)).slice(0, 200) }); break;
  }
  const end = await shot(page, 'floor-end');
  note('floor-end', { head: end.split('\n').slice(0, 4).join(' | ') });
  await click(page, 'Về tháp');
}

// Đọc phản hồi sau câu trả lời (học thêm khi thấy đáp án) rồi bấm đi tiếp.
async function feedback(page: Page): Promise<void> {
  if (await visible(page, '.fb')) {
    const t = await page.locator('.fb').first().innerText();
    if (!/Trúng|gục/.test(t)) screens.push({ day: DAY, sess: SESS, where: 'feedback-wrong', text: t });
  }
  if (await visible(page, '[data-e="qnext"]')) await page.locator('[data-e="qnext"]').first().click();
}

// "Lộ trình hôm nay": làm việc đầu tiên app đề xuất nếu là việc trong app engine (kiểm tra nhanh, thử câu mới, đo, bí kíp).
async function followToday(page: Page): Promise<void> {
  if (!(await click(page, 'Lộ trình hôm nay'))) { note('today-missing'); return; }
  await sleep(500);
  const t = await shot(page, 'today');
  // Đo đến hạn: người học làm theo.
  if (await click(page, /Đo đầu vào|Đo sau khi học|Đo lại sau/)) {
    await sleep(300);
    if (await click(page, /Đo đầu vào|Đo sau khi học|Đo lại sau/)) await runQuiz(page, 'measure');
    await shot(page, 'measure-result');
  } else {
    const first = page.locator('main [data-e="go"][data-r^="probe/"], main [data-e="go"][data-r^="xfer/"], main [data-e="go"][data-r^="micro/"]').filter({ visible: true }).first();
    if (await first.count()) {
      const r = await first.getAttribute('data-r');
      note('today-action', { route: r });
      await first.click(); await sleep(400);
      if (r?.startsWith('micro/')) { await shot(page, 'micro-card'); const node = r.split('/')[1]!; learn(node, DAY, 0.2); if (await click(page, /Làm câu kiểm tra|Kiểm tra|Thử/)) await runQuiz(page, 'micro'); }
      else await runQuiz(page, r?.split('/')[0] ?? '');
      await shot(page, 'action-result');
    } else note('today-top', { text: t.split('\n').slice(0, 8).join(' | ') });
  }
  // Về màn chính (tab Chơi).
  const tab = page.locator('#bnav button, #nav button').filter({ hasText: 'Chơi' }).filter({ visible: true }).first();
  if (await tab.count()) await tab.click(); else note('stuck', 'không thấy tab Chơi');
  await sleep(400);
}
async function runQuiz(page: Page, kind: string): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await sleep(80);
    const pk = await peek(page);
    if (!pk) break;
    await answer(page, pk);
  }
  note('quiz-done', { kind });
}

main().catch(e => { console.error(e); process.exit(1); });
