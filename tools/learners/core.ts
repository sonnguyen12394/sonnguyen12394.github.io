// Lõi bot người học (tools/learners): chơi app qua giao diện thật (Chromium, màn hình điện thoại) như một người dùng — mở app, làm
// theo điều app bảo, chơi tháp, đọc phản hồi, quay lại mỗi ngày. Bot KHÔNG đọc trạng thái bên trong để quyết định học gì.
// Mỗi dạng người học (l01.ts, l02.ts…) là một Profile: người học ẩn (ground truth) + hành vi riêng + kịch bản ép.
// Bot chỉ dùng EM.peek() (câu đang hiện + đáp án, chỉ đọc) làm "trí nhớ": biết đáp án khi và chỉ khi tung xúc xắc theo kỹ năng ẩn.
// Giới hạn trung thực: người học mô phỏng; mô hình học / quên do bot đặt ra → "mức tăng" của bot không chứng minh hiệu quả học trên
// người thật. Điều bot đo tốt: app đoán đúng trình độ ẩn tới đâu, có công nhận / từ chối nhầm, có kẹt, có hỏi đúng chỗ thiếu không.

import { chromium, devices, type Page } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const arg = (k: string, d: string): string => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1]! : d; };
const GAMES = arg('games', 'mix'), GAME_N = 4;   // tháp, Xếp Khối, Bàn Cờ, Bài Câu (v75–v76 thêm game thì tăng)
export const SCHEDULE_DAYS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 35, 44];

const gf = readdirSync('data/engine').find(f => /^graph\..*\.json$/.test(f))!;
export const GRAPH = JSON.parse(readFileSync(join('data/engine', gf), 'utf8')) as { nodes: { id: string; kind: string; cefr: string; vi: string }[] };
export const NODE = new Map(GRAPH.nodes.map(n => [n.id, n]));

export interface K { p: number; s: number; S: number; last: number; seen: Set<string>; peak: number; mis?: number; belief?: string }
export interface Peek { run: string; node: string; level: number; id: string; prompt: string; opts?: string[]; ans?: number; accept?: string[]; game?: string; gap?: string; tiles?: string[]; order?: number[] }
export interface Row {
  day: number; sess: string; run: string; game?: string; gap?: string; node: string; level: number; item: string; novel: boolean; opts: number;
  pTrue: number; trueKnow: boolean; ok: boolean; dunno: boolean; appState?: string; appM?: number; appN?: number; ms: number;
  cause?: string; forced?: string; guess?: boolean; given?: string; mis?: boolean; s?: number; S?: number;   // s: kỹ năng ẩn lúc trả lời; S: độ bền trí nhớ (ngày)
}
// Quyết định thay cho xúc xắc mặc định (kịch bản ép, hiểu sai). i: chỉ số phương án (−1 = "Không biết"); typed: chuỗi gõ.
export interface Decision { ok: boolean; i?: number; typed?: string; forced?: string; mis?: boolean }

export interface Ctx {
  rnd: () => number; day: () => number; k: (node: string) => K; eff: (x: K, day: number) => number; rows: Row[];
  note: (what: string, info?: unknown) => void; page: Page; click: (name: RegExp | string) => Promise<boolean>;
  visible: (sel: string) => Promise<boolean>; shot: (where: string) => Promise<string>; sleep: (ms: number) => Promise<void>;
}
export interface Profile {
  name: string; out: string;
  prior(node: string): number;                       // kỹ năng ẩn ban đầu (trước nhiễu)
  noise?: number; S0?: number;                        // biên độ nhiễu quanh tiên nghiệm; độ bền trí nhớ ban đầu (ngày)
  pCorrect(x: K, s: number, q: Peek, novel: boolean, opts: number): number;
  gain: { ok: number; bad: number; card: number; teach: number; why?: number; diagOk: number };
  dunno: (s: number, rnd: () => number) => boolean;   // sai mà kỹ năng rất thấp → bấm "Không biết" thay vì đoán
  decide?(c: Ctx, q: Peek, x: K, p: number, ok: boolean): Decision | null;
  cause?(c: Ctx, q: Peek, x: K, novel: boolean): string;
  explained?(c: Ctx, node: string, how: 'card' | 'teach' | 'why' | 'targeted'): void;   // vừa đọc lời giải thích của nút; targeted = nêu đúng câu trả lời sai hay gặp
  afterDiag?(c: Ctx): Promise<void>;
  floors?(day: number, rnd: () => number): number;   // số tầng mỗi phiên (mặc định 2, đôi khi 3); phiên ngắn = 1
  rate?: number;
}

// Người học chọn một mục tiêu CEFR ở màn "Mục tiêu" (việc người học được làm; giữ mục tiêu app đã tự đặt), rồi về tab Chơi.
export async function pickGoal(c: Ctx, id: string): Promise<void> {
  const goals = c.page.locator('[data-e="go"][data-r="goals"]').filter({ visible: true }).first();
  if (await goals.count()) { await goals.click(); await c.sleep(400); }
  const pick = c.page.locator('[data-r="pick/cefr"]').filter({ visible: true }).first();
  if (await pick.count()) { await pick.click(); await c.sleep(300); }
  const add = c.page.locator(`[data-e="add"][data-g="${id}"]`).filter({ visible: true }).first();
  if (await add.count()) { await add.click(); await c.sleep(400); c.note(`goal:${id}`); } else c.note('stuck', `không thấy nút chọn ${id}`);
  await c.shot(`goal:${id}`);
  const tab = c.page.locator('#bnav button, #nav button').filter({ hasText: 'Chơi' }).filter({ visible: true }).first();
  if (await tab.count()) await tab.click();
  await c.sleep(400);
}

export async function run(P: Profile): Promise<void> {
  const DAYS = Number(arg('days', '45')), SEED = Number(arg('seed', '1')), OUT = arg('out', P.out), PORT = Number(arg('port', '8098'));
  const RATE = P.rate ?? Number(arg('rate', '1'));
  const SCHEDULE = SCHEDULE_DAYS.filter(d => d <= DAYS);
  let _s = SEED >>> 0;
  const rnd = () => { _s = (_s + 0x6d2b79f5) >>> 0; let t = _s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const mind = new Map<string, K>();
  const k = (node: string): K => {
    let x = mind.get(node);
    if (!x) {
      const p = Math.max(0, Math.min(0.95, P.prior(node) + (rnd() - 0.5) * (P.noise ?? 0.3)));
      x = { p, s: p, S: P.S0 ?? 2, last: 0, seen: new Set(), peak: p };
      mind.set(node, x);
    }
    return x;
  };
  const eff = (x: K, day: number) => x.p + (x.s - x.p) * Math.exp(-Math.max(0, day - x.last) / x.S);
  const knows = (node: string, day: number) => eff(k(node), day) >= 0.8;
  const learn = (node: string, day: number, gain: number, recalled = false): void => {
    const x = k(node), cur = eff(x, day);
    if (recalled && day - x.last >= 1) x.S = Math.min(120, x.S * 2);
    x.s = cur + Math.min(0.9, gain * RATE) * (1 - cur); x.last = day; x.peak = Math.max(x.peak, x.s);
  };

  const rows: Row[] = [], screens: { day: number; sess: string; where: string; text: string }[] = [], events: { day: number; sess: string; what: string; info?: unknown }[] = [];
  const ends: { day: number; sess: string; m: unknown; truth: Record<string, number>; stab: Record<string, number>; snaps: number; q: unknown; mis?: unknown }[] = [];
  let DAY = 0, SESS = '';
  const note = (what: string, info?: unknown) => { events.push({ day: DAY, sess: SESS, what, ...(info !== undefined ? { info } : {}) }); };
  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  const srv = spawn('node', ['tools/serve.mjs', String(PORT)], { stdio: 'ignore' });
  await sleep(800);
  const browser = await chromium.launch();
  const bctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', serviceWorkers: 'block' });
  await bctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await bctx.route(/supabase\.co/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const page = await bctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));

  const text = () => page.evaluate(() => ((document.querySelector('main') ?? document.body) as HTMLElement).innerText.replace(/\n{2,}/g, '\n').trim());
  const shot = async (where: string): Promise<string> => { const t = await text(); screens.push({ day: DAY, sess: SESS, where, text: t.slice(0, 1500) }); return t; };
  const visible = async (sel: string) => (await page.locator(sel).filter({ visible: true }).count()) > 0;
  const click = async (name: RegExp | string): Promise<boolean> => {
    const b = page.getByRole('button', { name, exact: typeof name === 'string' }).filter({ visible: true }).first();
    if (!(await b.count())) return false;
    await b.click(); await sleep(120); return true;
  };
  const C: Ctx = { rnd, day: () => DAY, k, eff, rows, note, page, click, visible, shot, sleep };
  const explained = (node: string, how: 'card' | 'teach' | 'why' | 'targeted') => P.explained?.(C, node, how);

  const setDay = (day: number) => page.evaluate(d => { const w = window as any, st = w.eval('st'); st.offset = d; w.eval('save()'); }, day);   // eslint-disable-line @typescript-eslint/no-explicit-any
  const waitReady = async () => { await page.waitForFunction(() => (window as any).ELREADY === true, null, { timeout: 30000 }); await sleep(300); };   // eslint-disable-line @typescript-eslint/no-explicit-any
  const peek = (): Promise<Peek | null> => page.evaluate(() => { const w = window as any; try { return w.eval('EM') ? w.eval('EM').peek() : null; } catch { return null; } });   // eslint-disable-line @typescript-eslint/no-explicit-any

  function wrongType(right: string): string {
    const r = rnd();
    if (r < 0.4) return right.length > 3 ? right.slice(0, -2) : 'x';
    if (r < 0.7) return right.split('').reverse().join('');
    // Lỗi chính tả (gấp đôi một chữ cái). Trước đây gõ "idk": chuỗi giống nhau ở mọi câu → app (đúng) coi là "trả lời sai lặp lại",
    // tạo giả thuyết hiểu sai giả do chính bot.
    const j = Math.max(0, Math.floor(right.length / 2)); return right.length ? right.slice(0, j) + right[j] + right.slice(j) : 'x';
  }

  // Trả lời như người học ẩn. Đúng/sai quyết định bằng xúc xắc theo kỹ năng; Profile có thể thay quyết định (kịch bản ép, hiểu sai).
  async function answer(q: Peek): Promise<void> {
    const node = q.node, x = k(node), nOpts = q.opts?.length ?? 0, novel = !x.seen.has(q.id), s = eff(x, DAY);
    const p = P.pCorrect(x, s, q, novel, nOpts), truth = knows(node, DAY), t0 = Date.now();
    const cause = P.cause?.(C, q, x, novel);
    let ok = rnd() < p, dunno = false;
    if (!ok && P.dunno(s, rnd)) dunno = true;
    const d = P.decide?.(C, q, x, p, ok) ?? null;
    if (d) { ok = d.ok; dunno = false; }
    const act = { diag: 'dans', quest: 'qans', measure: 'xans', micro: 'mans', probe: 'pans', xfer: 'xans', tout: 'tans' }[q.run] ?? 'qans';
    let given = '';
    if (q.tiles && q.order) {   // v74 Bài Câu: xếp lá theo thứ tự (biết) / đổi chỗ hai lá liền nhau hoặc lấy lá bẫy (chưa biết)
      if (dunno) await page.locator('[data-e="cdskip"]').first().click();
      else {
        let seq = [...q.order];
        if (!ok) { const trap = q.tiles.findIndex((_, i) => !q.order!.includes(i)); const k = Math.floor(rnd() * Math.max(1, seq.length - 1)); if (trap >= 0 && rnd() < 0.5) seq[k] = trap; else if (seq.length > 1) [seq[k], seq[k + 1]] = [seq[k + 1]!, seq[k]!]; }
        for (const i of seq) await page.locator(`[data-e="cdtile"][data-i="${i}"]`).first().click();
        await page.locator('[data-e="cdplay"]').first().click();
        given = seq.map(i => q.tiles![i]).join(' ');
        ok = given.toLowerCase() === (q.accept?.[0] ?? '').toLowerCase();
      }
    } else if (q.opts) {
      let i = d?.i !== undefined ? d.i : dunno ? -1 : ok ? q.ans! : (() => { const w = q.opts!.map((_, j) => j).filter(j => j !== q.ans); return w[Math.floor(rnd() * w.length)] ?? -1; })();
      if (d && d.i === undefined) i = ok ? q.ans! : (q.opts.findIndex((_, j) => j !== q.ans));
      if (i < 0) dunno = true;
      const sel = `[data-e="${act}"][data-i="${i}"]`;
      if (!(await page.locator(sel).filter({ visible: true }).count())) { note('stuck', { why: 'không thấy nút trả lời', sel, run: q.run }); return; }
      await page.locator(sel).filter({ visible: true }).first().click();
      ok = !dunno && i === q.ans; given = i >= 0 ? q.opts[i] ?? '' : '';
    } else {
      if (dunno) await page.locator(`[data-e="${act}"][data-i="-1"]`).filter({ visible: true }).first().click();
      else {
        const right = q.accept?.[0] ?? '', typed = d?.typed ?? (ok ? right : wrongType(right));
        await page.locator('input[name="a"]').filter({ visible: true }).first().fill(typed);
        await page.locator('input[name="a"]').filter({ visible: true }).first().press('Enter');
        ok = (q.accept ?? []).some(a => a.toLowerCase().trim() === typed.toLowerCase().trim()) || (ok && typed === right && !!right);
        given = typed;
      }
    }
    await sleep(100);
    const app = await page.evaluate(([n, lv]) => { const w = window as any; try { const s = w.ELCORE.stat(w.eval('st'), n, Math.max(1, Math.min(5, lv))); return { state: s.state, m: s.m, n: s.n }; } catch { return null; } }, [node, q.level] as const);   // eslint-disable-line @typescript-eslint/no-explicit-any
    rows.push({
      day: DAY, sess: SESS, run: q.run, ...(q.game ? { game: q.game } : {}), ...(q.gap ? { gap: q.gap } : {}), node, level: q.level, item: q.id, novel, opts: nOpts,
      pTrue: +p.toFixed(2), s: +s.toFixed(2), S: +x.S.toFixed(1), trueKnow: truth, ok, dunno, ...(app ? { appState: app.state, appM: +(+app.m).toFixed(2), appN: app.n } : {}), ms: Date.now() - t0,
      ...(cause ? { cause } : {}), ...(d?.forced ? { forced: d.forced } : {}), ...(d?.mis ? { mis: true } : {}), ...(ok && q.opts && nOpts > 1 && (p * nOpts - 1) / (nOpts - 1) < 0.5 ? { guess: true } : {}), ...(given && !ok ? { given: given.slice(0, 40) } : {}),
    });
    x.seen.add(q.id);
    // Học từ chính lượt này: nhớ đúng (luyện truy hồi) hoặc thấy đáp án khi sai (đo không hiện đáp án thì không học).
    if (q.run !== 'measure' && q.run !== 'diag') learn(node, DAY, ok ? P.gain.ok : P.gain.bad, ok);
    else if (ok) learn(node, DAY, P.gain.diagOk, true);
  }

  async function onboarding(): Promise<void> {
    const t = await shot('hello');
    note('hello', { words: t.split(/\s+/).length });
    if (!(await click('Bắt đầu'))) { note('stuck', 'không thấy nút Bắt đầu'); return; }
    await sleep(500);
    const intro = await shot('diag-intro');
    note('diag-intro', { words: intro.split(/\s+/).length });
    if (!(await click(/Bắt đầu dò/))) { note('stuck', 'không thấy nút Bắt đầu dò'); return; }
    let n = 0;
    for (; n < 80; n++) {
      await sleep(80);
      if (await visible('h1:has-text("App đã đặt mục tiêu"), h2:has-text("App đã đặt mục tiêu")')) break;
      const pk = await peek();
      if (!pk) { if (await click(/Xem kết quả|Tiếp|Đi tiếp/)) continue; break; }
      await answer(pk);
    }
    const res = await shot('diag-result');
    note('diag-result', { probes: n, head: res.split('\n').slice(0, 6).join(' | ') });
    if (P.afterDiag) await P.afterDiag(C);
    else await click(/Bắt đầu leo tháp/);
    await sleep(400);
  }

  async function feedback(node: string): Promise<void> {
    if (await visible('.fb')) {
      const t = await page.locator('.fb').first().innerText();
      if (!/Trúng|gục/.test(t)) screens.push({ day: DAY, sess: SESS, where: 'feedback-wrong', text: t });
      if (P.gain.why && /💡/.test(t)) { learn(node, DAY, P.gain.why); explained(node, 'why'); }   // đọc dòng "vì sao"
    }
    if (await visible('[data-e="qnext"]')) await page.locator('[data-e="qnext"]').first().click();
  }

  async function playFloor(): Promise<void> {
    const home = await shot('tower');
    if (!(await click(/Leo tầng/))) { note('stuck', { why: 'không thấy nút leo tầng', home: home.slice(0, 200) }); return; }
    for (let steps = 0; steps < 40; steps++) {
      await sleep(60);
      if (await visible('h1:has-text("Qua tầng"), h1:has-text("Hết tim")')) break;
      const pk = await peek();
      if (pk?.run === 'camp') {
        const ct = await shot('camp');
        if (pk.node) { learn(pk.node, DAY, P.gain.card); explained(pk.node, /Bạn hay trả lời/.test(ct) ? 'targeted' : 'card'); }
        note('camp', { node: pk.node, title: pk.prompt });
        if (await visible('[data-e="qcheck"]')) await page.locator('[data-e="qcheck"]').first().click();   // "Thử ngay 1 câu"
        else await page.locator('[data-e="qnext"]').first().click();
        continue;
      }
      if (pk) {
        if (await visible('[data-teach]')) { const tt = await page.locator('[data-teach]').first().innerText(); learn(pk.node, DAY, P.gain.teach); explained(pk.node, /Bạn hay trả lời/.test(tt) ? 'targeted' : 'teach'); note('teach', { node: pk.node, targeted: /Bạn hay trả lời/.test(tt) }); }   // đọc thẻ mới trước khi đánh
        await answer(pk); await feedback(pk.node); continue;
      }
      if (await visible('[data-e="qnext"]')) { await page.locator('[data-e="qnext"]').first().click(); continue; }
      note('stuck', { why: 'tầng: không có câu, không có nút đi tiếp', text: (await text()).slice(0, 200) }); break;
    }
    const end = await shot('floor-end');
    note('floor-end', { head: end.split('\n').slice(0, 4).join(' | ') });
    await click('Về tháp');
  }

  // v72 Xếp Khối: trả lời như ở tháp; đặt khối ở ô hợp lệ đầu tiên (bot không cần chơi giỏi — cứu bàn giữ đủ số câu của ván).
  async function playBlocks(): Promise<void> {
    await shot('lobby');
    const start = page.locator('[data-e="bkstart"]').filter({ visible: true }).first();
    if (!(await start.count())) { note('stuck', 'không thấy Xếp Khối'); return; }
    await start.click(); await sleep(120);
    for (let steps = 0; steps < 240; steps++) {
      await sleep(40);
      if (await visible('h1:has-text("Xong ván"), h1:has-text("Hết chỗ đặt")')) break;
      const put = page.locator('[data-e="bkput"][data-ok]');
      if (await put.count()) { await put.first().click(); continue; }
      const pk = await peek();
      if (pk?.run === 'camp') {
        const ct = await shot('camp');
        if (pk.node) { learn(pk.node, DAY, P.gain.card); explained(pk.node, /Bạn hay trả lời/.test(ct) ? 'targeted' : 'card'); }
        note('camp', { node: pk.node, title: pk.prompt });
        if (await visible('[data-e="qcheck"]')) await page.locator('[data-e="qcheck"]').first().click();
        else await page.locator('[data-e="qnext"]').first().click();
        continue;
      }
      if (pk) {
        if (await visible('[data-teach]')) { const tt = await page.locator('[data-teach]').first().innerText(); learn(pk.node, DAY, P.gain.teach); explained(pk.node, /Bạn hay trả lời/.test(tt) ? 'targeted' : 'teach'); note('teach', { node: pk.node, targeted: /Bạn hay trả lời/.test(tt) }); }
        await answer(pk); await feedback(pk.node); continue;
      }
      if (await visible('[data-e="qnext"]')) { await page.locator('[data-e="qnext"]').first().click(); continue; }
      note('stuck', { why: 'xếp khối: không có câu, không có ô đặt', text: (await text()).slice(0, 200) }); break;
    }
    const end = await shot('blocks-end');
    note('blocks-end', { head: end.split('\n').slice(0, 4).join(' | ') });
    await click('Về sảnh');
  }

  // v73 Bàn Cờ Phố: tung xúc xắc; dừng ở ô cảnh thì trả lời như ở tháp; lô đất: xây khi đủ xu (người chơi thích sưu tầm nhà).
  async function playBoard(): Promise<void> {
    await shot('lobby');
    const start = page.locator('[data-e="bdstart"]').filter({ visible: true }).first();
    if (!(await start.count())) { note('stuck', 'không thấy Bàn Cờ'); return; }
    await start.click(); await sleep(120);
    for (let steps = 0; steps < 120; steps++) {
      await sleep(40);
      if (await visible('h1:has-text("Hết lượt tung")')) break;
      if (await visible('[data-e="bdroll"]')) { await page.locator('[data-e="bdroll"]').first().click(); continue; }
      if (await visible('[data-e="bdbuild"]')) { await page.locator('[data-e="bdbuild"]').first().click(); continue; }
      if (await visible('[data-e="bdskip"]')) { await page.locator('[data-e="bdskip"]').first().click(); continue; }
      const pk = await peek();
      if (pk?.run === 'camp') {
        const ct = await shot('camp');
        if (pk.node) { learn(pk.node, DAY, P.gain.card); explained(pk.node, /Bạn hay trả lời/.test(ct) ? 'targeted' : 'card'); }
        note('camp', { node: pk.node, title: pk.prompt });
        if (await visible('[data-e="qcheck"]')) await page.locator('[data-e="qcheck"]').first().click();
        else await page.locator('[data-e="qnext"]').first().click();
        continue;
      }
      if (pk) {
        if (await visible('[data-teach]')) { const tt = await page.locator('[data-teach]').first().innerText(); learn(pk.node, DAY, P.gain.teach); explained(pk.node, /Bạn hay trả lời/.test(tt) ? 'targeted' : 'teach'); note('teach', { node: pk.node, targeted: /Bạn hay trả lời/.test(tt) }); }
        await answer(pk); await feedback(pk.node); continue;
      }
      if (await visible('[data-e="qnext"]')) { await page.locator('[data-e="qnext"]').first().click(); continue; }
      note('stuck', { why: 'bàn cờ: không có nút tung / câu / đi tiếp', text: (await text()).slice(0, 200) }); break;
    }
    const end = await shot('board-end');
    note('board-end', { head: end.split('\n').slice(0, 3).join(' | ') });
    await click('Về sảnh');
  }

  // v74 Bài Câu: 3 bàn × 3 lượt; chọn bùa đầu tiên được mời.
  async function playCards(): Promise<void> {
    await shot('lobby');
    const start = page.locator('[data-e="cdstart"]').filter({ visible: true }).first();
    if (!(await start.count())) { note('stuck', 'không thấy Bài Câu'); return; }
    await start.click(); await sleep(120);
    for (let steps = 0; steps < 60; steps++) {
      await sleep(40);
      if (await visible('h1:has-text("Xong ván!")')) break;
      if (await visible('[data-e="cdcharm"]')) { await page.locator('[data-e="cdcharm"]').first().click(); continue; }
      const pk = await peek();
      if (pk?.run === 'cards') { await answer(pk); await feedback(pk.node); if (await visible('[data-e="cdnext"]')) await page.locator('[data-e="cdnext"]').first().click(); continue; }
      if (await visible('[data-e="cdnext"]')) { await page.locator('[data-e="cdnext"]').first().click(); continue; }
      note('stuck', { why: 'bài câu: không có câu / nút tiếp', text: (await text()).slice(0, 200) }); break;
    }
    const end = await shot('cards-end');
    note('cards-end', { head: end.split('\n').slice(0, 3).join(' | ') });
    await click('Về sảnh');
  }

  async function runQuiz(kind: string): Promise<void> {
    for (let i = 0; i < 30; i++) {
      await sleep(80);
      const pk = await peek();
      if (!pk) break;
      await answer(pk);
    }
    note('quiz-done', { kind });
  }

  // "Lộ trình hôm nay": làm việc đầu tiên app đề xuất nếu là việc trong app engine (kiểm tra nhanh, thử câu mới, đo, bí kíp).
  async function followToday(): Promise<void> {
    if (!(await click('Lộ trình hôm nay'))) { note('today-missing'); return; }
    await sleep(500);
    const t = await shot('today');
    if (await click(/Đo đầu vào|Đo sau khi học|Đo lại sau/)) {
      await sleep(300);
      if (await click(/Đo đầu vào|Đo sau khi học|Đo lại sau/)) await runQuiz('measure');
      await shot('measure-result');
    } else {
      const first = page.locator('main [data-e="go"][data-r^="probe/"], main [data-e="go"][data-r^="xfer/"], main [data-e="go"][data-r^="micro/"]').filter({ visible: true }).first();
      if (await first.count()) {
        const r = await first.getAttribute('data-r');
        note('today-action', { route: r });
        await first.click(); await sleep(400);
        if (r?.startsWith('micro/')) { const mt = await shot('micro-card'); const node = r.split('/')[1]!; learn(node, DAY, P.gain.card); explained(node, /Bạn hay trả lời/.test(mt) ? 'targeted' : 'card'); if (await click(/Làm câu kiểm tra|Kiểm tra|Thử/)) await runQuiz('micro'); }
        else await runQuiz(r?.split('/')[0] ?? '');
        await shot('action-result');
      } else note('today-top', { text: t.split('\n').slice(0, 8).join(' | ') });
    }
    const tab = page.locator('#bnav button, #nav button').filter({ hasText: 'Chơi' }).filter({ visible: true }).first();
    if (await tab.count()) await tab.click(); else note('stuck', 'không thấy tab Chơi');
    await sleep(400);
  }

  async function session(day: number): Promise<void> {
    if (day === 0) { await page.goto(`http://localhost:${PORT}/`); await waitReady(); await onboarding(); }
    else {
      await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 }).catch(() => {});   // eslint-disable-line @typescript-eslint/no-explicit-any
      await setDay(day); await page.reload(); await waitReady();
    }
    const t0 = await shot('open');
    note('open', { first: t0.split('\n').slice(0, 3).join(' | ') });
    await followToday();
    const floors = P.floors ? P.floors(day, rnd) : day === 0 ? 2 : 2 + (rnd() < 0.3 ? 1 : 0);
    // v72–v73: sảnh có nhiều game; mặc định bot luân phiên tháp, Xếp Khối, Bàn Cờ (--games tower: chỉ tháp, như trước v72).
    for (let f = 0; f < floors; f++) { const g = GAMES === 'mix' ? (day + f) % GAME_N : 0; if (g === 1) await playBlocks(); else if (g === 2) await playBoard(); else if (g === 3) await playCards(); else await playFloor(); }
    // Cuối phiên: mastery của app, giả thuyết hiểu sai của app, kỹ năng thật của bot trên mọi nút đã gặp.
    const e = await page.evaluate(() => { const st = (window as any).eval('st'); return { m: st.e.m, snaps: st.e.ev.snap.length, q: st.e.q, mis: st.e.ev.mis }; });   // eslint-disable-line @typescript-eslint/no-explicit-any
    const truth: Record<string, number> = {}, stab: Record<string, number> = {};
    for (const n of new Set([...Object.keys(e.m ?? {}), ...mind.keys()])) { truth[n] = +eff(k(n), day).toFixed(3); stab[n] = +k(n).S.toFixed(1); }
    ends.push({ day, sess: SESS, m: e.m, truth, stab, snaps: e.snaps, q: e.q, mis: e.mis });
  }

  try {
    for (const day of SCHEDULE) { DAY = day; SESS = `S${String(SCHEDULE.indexOf(day) + 1).padStart(3, '0')}`; await session(day); }
  } finally {
    const st = await page.evaluate(() => (window as any).eval('st')).catch(() => null);   // eslint-disable-line @typescript-eslint/no-explicit-any
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, 'rows.json'), JSON.stringify(rows));
    writeFileSync(join(OUT, 'screens.json'), JSON.stringify(screens, null, 1));
    writeFileSync(join(OUT, 'events.json'), JSON.stringify(events, null, 1));
    writeFileSync(join(OUT, 'ends.json'), JSON.stringify(ends));
    writeFileSync(join(OUT, 'state.json'), JSON.stringify({ e: st?.e ?? null, errors, mind: [...mind].map(([n, x]) => ({ n, p: +x.p.toFixed(2), s: +eff(x, DAY).toFixed(2), seen: x.seen.size, mis: x.mis ?? null, belief: x.belief ?? null })) }));
    await browser.close(); srv.kill();
    console.log(`${P.name}: ${rows.length} câu trả lời, ${SCHEDULE.length} phiên, lỗi trang ${errors.length} → ${OUT}`);
  }
}
