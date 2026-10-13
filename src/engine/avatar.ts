// v132 Nhân vật của người chơi (GAME-CRITERIA §19, C1–C8): chibi ghép nhiều lớp SVG như nhân vật Gunny (tóc, mặt, mắt, áo, kính, cánh,
// vũ khí). Thuần hàm: nhận ngoại hình + bậc trang bị, trả chuỗi SVG. Tí thành thú cưng đi cạnh (mascot() của app, không vẽ lại).
//
// Luật "cường hoá" khác Gunny (§18.0): 7 ô trang bị, mỗi ô gắn một chỉ số THẬT (bag.ts statsOf). Cấp của món = Lv chỉ số,
// tự lên khi giỏi lên; không mua được, không bao giờ thất bại / mất đồ. Bậc hình: gỗ → đồng → bạc → vàng (hào quang) → kim cương (lấp lánh).
// Thời trang chỉ đổi hình, mua bằng xu kiếm trong game, đè lên hình của món có chỉ số (bật / tắt được).

import type { StatId, StatRow } from './bag.ts';

// ---------- 7 ô trang bị ----------
export type Slot = 'pen' | 'hat' | 'glass' | 'phones' | 'coat' | 'scarf' | 'wing';
export const SLOT: Record<Slot, { stat: StatId; vi: string; ico: string }> = {
  pen: { stat: 'use', vi: 'Bút', ico: '✏️' },
  hat: { stat: 'mem', vi: 'Mũ', ico: '🎓' },
  glass: { stat: 'voc', vi: 'Kính', ico: '👓' },
  phones: { stat: 'lis', vi: 'Tai nghe', ico: '🎧' },
  coat: { stat: 'gra', vi: 'Áo', ico: '🧥' },
  scarf: { stat: 'spk', vi: 'Khăn', ico: '🧣' },
  wing: { stat: 'pro', vi: 'Cánh', ico: '🪽' },
};
export const SLOTS = Object.keys(SLOT) as Slot[];
// Bày quanh nhân vật như màn trang bị của Gunny: 4 ô bên trái, 3 ô bên phải.
export const LEFT: Slot[] = ['hat', 'glass', 'phones', 'scarf'], RIGHT: Slot[] = ['pen', 'coat', 'wing'];
export const TIER_VI = ['Chưa có', 'Gỗ', 'Đồng', 'Bạc', 'Vàng', 'Kim cương'] as const;
const TIER_C = ['#9aa3ad', '#a8743f', '#c7783b', '#aeb9c6', '#f1b92f', '#5fd4f2'] as const;
const TIER_D = ['#6b7480', '#7a5129', '#8f5226', '#7d8a99', '#b98505', '#2299bb'] as const;   // màu viền / bóng đậm của cùng bậc
export const tierOf = (lv: number): number => (lv <= 0 ? 0 : Math.min(5, Math.ceil(Math.min(10, lv) / 2)));
export const itemVi = (s: Slot, lv: number): string => (lv <= 0 ? `${SLOT[s].vi} (chưa có)` : `${SLOT[s].vi} ${TIER_VI[tierOf(lv)]} +${Math.min(10, lv)}`);
export interface GearRow { slot: Slot; lv: number; tier: number; next: string }
export const gearOf = (rows: StatRow[]): GearRow[] => SLOTS.map(s => { const r = rows.find(x => x.id === SLOT[s].stat); const lv = r?.lv ?? 0; return { slot: s, lv, tier: tierOf(lv), next: r?.next ?? '' }; });
// Lực chữ (giống "lực chiến"): một con số tổng, suy ra từ chỉ số thật, không lưu. Cấp cao đáng giá hơn (lv² nhỏ).
export const power = (rows: StatRow[]): number => rows.reduce((a, r) => a + r.lv * 100 + r.lv * r.lv * 10, 0);

// ---------- Ngoại hình (tạo nhân vật) ----------
export const HAIRS = ['short', 'spiky', 'bob', 'long', 'bun', 'curly'] as const;
export const HAIR_VI = ['Ngắn', 'Dựng', 'Bob', 'Dài', 'Búi', 'Xoăn'];
export const HAIR_C = ['#2b1d16', '#5a3825', '#8a5a2b', '#d9a441', '#c0392b', '#3d5a99', '#7e57c2', '#e8e3da'];
export const SKIN_C = ['#ffe0c7', '#f7cfa8', '#e8b58a', '#c98f5f', '#8d5a3b'];
export const EYES = ['dot', 'round', 'happy', 'sparkle'] as const;
export const EYES_VI = ['Chấm', 'Tròn', 'Cười', 'Lấp lánh'];
export const MOUTHS = ['smile', 'open', 'cat'] as const;
export const MOUTH_VI = ['Mỉm', 'Cười to', 'Mèo'];
export interface Look { h: number; hc: number; sk: number; ey: number; mo: number }
export const LOOK_MAX: Record<keyof Look, number> = { h: HAIRS.length, hc: HAIR_C.length, sk: SKIN_C.length, ey: EYES.length, mo: MOUTHS.length };
export const randomLook = (seed: number): Look => { let x = (seed >>> 0) || 1; const r = (n: number) => { x = (x * 1103515245 + 12345) >>> 0; return (x >>> 8) % n; }; return { h: r(HAIRS.length), hc: r(HAIR_C.length), sk: r(SKIN_C.length), ey: r(EYES.length), mo: r(MOUTHS.length) }; };

// ---------- Thời trang (chỉ đổi hình) ----------
export type FSlot = 'hat' | 'coat' | 'wing' | 'glass' | 'fx';
export interface Fash { id: string; slot: FSlot; vi: string; ico: string; price: number }
export const FASH: Fash[] = [
  { id: 'f-non', slot: 'hat', vi: 'Nón lá', ico: '👒', price: 60 },
  { id: 'f-cap', slot: 'hat', vi: 'Mũ lưỡi trai', ico: '🧢', price: 40 },
  { id: 'f-crown', slot: 'hat', vi: 'Vương miện giấy', ico: '👑', price: 120 },
  { id: 'f-aodai', slot: 'coat', vi: 'Áo dài xanh', ico: '👘', price: 90 },
  { id: 'f-hoodie', slot: 'coat', vi: 'Hoodie cam', ico: '🧥', price: 50 },
  { id: 'f-suit', slot: 'coat', vi: 'Vest lịch lãm', ico: '🤵', price: 100 },
  { id: 'f-rain', slot: 'coat', vi: 'Áo mưa vàng', ico: '🦺', price: 40 },
  { id: 'f-angel', slot: 'wing', vi: 'Cánh thiên thần', ico: '🕊️', price: 150 },
  { id: 'f-butter', slot: 'wing', vi: 'Cánh bướm', ico: '🦋', price: 110 },
  { id: 'f-shades', slot: 'glass', vi: 'Kính râm', ico: '🕶️', price: 50 },
  { id: 'f-petal', slot: 'fx', vi: 'Hoa rơi', ico: '🌸', price: 80 },
  { id: 'f-note', slot: 'fx', vi: 'Nốt nhạc bay', ico: '🎵', price: 80 },
];
export const FSLOTS: FSlot[] = ['hat', 'coat', 'wing', 'glass', 'fx'];
export const FSLOT_VI: Record<FSlot, string> = { hat: 'Mũ', coat: 'Áo', wing: 'Cánh', glass: 'Kính', fx: 'Hiệu ứng' };
export const fashById = (id: string | undefined): Fash | undefined => FASH.find(f => f.id === id);

// ---------- Bản lưu (st.e.av) ----------
export interface AvSave {
  look: Look; made: boolean;                    // made: đã qua màn Tạo nhân vật (hoặc bỏ qua)
  fash: string[];                               // món thời trang đã mua
  wear: Partial<Record<FSlot, string>>;         // món thời trang đang mặc
  showF: boolean;                               // hiện thời trang (tắt = thấy đồ có chỉ số)
  spent: number;                                // xu đã tiêu ở tủ thời trang (ví chung trừ khoản này)
  seen: Partial<Record<Slot, number>>;          // bậc cao nhất đã xem của từng ô (ăn mừng lên bậc một lần)
}
export const freshAv = (seed = 1): AvSave => ({ look: randomLook(seed), made: false, fash: [], wear: {}, showF: true, spent: 0, seen: {} });
const nn = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
const ob = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
export function sanitizeAv(raw: unknown): AvSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = ob(raw), l = ob(x.look), out = freshAv();
  for (const k of Object.keys(LOOK_MAX) as Array<keyof Look>) out.look[k] = nn(l[k], LOOK_MAX[k] - 1);
  out.made = x.made === true; out.showF = x.showF !== false; out.spent = nn(x.spent, 1e7);
  out.fash = [...new Set((Array.isArray(x.fash) ? x.fash : []).filter((f): f is string => typeof f === 'string' && !!fashById(f)))];
  for (const [k, v] of Object.entries(ob(x.wear))) { const f = fashById(typeof v === 'string' ? v : ''); if (f && f.slot === k && out.fash.includes(f.id)) out.wear[k as FSlot] = f.id; }
  for (const [k, v] of Object.entries(ob(x.seen))) if (k in SLOT) { const t = nn(v, 5); if (t) out.seen[k as Slot] = t; }
  return out;
}
// Hai máy: giữ ngoại hình của máy đã tạo nhân vật (ưu tiên a), hợp đồ đã mua, xu đã tiêu lấy lớn hơn (như tw.spent).
export function mergeAv(a?: AvSave, b?: AvSave): AvSave | undefined {
  if (!a) return b; if (!b) return a;
  const main = a.made || !b.made ? a : b, fash = [...new Set([...a.fash, ...b.fash])], seen: AvSave['seen'] = {};
  for (const s of SLOTS) { const t = Math.max(a.seen[s] ?? 0, b.seen[s] ?? 0); if (t) seen[s] = t; }
  return { look: { ...main.look }, made: a.made || b.made, fash, wear: { ...main.wear }, showF: main.showF, spent: Math.max(a.spent, b.spent), seen };
}
export type Buy = { ok: true } | { ok: false; why: 'owned' | 'coins' | 'unknown' };
export function canBuy(av: AvSave, id: string, coins: number): Buy {
  const f = fashById(id);
  if (!f) return { ok: false, why: 'unknown' };
  if (av.fash.includes(id)) return { ok: false, why: 'owned' };
  return coins >= f.price ? { ok: true } : { ok: false, why: 'coins' };
}
export function buy(av: AvSave, id: string, coins: number): boolean {
  if (!canBuy(av, id, coins).ok) return false;
  av.fash.push(id); av.spent += fashById(id)!.price; av.wear[fashById(id)!.slot] = id;
  return true;
}
export function toggleWear(av: AvSave, id: string): 'on' | 'off' | null {
  const f = fashById(id); if (!f || !av.fash.includes(id)) return null;
  if (av.wear[f.slot] === id) { delete av.wear[f.slot]; return 'off'; }
  av.wear[f.slot] = id; return 'on';
}
// Ô nào vừa lên bậc mà người chơi chưa xem (chấm đỏ + ăn mừng một lần).
export const fresh = (av: AvSave, g: GearRow[]): Slot[] => g.filter(r => r.tier > (av.seen[r.slot] ?? 0)).map(r => r.slot);
export function markSeen(av: AvSave, g: GearRow[]): void { for (const r of g) if (r.tier > (av.seen[r.slot] ?? 0)) av.seen[r.slot] = r.tier; }

// ---------- Vẽ ----------
export interface AvOpt { size?: number; label?: string; cls?: string; wear?: Partial<Record<FSlot, string>>; showF?: boolean }
const LN = 'var(--av-ln,#3b2a20)';
const star4 = (x: number, y: number, r: number, c: string, cls = '') => `<path class="${cls}" d="M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z" fill="${c}"/>`;

function wing(t: number, f?: string): string {
  if (f === 'f-angel') return `<path d="M36 80C14 58 2 66 4 84C8 82 10 86 8 92C14 88 16 94 14 100C24 94 30 96 36 92Z" fill="#fff" stroke="#c9d6e3" stroke-width="1.5"/><path d="M64 80C86 58 98 66 96 84C92 82 90 86 92 92C86 88 84 94 86 100C76 94 70 96 64 92Z" fill="#fff" stroke="#c9d6e3" stroke-width="1.5"/>`;
  if (f === 'f-butter') return `<path d="M38 82C20 60 4 70 10 86C14 96 28 92 38 88Z" fill="#f78fb3"/><path d="M38 90C24 96 18 108 28 108C34 108 38 98 38 90Z" fill="#c56cf0"/><path d="M62 82C80 60 96 70 90 86C86 96 72 92 62 88Z" fill="#f78fb3"/><path d="M62 90C76 96 82 108 72 108C66 108 62 98 62 90Z" fill="#c56cf0"/><circle cx="18" cy="80" r="3" fill="#fff" opacity=".7"/><circle cx="82" cy="80" r="3" fill="#fff" opacity=".7"/>`;
  if (!t) return '';
  const c = TIER_C[t], d = TIER_D[t], s = 0.8 + t * 0.08;
  const half = (m: 1 | -1) => `<path transform="translate(50 86) scale(${m * s} ${s}) translate(-50 -86)" d="M36 80C18 66 6 70 6 86C12 84 14 88 12 94C18 92 20 96 20 102C28 96 32 96 36 92Z" fill="${c}" stroke="${d}" stroke-width="1.5"/>`;
  return half(1) + half(-1);
}
function hairBack(h: number, c: string): string {
  const k = HAIRS[h];
  if (k === 'long') return `<path d="M22 42C18 70 22 92 30 98L70 98C78 92 82 70 78 42Z" fill="${c}" stroke="${LN}" stroke-width="1.5"/>`;
  if (k === 'bob') return `<path d="M21 44C19 60 22 68 28 70L72 70C78 68 81 60 79 44Z" fill="${c}" stroke="${LN}" stroke-width="1.5"/>`;
  if (k === 'bun') return `<circle cx="50" cy="15" r="10" fill="${c}" stroke="${LN}" stroke-width="1.5"/>`;
  return '';
}
function body(t: number, f?: string): string {
  const shape = 'M34 72Q50 66 66 72L70 104Q50 108 30 104Z';
  if (f === 'f-aodai') return `<path d="M34 72Q50 66 66 72L72 118Q50 122 28 118Z" fill="#3fa7d6" stroke="${LN}" stroke-width="1.5"/><path d="M50 70L50 118" stroke="#f4d35e" stroke-width="2"/><path d="M42 71Q50 76 58 71" fill="none" stroke="#f4d35e" stroke-width="2"/>`;
  if (f === 'f-hoodie') return `<path d="${shape}" fill="#f4845f" stroke="${LN}" stroke-width="1.5"/><path d="M40 92H60V102H40Z" fill="#e0603a"/><path d="M46 72L45 86M54 72L55 86" stroke="#fff" stroke-width="1.5"/>`;
  if (f === 'f-suit') return `<path d="${shape}" fill="#2f3542" stroke="${LN}" stroke-width="1.5"/><path d="M43 70L50 88L57 70Z" fill="#fff"/><path d="M48 76L50 80L52 76L50 90Z" fill="#e84118"/>`;
  if (f === 'f-rain') return `<path d="M34 72Q50 66 66 72L72 108Q50 112 28 108Z" fill="#fbc531" stroke="${LN}" stroke-width="1.5"/><circle cx="50" cy="82" r="1.6" fill="${LN}"/><circle cx="50" cy="92" r="1.6" fill="${LN}"/>`;
  if (!t) return `<path d="${shape}" fill="#8fb3d9" stroke="${LN}" stroke-width="1.5"/>`;
  const c = TIER_C[t], d = TIER_D[t];
  return `<path d="${shape}" fill="${c}" stroke="${LN}" stroke-width="1.5"/><path d="M50 70V105" stroke="${d}" stroke-width="2"/>${t >= 2 ? `<path d="M33 98Q50 102 67 98" fill="none" stroke="${d}" stroke-width="2.5"/>` : ''}${t >= 3 ? `<circle cx="50" cy="80" r="2" fill="${d}"/><circle cx="50" cy="90" r="2" fill="${d}"/>` : ''}${t >= 4 ? `<path d="M36 74Q42 80 44 72M64 74Q58 80 56 72" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/>` : ''}${t >= 5 ? star4(50, 85, 4, '#fff') : ''}`;
}
function scarf(t: number): string {
  if (!t) return '';
  const c = TIER_C[t], d = TIER_D[t];
  return `<path d="M36 70Q50 78 64 70L65 76Q50 84 35 76Z" fill="${c}" stroke="${d}" stroke-width="1.2"/><path d="M56 76L62 94L56 95L52 78Z" fill="${c}" stroke="${d}" stroke-width="1.2"/>${t >= 3 ? `<path d="M58 88L61 92" stroke="${d}" stroke-width="1.5"/>` : ''}`;
}
function face(sk: string, ey: number, mo: number): string {
  const e = EYES[ey], m = MOUTHS[mo], dark = '#2b1d16';
  const eye = (x: number) => e === 'dot' ? `<circle cx="${x}" cy="50" r="3.3" fill="${dark}"/><circle cx="${x + 1.1}" cy="48.8" r="1.1" fill="#fff"/>`
    : e === 'round' ? `<ellipse cx="${x}" cy="50" rx="4.2" ry="5.2" fill="${dark}"/><circle cx="${x + 1.4}" cy="48" r="1.6" fill="#fff"/>`
    : e === 'happy' ? `<path d="M${x - 4} 51Q${x} 45 ${x + 4} 51" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`
    : `<ellipse cx="${x}" cy="50" rx="4.4" ry="5.4" fill="#3b2f6b"/><circle cx="${x + 1.5}" cy="47.8" r="1.8" fill="#fff"/><circle cx="${x - 1.4}" cy="52.4" r="0.9" fill="#fff"/>`;
  const mouth = m === 'smile' ? `<path d="M45 60Q50 64 55 60" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>`
    : m === 'open' ? `<path d="M44.5 59Q50 68 55.5 59Z" fill="#c0392b" stroke="${dark}" stroke-width="1.2"/><path d="M47 62.5Q50 65 53 62.5" fill="#ff8fa3"/>`
    : `<path d="M44 59Q47 62.5 50 59Q53 62.5 56 59" fill="none" stroke="${dark}" stroke-width="1.8" stroke-linecap="round"/>`;
  return `<circle cx="24" cy="48" r="5" fill="${sk}" stroke="${LN}" stroke-width="1.5"/><circle cx="76" cy="48" r="5" fill="${sk}" stroke="${LN}" stroke-width="1.5"/>
    <circle cx="50" cy="45" r="27" fill="${sk}" stroke="${LN}" stroke-width="1.5"/>
    <g class="av-eye">${eye(40)}${eye(60)}</g><ellipse cx="34" cy="57" rx="4" ry="2" fill="#ff8fa3" opacity=".55"/><ellipse cx="66" cy="57" rx="4" ry="2" fill="#ff8fa3" opacity=".55"/>${mouth}`;
}
function hairFront(h: number, c: string): string {
  const k = HAIRS[h], st = `fill="${c}" stroke="${LN}" stroke-width="1.5" stroke-linejoin="round"`;
  const cap = `<path d="M23 44Q21 17 50 16Q79 17 77 44Q72 31 50 30Q28 31 23 44Z" ${st}/>`;
  const fringe = `<path d="M26 38Q34 44 42 34Q49 41 57 33Q66 43 74 37Q72 26 50 25Q28 26 26 38Z" ${st}/>`;
  if (k === 'spiky') return `<path d="M22 42L25 22L32 28L36 12L44 23L51 8L57 22L66 12L68 27L76 21L78 42Q67 29 50 29Q33 29 22 42Z" ${st}/>`;
  if (k === 'bob') return `${cap}${fringe}<path d="M23 40Q19 58 27 66L31 46Z" ${st}/><path d="M77 40Q81 58 73 66L69 46Z" ${st}/>`;
  if (k === 'long') return `${cap}${fringe}<path d="M23 40Q18 64 24 84L30 48Z" ${st}/><path d="M77 40Q82 64 76 84L70 48Z" ${st}/>`;
  if (k === 'curly') return [[26, 34], [32, 24], [41, 19], [50, 17], [59, 19], [68, 24], [74, 34], [36, 31], [50, 27], [64, 31]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" ${st}/>`).join('');
  if (k === 'bun') return `${cap}<path d="M28 36Q40 40 50 30Q60 40 72 36Q70 26 50 25Q30 26 28 36Z" ${st}/>`;
  return `${cap}<path d="M27 36Q38 40 46 31Q50 36 55 31Q64 40 73 36Q71 25 50 24Q29 25 27 36Z" ${st}/>`;
}
function hat(t: number, f?: string): string {
  if (f === 'f-non') return `<path d="M14 34L50 4L86 34Q50 40 14 34Z" fill="#f3d9a4" stroke="#b08d57" stroke-width="1.5"/><path d="M32 19L68 19M24 26L76 26" stroke="#d7b981" stroke-width="1.2"/>`;
  if (f === 'f-cap') return `<path d="M24 32Q24 12 50 12Q76 12 76 32Z" fill="#e84118" stroke="${LN}" stroke-width="1.5"/><path d="M50 32Q72 30 90 36Q72 40 50 36Z" fill="#c23616" stroke="${LN}" stroke-width="1.5"/><circle cx="50" cy="13" r="2.5" fill="#c23616"/>`;
  if (f === 'f-crown') return `<path d="M28 30L30 10L40 20L50 6L60 20L70 10L72 30Z" fill="#fbc531" stroke="#c9a227" stroke-width="1.5"/><circle cx="50" cy="22" r="3" fill="#e84118"/><circle cx="38" cy="25" r="2" fill="#00a8ff"/><circle cx="62" cy="25" r="2" fill="#4cd137"/>`;
  if (!t) return '';
  const c = TIER_C[t], d = TIER_D[t];
  if (t <= 2) return `<path d="M24 34Q25 12 50 11Q75 12 76 34Q50 27 24 34Z" fill="${c}" stroke="${d}" stroke-width="1.5"/><path d="M24 34Q50 27 76 34L76 37Q50 31 24 37Z" fill="${d}"/><circle cx="50" cy="10" r="4.5" fill="${d}"/>`;
  return `<path d="M30 30Q30 20 50 20Q70 20 70 30Z" fill="${d}" stroke="${LN}" stroke-width="1.2"/><path d="M50 6L84 18L50 30L16 18Z" fill="${c}" stroke="${d}" stroke-width="1.5"/><path d="M50 18L80 20L80 34" fill="none" stroke="${t >= 4 ? '#fff' : d}" stroke-width="1.6"/><circle cx="80" cy="35" r="2.6" fill="${t >= 4 ? '#fff' : d}"/>${t >= 5 ? star4(50, 18, 4, '#fff') : ''}`;
}
function phones(t: number): string {
  if (!t) return '';
  const c = TIER_C[t], d = TIER_D[t];
  return `<path d="M20 46Q19 10 50 10Q81 10 80 46" fill="none" stroke="${d}" stroke-width="4.5" stroke-linecap="round"/><path d="M20 46Q19 10 50 10Q81 10 80 46" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="14" y="38" width="10" height="17" rx="4" fill="${c}" stroke="${d}" stroke-width="1.5"/><rect x="76" y="38" width="10" height="17" rx="4" fill="${c}" stroke="${d}" stroke-width="1.5"/>${t >= 4 ? '<circle cx="19" cy="46.5" r="2" fill="#fff"/><circle cx="81" cy="46.5" r="2" fill="#fff"/>' : ''}`;
}
function glass(t: number, f?: string): string {
  if (f === 'f-shades') return `<path d="M32 46H48V53Q40 58 32 53Z" fill="#1e272e" stroke="${LN}" stroke-width="1.2"/><path d="M52 46H68V53Q60 58 52 53Z" fill="#1e272e" stroke="${LN}" stroke-width="1.2"/><path d="M48 48H52M26 47H32M68 47H74" stroke="#1e272e" stroke-width="1.8"/><path d="M35 48L39 48" stroke="#fff" stroke-width="1.2" opacity=".7"/>`;
  if (!t) return '';
  const d = TIER_D[t], c = TIER_C[t], tint = t >= 4 ? `fill="${c}" fill-opacity=".22"` : 'fill="none"';
  return `<circle cx="40" cy="50" r="7.5" ${tint} stroke="${d}" stroke-width="2"/><circle cx="60" cy="50" r="7.5" ${tint} stroke="${d}" stroke-width="2"/><path d="M47.5 50Q50 48 52.5 50M32.5 49L25 47M67.5 49L75 47" fill="none" stroke="${d}" stroke-width="1.8"/>`;
}
function pen(t: number): string {
  if (!t) return '';
  const c = TIER_C[t], d = TIER_D[t];
  return `<g transform="rotate(-28 74 94)"><rect x="71" y="62" width="7" height="34" rx="1.5" fill="${c}" stroke="${d}" stroke-width="1.2"/><rect x="71" y="58" width="7" height="6" rx="1.5" fill="#ff8fa3" stroke="${d}" stroke-width="1"/><path d="M71 96L74.5 106L78 96Z" fill="#f5d7a1" stroke="${d}" stroke-width="1"/><path d="M73.3 101.5L74.5 106L75.7 101.5Z" fill="#2b1d16"/>${t >= 4 ? star4(74.5, 75, 3.2, '#fff') : ''}</g>`;
}
function fx(f: string | undefined, front: boolean): string {
  if (f === 'f-petal') return front ? [[16, 30], [86, 46], [12, 92], [88, 104], [30, 10]].map(([x, y], i) => `<ellipse class="av-fx" style="--d:${i * 0.6}s" cx="${x}" cy="${y}" rx="3.2" ry="2" fill="#ff9ff3" transform="rotate(${i * 40} ${x} ${y})"/>`).join('') : '';
  if (f === 'f-note') return front ? [[14, 36, '♪'], [86, 30, '♫'], [10, 96, '♫'], [90, 92, '♪']].map(([x, y, n], i) => `<text class="av-fx" style="--d:${i * 0.7}s" x="${x}" y="${y}" font-size="11" fill="#7e57c2" text-anchor="middle">${n}</text>`).join('') : '';
  return '';
}

// Bậc cao nhất của các ô (hào quang: vàng trở lên; lấp lánh: kim cương).
export function avatar(look: Look, gear: Partial<Record<Slot, number>>, o: AvOpt = {}): string {
  const t = (s: Slot) => gear[s] ?? 0, w = o.showF === false ? {} : o.wear ?? {}, top = Math.max(0, ...SLOTS.map(t));
  const hc = HAIR_C[look.hc] ?? HAIR_C[0]!, sk = SKIN_C[look.sk] ?? SKIN_C[0]!, size = o.size ?? 120;
  const L = (id: string, html: string) => (html ? `<g data-l="${id}">${html}</g>` : '');
  const aura = top >= 4 ? `<circle class="av-aura" cx="50" cy="72" r="48" fill="${TIER_C[top]}" opacity=".2"/>` : '';
  const spark = top >= 5 ? [[14, 20], [88, 60], [18, 110]].map(([x, y], i) => `<g class="av-spk" style="--d:${i * 0.5}s">${star4(x!, y!, 4, '#fff')}</g>`).join('') : '';
  const art = [
    L('aura', aura),
    L('wing', wing(t('wing'), w.wing)),
    L('hairb', hairBack(look.h, hc)),
    L('legs', `<rect x="38" y="102" width="9" height="16" rx="3" fill="#4a4e69"/><rect x="53" y="102" width="9" height="16" rx="3" fill="#4a4e69"/><ellipse cx="42" cy="120" rx="7.5" ry="4" fill="#2d2a32"/><ellipse cx="58" cy="120" rx="7.5" ry="4" fill="#2d2a32"/>`),
    L('coat', body(t('coat'), w.coat)),
    L('arms', `<circle cx="28" cy="95" r="4.6" fill="${sk}" stroke="${LN}" stroke-width="1.3"/><circle cx="73" cy="95" r="4.6" fill="${sk}" stroke="${LN}" stroke-width="1.3"/>`),
    L('scarf', scarf(t('scarf'))),
    L('face', face(sk, look.ey, look.mo)),
    L('hair', hairFront(look.h, hc)),
    L('hat', hat(t('hat'), w.hat)),
    L('phones', phones(t('phones'))),
    L('glass', glass(t('glass'), w.glass)),
    L('pen', pen(t('pen'))),
    L('fx', fx(w.fx, true) + spark),
  ].join('');
  const lab = o.label ? `role="img" aria-label="${o.label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg class="av${o.cls ? ` ${o.cls}` : ''}${top >= 4 ? ' glow' : ''}" viewBox="0 0 100 126" width="${Math.round(size * 0.8)}" height="${size}" ${lab} focusable="false"><g class="av-body">${art}</g></svg>`;
}
// Bậc từng ô từ chỉ số thật.
export const tiers = (g: GearRow[]): Partial<Record<Slot, number>> => Object.fromEntries(g.map(r => [r.slot, r.tier]));
