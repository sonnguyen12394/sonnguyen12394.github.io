// v130 Bản đồ Phố Chữ toàn cảnh (GAME-CRITERIA §17): một thế giới 5 khu theo truyện (ACTS), mỗi game là một công trình (SPOTS) đặt ở
// đúng một khu. Gốc rễ được sửa: cùng một game mở từ ~8 lối vào rời nhau và ~10 thước đo song song (dàn trải, §10.3). Bản đồ là lối vào
// DUY NHẤT; tiến độ gom về một thứ thấy được: khu nào hồi sinh, sương tan tới đâu. Sương chỉ trang trí, KHÔNG khoá game (P13, P14).
// Thuần hàm, không thêm dữ liệu lưu: mọi thứ suy ra từ town() + cảnh truyện + lộ trình hôm nay của bộ não.

import { GAMES, type GameId } from './director.ts';
import { ACTS, ACT_BG } from './story.ts';
import { MAX_LV, DECO, type Building } from './town.ts';

// Kích thước thế giới (đơn vị bản đồ, không phải px): camera co giãn theo khung.
export const WORLD = { w: 1000, h: 1500 } as const;
export interface Rect { x: number; y: number; w: number; h: number }
// Khu 0 Quảng trường ở dưới (cửa vào), đường truyện đi lên theo hình chữ Z: Chợ Sáng → Bến Cảng → Rừng Trúc → Phố Đêm.
export const ZONES: Rect[] = [
  { x: 60, y: 1070, w: 880, h: 410 },
  { x: 20, y: 700, w: 460, h: 340 },
  { x: 520, y: 650, w: 460, h: 390 },
  { x: 20, y: 20, w: 460, h: 650 },
  { x: 520, y: 20, w: 460, h: 600 },
];
export const ZONE_VI = ['Quảng trường', ...ACTS.slice(1)] as const;

// Mốc không phải game: Đấu trường (thử thách cũ của app), Xưởng của Tí (Túi chữ, Lò rèn, Bản đồ phủ), Bảng tin (sự kiện tuần, trang trí, số liệu).
export type Landmark = 'arena' | 'bag' | 'notice' | 'story';
export type PlaceId = GameId | Landmark;
export const LANDMARKS: Record<Landmark, { ico: string; vi: string; hint: string }> = {
  arena: { ico: '🏟️', vi: 'Đấu trường', hint: 'Giải đấu tuần, luyện đề VSTEP, thách đấu bạn bè, trò nhanh cũ' },
  bag: { ico: '🎒', vi: 'Xưởng của Tí', hint: 'Túi chữ, Lò rèn năng lực, Bản đồ phủ cấp' },
  notice: { ico: '📋', vi: 'Bảng tin phố', hint: 'Trang trí phố bằng xu, số liệu chơi' },
  story: { ico: '📖', vi: 'Bạn & Tí', hint: 'Tí của bạn (tủ đồ), chương truyện đang mở và việc cư dân nhờ' },
};
// Thứ tự trong khu = thứ tự Tab (bàn phím, trình đọc màn hình) và thứ tự ở chế độ danh sách.
export const ZONE_OF: Array<PlaceId[]> = [
  ['wheel', 'hunt', 'fog', 'tower', 'puzzle', 'arena', 'bag', 'notice'],
  ['garden', 'cafe', 'talk', 'signs', 'letter'],
  ['port', 'shop', 'blocks', 'radio'],
  ['bubbles', 'ask', 'case', 'robot'],
  ['kara', 'cards', 'board'],
];
const HEAD = 64;   // chừa đầu khu cho tên khu

// Ô lưới trong khu, hàng lẻ lệch nhẹ cho đỡ thẳng hàng (vẫn không chồng nhau: lệch < nửa khoảng trống của ô).
export function layout(z: Rect, n: number): Array<[number, number]> {
  const cols = n <= 4 ? 2 : n <= 6 ? 3 : 4, rows = Math.ceil(n / cols), cw = z.w / cols, ch = (z.h - HEAD) / rows;
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), k = i % cols, inRow = Math.min(cols, n - r * cols), pad = (cols - inRow) * cw / 2;
    const dx = r % 2 ? cw * 0.1 : -cw * 0.06;
    return [Math.round(z.x + pad + cw * (k + 0.5) + (inRow < cols ? 0 : dx)), Math.round(z.y + HEAD + ch * (r + 0.5))];
  });
}

export interface WZone { act: number; vi: string; rect: Rect; c1: string; c2: string; fog: boolean; here: boolean; revived: boolean }
export interface WPlace {
  id: PlaceId; zone: number; x: number; y: number; ico: string; vi: string; hint: string;
  game: GameId | null; start: string | null;
  lv: number; v: number; next: number | null; unit: string;   // ★ của công trình (0–4) và mốc kế
  plan: number;      // vị trí trong lộ trình hôm nay (0–2), −1 = không có
  isNext: boolean;   // game bộ não chọn chơi tiếp
  played: boolean;   // đã chơi xong hôm nay
  fog: boolean;      // khu còn sương (chỉ trang trí)
  deco: string;      // đồ trang trí đã mua (Bảng tin → Trang trí phố)
  dot: boolean;      // v131 chấm đỏ: có việc làm được ngay (dots.ts)
}
export interface WorldIn { b: Building[]; act: number; done: boolean; plan: GameId[]; played: GameId[]; next: GameId | null; deco?: Partial<Record<GameId, number>>; dots?: PlaceId[] }
export interface World { zones: WZone[]; places: WPlace[]; stars: number; max: number; revived: number; route: Array<[number, number]>; here: [number, number] }

export function world(x: WorldIn): World {
  const act = Math.max(0, Math.min(ZONES.length - 1, x.act)), by = new Map(x.b.map(b => [b.game, b]));
  const zones: WZone[] = ZONES.map((rect, i) => {
    const [c1, c2] = ACT_BG[i]!;
    return { act: i, vi: ZONE_VI[i]!, rect, c1, c2, fog: !x.done && i > act, here: i === act, revived: x.done || i < act };
  });
  const places: WPlace[] = [];
  ZONE_OF.forEach((ids, zi) => {
    const list: PlaceId[] = zi === act ? [...ids, 'story'] : ids;   // ghim truyện nằm ở khu của chương đang mở
    layout(ZONES[zi]!, list.length).forEach(([px, py], k) => {
      const id = list[k]!, gm = id in GAMES ? (id as GameId) : null, b = gm ? by.get(gm) : undefined, lm = gm ? null : LANDMARKS[id as Landmark];
      places.push({
        id, zone: zi, x: px, y: py, ico: b?.ico ?? (gm ? GAMES[gm].ico : lm!.ico), vi: b?.vi ?? (gm ? GAMES[gm].vi : lm!.vi), hint: gm ? GAMES[gm].vi : lm!.hint,
        game: gm, start: gm ? GAMES[gm].start : null, lv: b?.lv ?? 0, v: b?.v ?? 0, next: b ? b.next : null, unit: b?.unit ?? '',
        plan: gm ? x.plan.indexOf(gm) : -1, isNext: !!gm && gm === x.next, played: !!gm && x.played.includes(gm), fog: zones[zi]!.fog, deco: gm ? DECO[gm].slice(0, x.deco?.[gm] ?? 0).join('') : '', dot: !!x.dots?.includes(id),
      });
    });
  });
  const at = (g: GameId) => places.find(p => p.game === g);
  const route = x.plan.map(at).filter((p): p is WPlace => !!p).map(p => [p.x, p.y] as [number, number]);
  const pin = places.find(p => p.id === 'story')!;
  return { zones, places, stars: x.b.reduce((a, b) => a + b.lv, 0), max: x.b.length * MAX_LV, revived: zones.filter(z => z.revived).length, route, here: [pin.x, pin.y] };
}

// Đường truyện nối tâm các khu theo thứ tự (SVG path, đơn vị bản đồ).
export function roadPath(): string {
  const c = ZONES.map(z => [z.x + z.w / 2, z.y + z.h / 2] as const);
  let d = `M${c[0]![0]} ${c[0]![1]}`;
  for (let i = 1; i < c.length; i++) { const [ax, ay] = c[i - 1]!, [bx, by] = c[i]!; d += ` C${ax} ${(ay + by) / 2} ${bx} ${(ay + by) / 2} ${bx} ${by}`; }
  return d;
}

// Camera: tâm (cx, cy) theo đơn vị bản đồ + độ phóng z. Kẹp để không kéo bản đồ ra khỏi khung (vw, vh: kích thước khung, px).
export interface Cam { cx: number; cy: number; z: number }
export const ZMIN = 0.35, ZMAX = 2.5;
export function clampCam(c: Cam, vw: number, vh: number): Cam {
  const fit = Math.min(vw / WORLD.w, vh / WORLD.h), z = Math.max(Math.max(ZMIN, Math.min(fit, 1)), Math.min(ZMAX, c.z || 1));
  const hw = vw / 2 / z, hh = vh / 2 / z;
  const cx = hw * 2 >= WORLD.w ? WORLD.w / 2 : Math.max(hw, Math.min(WORLD.w - hw, c.cx));
  const cy = hh * 2 >= WORLD.h ? WORLD.h / 2 : Math.max(hh, Math.min(WORLD.h - hh, c.cy));
  return { cx: Math.round(cx), cy: Math.round(cy), z: Math.round(z * 1000) / 1000 };
}
// translate + scale cho lớp thế giới: điểm (cx, cy) của bản đồ nằm giữa khung.
export const camCss = (c: Cam, vw: number, vh: number): string => `translate(${Math.round(vw / 2 - c.cx * c.z)}px,${Math.round(vh / 2 - c.cy * c.z)}px) scale(${c.z})`;
