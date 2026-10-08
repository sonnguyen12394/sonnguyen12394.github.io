// Làm sạch kho bằng chứng nạp từ ngoài (mã sao lưu, máy chủ đồng bộ): chỉ giữ khoá đúng kiểu, chặn kích thước.

import type { Level } from '../types.ts';
import type { Agg, EvEvent, EvStore, ObsRec, Prior, Src, Tier } from './types.ts';
import { freshEv, LED_MAX, OBS_MAX, SEEN_MAX } from './store.ts';
import { SNAP_MAX, type Snapshot, type SnapKind } from './snapshot.ts';

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const num = (v: unknown, lo: number, hi: number, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const str = (v: unknown, max = 80): string | undefined => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : undefined);
const NODE = /^(cd|u|g|pa|x|xw|xs):[a-z0-9][a-z0-9._-]{0,60}$/;
const CELL = /^(cd|u|g|pa|x|xw|xs):[a-z0-9][a-z0-9._-]{0,60}\|[1-5]$/;
const SUB = /^[^|]{1,40}\|[^|]{1,40}\|[01]\|-?[01]$/;
const SRCS: Src[] = ['vocab', 'gram', 'exam', 'pa', 'diag', 'testout', 'perf', 'game', 'micro', 'transfer', 'legacy'];
const src = (v: unknown): Src => (SRCS.includes(v as Src) ? (v as Src) : 'vocab');
const lvl = (v: unknown): Level => Math.round(num(v, 1, 5, 1)) as Level;

function agg(v: unknown, legacy: boolean): Agg | null {
  const x = obj(v);
  if (typeof x.n !== 'number') return null;
  const a: Agg = {
    n: Math.round(num(x.n, 0, 1e7, 0)), sw: num(x.sw, 0, 1e7, 0), swOk: num(x.swOk, 0, 1e7, 0), swgOk: num(x.swgOk, 0, 1e7, 0),
    swBad: num(x.swBad, 0, 1e7, 0), nov: Math.round(num(x.nov, 0, 1e7, 0)), asst: Math.round(num(x.asst, 0, 1e7, 0)),
    d0: Math.round(num(x.d0, 0, 1e6, 0)), d1: Math.round(num(x.d1, 0, 1e6, 0)),
  };
  if (a.swgOk > a.swOk) a.swgOk = a.swOk;
  if (typeof x.novOk === 'number') a.novOk = Math.round(num(x.novOk, 0, 1e7, 0));
  if (typeof x.dv === 'number') a.dv = Math.round(num(x.dv, 0, 1e9, 0));
  if (legacy) {
    const ss = (y: unknown, max: number) => (Array.isArray(y) ? y.filter((s): s is string => typeof s === 'string' && s.length <= 40).slice(0, max) : []);
    a.lq = ss(x.lq, 6); a.lc = ss(x.lc, 8);
  }
  return a;
}

function event(v: unknown): EvEvent | null {
  const x = obj(v), node = str(x.node), id = str(x.id, 40);
  if (!node || !NODE.test(node) || !id) return null;
  const e: EvEvent = {
    id, ts: num(x.ts, 0, 1e14, 0), day: Math.round(num(x.day, 0, 1e6, 0)), node, lv: lvl(x.lv), ok: x.ok === 1 ? 1 : 0,
    w: num(x.w, 0, 100, 1), g: num(x.g, 0, 0.9, 0), src: src(x.src), nov: x.nov === 1 ? 1 : 0, rel: num(x.rel, 0, 1, 1),
    tier: Math.round(num(x.tier, 0, 3, 1)) as Tier, val: num(x.val, -10, 100, 0), ev: str(x.ev, 30) ?? 'ev?',
  };
  if (x.only === 1) e.only = 1;
  if (x.asst === 1) e.asst = 1;
  for (const k of ['item', 'ch', 'qt', 'ctx', 'cv', 'sess', 'why'] as const) { const s = str(x[k]); if (s) e[k] = s; }
  if (typeof x.diff === 'number') e.diff = Math.max(-1, Math.min(1, Math.round(x.diff)));
  if (typeof x.rt === 'number' && x.rt > 0) e.rt = Math.round(Math.min(x.rt, 600000));
  return e;
}

export function sanitizeEv(raw: unknown): EvStore {
  const x = obj(raw), out = freshEv();
  if (!Object.keys(x).length) return out;
  for (const [dev, part0] of Object.entries(obj(x.agg))) {
    if (!/^[a-z0-9]{1,12}$/.test(dev)) continue;
    const part: Record<string, Record<string, Agg>> = {};
    for (const [ck, cell0] of Object.entries(obj(part0))) {
      if (!CELL.test(ck)) continue;
      const cell: Record<string, Agg> = {};
      for (const [k, v] of Object.entries(obj(cell0))) { if (!SUB.test(k)) continue; const a = agg(v, dev === 'legacy'); if (a) cell[k] = a; }
      if (Object.keys(cell).length) part[ck] = cell;
    }
    if (Object.keys(part).length) out.agg[dev] = part;
  }
  out.led = (Array.isArray(x.led) ? x.led : []).map(event).filter((e): e is EvEvent => !!e).slice(-LED_MAX);
  out.obs = (Array.isArray(x.obs) ? x.obs : []).map(o => {
    const y = obj(o), node = str(y.node);
    if (!node || !NODE.test(node)) return null;
    const r: ObsRec = { id: str(y.id, 40) ?? 'o', ts: num(y.ts, 0, 1e14, 0), day: Math.round(num(y.day, 0, 1e6, 0)), node, level: lvl(y.level), ok: y.ok === true };
    for (const k of ['item', 'ch', 'qt', 'ctx', 'cv', 'sess'] as const) { const s = str(y[k]); if (s) r[k] = s; }
    if (typeof y.src === 'string') r.src = src(y.src);
    for (const k of ['g', 'w', 'rt', 'gp', 'diff'] as const) if (typeof y[k] === 'number' && Number.isFinite(y[k])) r[k] = y[k] as number;
    for (const k of ['only', 'hint', 'retry', 'timed', 'timeout'] as const) if (y[k] === true) r[k] = true;
    return r;
  }).filter((o): o is ObsRec => !!o).slice(-OBS_MAX);
  for (const [k, v] of Object.entries(obj(x.pri))) {
    if (!/^(cd|u|g|pa|x|xw|xs):[a-z0-9][a-z0-9._-]{0,60}\|[1-5]$/.test(k)) continue;
    const p = obj(v);
    out.pri[k] = { a: num(p.a, 0, 1e4, 0), b: num(p.b, 0, 1e4, 0), src: p.src === 'diag' ? 'diag' : 'legacy', day: Math.round(num(p.day, 0, 1e6, 0)) } as Prior;
  }
  for (const [n, s] of Object.entries(obj(x.seen))) if (NODE.test(n) && typeof s === 'string' && /^[0-9a-z]*$/.test(s) && s.length % 6 === 0) out.seen[n] = s.slice(-SEEN_MAX * 6);
  out.seq = Math.round(num(x.seq, 0, 1e9, 0));
  const KINDS: SnapKind[] = ['mastery', 'testout', 'readiness', 'nba', 'diag'];
  out.snap = (Array.isArray(x.snap) ? x.snap : []).map(v => {
    const y = obj(v), id = str(y.id, 40), subj = str(y.subj), dec = str(y.dec, 40);
    if (!id || !subj || !dec || !KINDS.includes(y.kind as SnapKind)) return null;
    const sn: Snapshot = { id, ts: num(y.ts, 0, 1e14, 0), day: Math.round(num(y.day, 0, 1e6, 0)), kind: y.kind as SnapKind, subj, dec, rule: str(y.rule, 40) ?? '?',
      evs: (Array.isArray(y.evs) ? y.evs : []).filter((s): s is string => typeof s === 'string' && s.length <= 40).slice(-12) };
    if (typeof y.lv === 'number') sn.lv = lvl(y.lv);
    const mm = obj(y.m);
    if (typeof mm.a === 'number') sn.m = { a: num(mm.a, 0, 1e7, 1), b: num(mm.b, 0, 1e7, 1), n: num(mm.n, 0, 1e7, 0), mean: num(mm.mean, 0, 1, 0), lb: num(mm.lb, 0, 1, 0), ctx: num(mm.ctx, 0, 99, 0), qt: num(mm.qt, 0, 99, 0), nov: num(mm.nov, 0, 1e7, 0) };
    const th = obj(y.thr);
    if (typeof th.m === 'number') sn.thr = { m: num(th.m, 0, 1, 0.8), lb: num(th.lb, 0, 1, 0.6) };
    const inf = obj(y.info), info: Record<string, number | string> = {};
    for (const [k, w] of Object.entries(inf).slice(0, 20)) if (k.length <= 20 && (typeof w === 'number' || (typeof w === 'string' && w.length <= 200))) info[k] = w;
    if (Object.keys(info).length) sn.info = info;
    if (Array.isArray(y.alt)) sn.alt = y.alt.slice(0, 5).map(obj).filter(a => typeof a.node === 'string' && (NODE.test(a.node as string) || a.node === 'review'))
      .map(a => ({ node: a.node as string, score: num(a.score, -1e6, 1e6, 0), dep: num(a.dep, 0, 1e6, 0), min: num(a.min, 0, 1e5, 0) }));
    return sn;
  }).filter((v): v is Snapshot => !!v).slice(-SNAP_MAX);
  out.sseq = Math.round(num(x.sseq, 0, 1e9, out.snap.length));
  for (const [k, v] of Object.entries(obj(x.dis))) {
    if (!/^(cd|u|g|pa|x|xw|xs):[a-z0-9][a-z0-9._-]{0,60}\|[1-5]$/.test(k)) continue;
    const d = obj(v);
    out.dis[k] = { bad: num(d.bad, 0, 1e6, 0), ok: num(d.ok, 0, 1e6, 0), on: d.on === 1 ? 1 : 0, day: Math.round(num(d.day, 0, 1e6, 0)), ...(typeof d.cw === 'number' ? { cw: Math.round(num(d.cw, 0, 1e6, 0)) } : {}) };
  }
  for (const [n, v] of Object.entries(obj(x.mis))) {
    if (!NODE.test(n)) continue;
    const m: Record<string, { t: string; n: number; d: number }> = {};
    for (const [k, y0] of Object.entries(obj(v)).slice(0, 5)) {
      const y = obj(y0), t = str(y.t, 40);
      if (/^[0-9a-z]{6}$/.test(k) && t) m[k] = { t, n: num(y.n, 0, 1e6, 0), d: Math.round(num(y.d, 0, 1e6, 0)) };
    }
    if (Object.keys(m).length) out.mis[n] = m;
  }
  for (const [n, v] of Object.entries(obj(x.hyp))) {
    const h = obj(v), cause = str(h.cause);
    if (NODE.test(n) && cause && NODE.test(cause)) out.hyp[n] = { kind: 'prereq', cause, day: Math.round(num(h.day, 0, 1e6, 0)) };
  }
  const pb = obj(x.pb);
  out.pb = { day: Math.round(num(pb.day, 0, 1e6, 0)), n: Math.round(num(pb.n, 0, 1000, 0)) };
  const ig = obj(x.integ);
  out.integ = { err: Math.round(num(ig.err, 0, 1e9, 0)), last: str(ig.last, 200) ?? '', fixed: Math.round(num(ig.fixed, 0, 1e9, 0)) };
  return out;
}
