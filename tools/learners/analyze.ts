// Phân tích log của bot người học (tools/learners/l01.ts): so điều app kết luận với trình độ ẩn của bot, và tóm tắt hành vi app.
// Chạy: node --experimental-strip-types --no-warnings tools/learners/analyze.ts reports/learners/L01

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { defaultLevel } from '../../src/engine/graph.ts';
import type { Node } from '../../src/engine/types.ts';

const DIR = process.argv[2] ?? 'reports/learners/L01';   // cần ends.json + state.json (không commit: lớn), chạy l01.ts trước
const J = (f: string) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const rows = J('rows.json') as { day: number; sess: string; run: string; game?: string; gap?: string; node: string; level: number; item: string; novel: boolean; opts: number; pTrue: number; trueKnow: boolean; ok: boolean; dunno: boolean; appState?: string }[];
const ends = J('ends.json') as { day: number; sess: string; m: MasteryStore; truth: Record<string, number>; snaps: number; q: { floor: number; coins: number; runs: number; wins: number } }[];
const events = J('events.json') as { day: number; what: string; info?: Record<string, unknown> }[];
const state = J('state.json') as { e: { ev: { snap: { dec: string; kind: string; day: number; subj: string }[]; hyp: Record<string, unknown>; led: { src: string; ctx?: string; ok: boolean; rel?: number; w?: number }[] }; ms?: { checks: { phase: string; got: number; of: number; day: number }[] } }; errors: string[] };
const gf = readdirSync('data/engine').find(f => /^graph\..*\.json$/.test(f))!;
const G = JSON.parse(readFileSync(join('data/engine', gf), 'utf8')) as { nodes: Node[] };
const NODE = new Map(G.nodes.map(n => [n.id, n]));
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 1000) / 1000 : null);

// Kết luận của app về một nút ở mức mặc định: Đạt / chưa / chưa có gì.
function claim(m: MasteryStore, node: string): { state: string; pass: boolean; n: number } {
  const n = NODE.get(node); if (!n) return { state: 'none', pass: false, n: 0 };
  const s = stat(m[node]?.[defaultLevel(n)]);
  return { state: s.state, pass: s.pass, n: s.n };
}
// Độ chính xác của "Đạt" theo từng phiên: FP = app nói Đạt nhưng kỹ năng thật < 0,7; FN = kỹ năng thật ≥ 0,9, app có bằng chứng thật ≥ 4 lượt mà chưa Đạt.
const perSess = ends.map(e => {
  let tp = 0, fp = 0, fn = 0, claimed = 0, inferredFp = 0, inferred = 0, solid = 0, solidFp = 0;
  const fps: string[] = [];
  for (const [node, t] of Object.entries(e.truth)) {
    const c = claim(e.m, node);
    if (c.pass) { claimed++; if (t >= 0.7) tp++; else { fp++; if (c.state === 'inferred') inferredFp++; fps.push(`${node}:${t}`); } }
    if (c.pass && c.state === 'mastered') { solid++; if (t < 0.7) solidFp++; }   // "Đạt" thật (không tính phần suy ra từ chẩn đoán)
    if (c.state === 'inferred') { inferred++; }
    if (!c.pass && t >= 0.9 && c.n >= 4) fn++;
  }
  return { day: e.day, claimed, tp, fp, fn, inferredFp, inferred, solid, solidFp, fps: fps.slice(0, 6), floor: e.q?.floor, coins: e.q?.coins };
});

// Chuyển trạng thái: từng Đạt rồi bị mở lại.
let reopened = 0;
for (let i = 1; i < ends.length; i++) for (const node of Object.keys(ends[i]!.m)) { if (claim(ends[i - 1]!.m, node).pass && ['reopened', 'learning'].includes(claim(ends[i]!.m, node).state)) reopened++; }

const by = (f: (r: typeof rows[number]) => boolean) => { const xs = rows.filter(f); return { n: xs.length, ok: pct(xs.filter(r => r.ok).length, xs.length), truthKnow: pct(xs.filter(r => r.trueKnow).length, xs.length), pTrue: avg(xs.map(r => r.pTrue)) }; };
const runs = [...new Set(rows.map(r => r.run))].map(r => [r, by(x => x.run === r)]);
const games = [...new Set(rows.filter(r => r.game).map(r => r.game!))].map(g => [g, by(x => x.game === g)]);
const gapsT = [...new Set(rows.filter(r => r.gap).map(r => r.gap!))].map(g => [g, by(x => x.gap === g)]);
// Câu hỏi có "trúng chỗ thiếu" không: tỉ lệ câu quest / probe hỏi vào nút bot chưa thật sự biết (giá trị học), theo ngày.
const targeting = [...new Set(rows.map(r => r.day))].map(d => { const xs = rows.filter(r => r.day === d && r.run === 'quest'); return { day: d, n: xs.length, unknownShare: pct(xs.filter(r => !r.trueKnow).length, xs.length), ok: pct(xs.filter(r => r.ok).length, xs.length) }; });
// Lặp lại: số lần cùng một câu được hỏi lại (trong game), số nút khác nhau.
const itemCount = new Map<string, number>(); for (const r of rows) itemCount.set(r.item, (itemCount.get(r.item) ?? 0) + 1);
const repeats = [...itemCount.values()].filter(v => v > 1).length;
// Kỹ năng thật trung bình trên các nút mục tiêu đã gặp: đầu vs cuối.
const goalNodes = Object.keys(ends.at(-1)!.truth).filter(n => /^(u|g|fn|ph):/.test(n));
const mean = (e: typeof ends[number]) => avg(goalNodes.map(n => e.truth[n] ?? 0));
const decs = new Map<string, number>(); for (const s of state.e.ev.snap) { const k = s.dec.split(':').slice(0, 2).join(':'); decs.set(k, (decs.get(k) ?? 0) + 1); }
const out = {
  answers: rows.length, sessions: ends.length, pageErrors: state.errors.length, stuck: events.filter(e => e.what === 'stuck'),
  diag: { probes: events.find(e => e.what === 'diag-result')?.info, rows: by(r => r.run === 'diag') },
  byRun: Object.fromEntries(runs), byGame: Object.fromEntries(games), byGap: Object.fromEntries(gapsT),
  novel: by(r => r.novel && r.run === 'quest'), seen: by(r => !r.novel && r.run === 'quest'),
  repeatsItems: repeats, distinctItems: itemCount.size, distinctNodes: new Set(rows.map(r => r.node)).size,
  mastery: perSess, reopened,
  truthMean: { first: mean(ends[0]!), last: mean(ends.at(-1)!), nodes: goalNodes.length },
  measure: state.e.ms?.checks ?? [],
  todayActions: events.filter(e => e.what === 'today-action').map(e => `${e.day}:${(e.info as { route: string }).route}`),
  camps: events.filter(e => e.what === 'camp').length,
  hyp: Object.keys(state.e.ev.hyp ?? {}).length,
  decisions: Object.fromEntries([...decs].sort((a, b) => b[1] - a[1]).slice(0, 25)),
  targeting,
};
writeFileSync(join(DIR, 'metrics.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 6000));
