// v142 Độ phủ phiên âm của bộ chú thích phát âm (src/engine/pronote.ts) trên câu hội thoại A1–A2 (DIALOGUES, dùng ở Nói nhại)
// và bài đọc bài học A1–A2 (Đọc to). In tỉ lệ + từ còn thiếu. Dùng chung cho test đơn vị engine-pronote.
import { readFileSync, readdirSync } from 'node:fs';
import { coverage, sentencesOf, type IpaOf } from '../src/engine/pronote.ts';

export function corpus(): { ipaOf: IpaOf; dlg: string[]; read: string[] } {
  const src = readFileSync('app.js', 'utf8'), ipa = new Map<string, string>();
  for (const m of src.matchAll(/"word":"([^"]+)","pos":"[^"]*","ipa":"([^"]+)"/g)) if (!ipa.has(m[1]!.toLowerCase())) ipa.set(m[1]!.toLowerCase(), m[2]!);
  const a = src.indexOf('/*<DIALOGUES>*/'), b = src.indexOf('/*</DIALOGUES>*/');
  const D = new Function(src.slice(a + 15, b).replace(/^\s*const DIALOGUES =/, 'return ').replace(/;\s*$/, ''))() as Array<{ lv: string; lines: Array<{ t: string }> }>;
  const dlg = D.filter(d => d.lv === 'A1' || d.lv === 'A2').flatMap(d => d.lines.map(l => l.t));
  const read: string[] = [];
  for (const f of readdirSync('data').filter(f => /^lv-A[12]\.[0-9a-f]+\.json$/.test(f))) {
    const d = JSON.parse(readFileSync(`data/${f}`, 'utf8')) as { units: Record<string, { reading?: { text: string } }> };
    for (const u of Object.values(d.units)) if (u.reading?.text) read.push(...sentencesOf(u.reading.text));
  }
  return { ipaOf: w => ipa.get(w), dlg, read };
}

if (process.argv[1]?.endsWith('pronote-cov.ts')) {
  const c = corpus();
  for (const [k, lines] of [['Hội thoại A1–A2', c.dlg], ['Bài đọc A1–A2', c.read]] as const) {
    const r = coverage(lines, c.ipaOf);
    console.log(`${k}: ${lines.length} câu, ${r.n} từ, có IPA ${(100 * r.hit / r.n).toFixed(1)}%`);
    console.log('  thiếu:', [...r.miss].sort((x, y) => y[1] - x[1]).slice(0, 120).map(([w, n]) => `${w}:${n}`).join(' '));
  }
}
