// Chấm lại 200 tiêu chí Conformance (0–4) + 200 tiêu chí C201–C400 (0–10) + 10 Hard Fail + 20 Meta-Test từ dữ liệu
// tools/score/{conformance,scorecard}.json, rồi sinh docs/SCORE.md. Quy tắc "điểm cao phải có test chứng minh":
//   - Conformance 4 (đúng, có test, ổn định) và C201–C400 ≥ 9 bắt buộc có ≥ 1 tham chiếu test tồn tại thật;
//   - mỗi tham chiếu "đường/dẫn/tệp.ts::đoạn tên test" phải có tệp và có đoạn đó trong tệp (không chấm theo trí nhớ).
// Chạy: npm run score (sinh lại tài liệu) · npm run score -- --check (chỉ kiểm, dùng trong test).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export interface Crit { id: string; name: string; layer?: 'Critical' | 'Core' | 'Quality'; group?: number | string; v51: number; score: number; evidence: string; tests?: string[] }
export interface Flag { id: string; name: string; v51: boolean; pass: boolean; evidence: string; tests?: string[] }
export interface Conf { version: string; date: string; groups: Record<string, string>; criteria: Crit[] }
export interface Card { version: string; date: string; parts: Record<string, string>; criteria: Crit[]; hardFail: Flag[]; meta: Flag[] }

const load = <T>(f: string): T => JSON.parse(readFileSync(join(ROOT, 'tools/score', f), 'utf8')) as T;

export function checkRefs(items: Array<{ id: string; tests?: string[] }>): string[] {
  const err: string[] = [], cache = new Map<string, string>();
  for (const c of items) for (const t of c.tests ?? []) {
    const [file, needle] = t.split('::');
    if (!file || !needle) { err.push(`${c.id}: tham chiếu sai dạng "${t}"`); continue; }
    const p = join(ROOT, file);
    if (!existsSync(p)) { err.push(`${c.id}: không có tệp ${file}`); continue; }
    if (!cache.has(p)) cache.set(p, readFileSync(p, 'utf8'));
    if (!cache.get(p)!.includes(needle)) err.push(`${c.id}: ${file} không có "${needle}"`);
  }
  return err;
}

export function validate(conf: Conf, card: Card): string[] {
  const err: string[] = [];
  const ids = (xs: Crit[], from: number, to: number, label: string) => {
    const have = new Set(xs.map(x => x.id));
    for (let i = from; i <= to; i++) if (!have.has(`C${i}`)) err.push(`${label}: thiếu C${i}`);
    if (have.size !== xs.length) err.push(`${label}: trùng id`);
  };
  ids(conf.criteria, 1, 200, 'conformance'); ids(card.criteria, 201, 400, 'scorecard');
  for (const c of conf.criteria) {
    if (!(c.score >= 0 && c.score <= 4 && Number.isInteger(c.score))) err.push(`${c.id}: điểm ${c.score} ngoài 0–4`);
    if (!c.layer) err.push(`${c.id}: thiếu lớp`);
    if (c.score === 4 && !(c.tests ?? []).length) err.push(`${c.id}: 4 điểm cần test chứng minh`);
  }
  for (const c of card.criteria) {
    if (!(c.score >= 0 && c.score <= 10)) err.push(`${c.id}: điểm ${c.score} ngoài 0–10`);
    if (c.score >= 9 && !(c.tests ?? []).length) err.push(`${c.id}: ≥ 9 điểm cần test chứng minh`);
  }
  if (card.hardFail.length !== 10) err.push('cần đủ 10 Hard Fail');
  if (card.meta.length !== 20) err.push('cần đủ 20 Meta-Test');
  return [...err, ...checkRefs(conf.criteria), ...checkRefs(card.criteria), ...checkRefs(card.hardFail), ...checkRefs(card.meta)];
}

const pf = (s: number) => (s >= 3 ? 'Pass' : s === 2 ? 'Partial' : 'Fail');
const n1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1).replace('.', ',');
const pc = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;
const esc = (s: string) => s.replace(/\|/g, '\\|');

export function render(conf: Conf, card: Card): string {
  const C = conf.criteria, sum = (xs: Crit[], k: 'v51' | 'score') => xs.reduce((s, x) => s + x[k], 0);
  const tot = sum(C, 'score'), tot0 = sum(C, 'v51');
  const layers = (['Critical', 'Core', 'Quality'] as const).map(l => { const xs = C.filter(x => x.layer === l); return { l, n: xs.length, s: sum(xs, 'score'), s0: sum(xs, 'v51'), fail: xs.filter(x => x.score <= 1) }; });
  const cnt = (xs: Crit[], k: 'v51' | 'score') => ({ p: xs.filter(x => pf(x[k]) === 'Pass').length, q: xs.filter(x => pf(x[k]) === 'Partial').length, f: xs.filter(x => pf(x[k]) === 'Fail').length });
  const all = cnt(C, 'score');
  const crFail = C.filter(x => x.layer === 'Critical' && x.score <= 1);
  const K = card.criteria, avg = (xs: Crit[], k: 'v51' | 'score') => xs.reduce((s, x) => s + x[k], 0) / Math.max(1, xs.length);
  const hfFail = card.hardFail.filter(h => !h.pass), mtPass = card.meta.filter(m => m.pass).length;
  const tests = new Set([...C, ...K, ...card.hardFail, ...card.meta].flatMap(x => x.tests ?? [])).size;
  const out: string[] = [];
  out.push(`# Bảng chấm ${conf.version}: 200 tiêu chí Conformance + 400 tiêu chí v2.4`, '',
    `Sinh tự động bởi \`npm run score\` từ \`tools/score/conformance.json\` và \`tools/score/scorecard.json\` (${conf.date}). Không sửa tay tệp này.`,
    `Quy tắc: Conformance 4 điểm và C201–C400 từ 9 điểm bắt buộc có test tự động chứng minh; công cụ kiểm từng tham chiếu test (${tests} tham chiếu) có tồn tại thật. So sánh với bản chấm v51 (\`docs/CONFORMANCE-200-v2.4.md\`, \`docs/SCORECARD-v2.4.md\`).`, '',
    '## Kết luận', '',
    '| Chỉ số | v51 | ' + conf.version + ' |', '|---|---|---|',
    `| Conformance 200 | ${tot0}/800 (${pc(tot0, 800)}) | **${tot}/800 (${pc(tot, 800)})**: ${all.p} Pass · ${all.q} Partial · ${all.f} Fail |`,
    ...layers.map(x => `| ${x.l} (${x.n}) | ${x.s0}/${x.n * 4} | **${x.s}/${x.n * 4} (${pc(x.s, x.n * 4)})**${x.l === 'Critical' ? ` · ${x.fail.length} Fail` : ''} |`),
    `| C201–C400 (trung bình) | ${n1(avg(K, 'v51'))}/10 | **${n1(avg(K, 'score'))}/10** |`,
    `| Hard Fail | ${card.hardFail.filter(h => !h.v51).length} trượt | **${hfFail.length} trượt**${hfFail.length ? ` (${hfFail.map(h => h.id).join(', ')})` : ''} |`,
    `| Meta-Test | ${card.meta.filter(m => m.v51).length}/20 | **${mtPass}/20** |`, '');
  out.push(crFail.length ? `Critical còn Fail: ${crFail.map(x => `${x.id} ${x.name}`).join('; ')}.` : 'Không còn tiêu chí Critical nào Fail → Architecture không FAIL.', '');
  out.push('## Conformance theo nhóm', '', '| Nhóm | v51 | ' + conf.version + ' | Pass | Partial | Fail |', '|---|---|---|---|---|---|');
  for (const [g, name] of Object.entries(conf.groups)) {
    const xs = C.filter(x => String(x.group) === g), c = cnt(xs, 'score');
    out.push(`| ${g}. ${name} | ${sum(xs, 'v51')}/${xs.length * 4} | **${sum(xs, 'score')}/${xs.length * 4}** | ${c.p} | ${c.q} | ${c.f} |`);
  }
  out.push('', '## C201–C400 theo phần', '', '| Phần | v51 | ' + conf.version + ' |', '|---|---|---|');
  for (const [p, name] of Object.entries(card.parts)) { const xs = K.filter(x => x.group === p); out.push(`| ${p}. ${name} | ${n1(avg(xs, 'v51'))} | **${n1(avg(xs, 'score'))}** |`); }
  out.push('', '## 10 Hard Fail', '', '| # | Điều kiện | v51 | ' + conf.version + ' | Bằng chứng |', '|---|---|---|---|---|');
  for (const h of card.hardFail) out.push(`| ${h.id} | ${esc(h.name)} | ${h.v51 ? '✅' : '❌'} | ${h.pass ? '✅' : '❌'} | ${esc(h.evidence)} |`);
  out.push('', '## 20 Meta-Test', '', '| # | Tên | v51 | ' + conf.version + ' | Bằng chứng |', '|---|---|---|---|---|');
  for (const m of card.meta) out.push(`| ${m.id} | ${esc(m.name)} | ${m.v51 ? '✅' : '—'} | ${m.pass ? '✅' : '—'} | ${esc(m.evidence)} |`);
  out.push('', '## Chi tiết 200 tiêu chí Conformance', '');
  for (const [g, name] of Object.entries(conf.groups)) {
    const xs = C.filter(x => String(x.group) === g);
    out.push(`### ${g}. ${name}: ${sum(xs, 'score')}/${xs.length * 4}`, '', '| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |', '|---|---|---|---|---|---|');
    for (const x of xs) out.push(`| ${x.id} | ${esc(x.name)} | ${x.layer} | ${x.v51} | **${x.score}** | ${esc(x.evidence)}${x.tests?.length ? ` · test: ${x.tests.map(t => `\`${esc(t.split('::')[0]!.split('/').pop()!)}\``).join(', ')}` : ''} |`);
    out.push('');
  }
  out.push('## Chi tiết C201–C400', '');
  for (const [p, name] of Object.entries(card.parts)) {
    const xs = K.filter(x => x.group === p);
    out.push(`### ${p}. ${name}: ${n1(avg(xs, 'score'))}/10`, '', '| # | Tiêu chí | v51 | Điểm | Bằng chứng |', '|---|---|---|---|---|');
    for (const x of xs) out.push(`| ${x.id} | ${esc(x.name)} | ${x.v51} | **${x.score}** | ${esc(x.evidence)}${x.tests?.length ? ` · test: ${x.tests.map(t => `\`${esc(t.split('::')[0]!.split('/').pop()!)}\``).join(', ')}` : ''} |`);
    out.push('');
  }
  return out.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const conf = load<Conf>('conformance.json'), card = load<Card>('scorecard.json'), err = validate(conf, card);
  if (err.length) { console.error(`score: ${err.length} lỗi\n${err.slice(0, 40).join('\n')}`); process.exit(1); }
  const md = render(conf, card);
  if (process.argv.includes('--check')) {
    const cur = existsSync(join(ROOT, 'docs/SCORE.md')) ? readFileSync(join(ROOT, 'docs/SCORE.md'), 'utf8') : '';
    if (cur !== md) { console.error('score: docs/SCORE.md chưa sinh lại (npm run score)'); process.exit(1); }
  } else writeFileSync(join(ROOT, 'docs/SCORE.md'), md);
  console.log(`score: hợp lệ; ${md.split('\n').find(l => l.startsWith('| Conformance 200'))}`);
}
