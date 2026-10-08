// Phân tích bot L02 (người học yếu): so điều app kết luận với hồ sơ ẩn — điểm yếu, nguyên nhân gốc, hiểu sai, kịch bản S01–S10,
// hiệu quả, tiến bộ thật / giả. Chạy sau tools/learners/l02.ts (cần ends.json + state.json).
// node --experimental-strip-types --no-warnings tools/learners/analyze-l02.ts <thư mục>

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { defaultLevel } from '../../src/engine/graph.ts';
import { NODE } from './core.ts';
import { MIS, truthAt } from './l02.ts';
import type { Node } from '../../src/engine/types.ts';
import type { Row } from './core.ts';

const DIR = process.argv[2] ?? 'reports/learners/L02';
const J = (f: string) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const rows = J('rows.json') as Row[];
const ends = J('ends.json') as { day: number; m: MasteryStore; truth: Record<string, number>; stab?: Record<string, number>; mis?: Record<string, Record<string, { t: string; n: number }>> }[];
const events = J('events.json') as { day: number; what: string; info?: Record<string, unknown> }[];
const state = J('state.json') as { e: { goals: { id: string }[]; ev: { snap: { dec: string; subj: string; day: number; info?: Record<string, unknown> }[]; hyp: Record<string, unknown> }; ms?: { checks: { phase: string; got: number; of: number }[] } }; errors: string[]; mind: { n: string; p: number; s: number; mis: number | null }[] };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);
const r2 = (x: number) => Math.round(x * 100) / 100;
const lvOf = (n: string) => { const x = NODE.get(n); return x ? defaultLevel(x as unknown as Node) : 3; };
const last = ends.at(-1)!, first = ends[0]!;
const quest = rows.filter(r => r.run === 'quest');
const natural = (r: Row) => !r.forced && !r.mis;

// 1. Phát hiện điểm yếu (cuối kỳ): nút app đã có bằng chứng thật (n > 0 ở mức mặc định).
const judged = Object.keys(last.truth).filter(n => /^(u|g):/.test(n) && (last.m[n]?.[lvOf(n) as 3]?.n ?? 0) > 0);
// Ba lớp: vững (app: Đạt thật; thật: ≥ 0,75) / yếu (app: m < 0,6; thật: < 0,5) / giữa. Chỉ xét nút app có ≥ 3 lượt bằng chứng.
let agree = 0, extremes = 0, opposite = 0; const weakMiss: string[] = [], weakFalse: string[] = [];
const pairs: Array<[number, number]> = [], cls: Record<string, number> = {};
for (const n of judged) {
  const s = stat(last.m[n]![lvOf(n) as 3]), t = r2(truthAt(last.truth[n]!, lvOf(n), last.stab?.[n]));   // năng lực thật ở đúng mức app đo (câu mới, tự lực)
  if (s.n < 3) continue;
  pairs.push([s.m, t]);
  const a = s.pass && s.state === 'mastered' ? 'strong' : s.m < 0.6 ? 'weak' : 'mid', b = t >= 0.75 ? 'strong' : t < 0.5 ? 'weak' : 'mid';
  cls[`${a}|${b}`] = (cls[`${a}|${b}`] ?? 0) + 1;
  if (a === b) agree++;
  if (b !== 'mid') { extremes++; if ((a === 'strong' && b === 'weak') || (a === 'weak' && b === 'strong')) { opposite++; (b === 'weak' ? weakMiss : weakFalse).push(`${n}:${t}`); } }
}
const corr = (() => { const n = pairs.length; if (n < 3) return null; const mx = pairs.reduce((a, p) => a + p[0], 0) / n, my = pairs.reduce((a, p) => a + p[1], 0) / n; let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; } return r2(sxy / Math.sqrt(sxx * syy)); })();
// "Chưa biết" so với "chưa chứng minh": nút trong mục tiêu chưa có bằng chứng thật — app có gắn nhãn chưa có gì / suy ra (không phải Đạt / đang học)?
const noEv = Object.keys(last.truth).filter(n => /^(u|g):/.test(n) && !((last.m[n]?.[lvOf(n) as 3]?.n ?? 0) > 0));
const noEvStates: Record<string, number> = {}; for (const n of noEv) { const st = stat(last.m[n]?.[lvOf(n) as 3]).state; noEvStates[st] = (noEvStates[st] ?? 0) + 1; }

// 2. Hồ sơ không đều.
const diag = events.find(e => e.what === 'diag-result')?.info;
const listen = rows.filter(r => r.node.startsWith('ph:')).length;
// 3. Nút thắt: phân bổ lượt trong tháp.
const share = (f: (r: Row) => boolean) => pct(quest.filter(f).length, quest.length);
const cefr = (n: string) => NODE.get(n)?.cefr ?? '?';
const alloc = { grammarA1A2: share(r => r.node.startsWith('g:') && /A1|A2/.test(cefr(r.node))), vocab: share(r => r.node.startsWith('u:')), knownNodes: share(r => truthAt(r.s ?? 0, r.level, r.S) >= 0.75 && r.game !== 'chest') };

// 4. Nguyên nhân gốc: nhãn lỗ hổng của app ↔ nguyên nhân thật.
const MAP: Record<string, string[]> = { knowledge: ['knowledge', 'misconception', 'partial'], recall: ['recall'], skill: ['use'], transfer: ['transfer'], retention: ['retention'], prerequisite: ['knowledge'], context: ['transfer'], automaticity: ['none'] };
const lab = quest.filter(r => r.gap && r.cause && natural(r));
const cm: Record<string, Record<string, number>> = {};
for (const r of lab) { (cm[r.gap!] ||= {})[r.cause!] = (cm[r.gap!]![r.cause!] ?? 0) + 1; }
const rcHit = lab.filter(r => MAP[r.gap!]?.includes(r.cause!)).length, rcNone = lab.filter(r => r.cause === 'none').length;
const byCause: Record<string, { n: number; hit: number }> = {};
for (const r of lab) { const b = (byCause[r.cause!] ||= { n: 0, hit: 0 }); b.n++; if (MAP[r.gap!]?.includes(r.cause!)) b.hit++; }

// 5. Hiểu sai.
const misNodes = Object.keys(MIS);
const detect = misNodes.map(n => {
  const d = ends.find(e => Object.values(e.mis?.[n] ?? {}).some(x => x.n >= 2));
  const misAnswers = rows.filter(r => r.node === n && r.mis).length;
  return { node: n, kind: MIS[n], misAnswers, detectedDay: d?.day ?? null, botMisEnd: state.mind.find(x => x.n === n)?.mis ?? null, targeted: events.filter(e => e.what === 'mis-explained' && e.info?.node === n && e.info?.how === 'targeted').length, generic: events.filter(e => e.what === 'mis-explained' && e.info?.node === n && e.info?.how !== 'targeted').length };
});
const falseMis = [...new Set(ends.flatMap(e => Object.entries(e.mis ?? {}).filter(([n, v]) => !MIS[n] && Object.values(v).some(x => x.n >= 2)).map(([n]) => n)))];

// 6. Kịch bản.
const after = (node: string, from: Row) => rows.filter(r => r.node === node && (r.day > from.day || (r.day === from.day && rows.indexOf(r) > rows.indexOf(from))));
const scen = (tag: string) => rows.filter(r => r.forced === tag);
const sc: Record<string, unknown> = {};
for (const tag of ['S01', 'S02', 'S03', 'S04', 'S06']) {
  const xs = scen(tag); if (!xs.length) { sc[tag] = 'không tạo được'; continue; }
  const n = xs[0]!.node, before = rows.filter(r => r.node === n && rows.indexOf(r) < rows.indexOf(xs[0]!)).at(-1);
  const nx = after(n, xs.at(-1)!).slice(0, 4);
  sc[tag] = { node: n, forced: xs.length, appBefore: before ? `${before.appState}/${before.appM}` : null, appAfterForced: xs.map(x => `L${x.level}${x.opts ? 'mcq' : 'typed'}:${x.appState}/${x.appM}`), nextAsks: nx.map(r => `d${r.day} L${r.level}${r.game ? ' ' + r.game : ''}${r.gap ? ' ' + r.gap : ''} ${r.ok ? '✓' : '✗'} ${r.appState}`), endState: [1, 2, 3, 4].map(l => last.m[n]?.[l as 1] ? `${l}:${stat(last.m[n]![l as 1]).state}` : '').filter(Boolean).join(' '), snaps: state.e.ev.snap.filter(s => s.subj === n && /REOPEN|FAIL|micro|probe/.test(s.dec)).map(s => `d${s.day} ${s.dec}`).slice(0, 6) };
}
// S05: đúng câu thử sau trại → ≥ 3 ngày sau ở cùng nút.
const s05 = rows.filter(r => r.game === 'camp' && r.ok).map(r => { const later = rows.filter(z => z.node === r.node && z.day >= r.day + 3 && natural(z)); return later.length ? later[0]!.ok : null; }).filter(x => x !== null) as boolean[];
sc.S05 = { campCorrect: rows.filter(r => r.game === 'camp' && r.ok).length, laterChecked: s05.length, laterOk: pct(s05.filter(Boolean).length, s05.length) };
// S07: đoán trúng — có nút nào app công nhận Đạt mà phần lớn câu đúng là đoán?
const guessHeavy = Object.keys(last.m).filter(n => { const s = stat(last.m[n]?.[lvOf(n) as 3]); if (s.state !== 'mastered') return false; const ok = rows.filter(r => r.node === n && r.ok); return ok.length >= 3 && ok.filter(r => r.guess).length / ok.length > 0.5; });
sc.S07 = { guesses: rows.filter(r => r.guess).length, guessCorrectRate: pct(rows.filter(r => r.guess).length, rows.filter(r => r.ok && r.opts).length), masteredMostlyGuessed: guessHeavy };
sc.S08 = 'không có trong luồng chính (tháp không có nút gợi ý); engine giảm trọng số câu có gợi ý ×0,5 (evaluate.ts, test engine-evidence)';
sc.S09 = 'không có trong luồng chính (tháp không cho làm lại); engine có cờ retry ×0,3 (evaluate.ts)';
// S10: câu mới của nút trước / sau lần đọc bí kíp ở trại.
const s10: Array<[number, number]> = [];
for (const n of new Set(rows.filter(r => r.game === 'camp').map(r => r.node))) {
  const c0 = rows.find(r => r.node === n && r.game === 'camp')!, i0 = rows.indexOf(c0);
  const pre = rows.filter((r, i) => r.node === n && i < i0 && r.novel && natural(r)), post = rows.filter((r, i) => r.node === n && i > i0 && r.novel && natural(r) && r.game !== 'camp');
  if (pre.length >= 2 && post.length >= 2) s10.push([pre.filter(r => r.ok).length / pre.length, post.filter(r => r.ok).length / post.length]);
}
sc.S10 = { nodes: s10.length, before: s10.length ? r2(s10.reduce((a, x) => a + x[0], 0) / s10.length) : null, after: s10.length ? r2(s10.reduce((a, x) => a + x[1], 0) / s10.length) : null };

// 7. Hiệu quả.
const itemN = new Map<string, number>(); for (const r of quest) itemN.set(r.item, (itemN.get(r.item) ?? 0) + 1);
const eff = {
  answers: rows.length, quest: quest.length, distinctItems: itemN.size, repeatAsks: pct(quest.length - itemN.size, quest.length),
  practiceOnKnown: pct(quest.filter(r => truthAt(r.s ?? 0, r.level, r.S) >= 0.75 && r.game !== 'chest' && r.game !== 'scout').length, quest.length),   // đã dùng được ở mức đang hỏi, kể cả câu mới
  probesOnSolid: rows.filter(r => (r.run === 'probe' || r.game === 'scout') && r.appState === 'mastered').length, probes: rows.filter(r => r.run === 'probe' || r.game === 'scout').length,
  maxAsksOneNodeOneDay: Math.max(...[...new Set(quest.map(r => `${r.day}|${r.node}`))].map(k => quest.filter(r => `${r.day}|${r.node}` === k).length)),
};

// 8. Tiến bộ thật / giả.
const practiced = [...new Set(rows.filter(r => r.run !== 'diag' && r.run !== 'measure').map(r => r.node))];
// Kỹ năng ban đầu = tiên nghiệm ẩn của bot (trước mọi lượt học); trước đây lấy kỹ năng ở cuối phiên đầu tiên có nút → đã gồm phần học
// trong phiên đó, làm "mức tăng" bị đánh giá thấp (báo cáo L02 v69 sửa lại).
const P0 = new Map(state.mind.map(x => [x.n, x.p]));
const t0 = (n: string) => P0.get(n) ?? 0;
const half = (xs: Row[]) => { const h = Math.floor(xs.length / 2); return [xs.slice(0, h), xs.slice(h)] as const; };
const [qa, qb] = half(quest.filter(natural));
const acc = (xs: Row[]) => pct(xs.filter(r => r.ok).length, xs.length);
const gain = {
  truthStart: r2(practiced.reduce((a, n) => a + t0(n), 0) / practiced.length), truthEnd: r2(practiced.reduce((a, n) => a + (last.truth[n] ?? 0), 0) / practiced.length),
  knownStart: practiced.filter(n => t0(n) >= 0.8).length, knownEnd: practiced.filter(n => (last.truth[n] ?? 0) >= 0.8).length, practiced: practiced.length,
  usableStart: practiced.filter(n => truthAt(t0(n), lvOf(n)) >= 0.75).length, usableEnd: practiced.filter(n => truthAt(last.truth[n] ?? 0, lvOf(n), last.stab?.[n]) >= 0.75).length,   // dùng được câu mới ở mức mục tiêu cần
  accFirstHalf: acc(qa), accSecondHalf: acc(qb), novelFirst: acc(qa.filter(r => r.novel)), novelSecond: acc(qb.filter(r => r.novel)), seenFirst: acc(qa.filter(r => !r.novel)), seenSecond: acc(qb.filter(r => !r.novel)),
  grammarA1A2TruthStart: r2(avg(practiced.filter(n => /^g:g-a[12]/.test(n)).map(t0))), grammarA1A2TruthEnd: r2(avg(practiced.filter(n => /^g:g-a[12]/.test(n)).map(n => last.truth[n] ?? 0))),
  measure: state.e.ms?.checks.map(c => `${c.phase}:${c.got}/${c.of}`) ?? [],
  solidEnd: Object.keys(last.m).filter(n => stat(last.m[n]?.[lvOf(n) as 3]).state === 'mastered').length,
  solidFalse: Object.keys(last.m).filter(n => stat(last.m[n]?.[lvOf(n) as 3]).state === 'mastered' && (last.truth[n] ?? 0) < 0.7).length,
};
function avg(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
// Lỗi theo nút: 3 lượt đầu so với 3 lượt cuối (nút ≥ 8 lượt).
const errRed = practiced.map(n => rows.filter(r => r.node === n && natural(r) && r.run === 'quest')).filter(xs => xs.length >= 8).map(xs => [1 - xs.slice(0, 3).filter(r => r.ok).length / 3, 1 - xs.slice(-3).filter(r => r.ok).length / 3]);
const nextChanges = (() => { const s = (J('screens.json') as { where: string; text: string; day: number }[]).filter(x => x.where === 'tower'); const seq: string[] = []; for (const x of s) { const t = (x.text.match(/Bước tiếp theo[^\n]*/) ?? [''])[0]; if (seq.at(-1) !== t) seq.push(t); } return seq.length; })();

const out = {
  goals: state.e.goals.map(g => g.id), pageErrors: state.errors.length, stuck: events.filter(e => e.what === 'stuck').length,
  weakness: { judged: pairs.length, agree3: pct(agree, pairs.length), oppositeOnExtremes: pct(opposite, extremes), classes: cls, missed: weakMiss.slice(0, 8), falseWeak: weakFalse.slice(0, 8), corrAppVsTruth: corr, noEvidence: noEv.length, noEvidenceStates: noEvStates },
  profile: { diag, listeningAsks: listen, readingAsks: rows.filter(r => r.node.startsWith('cd:')).length },
  alloc, rootCause: { labelled: lab.length, hit: pct(rcHit, lab.length), truthNoneButGap: pct(rcNone, lab.length), byCause, matrix: cm },
  misconception: { detect, falseMis, hyp: Object.keys(state.e.ev.hyp ?? {}).length },
  scenarios: sc, efficiency: eff, gain, errorReduction: { nodes: errRed.length, first: r2(avg(errRed.map(x => x[0]!))), last: r2(avg(errRed.map(x => x[1]!))) }, nextChanges,
  decisions: Object.fromEntries([...state.e.ev.snap.reduce((m, s) => m.set(s.dec.split(':').slice(0, 2).join(':'), (m.get(s.dec.split(':').slice(0, 2).join(':')) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 16)),
};
writeFileSync(join(DIR, 'metrics-l02.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
