// Máy chấm câu Nghe/Đọc theo cách chấm của đề thật: đúng chính tả, đúng giới hạn số từ, không phân biệt hoa thường.
// Mỗi phương án trong "chọn TWO" là một điểm riêng (như đề IELTS), nên một câu nhiều đáp án có thể được 0, 1 hoặc 2 điểm.

import type { Group, Item, TextAnswer } from './content.ts';
import { answerKind } from './content.ts';

const ARTICLES = new Set(['a', 'an', 'the']);

// Chuẩn hoá để so: thường hoá, dấu nháy cong → thẳng, gạch nối/gạch chéo giữa từ coi như cách, bỏ dấu câu ở hai đầu,
// bỏ dấu phẩy ngăn cách hàng nghìn trong số.
export function norm(s: string): string {
  return s.toLowerCase()
    .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"')
    .replace(/(\d),(?=\d{3}\b)/g, '$1')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/^[\s"'.,;:!?()]+|[\s"'.,;:!?()]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const isNum = (w: string): boolean => /^[£$€]?\d+([.:/]\d+)*(%|st|nd|rd|th|am|pm|kg|km|m|cm)?$/i.test(w);

// Đếm từ theo quy ước đề IELTS: từ có gạch nối tính là một từ; số tính riêng.
export function countWords(s: string): { words: number; nums: number } {
  const toks = s.trim().split(/\s+/).filter(Boolean);
  let words = 0, nums = 0;
  for (const t of toks) (isNum(t.replace(/[.,;:!?]+$/, '')) ? nums++ : words++);
  return { words, nums };
}

export function withinLimit(s: string, limit: number | undefined, num: boolean | undefined): boolean {
  if (limit === undefined) return true;
  const c = countWords(s);
  if (num) return c.words <= limit && c.nums <= 1;
  return c.words + c.nums <= limit;
}

export function textCorrect(given: string, ans: TextAnswer, limit?: number, num?: boolean): boolean {
  const g = norm(given);
  if (!g || !withinLimit(given, limit, num)) return false;
  for (const a of ans.accept) {
    const n = norm(a);
    if (g === n) return true;
    // Thêm mạo từ ở đầu vẫn đúng nếu không vượt giới hạn từ.
    const parts = g.split(' ');
    if (parts.length > 1 && ARTICLES.has(parts[0]!) && parts.slice(1).join(' ') === n) return true;
  }
  return false;
}

export type Given = string | string[] | undefined;

export interface Mark {
  got: number;
  of: number;
}

export function marksOf(it: Item): number {
  return Array.isArray(it.ans) ? it.ans.length : 1;
}

export function markItem(it: Item, g: Group, given: Given): Mark {
  const kind = answerKind(it, g), of = marksOf(it);
  if (given === undefined) return { got: 0, of };
  if (kind === 'choice') return { got: typeof given === 'string' && given === it.ans ? 1 : 0, of };
  if (kind === 'multi') {
    const want = new Set(it.ans as string[]);
    const picks = [...new Set(Array.isArray(given) ? given : [given])];
    if (picks.length > of) return { got: 0, of };   // chọn quá số đáp án đề cho: không tính điểm (như đề thật)
    return { got: picks.filter(p => want.has(p)).length, of };
  }
  return { got: typeof given === 'string' && textCorrect(given, it.ans as TextAnswer, it.limit, it.num) ? 1 : 0, of };
}
