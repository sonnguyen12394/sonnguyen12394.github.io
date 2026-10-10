// Vòng Chữ (v93, game chủ lực — GAME-CRITERIA §10.4): vuốt qua các chữ cái trên vòng để ghép thành từ tiếng Anh, điền vào các ô của màn.
// Chữ chính là quân cờ (M1, HG24): mọi thao tác là đánh vần một từ. Mỗi ô có nghĩa tiếng Việt làm gợi ý, nên tìm ra từ = nhớ lại dạng từ
// từ nghĩa với bộ chữ cho sẵn (mức 2). Nội dung do engine chọn: từ gốc lấy từ các cụm từ (u:) mà bộ chọn chung đưa ra (ôn → đang học →
// lộ trình); các ô còn lại là từ khác trong kho của app ghép được từ cùng bộ chữ, không quá cấp người học + 1.
// Thuần hàm, theo seed. Đường cong độ khó do số màn quyết định (độ khó game, P14), không đổi cách chấm năng lực.

export interface Lex { en: string; vi: string; lv: string; node: string; id: string; pic?: string }
export interface Slot { en: string; vi: string; node: string; id: string; pic?: string; target: boolean }
export interface Level { letters: string[]; base: string; slots: Slot[]; bonus: string[] }

export const LVS = ['Pre-A1', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const lvi = (lv: string) => Math.max(0, LVS.indexOf(lv));
export const isWord = (s: string) => /^[a-z]{3,8}$/.test(s);

export function rand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const count = (w: string): Record<string, number> => { const c: Record<string, number> = {}; for (const ch of w) c[ch] = (c[ch] ?? 0) + 1; return c; };
export function canForm(word: string, letters: string): boolean {
  const have = count(letters);
  for (const ch of word) { if (!have[ch]) return false; have[ch]!--; }
  return true;
}

// Đường cong độ khó theo số màn (P14: độ khó game): số chữ trên vòng và số ô tăng dần, có màn "nghỉ" dễ hơn sau mỗi 5 màn.
export function curve(level: number): { len: number; slots: number } {
  const rest = level > 1 && level % 5 === 0;
  const len = level <= 6 ? 5 : level <= 25 ? 6 : 7;
  const slots = Math.min(7, 3 + Math.floor(level / 4));
  return rest ? { len: Math.max(5, len - 1), slots: Math.max(3, slots - 1) } : { len, slots };
}

// Dựng một màn: thử các từ gốc (từ của cụm engine chọn, đủ độ dài), chọn từ gốc ghép được nhiều từ của cụm nhất rồi nhiều từ kho nhất.
// Ô: từ gốc + từ của cụm ghép được + từ kho dễ trước (cấp thấp, ngắn) tới đủ số ô. Từ ghép được còn lại = từ thưởng.
export function buildLevel(seed: number, targets: Lex[], lex: Lex[], cap: string, want: { len: number; slots: number }): Level | null {
  const r = rand(seed), maxLv = lvi(cap) + 1;
  const pool = lex.filter(x => isWord(x.en) && lvi(x.lv) <= maxLv);
  const tgt = targets.filter(x => isWord(x.en));
  let best: { base: Lex; t: Lex[]; o: Lex[]; score: number } | null = null;
  for (const lenTry of [want.len, want.len + 1, want.len - 1, want.len + 2]) {
    for (const b of tgt.filter(x => x.en.length === lenTry)) {
      const t = tgt.filter(x => x.en !== b.en && canForm(x.en, b.en));
      const o = pool.filter(x => x.en !== b.en && !t.some(y => y.en === x.en) && canForm(x.en, b.en));
      const score = t.length * 3 + Math.min(o.length, want.slots) + r() * 0.5;
      if (1 + t.length + o.length >= Math.min(3, want.slots) && (!best || score > best.score)) best = { base: b, t, o, score };
    }
    if (best) break;
  }
  if (!best) return null;
  const uniq = (xs: Lex[]) => { const seen = new Set<string>(); return xs.filter(x => (seen.has(x.en) ? false : (seen.add(x.en), true))); };
  const t = uniq(best.t), o = uniq(best.o).sort((a, b) => lvi(a.lv) - lvi(b.lv) || a.en.length - b.en.length || (a.en < b.en ? -1 : 1));
  const chosen: Slot[] = [{ ...best.base, target: true }, ...t.map(x => ({ ...x, target: true }))].slice(0, want.slots);
  for (const x of o) { if (chosen.length >= want.slots) break; chosen.push({ ...x, target: false }); }
  const slots = chosen.map(({ en, vi, node, id, pic, target }) => ({ en, vi, node, id, ...(pic ? { pic } : {}), target }))
    .sort((a, b) => a.en.length - b.en.length || (a.en < b.en ? -1 : 1));
  const inSlots = new Set(slots.map(s => s.en));
  const bonus = [...new Set(lex.filter(x => isWord(x.en) && !inSlots.has(x.en) && canForm(x.en, best!.base.en)).map(x => x.en))];
  return { letters: shuffle(best.base.en.split(''), r), base: best.base.en, slots, bonus };
}
export function shuffle<T>(xs: T[], r: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

// Thử thách ngày: cùng một màn cho mọi người trong ngày (seed = ngày), từ gốc 6 chữ cấp A1–A2, ô từ kho tới B1 (M10).
export function dailyLevel(day: number, lex: Lex[]): Level | null {
  const r = rand(day * 2654435761), bases = lex.filter(x => isWord(x.en) && x.en.length === 6 && lvi(x.lv) <= lvi('A2')).sort((a, b) => (a.en < b.en ? -1 : 1));
  for (let k = 0; k < 40 && bases.length; k++) {
    const b = bases[Math.floor(r() * bases.length)]!, lv = buildLevel(day + k, [b], lex, 'A2', { len: 6, slots: 6 });
    if (lv && lv.slots.length >= 5) return lv;
  }
  return null;
}

export type Verdict = 'slot' | 'bonus' | 'dup' | 'short' | 'no';
export function judge(lv: Level, found: ReadonlySet<string>, word: string): Verdict {
  const w = word.toLowerCase();
  if (w.length < 3) return 'short';
  if (found.has(w)) return 'dup';
  if (lv.slots.some(s => s.en === w)) return 'slot';
  if (lv.bonus.includes(w)) return 'bonus';
  return 'no';
}
// Gợi ý: mở một chữ của ô chưa tìm (ô ngắn nhất trước, chữ đầu chưa mở). Trả về [ô, vị trí chữ] hoặc null khi hết chỗ.
export function nextHint(lv: Level, found: ReadonlySet<string>, shown: Record<string, number[]>): [number, number] | null {
  const order = lv.slots.map((s, i) => ({ s, i })).filter(x => !found.has(x.s.en)).sort((a, b) => a.s.en.length - b.s.en.length || a.i - b.i);
  for (const { s, i } of order) { const k = s.en.split('').findIndex((_, j) => !(shown[s.en] ?? []).includes(j)); if (k >= 0) return [i, k]; }
  return null;
}
// Bằng chứng của một ô tìm ra (chỉ ô thuộc cụm engine chọn): mở ≥ nửa số chữ bằng gợi ý thì coi như chưa nhớ ra (sai); mở ít hơn → đúng
// có trợ giúp; không gợi ý → đúng tự lực. Xác suất đoán g: bộ chữ cho sẵn nên không bằng 0.
export const GUESS = 0.1;
export function evidenceOf(slot: Slot, shownCount: number): { ok: boolean; hint: boolean } | null {
  if (!slot.target) return null;
  if (shownCount * 2 >= slot.en.length) return { ok: false, hint: true };
  return { ok: true, hint: shownCount > 0 };
}
export const stars = (hints: number): number => (hints === 0 ? 3 : hints <= 2 ? 2 : 1);
export const HINT_COST = 10;

export interface WheelSave { lv: number; stars: number; words: number; bonus: number; runs: number; day: number; daily: { day: number; done: boolean; secs: number; hints: number } }
export const freshWheelSave = (): WheelSave => ({ lv: 1, stars: 0, words: 0, bonus: 0, runs: 0, day: 0, daily: { day: 0, done: false, secs: 0, hints: 0 } });
export function sanitizeWheel(raw: unknown): WheelSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : d);
  const d = (x.daily && typeof x.daily === 'object' ? x.daily : {}) as Record<string, unknown>;
  return { lv: Math.max(1, n(x.lv, 1e6, 1)), stars: n(x.stars, 1e8), words: n(x.words, 1e8), bonus: n(x.bonus, 1e8), runs: n(x.runs, 1e7), day: n(x.day, 1e6),
    daily: { day: n(d.day, 1e6), done: !!d.done, secs: n(d.secs, 1e6), hints: n(d.hints, 1e3) } };
}
export function mergeWheel(a?: WheelSave, b?: WheelSave): WheelSave | undefined {
  if (!a) return b; if (!b) return a;
  const daily = a.daily.day !== b.daily.day ? (a.daily.day > b.daily.day ? a.daily : b.daily) : a.daily.done ? a.daily : b.daily;
  return { lv: Math.max(a.lv, b.lv), stars: Math.max(a.stars, b.stars), words: Math.max(a.words, b.words), bonus: Math.max(a.bonus, b.bonus), runs: Math.max(a.runs, b.runs), day: Math.max(a.day, b.day), daily };
}
// Chủ đề hình theo chương (10 màn một chương): màu nền + tên, vẽ bằng canvas (M4).
export const CHAPTERS = [
  { vi: 'Bình minh', a: '#ff9a62', b: '#7b4fd6', c: '#ffd166' },
  { vi: 'Biển xanh', a: '#2bc0e4', b: '#1b3b8f', c: '#eaffd0' },
  { vi: 'Rừng trúc', a: '#56ab2f', b: '#1d4d2b', c: '#d4fc79' },
  { vi: 'Phố đêm', a: '#8e2de2', b: '#160b3d', c: '#f9d423' },
  { vi: 'Sa mạc', a: '#f7b733', b: '#a1452a', c: '#fff1c1' },
  { vi: 'Băng tuyết', a: '#a1c4fd', b: '#3a5a98', c: '#ffffff' },
];
export const chapterOf = (level: number) => CHAPTERS[Math.floor((level - 1) / 10) % CHAPTERS.length]!;
// Văn bản chia sẻ thử thách ngày (không lộ đáp án).
export function shareText(day: number, found: number, total: number, hints: number, secs: number): string {
  const mm = Math.floor(secs / 60), ss = String(secs % 60).padStart(2, '0');
  return `Vòng Chữ · ngày ${day % 10000}\n${'🟩'.repeat(found)}${'⬜'.repeat(Math.max(0, total - found))}\n${'⭐'.repeat(stars(hints))} · ${hints} gợi ý · ⏱ ${mm}:${ss}`;
}
