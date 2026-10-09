// Phân tích bot L03 (người học trung bình): mô hình người học, độ khó thích ứng, độ trễ thích ứng, NBA, hiệu quả, kịch bản S01–S15,
// tiến bộ thật / giả, tiến độ mục tiêu. Chạy sau tools/learners/l03.ts (cần ends.json + state.json).
// node --experimental-strip-types --no-warnings tools/learners/analyze-l03.ts <thư mục>

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { defaultLevel } from '../../src/engine/graph.ts';
import { NODE, type Row } from './core.ts';
import { truthAt } from './l03.ts';
import type { Node } from '../../src/engine/types.ts';

const DIR = process.argv[2] ?? 'reports/learners/L03';
const J = (f: string) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const rows = J('rows.json') as Row[];
const ends = J('ends.json') as { day: number; m: MasteryStore; truth: Record<string, number>; stab?: Record<string, number> }[];
const events = J('events.json') as { day: number; what: string; info?: Record<string, unknown> }[];
const screens = J('screens.json') as { day: number; where: string; text: string }[];
const state = J('state.json') as { e: { goals: { id: string }[]; ev: { snap: { kind: string; dec: string; subj: string; day: number; lv?: number; info?: Record<string, unknown> }[] }; ms?: { checks: { phase: string; got: number; of: number }[] } }; errors: string[]; mind: { n: string; p: number; s: number }[] };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
const r2 = (x: number) => Math.round(x * 100) / 100;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const lvOf = (n: string) => { const x = NODE.get(n); return x ? defaultLevel(x as unknown as Node) : 3; };
const last = ends.at(-1)!;
const quest = rows.filter(r => r.run === 'quest' && r.game !== 'camp');
const natural = (r: Row) => !r.forced;
const P0 = new Map(state.mind.map(x => [x.n, x.p]));
const cefr = (n: string) => NODE.get(n)?.cefr ?? '?';

// ---------- 1. Mô hình người học ----------
let agree = 0, extremes = 0, opposite = 0; const pairs: Array<[number, number]> = [], cls: Record<string, number> = {};
for (const n of Object.keys(last.truth).filter(n => /^(u|g|ph):/.test(n))) {
  const c = last.m[n]?.[lvOf(n) as 3]; if (!c || c.n < 3) continue;
  const s = stat(c), t = r2(truthAt(last.truth[n]!, lvOf(n), last.stab?.[n]));
  pairs.push([s.m, t]);
  const a = s.pass && s.state === 'mastered' ? 'strong' : s.m < 0.6 ? 'weak' : 'mid', b = t >= 0.75 ? 'strong' : t < 0.5 ? 'weak' : 'mid';
  cls[`${a}|${b}`] = (cls[`${a}|${b}`] ?? 0) + 1;
  if (a === b) agree++;
  if (b !== 'mid') { extremes++; if ((a === 'strong' && b === 'weak') || (a === 'weak' && b === 'strong')) opposite++; }
}
const corr = (() => { const n = pairs.length; if (n < 3) return null; const mx = avg(pairs.map(p => p[0])), my = avg(pairs.map(p => p[1])); let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; } return r2(sxy / Math.sqrt(sxx * syy)); })();
const diag = events.find(e => e.what === 'diag-result')?.info;
const share = (f: (r: Row) => boolean) => pct(quest.filter(f).length, quest.length);
const PH_VI = new Set([...NODE.values()].filter(n => n.id.startsWith('ph:')).map(n => n.vi));
const necks = screens.filter(s => s.where === 'tower').map(s => (s.text.match(/Điểm nghẽn: ([^(]+)\(/) ?? [])[1]?.trim()).filter(Boolean) as string[];
const model = {
  judged: pairs.length, agree3: pct(agree, pairs.length), oppositeOnExtremes: pct(opposite, extremes), classes: cls, corr, diag,
  alloc: { vocab: share(r => r.node.startsWith('u:')), vocabA1A2: share(r => r.node.startsWith('u:') && /A1|A2/.test(cefr(r.node))), grammar: share(r => r.node.startsWith('g:')), listening: share(r => r.node.startsWith('ph:')) },
  strongRepractice: share(r => r.node.startsWith('u:') && /A1|A2/.test(cefr(r.node)) && truthAt(r.s ?? 0, r.level, r.S) >= 0.75 && r.game !== 'chest'),
  neckShown: necks.length, neckIsListening: pct(necks.filter(v => PH_VI.has(v)).length, necks.length), neckTop: [...new Set(necks)].slice(0, 5),
};

// ---------- 2. Độ khó thích ứng ----------
const nat = quest.filter(natural);
const byLevel = Object.fromEntries([1, 2, 3, 4, 5].map(l => [l, (() => { const xs = nat.filter(r => r.level === l); return { n: xs.length, ok: pct(xs.filter(r => r.ok).length, xs.length) }; })()]).filter(([, v]) => (v as { n: number }).n));
const sessAcc = [...new Set(nat.map(r => r.day))].map(d => { const xs = nat.filter(r => r.day === d); return xs.filter(r => r.ok).length / xs.length; });
const inBand = pct(sessAcc.filter(a => a >= 0.6 && a <= 0.85).length, sessAcc.length);
// Lên / xuống mức theo chuỗi của từng nút.
let upOpp = 0, up = 0, downOpp = 0, down = 0, oneErrOpp = 0, oneErrDrop = 0;
const lat: number[] = [], overAfterPass: number[] = [];
for (const n of new Set(quest.map(r => r.node))) {
  const xs = quest.filter(r => r.node === n);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i]!, nx = xs[i + 1]!, prev = xs.slice(Math.max(0, i - 2), i + 1);
    if (prev.length === 3 && prev.every(r => r.ok && r.level === a.level)) { upOpp++; if (nx.level > a.level || nx.game === 'boss') up++; }
    if (i >= 1 && !a.ok && !xs[i - 1]!.ok && xs[i - 1]!.level === a.level) { downOpp++; if (nx.level < a.level) down++; }
    if (!a.ok && i >= 2 && xs[i - 1]!.ok && xs[i - 2]!.ok) { oneErrOpp++; if (nx.level < a.level) oneErrDrop++; }
  }
  // Độ trễ thích ứng: sau 2 lần sai liên tiếp, bao nhiêu lượt nữa app mới đổi (hạ mức, dạy lại, bí kíp ở trại cho nút này, hoặc rời nút).
  for (let i = 1; i < xs.length; i++) {
    if (xs[i]!.ok || xs[i - 1]!.ok) continue;
    const t0 = rows.indexOf(xs[i]!), lv = xs[i]!.level; let k = 0, changed = false;
    for (const r of rows.slice(t0 + 1)) {
      if (r.node !== n) continue;
      if (r.game === 'camp' || r.level < lv) { changed = true; break; }
      if (events.some(e => e.what === 'teach' && e.info?.node === n && e.day === r.day)) { changed = true; break; }
      k++; if (k > 10) break;
    }
    lat.push(changed ? k : 11); break;
  }
  // Luyện thừa sau khi Đạt: số lượt cùng mức sau lượt đầu tiên app báo "mastered" ở mức đó.
  const firstPass = xs.findIndex(r => r.appState === 'mastered');
  if (firstPass >= 0) overAfterPass.push(xs.slice(firstPass + 1).filter(r => r.level === xs[firstPass]!.level && r.game !== 'chest').length);
}
const difficulty = { byLevel, sessionsInBand: inBand, sessAccMin: r2(Math.min(...sessAcc)), sessAccMax: r2(Math.max(...sessAcc)), upAfter3ok: pct(up, upOpp), upOpp, downAfter2bad: pct(down, downOpp), downOpp, dropAfterOneError: pct(oneErrDrop, oneErrOpp), oneErrOpp };
const latency = { nodes: lat.length, median: lat.length ? [...lat].sort((a, b) => a - b)[Math.floor(lat.length / 2)] : null, mean: r2(avg(lat)), neverChanged: lat.filter(x => x > 10).length, overPracticeAfterPassMean: r2(avg(overAfterPass)) };

// ---------- 3. NBA / hành động ----------
const nbaKinds: Record<string, number> = {}; for (const s of state.e.ev.snap.filter(s => s.kind === 'nba')) { const k = String(s.info?.k ?? '?'); nbaKinds[k] = (nbaKinds[k] ?? 0) + 1; }
const games: Record<string, number> = {}; for (const r of rows.filter(r => r.run === 'quest')) games[r.game ?? '?'] = (games[r.game ?? '?'] ?? 0) + 1;
const gapLabels: Record<string, number> = {}; for (const r of quest) gapLabels[r.gap || '-'] = (gapLabels[r.gap || '-'] ?? 0) + 1;
const nextSeq: string[] = []; for (const s of screens.filter(s => s.where === 'tower')) { const t = (s.text.match(/Bước tiếp theo[^\n]*/) ?? [''])[0]; if (nextSeq.at(-1) !== t) nextSeq.push(t); }
const MAP: Record<string, string[]> = { knowledge: ['knowledge', 'partial'], unproven: ['knowledge', 'partial', 'none', 'recall', 'use', 'transfer'], recall: ['recall'], skill: ['use'], transfer: ['transfer'], retention: ['retention'], prerequisite: ['knowledge'], misconception: ['knowledge', 'partial'] };
const lab = quest.filter(r => r.gap && r.cause && natural(r)), rcHit = lab.filter(r => MAP[r.gap!]?.includes(r.cause!)).length;
const byCause: Record<string, { n: number; hit: number }> = {}; for (const r of lab) { const b = (byCause[r.cause!] ||= { n: 0, hit: 0 }); b.n++; if (MAP[r.gap!]?.includes(r.cause!)) b.hit++; }
const nba = { nbaKinds, games, gapLabels, nextChanges: nextSeq.length, rootCause: { labelled: lab.length, hit: pct(rcHit, lab.length), byCause } };

// ---------- 4. Hiệu quả ----------
const itemN = new Map<string, number>(); for (const r of quest) itemN.set(r.item, (itemN.get(r.item) ?? 0) + 1);
const chest = quest.filter(r => r.game === 'chest'), probes = rows.filter(r => r.run === 'probe' || r.game === 'scout');
const efficiency = {
  answers: rows.length, quest: quest.length, repeatAsks: pct(quest.length - itemN.size, quest.length),
  practiceOnUsable: pct(quest.filter(r => truthAt(r.s ?? 0, r.level, r.S) >= 0.75 && r.game !== 'chest' && r.game !== 'scout').length, quest.length),
  reviewOnStrong: pct(chest.filter(r => truthAt(r.s ?? 0, r.level, r.S) >= 0.75).length, chest.length), reviews: chest.length,
  probeShare: pct(probes.length, rows.length), probesOnSolid: probes.filter(r => r.appState === 'mastered').length,
};

// ---------- 5. Học ----------
const practiced = [...new Set(rows.filter(r => r.run !== 'diag' && r.run !== 'measure').map(r => r.node))];
const area = (re: RegExp) => { const ns = practiced.filter(n => re.test(n) && P0.has(n)); return ns.length ? `${ns.length}: ${r2(avg(ns.map(n => P0.get(n)!)))} → ${r2(avg(ns.map(n => last.truth[n] ?? 0)))}` : '0'; };
const half = (xs: Row[]) => [xs.slice(0, Math.floor(xs.length / 2)), xs.slice(Math.floor(xs.length / 2))] as const;
const [qa, qb] = half(nat); const acc = (xs: Row[]) => pct(xs.filter(r => r.ok).length, xs.length);
// S07: câu mới của nút trước / sau bí kíp ở trại.
const s07: Array<[number, number]> = [];
for (const n of new Set(rows.filter(r => r.game === 'camp').map(r => r.node))) {
  const i0 = rows.findIndex(r => r.node === n && r.game === 'camp');
  const pre = rows.filter((r, i) => r.node === n && i < i0 && r.novel && natural(r)), post = rows.filter((r, i) => r.node === n && i > i0 && r.novel && natural(r) && r.game !== 'camp');
  if (pre.length >= 2 && post.length >= 2) s07.push([pre.filter(r => r.ok).length / pre.length, post.filter(r => r.ok).length / post.length]);
}
// S08: nút đứng yên — ≥ 3 phiên liền có tỉ lệ đúng 30–70%; app có đổi gì trong các phiên đó (mức, nhãn lỗ hổng, dạy lại / trại)?
let plateaus = 0, plateauChanged = 0;
for (const n of practiced) {
  const days = [...new Set(quest.filter(r => r.node === n).map(r => r.day))];
  for (let i = 0; i + 2 < days.length; i++) {
    const w = days.slice(i, i + 3).map(d => quest.filter(r => r.node === n && r.day === d)), accs = w.map(xs => xs.filter(r => r.ok).length / xs.length);
    if (!accs.every(a => a >= 0.3 && a <= 0.7)) continue;
    plateaus++;
    const flat = w.flat(), varied = new Set(flat.map(r => `${r.level}|${r.gap}`)).size > 1 || rows.some(r => r.node === n && r.game === 'camp' && days.slice(i, i + 3).includes(r.day)) || events.some(e => e.what === 'teach' && e.info?.node === n && days.slice(i, i + 3).includes(e.day));
    if (varied) plateauChanged++;
    break;
  }
}
const usable = (n: string, s: number | undefined, S?: number) => truthAt(s ?? 0, lvOf(n), S) >= 0.75;
const learning = {
  vocab: area(/^u:/), grammar: area(/^g:/), listening: area(/^ph:/), all: area(/./),
  usableStart: practiced.filter(n => usable(n, P0.get(n))).length, usableEnd: practiced.filter(n => usable(n, last.truth[n], last.stab?.[n])).length, practiced: practiced.length,
  accFirst: acc(qa), accSecond: acc(qb), novelFirst: acc(qa.filter(r => r.novel)), novelSecond: acc(qb.filter(r => r.novel)), seenFirst: acc(qa.filter(r => !r.novel)), seenSecond: acc(qb.filter(r => !r.novel)),
  S07: { nodes: s07.length, before: r2(avg(s07.map(x => x[0]))), after: r2(avg(s07.map(x => x[1]))) }, S08: { plateaus, appChangedSomething: plateauChanged },
  measure: state.e.ms?.checks.map(c => `${c.phase}:${c.got}/${c.of}`) ?? [],
  solidEnd: Object.keys(last.m).filter(n => stat(last.m[n]?.[lvOf(n) as 3]).state === 'mastered').length,
  solidFalse: Object.keys(last.m).filter(n => stat(last.m[n]?.[lvOf(n) as 3]).state === 'mastered' && truthAt(last.truth[n] ?? 0, lvOf(n), last.stab?.[n]) < 0.5).length,
};

// ---------- 6. Kịch bản ép + S12 / S14 ----------
const sc: Record<string, unknown> = {};
for (const tag of ['S05', 'S06', 'S11', 'S13']) {
  const xs = rows.filter(r => r.forced === tag); if (!xs.length) { sc[tag] = 'không tạo được'; continue; }
  const n = xs[0]!.node, i0 = rows.indexOf(xs[0]!), before = rows.filter((r, i) => r.node === n && i < i0).at(-1), iz = rows.indexOf(xs.at(-1)!);
  const nx = rows.filter((r, i) => r.node === n && i > iz).slice(0, 4);
  sc[tag] = { node: n, forced: xs.length, appBefore: before ? `L${before.level} ${before.appState}/${before.appM}` : null, appAfter: xs.map(x => `L${x.level}:${x.appState}/${x.appM}`), next: nx.map(r => `d${r.day} L${r.level} ${r.game ?? r.run}${r.gap ? ' ' + r.gap : ''} ${r.ok ? '✓' : '✗'} ${r.appState}`), snaps: state.e.ev.snap.filter(s => s.subj === n && /REOPEN|FAIL|VERIFY|micro|transfer/.test(s.dec)).map(s => `d${s.day} ${s.dec}`).slice(0, 5) };
}
const s12 = practiced.filter(n => rows.filter(r => r.node === n && r.novel && r.ok && natural(r) && r.level >= 3).length >= 2 && stat(last.m[n]?.[lvOf(n) as 3]).state === 'mastered').length;
const s12cand = practiced.filter(n => rows.filter(r => r.node === n && r.novel && r.ok && natural(r) && r.level >= 3).length >= 2).length;
sc.S12 = { nodesWith2NovelCorrect: s12cand, mastered: s12 };
const chestOk = chest.filter(r => r.ok && natural(r)), chestAgain = chestOk.map(r => rows.filter((z, i) => z.node === r.node && z.game === 'chest' && i > rows.indexOf(r)).length);
sc.S14 = { chestCorrect: chestOk.length, laterChestSameNodeMean: r2(avg(chestAgain)) };
sc.S09_S10 = 'không tạo được qua giao diện: game không có kỹ năng thao tác (không tính giờ, không phản xạ); điểm game chỉ sinh từ câu trả lời (P14, test engine-quest)';

// ---------- 7. Tiến độ mục tiêu ----------
const towers = screens.filter(s => s.where === 'tower');
const prog = (t: string | undefined) => (t?.match(/Tiến độ thật của bạn: (\d+\/\d+)/) ?? [])[1] ?? null, skill = (t: string | undefined) => (t?.match(/📈 (\d+\/\d+)/) ?? [])[1] ?? null;
const goal = { goals: state.e.goals.map(g => g.id), readinessFirst: prog(towers[0]?.text), readinessLast: prog(towers.at(-1)?.text), skillsFirst: skill(towers[0]?.text), skillsLast: skill(towers.at(-1)?.text), why: state.e.ev.snap.filter(s => s.kind === 'readiness').slice(-1).map(s => s.dec) };

const out = { pageErrors: state.errors.length, stuck: events.filter(e => e.what === 'stuck').length, model, difficulty, latency, nba, efficiency, learning, scenarios: sc, goal,
  decisions: Object.fromEntries([...state.e.ev.snap.reduce((m, s) => m.set(s.dec.split(':').slice(0, 2).join(':'), (m.get(s.dec.split(':').slice(0, 2).join(':')) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 16)) };
writeFileSync(join(DIR, 'metrics-l03.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
