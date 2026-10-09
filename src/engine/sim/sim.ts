// Bộ mô phỏng learner (spec v2.4 Phần M "Statistical & Mastery Validation", 20 Meta-Test, 10 Scenario).
// Learner tổng hợp có TRẠNG THÁI THẬT biết trước — biết/không biết từng nút, hiểu sai, quên, đoán mò, nhầm tay — và kỹ năng chơi
// game, tốc độ thay đổi ĐỘC LẬP với năng lực ngôn ngữ. Chạy qua chính engine thật (ingest → evaluate → aggregate → Beta → path),
// để đo: calibration, dương tính giả / âm tính giả, độ chính xác chẩn đoán, hiệu quả lộ trình thích ứng so với giáo trình cố định,
// mức nhiễm từ kỹ năng game. Kết quả chỉ chứng minh THUẬT TOÁN đúng trên dữ liệu giả lập (L2–L3), không chứng minh việc học thật (L4–L5).

import { stat, type MasteryStore } from '../mastery.ts';
import { ingest, freshEv } from '../ev/store.ts';
import { RULE, type Rule } from '../ev/evaluate.ts';
import type { EvStore, Observation } from '../ev/types.ts';
import { index, defaultLevel, type Index } from '../graph.ts';
import { plan } from '../path.ts';
import { startDiag, nextProbe, answer, finished, level, priorFor, type Cand } from '../diag.ts';
import { setPrior } from '../ev/store.ts';
import type { Edge, Goal, Graph, Level, Node } from '../types.ts';

// ---------- Số giả ngẫu nhiên có hạt giống (kết quả tái tạo được) ----------
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- Learner ----------
export interface Profile {
  slip: number;          // xác suất sai khi đã biết
  learn: number;         // xác suất học được nút sau một lượt có phản hồi khi chưa biết
  forgetDays: number;    // không luyện quá số ngày này thì có thể quên
  gameSkill: number;     // 0–1: kỹ năng chơi (bấm kịp giờ) — KHÔNG liên quan ngôn ngữ
  speed: number;         // 0–1: tốc độ trả lời — KHÔNG liên quan ngôn ngữ
}
export const DEFAULT_PROFILE: Profile = { slip: 0.08, learn: 0.25, forgetDays: 60, gameSkill: 0.7, speed: 0.6 };

interface Truth { k: boolean; last: number; mis?: string }
export class Learner {
  readonly truth = new Map<string, Truth>();
  readonly p: Profile;
  readonly r: () => number;
  constructor(p: Profile, r: () => number) { this.p = p; this.r = r; }
  know(node: string, k: boolean, mis?: string): void { this.truth.set(node, { k, last: 0, mis }); }
  knows(node: string): boolean { return !!this.truth.get(node)?.k; }
  // Trả lời một câu. mc: trắc nghiệm 4 phương án; timed: luật game ép thời gian.
  respond(node: string, day: number, mc: boolean, timed = false): { ok: boolean; given?: string; timeout?: boolean; rt: number } {
    const t = this.truth.get(node) ?? { k: false, last: day };
    if (t.k && day - t.last > this.p.forgetDays && this.r() < 0.5) t.k = false;   // quên
    const rt = Math.round(2000 + 8000 * (1 - this.p.speed) * this.r());
    if (timed && this.r() < (1 - this.p.gameSkill) * 0.35) { this.truth.set(node, t); return { ok: false, timeout: true, rt: 15000 }; }
    let ok: boolean, given: string | undefined;
    if (t.k) ok = this.r() > this.p.slip;
    else if (t.mis) { ok = false; given = t.mis; }
    else ok = this.r() < (mc ? 0.25 : 0.02);
    if (!ok && !given) given = `x${Math.floor(this.r() * 3)}`;
    if (!t.k && this.r() < this.p.learn) { t.k = true; delete t.mis; }   // học từ phản hồi
    t.last = day;
    this.truth.set(node, t);
    return { ok, given, rt };
  }
}

// ---------- Engine dưới dạng gọn cho mô phỏng ----------
export interface SimEngine { st: EvStore; m: MasteryStore; recent: Record<string, number>; seq: number; rule: Rule }
export const newEngine = (rule: Rule = RULE): SimEngine => ({ st: freshEv(), m: {}, recent: {}, seq: 0, rule });

export function ask(E: SimEngine, L: Learner, node: string, lv: Level, day: number, opt: { mc?: boolean; timed?: boolean; novel?: boolean; gp?: number } = {}): boolean {
  const mc = opt.mc ?? true, r = L.respond(node, day, mc, opt.timed);
  const item = opt.novel === false ? `${node}#0` : `${node}#${++E.seq}`;
  const o: Observation = { node, level: lv, ok: r.ok, item, g: mc ? 0.25 : 0, qt: mc ? 'mcq' : 'typed', ctx: `c${E.seq % 4}`, src: 'game', rt: r.rt, given: r.given };
  if (opt.timed) { o.timed = true; o.gp = opt.gp ?? 0.5; if (r.timeout) o.timeout = true; }
  ingest(E.st, E.m, o, { dev: 'sim001', ts: E.seq, day, recent: E.recent, rule: E.rule });
  return r.ok;
}
export const passed = (E: SimEngine, node: string, lv: Level): boolean => stat(E.m[node]?.[lv]).pass;

// Luyện một nút tới khi Đạt (hoặc hết lượt). Trả về số lượt.
export function drill(E: SimEngine, L: Learner, node: string, lv: Level, day: number, cap = 60, opt: { timed?: boolean } = {}): number {
  let k = 0;
  while (k < cap && !passed(E, node, lv)) { ask(E, L, node, lv, day, { mc: k % 2 === 0, timed: opt.timed }); k++; }
  return k;
}

// ---------- Đồ thị tổng hợp: 6 cấp × w nút; mỗi nút cần (cứng) 1–2 nút cấp dưới ----------
export function synthGraph(width = 8, seed = 1): Graph {
  const r = rng(seed), nodes: Node[] = [], edges: Edge[] = [];
  for (let lv = 0; lv < 6; lv++) for (let i = 0; i < width; i++) {
    const id = `${i % 2 ? 'g' : 'u'}:s${lv}-${i}`;
    nodes.push({ id, kind: i % 2 ? 'grammar' : 'vocab', area: i % 2 ? 'gra' : 'voc', skill: null, cefr: (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const)[lv]!, vi: id, ctx: [], acts: [], minutes: 10 + Math.floor(r() * 20) });
    if (lv > 0) for (let k = 0; k < 1 + Math.floor(r() * 2); k++) {
      const to = `${(i + k) % 2 ? 'g' : 'u'}:s${lv - 1}-${(i + k) % width}`;
      if (!edges.some(e => e.from === id && e.to === to)) edges.push({ from: id, to, type: 'hard', w: 1 });
    }
  }
  const goals: Goal[] = [2, 3].map(lv => ({ id: `g${lv}`, version: '1.0', kind: 'cefr', vi: `g${lv}`, target: `L${lv}`, cefr: null, status: 'active',
    req: nodes.filter(n => n.id.includes(`s${lv}-`)).map(n => ({ node: n.id, level: 3 as Level, type: 'foundation' as const })) }));
  return { nodes, edges, goals };
}
const lvOf = (id: string): number => Number(/s(\d)-/.exec(id)![1]);

// ---------- Thí nghiệm ----------
export interface Calib { bins: Array<{ lo: number; hi: number; n: number; pred: number; obs: number }>; ece: number }
// Calibration: m dự đoán so với tỉ lệ đúng thật ở câu MỚI kế tiếp (không học thêm trong lượt kiểm tra).
export function calibration(nLearners = 300, seed = 7): Calib {
  const r = rng(seed), bins = Array.from({ length: 10 }, (_, i) => ({ lo: i / 10, hi: (i + 1) / 10, n: 0, sp: 0, so: 0 }));
  for (let j = 0; j < nLearners; j++) {
    const L = new Learner({ ...DEFAULT_PROFILE, learn: 0.15 }, rng(seed * 1000 + j)), E = newEngine();
    L.know('u:x', r() < 0.4);
    const steps = 1 + Math.floor(r() * 25);
    for (let i = 0; i < steps; i++) ask(E, L, 'u:x', 3, 10, { mc: false });
    const m = stat(E.m['u:x']?.[3]).m;
    const t = L.truth.get('u:x')!, pTrue = t.k ? 1 - L.p.slip : 0.02;
    const b = bins[Math.min(9, Math.floor(m * 10))]!;
    b.n++; b.sp += m; b.so += pTrue;
  }
  const tot = bins.reduce((s, b) => s + b.n, 0);
  const out = bins.filter(b => b.n).map(b => ({ lo: b.lo, hi: b.hi, n: b.n, pred: b.sp / b.n, obs: b.so / b.n }));
  return { bins: out, ece: out.reduce((s, b) => s + (b.n / tot) * Math.abs(b.pred - b.obs), 0) };
}

// Dương tính giả (Đạt nhưng thật ra không biết) và âm tính giả (biết, đã có ≥ 15 lượt, vẫn chưa Đạt).
export function fpfn(nLearners = 400, seed = 11, rule: Rule = RULE): { fp: number; fn: number; passN: number; knowN: number } {
  const r = rng(seed);
  let fp = 0, passN = 0, fn = 0, knowN = 0;
  for (let j = 0; j < nLearners; j++) {
    const L = new Learner({ ...DEFAULT_PROFILE, learn: 0 }, rng(seed * 997 + j)), E = newEngine(rule);
    const k = r() < 0.5;
    L.know('u:x', k);
    const steps = 3 + Math.floor(r() * 25);
    for (let i = 0; i < steps; i++) ask(E, L, 'u:x', 3, 10, { mc: true });
    const p = passed(E, 'u:x', 3);
    if (p) { passN++; if (!k) fp++; }
    if (k && steps >= 15) { knowN++; if (!p) fn++; }
  }
  return { fp: passN ? fp / passN : 0, fn: knowN ? fn / knowN : 0, passN, knowN };
}

// Chẩn đoán cầu thang trên learner có cấp thật L (biết mọi nút ≤ L): sai số cấp và số nút dò.
export function diagAccuracy(seed = 3): { mae: number; probes: number; runs: number } {
  const g = synthGraph(10, seed), cands: Cand[] = g.nodes.map(n => ({ id: n.id, kind: n.kind === 'vocab' ? 'u' : 'g', lv: lvOf(n.id), weight: 1 }));
  let err = 0, probes = 0, runs = 0;
  for (let truth = 0; truth <= 5; truth++) for (let rep = 0; rep < 5; rep++) {
    const L = new Learner({ ...DEFAULT_PROFILE, learn: 0 }, rng(seed * 31 + truth * 7 + rep));
    for (const n of g.nodes) L.know(n.id, lvOf(n.id) <= truth);
    const d = startDiag(rep % 3, 0);
    for (let k = 0; k < 60 && !finished(d, 0, cands.length - d.probed.length); k++) {
      const c = nextProbe(d, cands)!;
      let got = 0;
      for (let q = 0; q < 3; q++) if (L.respond(c.id, 1, q < 2).ok) got++;
      answer(d, c, got, 3);
    }
    err += (Math.abs(level(d.stair.u) - truth) + Math.abs(level(d.stair.g) - truth)) / 2; probes += d.probed.length; runs++;
  }
  return { mae: err / runs, probes: probes / runs, runs };
}

// Lộ trình thích ứng (chẩn đoán + bỏ qua thứ đã biết + chỉ mở nút đủ tiền đề) so với giáo trình cố định (học mọi nút theo thứ tự).
// Trung bình trên nhiều learner (một learner đơn lẻ nhiễu quá lớn để so sánh).
export function pathEfficiencyAvg(n = 20, knownUpTo = 1): { adaptive: number; fixed: number; ratio: number; done: number } {
  let a = 0, f = 0, done = 0;
  for (let i = 0; i < n; i++) { const r = pathEfficiency(100 + i, knownUpTo); a += r.adaptive; f += r.fixed; if (r.adaptiveDone && r.fixedDone) done++; }
  return { adaptive: a / n, fixed: f / n, ratio: a / f, done: done / n };
}

export function pathEfficiency(seed = 5, knownUpTo = 1): { adaptive: number; fixed: number; adaptiveDone: boolean; fixedDone: boolean } {
  const g = synthGraph(8, 5), ix: Index = index(g), goal = g.goals.find(x => x.id === 'g3')!;
  const mk = () => { const L = new Learner({ ...DEFAULT_PROFILE, slip: 0.05, learn: 0.3 }, rng(seed)); for (const n of g.nodes) L.know(n.id, lvOf(n.id) <= knownUpTo); return L; };
  // Thích ứng
  const La = mk(), Ea = newEngine();
  const cands: Cand[] = g.nodes.map(n => ({ id: n.id, kind: n.kind === 'vocab' ? 'u' : 'g', lv: lvOf(n.id), weight: 1 }));
  const d = startDiag(0, 0);
  let adaptive = 0;
  for (let k = 0; k < 40 && !finished(d, 0, cands.length - d.probed.length); k++) {
    const c = nextProbe(d, cands)!;
    let got = 0;
    for (let q = 0; q < 3; q++) { if (ask(Ea, La, c.id, 3, 1, { mc: false })) got++; adaptive++; }
    answer(d, c, got, 3);
  }
  for (const n of g.nodes) { const p = priorFor(lvOf(n.id), n.kind === 'vocab' ? level(d.stair.u) : level(d.stair.g)); if (p) setPrior(Ea.st, Ea.m, n.id, defaultLevel(n), p[0], p[1], 'diag', 1); }
  let day = 2;
  for (let guard = 0; guard < 500; guard++) {
    const p = plan(ix, [{ goal, date: null }], day, (node, lv) => passed(Ea, node, lv));
    if (!p.open.length) break;
    const it = p.open[0]!, k = drill(Ea, La, it.node, it.level, day, 60);
    if (!k && passed(Ea, it.node, it.level)) break;   // an toàn: không bao giờ lặp không
    adaptive += k; day++;
  }
  const adaptiveDone = !plan(ix, [{ goal, date: null }], day, (node, lv) => passed(Ea, node, lv)).unmet.length;
  // Cố định: mọi nút cấp 0..3 theo thứ tự cấp, luyện tới khi Đạt
  const Lf = mk(), Ef = newEngine();
  let fixed = 0;
  for (const n of [...g.nodes].filter(n => lvOf(n.id) <= 3).sort((a, b) => lvOf(a.id) - lvOf(b.id))) fixed += drill(Ef, Lf, n.id, lvOf(n.id) === 3 ? 3 : defaultLevel(n), 2, 60);
  const fixedDone = goal.req.every(r => passed(Ef, r.node, 3));
  return { adaptive, fixed, adaptiveDone, fixedDone };
}

// Nhiễm từ kỹ năng game (C343–C345, HG12): hai learner cùng năng lực ngôn ngữ, khác kỹ năng chơi, cùng chơi có ép thời gian.
// So độ lệch mastery giữa hai người với evaluator (hết giờ ×0,3) và với cách "ngây thơ" (hết giờ = sai đủ trọng số).
export function gameContamination(seed = 9): { withEvaluator: number; naive: number } {
  const run = (skill: number, naive: boolean): number => {
    let s = 0;
    for (let j = 0; j < 60; j++) {
      const L = new Learner({ ...DEFAULT_PROFILE, learn: 0, gameSkill: skill }, rng(seed * 100 + j)), E = newEngine(naive ? { ...RULE, timeout: 1 } : RULE);
      L.know('u:x', j % 2 === 0);
      for (let i = 0; i < 20; i++) ask(E, L, 'u:x', 3, 10, { mc: false, timed: true });
      s += stat(E.m['u:x']?.[3]).m;
    }
    return s / 60;
  };
  return { withEvaluator: Math.abs(run(0.95, false) - run(0.2, false)), naive: Math.abs(run(0.95, true) - run(0.2, true)) };
}

// Tốc độ trả lời không làm lệch mastery (C373, P15): hai learner cùng năng lực, khác tốc độ.
export function speedBias(seed = 13): number {
  const run = (speed: number): number => {
    let s = 0;
    for (let j = 0; j < 60; j++) {
      const L = new Learner({ ...DEFAULT_PROFILE, learn: 0, speed }, rng(seed * 100 + j)), E = newEngine();
      L.know('u:x', j % 2 === 0);
      for (let i = 0; i < 15; i++) ask(E, L, 'u:x', 3, 10, { mc: false });
      s += stat(E.m['u:x']?.[3]).m;
    }
    return s / 60;
  };
  return Math.abs(run(0.95) - run(0.05));
}

// Độ nhạy ngưỡng (C272): FP/FN khi đổi ngưỡng m.
export function thresholdSensitivity(): Array<{ thr: number; fp: number; fn: number }> {
  return [0.7, 0.75, 0.8, 0.85, 0.9].map(thr => {
    const r = rng(17);
    let fp = 0, passN = 0, fn = 0, knowN = 0;
    for (let j = 0; j < 300; j++) {
      const L = new Learner({ ...DEFAULT_PROFILE, learn: 0 }, rng(1700 + j)), E = newEngine();
      const k = r() < 0.5; L.know('u:x', k);
      const steps = 3 + Math.floor(r() * 25);
      for (let i = 0; i < steps; i++) ask(E, L, 'u:x', 3, 10, { mc: true });
      const s = stat(E.m['u:x']?.[3]), p = s.m >= thr && s.lb >= 0.6;
      if (p) { passN++; if (!k) fp++; }
      if (k && steps >= 15) { knowN++; if (!p) fn++; }
    }
    return { thr, fp: passN ? fp / passN : 0, fn: knowN ? fn / knowN : 0 };
  });
}
