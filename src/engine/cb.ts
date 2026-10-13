// v133 Chiến Binh Chữ, mốc 1: ô Vũ khí (Từ vựng), tinh hoa chữ, rèn, khoá theo chỉ số thật, Thợ rèn gợi ý, số liệu trận, góp ý nhanh.
// Hai cổng tách bạch (docs/MOC1-KE-HOACH.md §1):
//   • tinh hoa: CHỈ từ câu trả lời đúng ở lò (Vườn từ, Vòng Chữ, Mỏ Chữ, Lò rèn) cho nút từ vựng; không mua được;
//   • chỉ số thật: Vũ khí bậc N chỉ MẶC được khi Từ vựng Lv ≥ N (bag.ts statsOf). Rèn rồi mà chỉ số chưa đủ = "đã rèn, chưa mặc được".
// Xu (thô) chỉ là phí rèn, không thay được hai cổng trên. Thuần hàm; không ghi bằng chứng (chỉ đọc kết quả của ingest).

import { FIGHTS, type FightDef } from './fight.ts';

// ---------- Rèn Vũ khí ----------
export const W_MAX = 3;   // mốc 1 rèn tới bậc 3
export const W_VI = ['Que gỗ', 'Ná Chữ Gỗ', 'Ná Chữ Đồng', 'Ná Chữ Bạc', 'Ná Chữ Vàng', 'Ná Chữ Kim cương'] as const;
export const W_COST: Array<{ ess: number; coins: number; voc: number }> = [
  { ess: 0, coins: 0, voc: 0 },
  { ess: 8, coins: 20, voc: 1 },
  { ess: 20, coins: 60, voc: 2 },
  { ess: 40, coins: 120, voc: 3 },
];
export const ESS_DAY = 60;          // trần tinh hoa mỗi ngày (giãn cách; không cày một ngày cho xong)
export const ESS_GAMES: Record<string, string> = { learn: 'garden', wheel: 'wheel', hunt: 'hunt', forge: 'forge' };   // ctx bằng chứng → lò

export interface FightLog { d: number; id: string; w: number; need: number; r: 'w' | 'l' | 'q'; n: number; acc: number; t1: number; sec: number; again?: 1 }
export interface Fb { d: number; at: 'fight' | 'forge'; id: string; s: number; t: string }
export interface CbSave {
  w: number;                         // bậc Vũ khí đã rèn
  ess: number;                       // tinh hoa Vũ khí đang có (bội 0,5)
  got: number;                       // tổng tinh hoa đã nhận (số liệu)
  day: number; today: number;        // ngày và tinh hoa đã nhận trong ngày đó (trần ESS_DAY)
  spent: number;                     // xu đã tiêu để rèn (ví chung trừ khoản này)
  clr: string[];                     // trận đã thắng ít nhất một lần
  tip: { day: number; game: string } | null;   // lò Thợ rèn gợi ý mà người chơi đã bấm hôm nay (+25% tinh hoa)
  log: FightLog[];                   // số liệu trận (≤ LOG_MAX)
  fb: Fb[];                          // góp ý nhanh (≤ FB_MAX)
}
export const LOG_MAX = 60, FB_MAX = 200;
export const freshCb = (): CbSave => ({ w: 0, ess: 0, got: 0, day: 0, today: 0, spent: 0, clr: [], tip: null, log: [], fb: [] });

const nn = (v: unknown, hi = 1e7): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, v)) : 0);
const half = (v: number): number => Math.round(v * 2) / 2;
const ob = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const ID = /^[a-z0-9-]{1,24}$/;
export function sanitizeCb(raw: unknown): CbSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = ob(raw), o = freshCb();
  o.w = Math.round(nn(x.w, W_MAX)); o.ess = half(nn(x.ess, 1e5)); o.got = half(nn(x.got)); o.day = Math.round(nn(x.day, 1e6)); o.today = half(nn(x.today, ESS_DAY));
  o.spent = Math.round(nn(x.spent));
  o.clr = [...new Set((Array.isArray(x.clr) ? x.clr : []).filter((s): s is string => typeof s === 'string' && FIGHTS.some(f => f.id === s)))];
  const tp = ob(x.tip); if (x.tip && typeof tp.game === 'string' && ID.test(tp.game)) o.tip = { day: Math.round(nn(tp.day, 1e6)), game: tp.game };
  o.log = (Array.isArray(x.log) ? x.log : []).map(ob).filter(l => typeof l.id === 'string' && ID.test(l.id) && (l.r === 'w' || l.r === 'l' || l.r === 'q')).map((l): FightLog => ({
    d: Math.round(nn(l.d, 1e6)), id: l.id as string, w: Math.round(nn(l.w, 5)), need: Math.round(nn(l.need, 5)), r: l.r as FightLog['r'], n: Math.round(nn(l.n, 999)),
    acc: Math.round(nn(l.acc, 1) * 100) / 100, t1: Math.round(nn(l.t1, 3600)), sec: Math.round(nn(l.sec, 36000)), ...(l.again === 1 ? { again: 1 as const } : {}),
  })).slice(-LOG_MAX);
  o.fb = (Array.isArray(x.fb) ? x.fb : []).map(ob).filter(f => (f.at === 'fight' || f.at === 'forge') && typeof f.id === 'string' && ID.test(f.id)).map((f): Fb => ({
    d: Math.round(nn(f.d, 1e6)), at: f.at as Fb['at'], id: f.id as string, s: Math.max(1, Math.min(5, Math.round(nn(f.s, 5)))), t: typeof f.t === 'string' ? f.t.slice(0, 200) : '',
  })).slice(-FB_MAX);
  return o;
}
// Hai máy: bậc / tổng lấy lớn hơn; tinh hoa đang có lấy của máy có tổng nhận lớn hơn (không cộng trùng); nhật ký hợp theo (ngày, trận, giây).
export function mergeCb(a?: CbSave, b?: CbSave): CbSave | undefined {
  if (!a) return b; if (!b) return a;
  const main = a.got >= b.got ? a : b, key = (l: FightLog) => `${l.d}|${l.id}|${l.sec}|${l.r}`, fkey = (f: Fb) => `${f.d}|${f.id}|${f.s}|${f.t}`;
  const log = [...new Map([...a.log, ...b.log].map(l => [key(l), l])).values()].sort((p, q) => p.d - q.d).slice(-LOG_MAX);
  const fb = [...new Map([...a.fb, ...b.fb].map(f => [fkey(f), f])).values()].sort((p, q) => p.d - q.d).slice(-FB_MAX);
  return { w: Math.max(a.w, b.w), ess: main.ess, got: Math.max(a.got, b.got), day: main.day, today: main.today, spent: Math.max(a.spent, b.spent), clr: [...new Set([...a.clr, ...b.clr])], tip: main.tip, log, fb };
}

// ---------- Tinh hoa ----------
// Một câu trả lời của lò: đúng ở nút từ vựng → 1; câu mới gặp ×2; có gợi ý ×0,5; theo Thợ rèn gợi ý hôm nay ×1,25. Trần ESS_DAY / ngày.
export interface EssIn { node: string; ok: boolean; ctx?: string; hint?: boolean; nov: boolean; day: number }
export function essOf(x: EssIn, tip: CbSave['tip']): number {
  if (!x.ok || !x.node.startsWith('u:') || !x.ctx || !(x.ctx in ESS_GAMES)) return 0;
  let v = 1 * (x.nov ? 2 : 1) * (x.hint ? 0.5 : 1);
  if (tip && tip.day === x.day && tip.game === ESS_GAMES[x.ctx]) v *= 1.25;
  return v;
}
// Cộng tinh hoa (đổi ngày thì đặt lại phần trong ngày). Trả số đã cộng thật (sau trần).
export function addEss(s: CbSave, v: number, day: number): number {
  if (v <= 0) return 0;
  if (s.day !== day) { s.day = day; s.today = 0; }
  const add = half(Math.min(v, ESS_DAY - s.today));
  if (add <= 0) return 0;
  s.today = half(s.today + add); s.ess = half(s.ess + add); s.got = half(s.got + add);
  return add;
}

// ---------- Rèn và mặc ----------
// Bậc đang MẶC = min(bậc đã rèn, Từ vựng Lv): mọi đường khác (xu, thời gian, thời trang) không vượt được khoá chỉ số.
export const wornW = (s: Pick<CbSave, 'w'>, vocLv: number): number => Math.max(0, Math.min(s.w, Math.floor(vocLv), W_MAX));
export type ForgeCheck = { ok: true } | { ok: false; why: 'max' | 'ess' | 'coins'; lack: number };
export function canForge(s: CbSave, coins: number): ForgeCheck {
  if (s.w >= W_MAX) return { ok: false, why: 'max', lack: 0 };
  const c = W_COST[s.w + 1]!;
  if (s.ess < c.ess) return { ok: false, why: 'ess', lack: half(c.ess - s.ess) };
  if (coins < c.coins) return { ok: false, why: 'coins', lack: c.coins - coins };
  return { ok: true };
}
// Rèn được dù chỉ số chưa đủ (món chờ sẵn: "đã rèn, chưa mặc được"); bậc mặc vẫn khoá theo chỉ số.
export function forge(s: CbSave, coins: number): boolean {
  if (!canForge(s, coins).ok) return false;
  const c = W_COST[s.w + 1]!; s.ess = half(s.ess - c.ess); s.spent += c.coins; s.w++;
  return true;
}
export const vocNeed = (lv: number, LV_AT: number[]): number => LV_AT[Math.max(0, lv - 1)] ?? Infinity;   // số kỹ năng vững để đạt Lv

// ---------- Trận kế tiếp, thưởng ----------
export const nextFight = (s: CbSave): FightDef => FIGHTS.find(f => !s.clr.includes(f.id)) ?? FIGHTS.find(f => f.id === 'k1-boss')!;
export const unlocked = (s: CbSave, id: string): boolean => { const i = FIGHTS.findIndex(f => f.id === id); return i === 0 || (i > 0 && s.clr.includes(FIGHTS[i - 1]!.id)); };
export const reward = (s: CbSave, def: FightDef): number => def.coins + (s.clr.includes(def.id) ? 0 : def.first);
export function logFight(s: CbSave, l: FightLog): void { s.log.push(l); if (s.log.length > LOG_MAX) s.log.splice(0, s.log.length - LOG_MAX); }
export function addFb(s: CbSave, f: Fb): void { s.fb.push({ ...f, t: f.t.slice(0, 200), s: Math.max(1, Math.min(5, Math.round(f.s))) }); if (s.fb.length > FB_MAX) s.fb.splice(0, s.fb.length - FB_MAX); }

// ---------- Thợ rèn gợi ý (bản đầu: chỉ ô Vũ khí) ----------
export type Forge = 'garden' | 'wheel' | 'hunt';
export const FORGE_VI: Record<Forge, { ico: string; vi: string; start: string }> = {
  garden: { ico: '🌱', vi: 'Vườn từ', start: 'gdstart' }, wheel: { ico: '🎡', vi: 'Vòng Chữ', start: 'whstart' }, hunt: { ico: '⛏️', vi: 'Mỏ Chữ', start: 'hnstart' },
};
export interface TipIn { s: CbSave; vocLv: number; vocLeft: number; coins: number; garden: number; last: string; dirGame?: string }
export interface Tip { forge: Forge; why: string; ready: boolean }
// Lò chọn theo nhu cầu: cây đến ngày tưới → Vườn từ; chỉ số Từ vựng chưa đủ cho bậc kế → Vườn từ (từ mới thành kỹ năng vững);
// còn lại theo bộ não (nếu là một trong ba lò), không thì Vòng Chữ / Mỏ Chữ thay nhau theo lò vừa chơi.
export function tipOf(x: TipIn): Tip {
  const s = x.s, next = Math.min(W_MAX, s.w + 1), c = W_COST[next]!, boss = FIGHTS.find(f => f.id === 'k1-boss')!;
  const ready = canForge(s, x.coins).ok;
  const lack = Math.max(0, half(c.ess - s.ess));
  const goal = s.w >= W_MAX ? 'Vũ khí đã tới bậc cao nhất của khu 1' : `Vũ khí bậc ${next} còn thiếu ${lack} tinh hoa`;
  const tail = !s.clr.includes(boss.id) && wornW(s, x.vocLv) < boss.need ? ` ${boss.vi} cần Vũ khí bậc ${boss.need}.` : '';
  let forge: Forge;
  if (x.garden > 0) forge = 'garden';
  else if (s.w >= x.vocLv && x.vocLv < W_MAX) forge = 'garden';
  else if (x.dirGame === 'wheel' || x.dirGame === 'hunt' || x.dirGame === 'garden') forge = x.dirGame;
  else forge = x.last === 'wheel' ? 'hunt' : 'wheel';
  // Việc cần làm nói trước (sảnh chỉ hiện 2 dòng), bối cảnh boss nói sau.
  const why = ready ? `Đủ tinh hoa: rèn Vũ khí bậc ${next} ngay.${tail}`
    : forge === 'garden' && x.garden > 0 ? `Tưới ${x.garden} từ đến hạn: vừa có tinh hoa vừa nhớ lâu. ${goal}.${tail}`
    : forge === 'garden' ? `Học từ mới: còn ${x.vocLeft} kỹ năng từ vựng vững nữa mới mặc được Vũ khí bậc ${next}.${tail}`
    : `Tìm từ để lấy tinh hoa: ${goal.charAt(0).toLowerCase()}${goal.slice(1)}.${tail}`;
  return { forge, why, ready };
}

// ---------- Màn kết thua: chỉ thẳng ô cần rèn ----------
export interface LoseAdvice { gap: boolean; text: string; act: 'forge' | 'lo' | 'retry' }
export function loseAdvice(def: FightDef, worn: number, s: CbSave, coins: number, vocLv: number): LoseAdvice {
  if (worn < def.need) {
    const ready = canForge(s, coins).ok, made = s.w > worn;
    const text = made ? `Vũ khí đã rèn bậc ${s.w} nhưng mới mặc được bậc ${worn}: Từ vựng cần Lv ${s.w} (đang Lv ${vocLv}). ${def.vi} cần bậc ${def.need}.`
      : `Vũ khí của bạn bậc ${worn}, ${def.vi} cần bậc ${def.need}.`;
    return { gap: true, text, act: !made && ready ? 'forge' : 'lo' };
  }
  return { gap: false, text: 'Đồ đã đủ bậc: trận này do tay ngắm. Nhìn dấu ✕ của phát trước và cờ gió rồi chỉnh lực từng chút.', act: 'retry' };
}

// ---------- Số liệu trận (C1, C2, C15) ----------
export interface FightStats { n: number; win: number; quit: number; again: number; t1: number | null; bySide: Array<{ d: number; n: number; win: number }> }
export function fightStats(log: FightLog[]): FightStats {
  const done = log.filter(l => l.r !== 'q'), by = new Map<number, { n: number; win: number }>();
  for (const l of done) { const d = l.w - l.need, x = by.get(d) ?? { n: 0, win: 0 }; x.n++; if (l.r === 'w') x.win++; by.set(d, x); }
  const t1s = log.filter(l => l.n > 0).map(l => l.t1).sort((a, b) => a - b);
  return {
    n: log.length, win: log.filter(l => l.r === 'w').length, quit: log.filter(l => l.r === 'q').length, again: done.filter(l => l.again).length,
    t1: t1s.length ? t1s[Math.floor(t1s.length / 2)]! : null,
    bySide: [...by.entries()].sort((p, q) => p[0] - q[0]).map(([d, x]) => ({ d, ...x })),
  };
}
// Văn bản gửi cho nhà làm game (sao chép / chia sẻ): góp ý + số liệu trận, không có dữ liệu học.
export function fbText(s: CbSave, ver: string): string {
  const st = fightStats(s.log);
  const lines = [`Chiến Binh Chữ ${ver} · góp ý nhanh`, `Trận: ${st.n} (thắng ${st.win}, bỏ giữa ${st.quit}, chơi tiếp ${st.again}); giây tới phát đầu (trung vị): ${st.t1 ?? '—'}`,
    ...st.bySide.map(b => `  chênh bậc ${b.d >= 0 ? '+' : ''}${b.d}: ${b.win}/${b.n} thắng`), `Vũ khí bậc ${s.w}, tinh hoa đã nhận ${s.got}`, '',
    ...s.fb.slice(-40).map(f => `[ngày ${f.d}] ${f.at === 'fight' ? 'trận' : 'lò'} ${f.id}: ${'★'.repeat(f.s)}${'☆'.repeat(5 - f.s)} ${f.t}`)];
  return lines.join('\n');
}
