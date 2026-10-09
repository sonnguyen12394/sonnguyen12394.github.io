// Bot người học L01 — Người mới hoàn toàn (Cold-Start Beginner). Lõi chơi app: tools/learners/core.ts.
// Người học ẩn:
//   - Kỹ năng thật s ∈ [0,1] theo cấp CEFR và loại nút (biết ít từ A1, ngữ pháp yếu hơn từ vựng, gần như không biết B1+).
//   - Xác suất đúng: câu chọn = s + (1 − s)/số phương án (đoán); câu tự gõ = s^1.4. Câu đã gặp +0,15 ("quen mặt"), câu mới thì không.
//   - Học: thấy đáp án sau khi sai +10%, trả lời đúng +4%, đọc bí kíp / thẻ mới +20%. Quên theo e^(−Δngày/S), S = 2 rồi ×2 mỗi lần
//     nhớ đúng cách ngày. "Thật sự biết" = s ≥ 0,8.
// Chạy: node --experimental-strip-types --no-warnings tools/learners/l01.ts [--days 45] [--seed 1] [--rate 1] [--out reports/learners/L01]
// --rate: hệ số tốc độ học (độ nhạy: app có nhận ra khi người học tiến bộ nhanh hơn không).

import { run, NODE, type Profile } from './core.ts';

const PRIOR: Record<string, Record<string, number>> = {
  u: { 'Pre-A1': 0.75, A1: 0.6, A2: 0.3, B1: 0.1, B2: 0.04, C1: 0.02 },
  g: { 'Pre-A1': 0.5, A1: 0.35, A2: 0.15, B1: 0.05, B2: 0.02, C1: 0.01 },
  ph: { 'Pre-A1': 0.4, A1: 0.3, A2: 0.2, B1: 0.1, B2: 0.05, C1: 0.05 },
  fn: { 'Pre-A1': 0.35, A1: 0.25, A2: 0.1, B1: 0.05, B2: 0.02, C1: 0.01 },
};

export const L01: Profile = {
  name: 'L01', out: 'reports/learners/L01',
  prior: node => (PRIOR[node.split(':')[0]!] ?? PRIOR.fn!)[NODE.get(node)?.cefr ?? 'A2'] ?? 0.1,
  pCorrect: (x, s0, q, _novel, opts) => { const s = Math.min(1, s0 + (x.seen.has(q.id) ? 0.15 : 0)); return opts ? s + (1 - s) / opts : Math.pow(s, 1.4); },
  gain: { ok: 0.04, bad: 0.1, card: 0.2, teach: 0.2, diagOk: 0.02 },
  dunno: (s, rnd) => s < 0.25 && rnd() < 0.4,
};

if (import.meta.url === `file://${process.argv[1]}`) run(L01).catch(e => { console.error(e); process.exit(1); });
