// Số liệu chơi (v89, GAME-CRITERIA §8.3): đo trục T (trải nghiệm) bằng hành vi thật thay cho tự chấm.
// Mỗi game đếm: số ván, ván tự chọn (không qua "▶ Chơi tiếp" của bộ não chọn game), ván chơi lại ngay từ màn kết, ván xong, ván bỏ giữa,
// thời gian tới thao tác đầu tiên và thời lượng ván (giữ 20 lần gần nhất). Chỉ ở máy này (tier 0 telemetry), không vào năng lực (P13).
// Thuần hàm: thời điểm do nơi gọi truyền vào.

import { isGame, type GameId } from './director.ts';

export type Via = 'dir' | 'self' | 'again';
export interface GStat { n: number; self: number; again: number; done: number; quit: number; fa: number[]; du: number[] }   // fa, du: giây
export interface PlayCur { g: GameId; t0: number; via: Via; f: number; d: 0 | 1; town: string }   // f: giây tới thao tác đầu (−1 = chưa); town: Phố lúc bắt đầu
export interface PlaySave { g: Partial<Record<GameId, GStat>>; cur: PlayCur | null }
export const freshPlay = (): PlaySave => ({ g: {}, cur: null });
const KEEP = 20;
const freshG = (): GStat => ({ n: 0, self: 0, again: 0, done: 0, quit: 0, fa: [], du: [] });
const push = (xs: number[], v: number) => { xs.push(v); if (xs.length > KEEP) xs.splice(0, xs.length - KEEP); };
const sec = (ms: number) => Math.max(0, Math.min(36000, Math.round(ms / 1000)));

// Ván dở của game trước (chưa tới màn kết) tính là bỏ giữa.
function close(s: PlaySave): void {
  const c = s.cur;
  if (c && !c.d) { const g = (s.g[c.g] ||= freshG()); g.quit++; }
  s.cur = null;
}
export function playStart(s: PlaySave, game: GameId, via: Via, now: number, town = ''): void {
  close(s);
  const g = (s.g[game] ||= freshG());
  g.n++; if (via === 'self') g.self++; if (via === 'again') g.again++;
  s.cur = { g: game, t0: now, via, f: -1, d: 0, town };
}
export function playAct(s: PlaySave, now: number): void {
  const c = s.cur;
  if (!c || c.d || c.f >= 0) return;
  c.f = sec(now - c.t0);
  push((s.g[c.g] ||= freshG()).fa, c.f);
}
// Tới màn kết. Trả về true lần đầu (để màn kết chỉ ăn mừng một lần).
export function playDone(s: PlaySave, game: GameId, now: number): boolean {
  const c = s.cur;
  if (!c || c.g !== game || c.d) return false;
  c.d = 1;
  const g = (s.g[game] ||= freshG());
  g.done++; push(g.du, sec(now - c.t0));
  return true;
}
export function playQuit(s: PlaySave): void { close(s); }

// Ngưỡng §8.3. Cần ≥ MIN_N ván mới kết luận.
export const MIN_N = 5;
export const TH = { quit: 0.2, first: 10, self: 0.25, durLo: 180, durHi: 480 };
const med = (xs: number[]): number | null => { if (!xs.length) return null; const a = [...xs].sort((p, q) => p - q), m = a.length >> 1; return a.length % 2 ? a[m]! : Math.round((a[m - 1]! + a[m]!) / 2); };
export interface GReport { game: GameId; n: number; done: number; quit: number; self: number; first: number | null; dur: number | null; ok: { quit: boolean; first: boolean; self: boolean; dur: boolean } | null }
export function playReport(s: PlaySave): GReport[] {
  const out: GReport[] = [];
  for (const [k, g] of Object.entries(s.g)) {
    if (!g || !isGame(k) || !g.n) continue;
    const ended = g.done + g.quit, quit = ended ? g.quit / ended : 0, self = (g.self + g.again) / g.n, first = med(g.fa), dur = med(g.du);
    out.push({ game: k, n: g.n, done: g.done, quit, self, first, dur,
      ok: g.n < MIN_N ? null : { quit: quit < TH.quit, first: first !== null && first <= TH.first, self: self >= TH.self, dur: dur !== null && dur >= TH.durLo && dur <= TH.durHi } });
  }
  return out.sort((a, b) => b.n - a.n || (a.game < b.game ? -1 : 1));
}

export function sanitizePlay(raw: unknown): PlaySave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const arr = (v: unknown) => (Array.isArray(v) ? v.filter((t): t is number => typeof t === 'number' && Number.isFinite(t)).slice(-KEEP).map(t => n(t, 36000)) : []);
  const out = freshPlay();
  if (x.g && typeof x.g === 'object') for (const [k, v] of Object.entries(x.g as Record<string, unknown>)) {
    if (!isGame(k) || !v || typeof v !== 'object') continue;
    const q = v as Record<string, unknown>;
    out.g[k] = { n: n(q.n, 1e7), self: n(q.self, 1e7), again: n(q.again, 1e7), done: n(q.done, 1e7), quit: n(q.quit, 1e7), fa: arr(q.fa), du: arr(q.du) };
  }
  const c = x.cur as Record<string, unknown> | null | undefined;
  if (c && typeof c === 'object' && typeof c.g === 'string' && isGame(c.g)) {
    out.cur = { g: c.g, t0: n(c.t0, 1e14), via: c.via === 'dir' || c.via === 'again' ? c.via : 'self', f: typeof c.f === 'number' && c.f >= 0 ? n(c.f, 36000) : -1, d: c.d ? 1 : 0, town: typeof c.town === 'string' ? c.town.slice(0, 400) : '' };
  }
  return out;
}
// Gộp hai máy: mỗi game lấy bản có nhiều ván hơn (bộ đếm chỉ tăng theo máy); ván dở giữ của máy A.
export function mergePlay(a?: PlaySave, b?: PlaySave): PlaySave | undefined {
  if (!a) return b; if (!b) return a;
  const g: PlaySave['g'] = { ...a.g };
  for (const [k, v] of Object.entries(b.g)) { const cur = g[k as GameId]; if (v && (!cur || v.n > cur.n)) g[k as GameId] = v; }
  return { g, cur: a.cur ?? b.cur };
}
