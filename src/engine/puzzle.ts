// Câu đố ngày (v77, F10 ôn tập + F2 từ vựng): 16 ô từ của 4 cụm từ (nút u:) → tìm 4 nhóm cùng chủ đề. Thuần hàm, seed cố định.
// Ghép nhóm là luật chơi (dùng nghĩa của từ), nhưng KHÔNG vào năng lực: một nhóm sai không chỉ ra được người học hổng nút nào (G3).
// Bằng chứng là câu nhớ lại tự gõ sau mỗi nhóm (từ khác của cùng cụm, không có trên bàn). Sai không mất gì: không giới hạn lượt nộp,
// số lần sai chỉ bớt sao (telemetry). Tên, luật, màu của app (thể loại "nhóm từ theo chủ đề"), không theo game đố chữ thương mại nào.

import { rand } from './blocks.ts';

export const GROUPS = 4, PER = 4;
export interface PzWord { id: string; en: string; vi: string; pos?: string; pic?: string; learned?: boolean; due?: boolean }
export interface PzGroup { node: string; topic: string; vi: string; words: PzWord[] }

// Trộn 16 ô theo seed: mỗi ô là [nhóm, chỉ số từ trong nhóm].
export function deal(seed: number, groups: number): Array<[number, number]> {
  const r = rand(seed), xs: Array<[number, number]> = [];
  for (let g = 0; g < groups; g++) for (let k = 0; k < PER; k++) xs.push([g, k]);
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; }
  return xs;
}
// Chấm 4 ô đã chọn (theo nhóm của từng ô): đúng cả 4 / gần đúng (3 ô cùng một nhóm) / chưa đúng.
export function judge(sel: number[]): { res: 'ok' | 'near' | 'no'; g: number } {
  if (sel.length !== PER) return { res: 'no', g: -1 };
  const cnt = new Map<number, number>();
  for (const g of sel) cnt.set(g, (cnt.get(g) ?? 0) + 1);
  const [g, n] = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return { res: n === PER ? 'ok' : n === PER - 1 ? 'near' : 'no', g };
}
// Sao cả ván: 3 khi không nộp sai, 2 khi sai ≤ 2 lần, còn lại 1 (luôn có sao: hoàn thành là đủ). Gợi ý nghĩa miễn phí, không bớt sao.
export const stars = (mistakes: number): number => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);
// Họ chủ đề của cụm (theo tên cụm tiếng Anh). Nhiều cụm gần nghĩa nhau (Ngày trong tuần / Tháng / Xem giờ; Đồ ăn / Rau củ / Bữa ăn): hai cụm
// cùng họ trên một bàn thì một từ ("yesterday") hợp cả hai nhóm → không công bằng. Mỗi bàn 4 họ khác nhau. Cụm trừu tượng (đại từ, giới từ,
// cụm động từ, thành ngữ, từ nối…) không có họ: không dùng cho câu đố (nhóm theo chủ đề không có nghĩa với chúng).
const FAMILIES: Array<[string, string]> = [
  ['nature', 'weather|nature|animals?|wildlife|environment|plants?|sky and sea|land|farm|countryside|disasters?'],
  ['leisure', 'free time|hobb|leisure|games'],
  ['sport', 'sports?|competitions?|competitive'],
  ['food', 'food|drinks?|meals?|eat|fruit|vegetables?|kitchen|flavours?|cook|snacks?|dish|seafood|meat|sweets|nuts|taste'],
  ['time', 'days of|months?|dates|telling the time|times of the day|time words|duration'],
  ['number', 'numbers?|measuring units'],
  ['body', 'body|health|illness|medicine|injur|chemist|face'],
  ['feel', 'feelings?|emotions?|moods?|fear|joy|grief|personality|character'],
  ['family', 'family|friends'],
  ['home', 'house|home|housework'],
  ['shop', 'cloth|shopping|buying|money|payments?|finance|wealth|economy|business|compan'],
  ['travel', 'travel|transport|vehicles?|airport|directions?|getting around|going abroad|holidays?|trips?|places to go'],
  ['town', 'town|city|buildings\\b'],
  ['school', 'school|class|university|stud|education|subjects'],
  ['work', 'jobs?|work|careers?|office'],
  ['tech', 'technolog|computers?|internet|devices?|social media|screens'],
  ['arts', 'music|films?|media|books?|arts?\\b|literature|dance|news'],
  ['law', 'law|crime|justice|courts?|government|politic|elections?|war|soldiers?|weapons?|religion|faith|traditions?|history|diplomacy'],
  ['colour', 'colours?|size and shape'],
];
const FAM_RE = FAMILIES.map(([k, r]) => [k, new RegExp(`\\b(?:${r})`)] as const);
export function family(title: string): string | null {
  const t = title.toLowerCase();
  if (/^(phrasal|idiom)/.test(t)) return null;
  for (const [k, r] of FAM_RE) if (r.test(t)) return k;
  return null;
}
// Chọn tối đa `n` cụm khác họ chủ đề và không trùng chữ giữa các cụm (hai cụm cùng chứa một từ thì nhóm có hai đáp án).
export function distinct(gs: PzGroup[], n = GROUPS): PzGroup[] {
  const out: PzGroup[] = [], words = new Set<string>(), fams = new Set<string>();
  for (const g of gs) {
    const f = family(g.topic), ws = g.words.map(w => w.en.toLowerCase().trim());
    if (!f || fams.has(f) || ws.some(w => words.has(w)) || g.words.length < PER) continue;
    out.push(g); fams.add(f); ws.forEach(w => words.add(w));
    if (out.length >= n) break;
  }
  return out;
}

export interface PuzzleSave { runs: number; best: number; days: number; last: number; stars: number }
export const freshPuzzleSave = (): PuzzleSave => ({ runs: 0, best: 0, days: 0, last: 0, stars: 0 });
export function sanitizePuzzle(raw: unknown): PuzzleSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), best: n(x.best, 3), days: n(x.days, 1e6), last: n(x.last, 1e6), stars: n(x.stars, 1e8) };
}
export function mergePuzzle(a?: PuzzleSave, b?: PuzzleSave): PuzzleSave | undefined {
  if (!a) return b; if (!b) return a;
  return { runs: Math.max(a.runs, b.runs), best: Math.max(a.best, b.best), days: Math.max(a.days, b.days), last: Math.max(a.last, b.last), stars: Math.max(a.stars, b.stars) };
}
