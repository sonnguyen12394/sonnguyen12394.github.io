// v134 Chiến Binh Chữ: nhân vật và thành tích của trận (port từ Chaos Orbit, sửa cho hợp luật "đồ quyết định ~70%").
// Nhân vật là lối chơi NGANG SỨC (sidegrade): ưu ở đâu thì nhược ở đó, không ai mạnh hơn tổng thể (test khoá dải tỉ lệ thắng).
// Mở nhân vật bằng việc làm trong trận (thành tích), không bằng xu, không mua được. Thành tích chỉ để khoe + mở nhân vật, không cộng lực.

export type CharId = 'orbiter' | 'berserker' | 'warden' | 'sprinter' | 'cryomancer' | 'revenant' | 'gambler';
export interface Best { t: number; kills: number; combo: number; boss: number; total: number; runs: number; evo: number; l2: number }
export interface CharDef {
  vi: string; ic: string; hp: number; speed: number; dmg: number; pickup: number; slot: number;
  crit?: number; lifesteal?: number; regen?: number; starts: string[];
  pro: string; con: string; req?: (b: Best) => boolean; reqTxt?: string;
}
export const CHARS: Record<CharId, CharDef> = {
  orbiter: { vi: 'Orbiter', ic: '🛡️', hp: 110, speed: 232, dmg: 1.05, pickup: 1, slot: 5, starts: [],
    pro: '+1 ô kỹ năng · chỉ số đều', con: 'Không có kỹ năng khởi đầu' },
  berserker: { vi: 'Cuồng Chiến', ic: '🔥', hp: 76, speed: 232, dmg: 0.86, pickup: 1, slot: 4, starts: ['heavy'],
    pro: 'Sẵn Lưỡi Nặng (đòn to)', con: 'Máu rất mỏng (−31%), sát thương nền −14%', req: b => b.total >= 300, reqTxt: 'Hạ tổng 300 quái' },
  warden: { vi: 'Hộ Vệ', ic: '🗿', hp: 140, speed: 205, dmg: 0.86, pickup: 1, slot: 4, regen: 1, starts: ['aura'],
    pro: 'Trâu · sẵn Gai Hộ Thân', con: 'Chậm · sát thương thấp (−14%)', req: b => b.l2 >= 1, reqTxt: 'Thắng Luyện tay 2' },
  sprinter: { vi: 'Gió Lốc', ic: '⚡', hp: 92, speed: 290, dmg: 0.98, pickup: 1.3, slot: 4, starts: ['bolt'],
    pro: 'Cực nhanh · hút XP rộng · sẵn Tên Sét', con: 'Máu mỏng (−16%)', req: b => b.boss >= 1, reqTxt: 'Hạ Tiếng Ồn Rè' },
  cryomancer: { vi: 'Băng Sư', ic: '❄️', hp: 108, speed: 228, dmg: 1.0, pickup: 1.1, slot: 4, starts: ['frost'],
    pro: 'Làm chậm quái · sẵn Lưỡi Băng', con: 'Không có kỹ năng gây sát thương thêm', req: b => b.total >= 1000, reqTxt: 'Hạ tổng 1000 quái' },
  revenant: { vi: 'Huyết Ảnh', ic: '🧛', hp: 100, speed: 226, dmg: 0.98, pickup: 1, slot: 4, lifesteal: 1.5, starts: [],
    pro: 'Hút máu bẩm sinh', con: 'Tốc độ, sát thương dưới trung bình', req: b => b.combo >= 50, reqTxt: 'Combo ×50' },
  gambler: { vi: 'Con Bạc', ic: '🎲', hp: 100, speed: 234, dmg: 0.95, pickup: 1, slot: 4, crit: 0.25, starts: ['split'],
    pro: 'Chí mạng rất cao · sẵn Phân Mảnh', con: 'Sát thương nền thấp (−5%)', req: b => b.boss >= 2, reqTxt: 'Hạ Tiếng Ồn Rè 2 lần' },
};
export const CHAR_IDS = Object.keys(CHARS) as CharId[];
export const isChar = (s: unknown): s is CharId => typeof s === 'string' && s in CHARS;
export const charOpen = (id: CharId, b: Best): boolean => { const c = CHARS[id]; return !c.req || c.req(b); };

export interface AchDef { id: string; ic: string; vi: string; d: string; chk: (b: Best) => boolean }
export const ACH: AchDef[] = [
  { id: 'run1', ic: '🎮', vi: 'Ra trận', d: 'Đánh xong 1 trận', chk: b => b.runs >= 1 },
  { id: 'surv2', ic: '⏱️', vi: 'Trụ vững', d: 'Sống 2 phút trong một trận', chk: b => b.t >= 120 },
  { id: 'combo50', ic: '💥', vi: 'Cuồng sát', d: 'Combo ×50', chk: b => b.combo >= 50 },
  { id: 'evo', ic: '🌟', vi: 'Tiến hoá', d: 'Tiến hoá một kỹ năng', chk: b => b.evo >= 1 },
  { id: 'k300', ic: '⚙️', vi: 'Máy xay', d: 'Hạ 300 quái trong một trận', chk: b => b.kills >= 300 },
  { id: 'boss', ic: '👑', vi: 'Dập tiếng rè', d: 'Hạ Tiếng Ồn Rè', chk: b => b.boss >= 1 },
];
export const freshBest = (): Best => ({ t: 0, kills: 0, combo: 0, boss: 0, total: 0, runs: 0, evo: 0, l2: 0 });
