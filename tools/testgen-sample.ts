// v141 Soát câu của máy sinh bài (src/engine/testgen.ts). Ba chế độ:
//   npm run testgen -- [--lv a1|a2] [--n 5] [--seed 1]            in bài đầy đủ (bài đọc, lời thoại, câu hỏi, đáp án, lý do) để người / phiên AI soát;
//   npm run testgen -- --blind [--lv a2] [--n 20] [--seed 1]      phép thử "không có bài": chỉ câu hỏi + phương án (không bài, không đáp án),
//                                                                  dán cho một phiên AI mới, cấm công cụ; lưu trả lời JSON {id: "A"};
//   npm run testgen -- --score phien1.json [phien2.json …]        chấm: tỉ lệ đoán đúng theo dạng câu; đích gần 33% (3 phương án), ngưỡng ≤ 55%.
// Mã câu dạng "<cấp>:<hạt>:<mã câu>" nên chấm lại được bằng cách sinh lại đúng bài từ hạt. Không cần ngân hàng câu theo nút.
import { readFileSync } from 'node:fs';
import { genForm } from '../src/engine/testgen.ts';

const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const goalOf = (lv: string) => (lv === 'a1' ? 'cefr-a1' : 'cefr-a2');
const form = (lv: string, seed: number) => genForm({ goal: goalOf(lv), seed, bank: [], used: new Set(), pools: [], seen: () => false });
const lv = (arg('--lv') ?? 'a2').toLowerCase(), n = Number(arg('--n') ?? 5), seed0 = Number(arg('--seed') ?? 1);
const seeds = Array.from({ length: n }, (_, i) => seed0 + i * 7919);

if (process.argv.includes('--score')) {
  const files = process.argv.slice(process.argv.indexOf('--score') + 1), st = new Map<string, { n: number; ok: number }>();
  for (const f of files) for (const [id, a] of Object.entries(JSON.parse(readFileSync(f, 'utf8')) as Record<string, string>)) {
    const [l, s, iid] = id.split(':'); const g = form(l!, Number(s)).groups.find(x => x.items.some(it => it.id === iid)); const it = g?.items.find(x => x.id === iid);
    if (!it || !g) { console.log(`? ${id}: không sinh lại được`); continue; }
    const k = `${g.title} · ${it.tag ?? ''}`, v = st.get(k) ?? { n: 0, ok: 0 }; v.n++; if (String(a).trim().toUpperCase().startsWith(String(it.ans))) v.ok++; st.set(k, v);
  }
  let bad = 0;
  for (const [k, v] of [...st].sort()) { const p = v.ok / v.n; if (p > 0.55) bad++; console.log(`${p > 0.55 ? '✗' : '✓'} ${k}: ${v.ok}/${v.n} = ${Math.round(p * 100)}% (ngẫu nhiên 33%)`); }
  process.exit(bad ? 1 : 0);
}
for (const s of seeds) {
  const f = form(lv, s);
  if (!process.argv.includes('--blind')) console.log(`\n==== ${f.id} (hạt ${s}) ====`);
  for (const g of f.groups) {
    if (process.argv.includes('--blind')) { for (const it of g.items) console.log(`[${lv}:${s}:${it.id}] ${it.q}\n  ${it.opts!.map(o => `${o.k}) ${o.t}`).join('   ')}`); continue; }
    console.log(`\n## ${g.kind === 'reading' ? 'Đọc' : 'Nghe'} · ${g.title}`);
    (g.paras ?? []).forEach(p => console.log(`  ${p}`));
    (g.script ?? []).forEach(l => console.log(`  ${l.sp}: ${l.t}`));
    for (const it of g.items) console.log(`  • ${it.q}\n    ${it.opts!.map(o => `${o.k}) ${o.t}`).join('   ')}  → ${it.ans} (${it.why}) · b ${it.b}`);
  }
  if (!process.argv.includes('--blind')) for (const t of f.ws) console.log(`\n## ${t.kind === 'w' ? 'Viết' : 'Nói'} · ${t.en}\n  ${t.p}\n  ${t.pv}\n  Ý: ${t.c.join('; ')} · ≥ ${t.min} từ`);
}
