// v129 Điều khiển Lò rèn năng lực (forge.ts, forgeview.ts). Nằm trong Túi chữ (tab 🔥 Lò rèn, 🗺️ Bản đồ phủ); hành động bgf*.
// Câu trả lời ghi bằng chứng THẬT qua cùng cổng ingest của mọi game (ctx 'forge', src 'game'); không đổi luật chấm.

import type { EHost, MicroCard } from './host.ts';
import type { EState } from './state.ts';
import type { ECtx } from './views.ts';
import type { Level } from './types.ts';
import type { Observation } from './ev/types.ts';
import type { Peek } from './main.ts';
import { sfx } from './sfx.ts';
import { FORGE_CAP, FORGE_LEN, FORGEABLE, poolOf, pickItem, grade, step, startLevel, tierOf, maxLevel, coverage, areaOf, TIER_F, type FItem, type FRun, type FMode, type Cov } from './forge.ts';
import { viewForgeHome, viewForgeRun, viewForgeTeach, viewCoverage, type ForgeNext } from './forgeview.ts';

export interface ForgeDeps {
  host: EHost;
  E: () => EState;
  rows: () => Array<{ node: string; level: number }>;      // mọi kỹ năng mục tiêu cần (đóng tiền đề), mức cần
  open: () => Array<{ node: string; level: number }>;      // kỹ năng đang mở để học, theo thứ tự ưu tiên của engine
  vi: (node: string) => string;
  pass: (node: string, level: Level) => boolean;
  none: (node: string) => boolean;                         // chưa có bằng chứng nào
  transfer: (node: string) => ReturnType<EHost['probe']>;  // câu ở ngữ cảnh mới chưa gặp (xferItems)
  ev: (o: Observation) => void;
  coins: (n: number) => void;
  goalLv: () => string;
}

export function makeForge(d: ForgeDeps) {
  const { host } = d;
  let run: FRun | null = null, pool: FItem[] = [], card: MicroCard | null = null;
  const today = () => host.today();
  const tier = (node: string) => tierOf(l => d.pass(node, l));
  const usedToday = (node: string) => d.E().ev.led.filter(x => x.day === today() && x.ctx === 'forge' && x.node === node).length;
  const recent = () => new Set(Object.keys(d.E().r ?? {}));
  const seed = () => (Date.now() ^ d.E().ev.led.length * 2654435761) >>> 0;
  function poolFor(node: string): FItem[] {
    return poolOf({ probe: host.probe(node), order: host.order?.(node) ?? [], fix: host.fixes?.(node) ?? [], fn: node.startsWith('fn:') ? host.fn?.(node) ?? [] : [], transfer: d.transfer(node) }, seed());
  }
  function next(): void {
    const r = run!; r.res = null; r.sel = [];
    if (r.n >= FORGE_LEN || usedToday(r.node) >= FORGE_CAP) { r.capped = usedToday(r.node) >= FORGE_CAP; finish(); return; }
    r.item = pickItem(pool, r.cur, recent(), new Set(r.used), seed());
    if (!r.item) finish();
  }
  function finish(): void { const r = run!; r.done = true; r.item = null; if (r.n) sfx('end'); host.save(); }
  function start(node: string, mode: FMode): void {
    const need = (d.rows().find(x => x.node === node)?.level ?? 3) as Level;
    if (!FORGEABLE.test(node)) { host.toast('Kỹ năng này đo bằng bài làm (đọc, nghe, viết, nói), không rèn ở Lò được.'); return; }
    pool = poolFor(node);
    const top = maxLevel(pool), t = tier(node);
    run = { node, vi: d.vi(node), need, mode, cur: startLevel(mode, t, need, top), top, t0: Date.now(), tier0: t, n: 0, ok: 0, streak: 0, used: [], item: null, res: null, sel: [], done: false, teach: false, capped: false, up: [] };
    if (!pool.length) { run.done = true; host.toast('Kho app chưa có câu cho kỹ năng này.'); return; }
    if (usedToday(node) >= FORGE_CAP) { run.capped = true; run.done = true; return; }
    card = mode === 'up' && t === 0 && d.none(node) ? host.micro?.(node)?.card ?? null : null;
    run.teach = !!card;
    if (!run.teach) next();
  }
  function answer(a: { pick?: number; text?: string; order?: number[] }): void {
    const r = run; if (!r?.item || r.res || r.done) return;
    const it = r.item, g = grade(it, a), before = tier(r.node);
    d.ev({ node: r.node, level: it.level, ok: g.ok, g: it.g, item: it.id, text: it.prompt, qt: it.kind === 'mcq' ? 'mcq' : it.kind === 'order' ? 'order' : 'typed', ctx: 'forge', src: 'game', ch: `forge/${r.node}`, ...(g.given ? { given: g.given, right: g.right } : {}) });
    r.n++; r.used.push(it.id); if (g.ok) r.ok++;
    const s = step(r, g.ok); r.cur = s.cur; r.streak = s.streak;
    r.res = { ok: g.ok, right: g.right, ...(it.why ? { why: it.why } : {}) };
    const after = tier(r.node);
    if (after > before) { for (let k = before + 1; k <= after; k++) r.up.push(k); d.coins(10 * (after - before)); host.toast(`${TIER_F[after]![0]} ${r.vi}: lên bậc ${TIER_F[after]![1]}! +${10 * (after - before)} xu`); sfx('clear'); }
    else { if (g.ok) d.coins(2); sfx(g.ok ? 'ok' : 'bad'); }
    host.save(); host.render();
  }

  const acts: Record<string, (el: HTMLElement) => void> = {
    bgfgo: el => { start(el.dataset.n ?? '', el.dataset.m === 'jump' ? 'jump' : 'up'); host.render(); window.scrollTo?.(0, 0); },
    bgfhome: () => { run = null; card = null; host.render(); },
    bgfteach: () => { if (run) { run.teach = false; card = null; next(); host.render(); } },
    bgfpick: el => answer({ pick: Number(el.dataset.i) }),
    bgftile: el => { const r = run, i = Number(el.dataset.i); if (!r?.item || r.res || r.sel.includes(i)) return; r.sel.push(i); host.render(); },
    bgfundo: () => { if (run && !run.res) { run.sel.pop(); host.render(); } },
    bgfdone: () => { if (run?.item?.kind === 'order' && run.sel.length) answer({ order: run.sel }); },
    bgfnext: () => { if (run?.res) { next(); host.render(); } },
    bgfsay: () => { const s = run?.item?.say; if (s) host.say?.(s); },
  };
  const forms: Record<string, (f: HTMLFormElement) => void> = {
    bgftype: f => { const i = f.querySelector('input'), v = String(i?.value ?? '').trim(); if (i) i.value = ''; if (v) answer({ text: v }); },
  };
  function covRows(): Cov[] { return d.rows().map(r => ({ node: r.node, vi: d.vi(r.node), need: r.level as Level, tier: tier(r.node), pass: d.pass(r.node, r.level as Level), area: areaOf(r.node) })); }

  return {
    acts, forms,
    reset(): void { run = null; card = null; },
    active: (): boolean => !!run && !run.done,
    body(c: ECtx, tab: 'forge' | 'map'): string {
      if (tab === 'map') return viewCoverage(c, d.goalLv(), coverage(covRows()));
      if (run) return run.teach && card ? viewForgeTeach(c, run, card) : viewForgeRun(c, run, tier(run.node), !!host.tts?.());
      const nx: ForgeNext[] = d.open().filter(r => FORGEABLE.test(r.node) && !d.pass(r.node, r.level as Level)).slice(0, 6)
        .map(r => ({ node: r.node, vi: d.vi(r.node), need: r.level, tier: tier(r.node), left: FORGE_CAP - usedToday(r.node) }));
      const cv = coverage(covRows());
      return viewForgeHome(c, nx, cv.total ? { done: cv.done, total: cv.total, lv: d.goalLv() } : null);
    },
    // Hub: số kỹ năng đã phủ của mục tiêu.
    cov(): { done: number; total: number } { const cv = coverage(covRows()); return { done: cv.done, total: cv.total }; },
    peek(): Peek | null {
      const it = run?.item; if (!run || !it || run.res || run.done) return null;
      const base = { run: 'forge', node: run.node, level: it.level, id: it.id, prompt: it.prompt, game: 'forge' };
      if (it.kind === 'mcq') return { ...base, opts: it.opts, ans: it.ans ?? 0 };
      if (it.kind === 'order') return { ...base, tiles: it.tiles, order: (it.tokens ?? []).map((w, k, a) => { const idx = (it.tiles ?? []).map((t, i) => (t === w ? i : -1)).filter(i => i >= 0); return idx[a.slice(0, k).filter(x => x === w).length] ?? idx[0]!; }) };
      return { ...base, accept: it.accept ?? [] };
    },
  };
}
