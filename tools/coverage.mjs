#!/usr/bin/env node
// Bảng phủ nội dung (yêu cầu 6.1, 6.2): mỗi dạng câu IELTS/VSTEP cần bài học + ≥ 30 câu luyện, trải cấp B1–C1 (trọng tâm).
// In bảng tình trạng và ghi content/coverage.md. Không làm CI đỏ (phát hành dần, 4.4) nhưng ghi rõ dạng nào chưa đủ.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = d => !existsSync(d) ? [] : readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; });
const src = readFileSync(join(ROOT, 'src/exam/content.ts'), 'utf8');
const QT = [...src.matchAll(/\{ id: '([a-z0-9-]+)', vi: '([^']+)', en: '([^']+)', skill: '([LR])', exams: (\w+),/g)].map(m => ({ id: m[1], vi: m[2], en: m[3], skill: m[4], exams: m[5] })).filter(q => !q.id.startsWith('pl-'));
const groups = walk(join(ROOT, 'content/exam')).filter(f => !f.includes('/types/')).flatMap(f => [JSON.parse(readFileSync(f, 'utf8'))].flat());
const lessons = new Set(walk(join(ROOT, 'content/exam/types')).map(f => JSON.parse(readFileSync(f, 'utf8')).id));
// Đếm theo số điểm như đề IELTS: câu "Choose TWO" tính là 2 câu.
const pts = it => Array.isArray(it.ans) ? it.ans.length : 1;
const NEED = 30, LV = ['A2', 'B1', 'B2', 'C1', 'C2'];
const rows = QT.map(q => {
  const gs = groups.filter(g => g.mode === 'practice' && g.qtype === q.id), n = gs.reduce((s, g) => s + g.items.reduce((t, it) => t + pts(it), 0), 0);
  const lv = Object.fromEntries(LV.map(L => [L, gs.filter(g => g.level === L).reduce((s, g) => s + g.items.reduce((t, it) => t + pts(it), 0), 0)]));
  const audio = q.skill === 'L' ? gs.filter(g => g.audio).length + '/' + gs.length : '—';
  return { ...q, n, lv, lesson: lessons.has(q.id), audio, ok: n >= NEED && lessons.has(q.id) };
});
const lines = ['# Bảng phủ nội dung ôn thi', '', 'Tạo bởi `node tools/coverage.mjs`. Chỉ tiêu mỗi dạng: có bài học + ≥ 30 câu luyện, trọng tâm B1–C1 (yêu cầu 6.1, 6.2).', '',
  '| Kỹ năng | Dạng câu | Kỳ thi | Bài học | Số câu | A2 | B1 | B2 | C1 | C2 | Âm thanh | Đạt |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.skill === 'L' ? 'Nghe' : 'Đọc'} | ${r.vi} (${r.en}) | ${r.exams === 'V' ? 'VSTEP' : 'IELTS'} | ${r.lesson ? '✓' : '—'} | ${r.n}/${NEED} | ${LV.map(L => r.lv[L] || '').join(' | ')} | ${r.audio} | ${r.ok ? '✓' : '—'} |`),
  '', `Đạt ${rows.filter(r => r.ok).length}/${rows.length} dạng. Kiểm tra đầu vào: ${groups.filter(g => g.mode === 'place').reduce((s, g) => s + g.items.length, 0)} câu. Đề thi thử: ${groups.filter(g => g.mode === 'mock').reduce((s, g) => s + g.items.length, 0)} câu.`];
writeFileSync(join(ROOT, 'content/coverage.md'), lines.join('\n') + '\n');
console.log(lines.slice(-1)[0]);
