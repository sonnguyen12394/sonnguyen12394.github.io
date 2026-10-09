// Bài Câu (v74, F3 ngữ pháp): xếp lá từ thành câu đúng để "ra bài". Thuần hàm, seed cố định.
// Học là luật chơi (G1): lá bài chính là các từ của câu; ra bài = tự dựng câu đúng ngữ pháp (bằng chứng mức 3, không đoán mò được).
// Điểm = chip × nhân; bùa (lá đổi luật) do người chơi chọn sau mỗi bàn — chiến thuật thuần game, không đổi câu hỏi (P14), không vào
// mastery (P13). Thua một bàn không kết thúc ván: đủ 3 bàn × 3 lượt (ván không ngắn lại vì chơi kém — học không bị cắt).
// Tên, luật, hình lá bài là của app (thể loại "xếp bài tính điểm"), không lấy tên / hình của trò chơi thương mại nào.

import { rand } from './blocks.ts';

export const TABLES = 3, PLAYS = 3;
export interface Charm { id: string; name: string; desc: string }
export const CHARMS: Charm[] = [
  { id: 'long', name: 'Câu dài', desc: 'Câu từ 7 lá trở lên: nhân ×2' },
  { id: 'ask', name: 'Câu hỏi', desc: 'Câu hỏi (kết thúc bằng ?): +40 chip' },
  { id: 'chain', name: 'Chuỗi lửa', desc: 'Đúng 2 lượt liền trở lên: nhân +2' },
  { id: 'short', name: 'Gọn gàng', desc: 'Câu từ 5 lá trở xuống: +30 chip' },
  { id: 'neg', name: 'Phủ định', desc: 'Câu có not / n\'t / never: nhân +1' },
  { id: 'first', name: 'Khai cuộc', desc: 'Lượt đầu mỗi bàn: +25 chip' },
];
export const target = (table: number): number => [180, 320, 520][table] ?? 520;

export interface Play { ok: boolean; tiles: number; question: boolean; negative: boolean; first: boolean }
// Điểm một lượt ra bài: sai = 0 (không trừ). chip = 10 / lá (+ bùa), nhân = 1 + chuỗi đúng trước đó (+ bùa).
export function score(p: Play, streak: number, charms: string[]): { chips: number; mult: number; total: number } {
  if (!p.ok) return { chips: 0, mult: 0, total: 0 };
  let chips = p.tiles * 10, mult = 1 + streak;
  for (const c of charms) {
    if (c === 'long' && p.tiles >= 7) mult *= 2;
    if (c === 'ask' && p.question) chips += 40;
    if (c === 'chain' && streak >= 1) mult += 2;
    if (c === 'short' && p.tiles <= 5) chips += 30;
    if (c === 'neg' && p.negative) mult += 1;
    if (c === 'first' && p.first) chips += 25;
  }
  return { chips, mult, total: chips * mult };
}
// Hai bùa để chọn sau bàn `table` (theo seed, chưa có trong tay).
export function offer(seed: number, table: number, have: string[]): Charm[] {
  const r = rand(seed + table * 7717), pool = CHARMS.filter(c => !have.includes(c.id)), out: Charm[] = [];
  while (out.length < 2 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}
// Trộn lá: câu + lá nhiễu, theo seed (không phụ thuộc người học).
export function deal(seed: number, n: number, tokens: string[], distract: string[]): string[] {
  const r = rand(seed + n * 1009), xs = [...tokens, ...distract];
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; }
  return xs;
}
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[.!,]+$/g, '').trim();
// So câu đã xếp với đáp án (bỏ qua hoa thường, dấu chấm / phẩy cuối). Trả về vị trí sai đầu tiên (−1 nếu đúng).
export function check(built: string[], answer: string[]): number {
  const n = Math.max(built.length, answer.length);
  for (let i = 0; i < n; i++) if (norm(built[i] ?? '') !== norm(answer[i] ?? '')) return i;
  return -1;
}

export interface CardsSave { best: number; runs: number; wins: number; day: number }
export const freshCardsSave = (): CardsSave => ({ best: 0, runs: 0, wins: 0, day: 0 });
export function sanitizeCards(raw: unknown): CardsSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { best: n(x.best, 1e9), runs: n(x.runs, 1e7), wins: n(x.wins, 1e7), day: n(x.day, 1e6) };
}
export function mergeCards(a?: CardsSave, b?: CardsSave): CardsSave | undefined {
  if (!a) return b; if (!b) return a;
  return { best: Math.max(a.best, b.best), runs: Math.max(a.runs, b.runs), wins: Math.max(a.wins, b.wins), day: Math.max(a.day, b.day) };
}
