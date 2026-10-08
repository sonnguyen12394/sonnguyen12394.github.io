// Kho bằng chứng L0–L2 và trạng thái dẫn xuất L3 (spec v2.4 §27–35, P21–P28, HG26–HG33).
//   ingest(): quan sát → L0 → evaluate() → L1 sổ + L2 thống kê (phân vùng của thiết bị) → tính lại ô Beta của nút (L3).
//   derive()/recomputeAll(): ô Beta luôn tính được lại từ L2 (+ tiên nghiệm cho ô chưa có bằng chứng thật), kể cả khi đổi luật
//   (slip, ngưỡng): P26, HG33. Thống kê giữ đủ chiều (mức, ngữ cảnh, dạng câu, câu mới, độ khó) để không gộp mất chiều (§33).
//   prune(): sổ L1 giữ theo giá trị (§30–31, §35), không theo tuổi; bằng chứng quan trọng (tier 2–3) và bằng chứng đại diện
//   của mỗi nút (lần đúng và lần sai gần nhất) được giữ.
//   mergeEv(): gộp hai máy không mất và không đếm trùng (thống kê theo thiết bị chỉ tăng; sổ hợp theo id sự kiện).

import type { Level } from '../types.ts';
import { freshCell, stat, type Cell, type MasteryStore } from '../mastery.ts';
import { evaluate, RULE, type Rule } from './evaluate.ts';
import type { Agg, EvEvent, EvStore, Observation, ObsRec, Prior, Tier } from './types.ts';
import { EV_SCHEMA } from './types.ts';

export const LED_MAX = 2000, LED_KEEP = 1700, OBS_MAX = 300, OBS_DAYS = 7, SEEN_MAX = 150;
const LEGACY = 'legacy';

export function freshEv(): EvStore {
  return { v: EV_SCHEMA, agg: {}, led: [], obs: [], pri: {}, seen: {}, seq: 0, integ: { err: 0, last: '', fixed: 0 } };
}

const cellKey = (node: string, lv: number): string => `${node}|${lv}`;
const clean = (s: string | undefined): string => (s ? s.replace(/[|]/g, '/').slice(0, 40) : '-');
// Thống kê lồng theo ô: thiết bị → "nút|mức" → "ngữ cảnh|dạng câu|câu mới|độ khó" → Agg. Tính một ô chỉ đọc đúng ô đó (C393).
export const subKey = (e: Pick<EvEvent, 'ctx' | 'qt' | 'nov' | 'diff'>): string => `${clean(e.ctx)}|${clean(e.qt)}|${e.nov}|${e.diff ?? 0}`;
const parseSub = (k: string) => { const [ctx, qt] = k.split('|'); return { ctx: ctx!, qt: qt! }; };
export const levelsOf = (lv: Level, only?: boolean | 1): Level[] => (only ? [lv] : (Array.from({ length: lv }, (_, i) => (i + 1) as Level)));

// Băm 31 bit (FNV-1a) → 6 ký tự base36: đánh dấu câu đã gặp ở mỗi nút mà không lưu cả id câu.
export function hash6(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return ((h >>> 1) % 2176782336).toString(36).padStart(6, '0');
}
function seenHas(st: EvStore, node: string, item: string): boolean {
  const s = st.seen[node], h = hash6(item);
  if (!s) return false;
  for (let i = 0; i < s.length; i += 6) if (s.slice(i, i + 6) === h) return true;
  return false;
}
function seenAdd(st: EvStore, node: string, item: string): void {
  const s = (st.seen[node] ?? '') + hash6(item);
  st.seen[node] = s.length > SEEN_MAX * 6 ? s.slice(s.length - SEEN_MAX * 6) : s;
}

// ---------- L3: ô Beta dẫn xuất ----------
export function derive(st: EvStore, node: string, lv: Level, rule: Rule = RULE): Cell | undefined {
  const ck = cellKey(node, lv);
  let a = 1, b = 1, n = 0, d = 0, any = false;
  const q = new Set<string>(), c = new Set<string>();
  for (const part of Object.values(st.agg)) for (const [k, x] of Object.entries(part[ck] ?? {})) {
    any = true;
    a += x.swOk - x.swgOk; b += x.swBad * (1 - rule.slip); n += x.sw; d = Math.max(d, x.d1);
    const p = parseSub(k);
    if (p.qt !== '-' && p.qt !== LEGACY) q.add(p.qt);
    if (p.ctx !== '-' && p.ctx !== LEGACY) c.add(p.ctx);
    for (const y of x.lq ?? []) q.add(y);
    for (const y of x.lc ?? []) c.add(y);
  }
  const pr = st.pri[cellKey(node, lv)];
  if (!any && !pr) return undefined;
  if (n <= 0 && pr) { a = 1 + pr.a; b = 1 + pr.b; }
  return { a: round(a), b: round(b), n: round(n), q: [...q].sort().slice(0, 6), c: [...c].sort().slice(0, 8), d };
}
const round = (x: number): number => Math.round(x * 1e6) / 1e6;

// Mọi khoá ô (nút|mức) có trong thống kê hoặc tiên nghiệm.
function cells(st: EvStore): Set<string> {
  const out = new Set(Object.keys(st.pri));
  for (const part of Object.values(st.agg)) for (const k of Object.keys(part)) out.add(k);
  return out;
}

export function recomputeAll(st: EvStore, rule: Rule = RULE): MasteryStore {
  const m: MasteryStore = {};
  for (const ck of cells(st)) {
    const [node, l] = ck.split('|'), lv = Number(l) as Level, c = derive(st, node!, lv, rule);
    if (c) (m[node!] ||= {})[lv] = c;
  }
  return m;
}
function refreshNode(st: EvStore, m: MasteryStore, node: string): void {
  for (let l = 1 as Level; l <= 5; l = (l + 1) as Level) {
    const c = derive(st, node, l);
    if (c) (m[node] ||= {})[l] = c;
  }
}

// ---------- Ghi một quan sát ----------
export interface IngestCtx { dev: string; ts: number; day: number; recent?: Record<string, number> }

export function ingest(st: EvStore, m: MasteryStore, o: Observation, c: IngestCtx): EvEvent | null {
  if (!o.node || !(o.level >= 1 && o.level <= 5)) return null;
  // L0
  const rec: ObsRec = { ...o, id: `${c.dev}.o${st.seq + 1}`, ts: c.ts, day: c.day };
  st.obs.push(rec);
  if (st.obs.length > OBS_MAX || (st.obs[0] && c.day - st.obs[0].day > OBS_DAYS)) st.obs = st.obs.filter(x => c.day - x.day <= OBS_DAYS).slice(-OBS_MAX);
  // Evaluator
  const novel = !!o.item && !seenHas(st, o.node, o.item);
  const lastSeen = o.item && c.recent ? c.recent[o.item] : undefined;
  st.seq++;
  const ev = evaluate(o, { day: c.day, ts: c.ts, id: `${c.dev}.${st.seq}`, lastSeenDay: lastSeen, novel });
  if (o.item) { if (c.recent) c.recent[o.item] = c.day; if (novel) seenAdd(st, o.node, o.item); }
  // Trạng thái trước (để biết bằng chứng này có làm đổi quyết định không)
  const lvls = levelsOf(ev.lv, ev.only), before = lvls.map(l => stat(m[o.node]?.[l]));
  // L2 (phân vùng của thiết bị này)
  const part = (st.agg[c.dev] ||= {});
  for (const l of lvls) {
    const cell = (part[cellKey(ev.node, l)] ||= {}), x = (cell[subKey(ev)] ||= { n: 0, sw: 0, swOk: 0, swgOk: 0, swBad: 0, nov: 0, asst: 0, d0: c.day, d1: c.day });
    x.n++; x.sw = round(x.sw + ev.w); x.d1 = c.day; if (ev.nov) x.nov++; if (ev.asst) x.asst++;
    if (ev.ok) { x.swOk = round(x.swOk + ev.w); x.swgOk = round(x.swgOk + ev.w * ev.g); } else x.swBad = round(x.swBad + ev.w);
  }
  // L3
  refreshNode(st, m, o.node);
  const after = lvls.map(l => stat(m[o.node]?.[l]));
  // Tier và giá trị (§29–30)
  const flip = before.some((s, i) => s.pass !== after[i]!.pass);
  const disagree = !ev.ok && ev.nov === 1 && before.some(s => s.pass);
  const boundary = after.some(s => s.n >= 3 && Math.abs(s.m - 0.8) < 0.06);
  const transfer = ev.src === 'transfer' || ev.ctx === 'transfer';
  let tier: Tier = 1, why: string | undefined;
  if (disagree || (transfer && !ev.ok)) { tier = 3; why = disagree ? 'disagree' : 'transfer'; }
  else if (flip) { tier = 2; why = 'flip'; }
  else if (boundary || transfer) { tier = 2; why = boundary ? 'boundary' : 'transfer'; }
  ev.tier = tier;
  if (why) ev.why = why;
  const sdDrop = before.reduce((s, x, i) => s + Math.max(0, x.sd - after[i]!.sd), 0);
  const TIER_VAL = [0, 1, 3, 6] as const;
  ev.val = Math.round((TIER_VAL[tier] + ev.nov + (ev.asst ? -0.3 : 0) + Math.min(2, sdDrop * 20)) * 100) / 100;
  st.led.push(ev);
  if (st.led.length > LED_MAX) st.led = prune(st.led, LED_KEEP, c.day);
  return ev;
}

// ---------- Dọn sổ L1 theo giá trị ----------
export function prune(led: EvEvent[], keep: number, today: number): EvEvent[] {
  if (led.length <= keep) return led;
  const protect = new Set<string>();
  const lastOk = new Map<string, EvEvent>(), lastBad = new Map<string, EvEvent>();
  for (const e of led) (e.ok ? lastOk : lastBad).set(e.node, e);          // đại diện mỗi nút (§35)
  for (const e of [...lastOk.values(), ...lastBad.values()]) protect.add(e.id);
  for (const e of led) if (e.tier >= 2) protect.add(e.id);
  const score = (e: EvEvent): number => e.val - (today - e.day) / 60;
  const cand = led.filter(e => !protect.has(e.id)).sort((x, y) => score(x) - score(y) || x.ts - y.ts);
  let drop = led.length - keep;
  const out = new Set(cand.slice(0, Math.max(0, drop)).map(e => e.id));
  drop -= out.size;
  if (drop > 0) {   // vẫn quá: bỏ bằng chứng tier 2 cũ nhất (không bao giờ bỏ tier 3 trước tier 2)
    const t2 = led.filter(e => !out.has(e.id) && e.tier === 2).sort((x, y) => x.ts - y.ts).slice(0, drop);
    t2.forEach(e => out.add(e.id)); drop -= t2.length;
  }
  if (drop > 0) led.filter(e => !out.has(e.id)).sort((x, y) => x.ts - y.ts).slice(0, drop).forEach(e => out.add(e.id));
  return led.filter(e => !out.has(e.id));
}

// ---------- Tiên nghiệm (Claim) ----------
export function setPrior(st: EvStore, m: MasteryStore, node: string, upTo: Level, a: number, b: number, src: Prior['src'], day: number): void {
  for (let l = 1 as Level; l <= upTo; l = (l + 1) as Level) {
    const cur = m[node]?.[l];
    if (cur && cur.n > 0) continue;            // có bằng chứng thật thì không đè
    st.pri[cellKey(node, l)] = { a, b, src, day };
    const c = derive(st, node, l);
    if (c) (m[node] ||= {})[l] = c;
  }
}

// ---------- Nâng cấp từ ô Beta cũ (st.e v3) ----------
// Mỗi ô có bằng chứng thật thành một thống kê "legacy" cho ra đúng α, β cũ; ô chỉ có tiên nghiệm thành Prior.
export function fromCells(m: MasteryStore, day: number, rule: Rule = RULE): EvStore {
  const st = freshEv(), part: Record<string, Record<string, Agg>> = {};
  for (const [node, cs] of Object.entries(m)) for (const [l, c0] of Object.entries(cs ?? {})) {
    const c = c0 as Cell, lv = Number(l);
    if (c.n > 0) {
      part[cellKey(node, lv)] = { [`${LEGACY}|${LEGACY}|0|0`]: {
        n: Math.max(1, Math.round(c.n)), sw: c.n, swOk: round(c.a - 1), swgOk: 0, swBad: round((c.b - 1) / (1 - rule.slip)),
        nov: 0, asst: 0, d0: c.d, d1: c.d, lq: c.q.slice(0, 6), lc: c.c.slice(0, 8),
      } };
    } else if (c.a !== 1 || c.b !== 1) st.pri[cellKey(node, lv)] = { a: round(c.a - 1), b: round(c.b - 1), src: 'legacy', day };
  }
  if (Object.keys(part).length) st.agg[LEGACY] = part;
  return st;
}

// ---------- Gộp hai máy ----------
export function mergeEv(a: EvStore, b: EvStore): EvStore {
  const out = freshEv();
  for (const dev of new Set([...Object.keys(a.agg), ...Object.keys(b.agg)])) {
    const A = a.agg[dev] ?? {}, B = b.agg[dev] ?? {}, p: Record<string, Record<string, Agg>> = {};
    for (const ck of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const AC = A[ck] ?? {}, BC = B[ck] ?? {}, cell: Record<string, Agg> = {};
      for (const k of new Set([...Object.keys(AC), ...Object.keys(BC)])) {
        const x = AC[k], y = BC[k];
        cell[k] = !x ? y! : !y ? x : y.n > x.n || (y.n === x.n && y.sw > x.sw) ? y : x;
      }
      p[ck] = cell;
    }
    out.agg[dev] = p;
  }
  const byId = new Map<string, EvEvent>();
  for (const e of [...a.led, ...b.led]) byId.set(e.id, e);
  out.led = [...byId.values()].sort((x, y) => x.ts - y.ts || (x.id < y.id ? -1 : 1));
  const today = Math.max(0, ...out.led.map(e => e.day));
  if (out.led.length > LED_MAX) out.led = prune(out.led, LED_KEEP, today);
  out.obs = a.obs;   // L0 chỉ của máy này
  out.pri = { ...b.pri, ...a.pri };
  for (const n of new Set([...Object.keys(a.seen), ...Object.keys(b.seen)])) {
    const s = a.seen[n] ?? '', t = b.seen[n] ?? '', have = new Set<string>();
    let acc = '';
    for (const x of [s, t]) for (let i = 0; i < x.length; i += 6) { const h = x.slice(i, i + 6); if (!have.has(h)) { have.add(h); acc += h; } }
    out.seen[n] = acc.length > SEEN_MAX * 6 ? acc.slice(acc.length - SEEN_MAX * 6) : acc;
  }
  out.seq = a.seq;
  out.integ = { err: a.integ.err + b.integ.err, last: a.integ.last || b.integ.last, fixed: a.integ.fixed + b.integ.fixed };
  return out;
}

// ---------- Phát hiện hỏng dữ liệu (C399) ----------
// So ô Beta đang lưu với ô tính lại từ thống kê; lệch thì sửa theo thống kê (nguồn sự thật) và đếm.
export function verify(st: EvStore, m: MasteryStore): number {
  const want = recomputeAll(st);
  let bad = 0;
  const ids = new Set([...Object.keys(want), ...Object.keys(m)]);
  for (const id of ids) for (let l = 1 as Level; l <= 5; l = (l + 1) as Level) {
    const x = m[id]?.[l], y = want[id]?.[l];
    if (!x && !y) continue;
    if (!x || !y || Math.abs(x.a - y.a) > 1e-4 || Math.abs(x.b - y.b) > 1e-4 || Math.abs(x.n - y.n) > 1e-4) {
      bad++;
      if (y) (m[id] ||= {})[l] = y; else if (m[id]) delete m[id]![l];
    }
  }
  for (const id of Object.keys(m)) if (!Object.keys(m[id]!).length) delete m[id];
  if (bad) st.integ.fixed += bad;
  return bad;
}

export { freshCell };
