// v144 Bài luyện ngẫu nhiên theo cấp (người sáng lập 16/10/2026): sinh bài đọc / bài nói song song Anh – Việt từ khuôn (textbank.ts),
// A1 / A2 × 3 bậc Dễ → Vừa → Khó. Bậc của câu theo số từ tiếng Anh (≤ 6 Dễ, 7–10 Vừa, ≥ 11 Khó); bài ưu tiên câu đúng bậc.
// Thuần hàm, có hạt: cùng hạt cho lại đúng bài. Bản dịch chưa người thật kiểm.
import { POOLS, TOPICS, type Frame, type Val, type Topic } from './textbank.ts';

export type Lv = 'A1' | 'A2';
export type Tier = 1 | 2 | 3;
export interface GenLine { en: string; vi: string; sp?: 'A' | 'B' }
export interface GenText { id: string; lv: Lv; tier: Tier; kind: 'read' | 'talk'; title: string; tvi: string; lines: GenLine[] }

const rngOf = (seed: number) => { let a = seed >>> 0 || 1; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
export const wordsOf = (s: string) => (s.match(/[A-Za-z0-9'’-]+/g) ?? []).length;
export const tierOf = (s: string): Tier => { const n = wordsOf(s); return n <= 6 ? 1 : n <= 10 ? 2 : 3; };
const cap = (s: string) => s.replace(/^(\s*["“(]?)(\p{Ll})/u, (_, a: string, b: string) => a + b.toUpperCase());

// Điền khe: {KEY} / {KEY:v|i|n|nv}. KEY = tên kho + số (FOOD2 khác FOOD). Cùng bài cùng khe thì cùng giá trị.
function filler(r: () => number) {
  const got = new Map<string, Val>();
  const val = (key: string): Val => {
    const cur = got.get(key); if (cur) return cur;
    const base = key.replace(/\d+$/, ''), pool = POOLS[base] ?? [];
    const used = new Set([...got].filter(([k]) => k.replace(/\d+$/, '') === base).map(([, v]) => v.en));
    const free = pool.filter(v => !used.has(v.en)), v = pick(r, free.length ? free : pool);
    got.set(key, v); return v;
  };
  return (f: Frame): GenLine => {
    const sub = (s: string, vi: boolean) => s.replace(/\{([A-Z]+\d*)(?::(v|i|n|nv))?\}/g, (_, k: string, m?: string) => {
      const v = val(k), f2 = m ?? (vi ? 'v' : '');
      return f2 === 'v' ? v.v : f2 === 'i' ? v.i ?? v.en : f2 === 'n' ? v.n ?? v.en : f2 === 'nv' ? v.nv ?? v.v : v.en;
    });
    return { en: cap(sub(f[0], false)), vi: cap(sub(f[1], true)) };
  };
}

const N_READ: Record<Lv, [number, number, number]> = { A1: [4, 5, 6], A2: [5, 6, 6] };
const N_TALK: Record<Lv, [number, number, number]> = { A1: [3, 3, 4], A2: [3, 4, 4] };

// Chọn n câu gần bậc nhất (lệch bậc nhỏ trước, cùng lệch thì ngẫu nhiên), giữ thứ tự trong chủ đề cho mạch bài.
function choose<T>(r: () => number, xs: T[], tier: Tier, n: number, tOf: (x: T) => number): T[] {
  const idx = xs.map((x, i) => ({ i, d: Math.abs(tOf(x) - tier), k: r() })).sort((a, b) => a.d - b.d || a.k - b.k).slice(0, n).map(x => x.i).sort((a, b) => a - b);
  return idx.map(i => xs[i]!);
}

export function genText(o: { lv: Lv; tier: Tier; seed: number; kind: 'read' | 'talk' }): GenText {
  const r = rngOf(o.seed), fill = filler(r);
  // A2 ưu tiên chủ đề A2 (3/4 số lần), còn lại mượn chủ đề A1 ở câu khó hơn.
  const own = TOPICS.filter(t => t.lv === o.lv), other = TOPICS.filter(t => t.lv !== o.lv && o.lv === 'A2');
  const t: Topic = other.length && r() < 0.25 ? pick(r, other) : pick(r, own);
  const lines: GenLine[] = [];
  if (o.kind === 'read') {
    for (const f of choose(r, t.read, o.tier, N_READ[o.lv][o.tier - 1]!, x => tierOf(x[0]))) lines.push(fill(f));
  } else {
    for (const [q, a] of choose(r, t.talk, o.tier, N_TALK[o.lv][o.tier - 1]!, p => Math.max(tierOf(p[0][0]), tierOf(p[1][0])))) {
      lines.push({ ...fill(q), sp: 'A' }, { ...fill(a), sp: 'B' });
    }
  }
  return { id: `${o.lv.toLowerCase()}-${o.kind[0]}${o.tier}-${o.seed}`, lv: o.lv, tier: o.tier, kind: o.kind, title: t.en, tvi: t.vi, lines };
}

// Độ khó của một bài có sẵn (để xếp bậc cùng thang): số từ trung bình mỗi câu.
export const avgLen = (lines: string[]) => (lines.length ? lines.reduce((a, l) => a + wordsOf(l), 0) / lines.length : 0);
