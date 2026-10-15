// v134 Chiến Binh Chữ: trận kiểu Chaos Orbit (thay trận ngắm bắn Gunny v133; người sáng lập chốt 15/10/2026, docs/SPEC.md).
// Lối chơi port từ repo chaos-orbit-prototype: di chuyển để né, vũ khí quỹ đạo tự chém, lên cấp chọn 1 trong 3, combo, tiến hoá,
// Dash, Tuyệt kỹ (Overdrive), Elite rơi rương, boss. Game thuần: KHÔNG có câu tiếng Anh, KHÔNG ghi bằng chứng (P13).
// Đồ (Vũ khí bậc w) nhân sát thương ×1,32^w; quái khu nhân máu theo bậc cần của trận → đồ quyết định phần lớn, tay né + chọn nâng cấp
// phần còn lại (C2, khoá bằng mô phỏng bot ở test/unit/engine-fight.test.ts và tools/sim/fight.ts).
// Thuần hàm, tất định: cùng hạt giống + cùng chuỗi điều khiển = cùng kết quả (bước cố định DT). fightview.ts chỉ vẽ.

import { CHARS, type CharId } from './fightmeta.ts';

// ---------- Hằng số ----------
export const DT = 1 / 30;
export const TIER_MUL = 1.32, GIAP_MUL = 0.97;
export const GAP_POW = 2.5;              // chênh bậc so với bậc cần: sát thương ×1,32^(GAP_POW × chênh) (thiếu 2 bậc ≈ ×0,25)
export const SPAWN_R = 470;            // quái sinh ở vòng ngoài tầm nhìn (đơn vị thế giới)
const TAU = Math.PI * 2;

// Bảng số (từ TUNE_DEF của Chaos, chỉnh lại cho trận 1,5–3 phút). Đổi được lúc chạy (bảng tinh chỉnh ?dev); mô phỏng dùng giá trị gốc.
export const T_DEF = {
  en_normal_hp: 16, en_normal_dmg: 6, en_normal_spd: 62, en_normal_xp: 4,
  en_fast_hp: 9, en_fast_dmg: 5, en_fast_spd: 120, en_fast_xp: 4,
  en_tank_hp: 62, en_tank_dmg: 12, en_tank_spd: 40, en_tank_xp: 14,
  en_swarm_hp: 5, en_swarm_dmg: 3, en_swarm_spd: 80, en_swarm_xp: 2,
  sc_hpProg: 2.2, sc_hpTime: 0.0038, sc_dmgProg: 0.6, sc_spdProg: 0.35,
  el_hp: 90, el_dmg: 15, el_every: 30,
  bo_dmg: 20, bo_shock: 15, bo_shockR: 260, bo_minCount: 3, bo_minEvery: 3.4, bo_shockEvery: 5.5,
  sp_start: 6, sp_max: 150, sp_r0: 3.2, sp_r1: 4.8, sp_r2: 7, sp_r3: 10, sp_r4: 13, sp_r5: 16,
  pl_pickup: 100, pl_crit: 0.15, pl_iframe: 0.7,
  wp_dmg: 12, wp_radius: 78, wp_spin: 2.2, wp_hitcd: 0.28,
  up_radius: 1.22, up_spin: 1.3, up_dmg: 1.25, up_crit: 0.08, up_heavyDmg: 1.9, up_heavySpin: 0.75,
  up_speed: 1.14, up_magnet: 1.28, up_maxhp: 25, up_ls: 1.5, up_lsCap: 0.05, up_regen: 1,
  sk_fire: 0.15, sk_chain: 0.6, sk_chainChance: 0.5, sk_split: 0.5, sk_splitChance: 0.3,
  sk_frostSlow: 0.18, sk_frostDur: 1.5, sk_bolt: 1.1, sk_boltRate: 0.95, sk_nova: 1.3, sk_novaEvery: 3.6,
  sk_aura: 0.35, sk_auraEvery: 0.22, sk_solar: 0.5, sk_solarEvery: 0.2, sk_storm: 0.8, sk_stormEvery: 0.7,
  sk_glacier: 0.3, sk_glacierSlow: 0.35,
  ac_dashCd: 2.8, ac_dashIframe: 0.36, ac_dashSpeed: 900, ac_ultKill: 0.0045, ac_ultElite: 0.07,
  ac_ultBase: 24, ac_ultLv: 4, ac_ovDmg: 1.4, ac_ovDur: 3.5,
  xp_start: 5, xp_curve: 1.33, xp_add: 4, cb_10: 0.05, cb_25: 0.12, cb_50: 0.18, cb_100: 0.3, cb_window: 3,
};
export type Tune = typeof T_DEF;
export const T: Tune = { ...T_DEF };
export const resetTune = (): void => { Object.assign(T, T_DEF); };

// ---------- Ngẫu nhiên có hạt giống (mulberry32) ----------
export function rnd(s: { r: number }): number {
  s.r = (s.r + 0x6d2b79f5) >>> 0; let t = s.r;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rr = (s: { r: number }, a: number, b: number): number => a + rnd(s) * (b - a);

// ---------- Định nghĩa trận ----------
export interface FightDef {
  id: string; vi: string; sub: string; zone: number;
  need: number;                    // bậc Vũ khí cần (bậc đồ "đúng tầm"): máu / sát thương quái nhân TIER_MUL^need
  dur: number;                     // giây: trận luyện tay = sống đủ dur; trận boss = boss ra lúc dur
  boss?: { vi: string; hp: number; lim: number };   // lim: giây để hạ boss sau khi nó ra (quá = thua 'time')
  rate: number;                    // hệ số nhịp sinh quái
  elite: boolean;
  coins: number; first: number;    // xu rơi khi thắng; thưởng thêm lần thắng đầu
  tip: string;                     // một dòng cơ chế (hiện ở màn mở trận)
}
// Khu 1 (A1): hai trận luyện tay + boss Tiếng Ồn Rè. Số liệu chỉnh bằng mô phỏng (tools/sim/fight.ts, test khoá dải).
export const FIGHTS: FightDef[] = [
  { id: 'k1-l1', vi: 'Luyện tay 1', sub: 'Sống sót 75 giây', zone: 1, need: 0, dur: 75, rate: 0.7, elite: false, coins: 15, first: 15,
    tip: 'Kéo (hoặc phím mũi tên / WASD) để chạy. Lưỡi kiếm tự quay và chém quái chạm vào nó; đừng để quái chạm vào người.' },
  { id: 'k1-l2', vi: 'Luyện tay 2', sub: 'Sống sót 90 giây, có Elite', zone: 1, need: 0, dur: 90, rate: 0.72, elite: true, coins: 20, first: 20,
    tip: 'Elite (viền hồng) rơi rương: chọn thêm một nâng cấp. Bấm DASH để lướt qua bầy quái, không mất máu.' },
  { id: 'k1-boss', vi: 'Tiếng Ồn Rè', sub: 'Boss khu 1 · cần Vũ khí bậc 2', zone: 1, need: 2, dur: 70, rate: 1, elite: true,
    boss: { vi: 'Tiếng Ồn Rè', hp: 1650, lim: 75 }, coins: 60, first: 60,
    tip: 'Rè ra ở giây 70. Phải hạ nó trong 75 giây. Sóng rè đỏ lan ra từ thân nó: chạy xa hoặc DASH. Khiên (Nghe) giảm sóng rè.' },
];
export const fightById = (id: string): FightDef | undefined => FIGHTS.find(f => f.id === id);

// ---------- Trạng thái ----------
export interface Gear { w: number; giap: number; khien: number; giay?: number; bua?: number }   // bậc đang mặc
export type EType = 'normal' | 'fast' | 'tank' | 'swarm' | 'boss';
export interface Enemy {
  type: EType; x: number; y: number; r: number; hp: number; max: number; spd: number; dmg: number; xp: number; gc: number; kb: number;
  boss: boolean; elite: boolean; slow: number; slowT: number; burn: number; burnT: number; hcd: number; dead: boolean; flash: number;
  mcd: number; scd: number; pulse: number;
}
export interface Weapon {
  count: number; radius: number; spin: number; damage: number; angle: number; heavy: boolean; hitPad: number;
  fire: number; chain: number; split: number; frost: number; aura: number; bolt: number; nova: number;
  solar: boolean; storm: boolean; prism: boolean; glacier: boolean;
  boltCd: number; novaCd: number; stormCd: number; solarCd: number; auraCd: number; glacierCd: number;
}
export interface Player {
  x: number; y: number; px: number; py: number; r: number; speed: number; hp: number; maxHp: number; iframe: number;
  level: number; xp: number; xpNext: number; pickup: number; dmgMult: number; crit: number; lifesteal: number; regen: number;
  faceX: number; faceY: number; dashT: number; dashDX: number; dashDY: number; dashCd: number; dashMax: number; ult: number; ultMul: number; ovT: number;
  lsPend: number; lsLv: number; regenLv: number; critLv: number;
}
export interface Orb { x: number; y: number; v: number; pull: boolean; got?: boolean }
export interface Shot { x: number; y: number; vx: number; vy: number; dmg: number; pierce: number; r: number; life: number; shard: boolean; hit: Set<Enemy> }
export interface Nova { x: number; y: number; rad: number; maxRad: number; dmg: number; hit: Set<Enemy>; big: boolean }
export interface Ring { x: number; y: number; rad: number; life: number }
// Sự kiện cho màn vẽ (số sát thương, nổ, âm). Mô phỏng tắt (ev = null) cho nhanh.
export type Fx =
  | { k: 'hit'; x: number; y: number; v: number; crit: boolean } | { k: 'kill'; x: number; y: number; c: string; n: number }
  | { k: 'zap'; ax: number; ay: number; bx: number; by: number } | { k: 'hurt' } | { k: 'boss' } | { k: 'elite' } | { k: 'shock' }
  | { k: 'nova' } | { k: 'dash' } | { k: 'ult' } | { k: 'gold' } | { k: 'chest' } | { k: 'xp'; c: number } | { k: 'combo'; n: number };
export interface PickState { chest: boolean; opts: string[] }
export interface Fight {
  def: FightDef; seed: number; rng: { r: number }; gear: Gear; ch: CharId; lvl: number;
  t: number; p: Player; w: Weapon;
  en: Enemy[]; orbs: Orb[]; golds: Orb[]; chests: Orb[]; shots: Shot[]; novas: Nova[]; rings: Ring[];
  kills: number; gold: number; combo: { n: number; timer: number; best: number };
  spawnAcc: number; eliteCd: number; boss: Enemy | null; bossAt: number;
  pick: PickState | null; lvq: number; pendEvo: string[]; taken: Set<string>; slotCap: number; evos: number;
  over: 'win' | 'lose' | null; why: '' | 'dead' | 'time';
  dealt: number; taken_: number;
  ev: Fx[] | null;
}

// ---------- Kẻ thù ----------
const ESHAPE: Record<Exclude<EType, 'boss'>, { r: number; c: string; kb: number; gc: number }> = {
  normal: { r: 13, c: '#9fb3c8', kb: 1, gc: 0.1 }, fast: { r: 11, c: '#ffd447', kb: 1.1, gc: 0.1 },
  tank: { r: 19, c: '#b06bff', kb: 0.35, gc: 0.3 }, swarm: { r: 8, c: '#ff8fa8', kb: 1.2, gc: 0.05 },
};
export const colorOf = (e: Enemy): string => (e.boss ? '#a98be0' : e.elite ? '#ff6ad5' : ESHAPE[e.type as Exclude<EType, 'boss'>].c);
const prog = (f: Fight): number => Math.max(0, Math.min(1.2, f.t / f.def.dur));
const hpScale = (f: Fight): number => (1 + prog(f) * T.sc_hpProg + f.t * T.sc_hpTime) * f.lvl;
const st = (type: Exclude<EType, 'boss'>, k: 'hp' | 'dmg' | 'spd' | 'xp'): number => T[`en_${type}_${k}` as keyof Tune];
function spawn(f: Fight, type: Exclude<EType, 'boss'>, at?: { x: number; y: number }): Enemy {
  const s = ESHAPE[type], a = rnd(f.rng) * TAU, d = SPAWN_R + rr(f.rng, 0, 100);
  const hp = st(type, 'hp') * hpScale(f), pr = prog(f);
  const e: Enemy = {
    type, x: at ? at.x : f.p.x + Math.cos(a) * d, y: at ? at.y : f.p.y + Math.sin(a) * d, r: s.r, hp, max: hp,
    spd: st(type, 'spd') * (1 + pr * T.sc_spdProg), dmg: st(type, 'dmg') * (1 + pr * T.sc_dmgProg), xp: st(type, 'xp'), gc: s.gc, kb: s.kb,
    boss: false, elite: false, slow: 1, slowT: 0, burn: 0, burnT: 0, hcd: 0, dead: false, flash: 0, mcd: 0, scd: 0, pulse: 0,
  };
  f.en.push(e); return e;
}
function spawnElite(f: Fight): void {
  const e = spawn(f, 'tank'); e.r = 26; e.elite = true; e.kb = 0.2; e.hp = e.max = T.el_hp * hpScale(f); e.dmg = T.el_dmg;
  f.ev?.push({ k: 'elite' });
}
function spawnBoss(f: Fight): void {
  const b = f.def.boss!, a = rnd(f.rng) * TAU, d = SPAWN_R + 60, hp = Math.round(b.hp * f.lvl);
  const e: Enemy = {
    type: 'boss', x: f.p.x + Math.cos(a) * d, y: f.p.y + Math.sin(a) * d, r: 52, hp, max: hp, spd: 34, dmg: T.bo_dmg * Math.sqrt(f.lvl), xp: 0, gc: 0, kb: 0.05,
    boss: true, elite: false, slow: 1, slowT: 0, burn: 0, burnT: 0, hcd: 0, dead: false, flash: 0, mcd: T.bo_minEvery, scd: 5, pulse: 0,
  };
  f.en.push(e); f.boss = e; f.bossAt = f.t; f.ev?.push({ k: 'boss' });
}
const spawnRate = (f: Fight): number => { const p = prog(f); return f.def.rate * (p < 0.1 ? T.sp_r0 : p < 0.3 ? T.sp_r1 : p < 0.5 ? T.sp_r2 : p < 0.7 ? T.sp_r3 : p < 0.9 ? T.sp_r4 : T.sp_r5); };
function rollType(f: Fight): Exclude<EType, 'boss'> {
  const p = prog(f);
  const pool: Array<Exclude<EType, 'boss'>> = p < 0.1 ? ['normal', 'normal', 'normal', 'swarm'] : p < 0.3 ? ['normal', 'normal', 'fast', 'fast', 'swarm']
    : p < 0.5 ? ['normal', 'fast', 'fast', 'tank', 'swarm', 'swarm'] : ['normal', 'fast', 'tank', 'tank', 'swarm', 'swarm', 'swarm', 'fast'];
  return pool[Math.floor(rnd(f.rng) * pool.length)]!;
}

// ---------- Nâng cấp (1 trong 3) ----------
export interface UpDef { id: string; ic: string; acc: string; tag: string; vi: string; ds: string; max?: number; lv?: (f: Fight) => number; apply: (f: Fight) => void }
const evoOf = (b: string): string => ({ fire: 'solar', chain: 'storm', split: 'prism', frost: 'glacier' } as Record<string, string>)[b]!;
function queueEvo(f: Fight, b: string): void { const w = f.w as unknown as Record<string, number | boolean>; if ((w[b] as number) >= 3 && !w[evoOf(b)] && !f.pendEvo.includes(b)) f.pendEvo.push(b); }
const heavy = (f: Fight): void => { const w = f.w; if (w.heavy) return; w.damage *= T.up_heavyDmg; w.spin *= T.up_heavySpin; w.heavy = true; w.hitPad += 6; };
export const UP: UpDef[] = [
  { id: 'blade', ic: '⚔️', acc: '#33e1ff', tag: 'Quỹ đạo', vi: '+1 Lưỡi Kiếm', ds: 'Thêm một lưỡi kiếm quay quanh bạn.', lv: f => f.w.count, apply: f => { f.w.count++; } },
  { id: 'radius', ic: '🌀', acc: '#5fe9ff', tag: 'Quỹ đạo', vi: 'Quỹ Đạo Rộng', ds: 'Tăng bán kính quỹ đạo.', apply: f => { f.w.radius *= T.up_radius; } },
  { id: 'spin', ic: '💨', acc: '#7cff6b', tag: 'Quỹ đạo', vi: 'Xoay Nhanh', ds: 'Tăng tốc độ quay.', apply: f => { f.w.spin *= T.up_spin; } },
  { id: 'damage', ic: '🔺', acc: '#ff9068', tag: 'Sức mạnh', vi: 'Sắc Bén', ds: 'Tăng sát thương lưỡi.', apply: f => { f.w.damage *= T.up_dmg; } },
  { id: 'crit', ic: '🎯', acc: '#ffd447', tag: 'Sức mạnh', vi: 'Chí Mạng', ds: 'Tăng tỉ lệ chí mạng (×2 sát thương).', max: 6, lv: f => f.p.critLv, apply: f => { f.p.crit = Math.min(0.95, f.p.crit + T.up_crit); f.p.critLv++; } },
  { id: 'heavy', ic: '🗡️', acc: '#b06bff', tag: 'Sức mạnh', vi: 'Lưỡi Nặng', ds: 'Sát thương cao hơn, xoay chậm hơn, to hơn (một lần).', max: 1, lv: f => (f.w.heavy ? 1 : 0), apply: heavy },
  { id: 'fire', ic: '🔥', acc: '#ff7a3c', tag: 'Nguyên tố', vi: 'Ngọn Lửa', ds: 'Đòn chém gây cháy. Cấp 3 → tiến hoá!', max: 3, lv: f => f.w.fire, apply: f => { f.w.fire++; queueEvo(f, 'fire'); } },
  { id: 'chain', ic: '⚡', acc: '#ffe066', tag: 'Nguyên tố', vi: 'Sấm Truyền', ds: '50% truyền sét sang quái gần. Cấp 3 → tiến hoá!', max: 3, lv: f => f.w.chain, apply: f => { f.w.chain++; queueEvo(f, 'chain'); } },
  { id: 'split', ic: '✨', acc: '#8fd6ff', tag: 'Nguyên tố', vi: 'Phân Mảnh', ds: '30% bắn mảnh khi trúng. Cấp 3 → tiến hoá!', max: 3, lv: f => f.w.split, apply: f => { f.w.split++; queueEvo(f, 'split'); } },
  { id: 'frost', ic: '❄️', acc: '#8fe9ff', tag: 'Nguyên tố', vi: 'Lưỡi Băng', ds: 'Đòn chém làm chậm quái. Cấp 3 → tiến hoá!', max: 3, lv: f => f.w.frost, apply: f => { f.w.frost++; queueEvo(f, 'frost'); } },
  { id: 'bolt', ic: '🏹', acc: '#9dff8a', tag: 'Vũ khí', vi: 'Tên Sét', ds: 'Tự bắn tên vào quái gần nhất. Cấp cao bắn nhiều hơn.', max: 5, lv: f => f.w.bolt, apply: f => { f.w.bolt++; } },
  { id: 'nova', ic: '💫', acc: '#c9a3ff', tag: 'Vũ khí', vi: 'Vòng Nổ', ds: 'Định kỳ nổ vòng đẩy lùi và gây sát thương.', max: 5, lv: f => f.w.nova, apply: f => { f.w.nova++; } },
  { id: 'aura', ic: '🛡️', acc: '#33e1ff', tag: 'Vũ khí', vi: 'Gai Hộ Thân', ds: 'Vùng gai sát người, chặn quái áp sát.', max: 4, lv: f => f.w.aura, apply: f => { f.w.aura++; } },
  { id: 'maxhp', ic: '❤️', acc: '#ff5f6d', tag: 'Thân', vi: 'Sinh Lực', ds: 'Tăng máu tối đa và hồi máu tương ứng.', apply: f => { f.p.maxHp += T.up_maxhp; f.p.hp += T.up_maxhp; } },
  { id: 'lifesteal', ic: '🩸', acc: '#ff5f6d', tag: 'Thân', vi: 'Hút Máu', ds: 'Hồi máu mỗi lần hạ quái (có trần theo giây).', max: 4, lv: f => f.p.lsLv, apply: f => { f.p.lifesteal += T.up_ls; f.p.lsLv++; } },
  { id: 'regen', ic: '✚', acc: '#7cff6b', tag: 'Thân', vi: 'Hồi Phục', ds: 'Hồi máu mỗi giây.', max: 4, lv: f => f.p.regenLv, apply: f => { f.p.regen += T.up_regen; f.p.regenLv++; } },
  { id: 'speed', ic: '🏃', acc: '#7cff6b', tag: 'Thân', vi: 'Nhanh Nhẹn', ds: 'Tăng tốc độ chạy.', apply: f => { f.p.speed *= T.up_speed; } },
  { id: 'magnet', ic: '🧲', acc: '#33e1ff', tag: 'Thân', vi: 'Nam Châm', ds: 'Tăng tầm hút XP.', apply: f => { f.p.pickup *= T.up_magnet; } },
];
export const UP_BY: Record<string, UpDef> = Object.fromEntries(UP.map(u => [u.id, u]));
export const EVO: Record<string, { id: string; ic: string; vi: string; ds: string; apply: (f: Fight) => void }> = {
  fire: { id: 'solar', ic: '☀️', vi: 'Vòng Mặt Trời', ds: 'TIẾN HOÁ: vòng lửa cháy mãi quanh bạn, thiêu mọi quái đi qua quỹ đạo.', apply: f => { f.w.solar = true; } },
  chain: { id: 'storm', ic: '🌩️', vi: 'Quỹ Đạo Bão', ds: 'TIẾN HOÁ: mỗi lưỡi kiếm tự phóng sét vào quái gần nhất.', apply: f => { f.w.storm = true; } },
  split: { id: 'prism', ic: '🔱', vi: 'Lăng Kính', ds: 'TIẾN HOÁ: mọi đòn trúng bắn 3 mảnh xuyên.', apply: f => { f.w.prism = true; } },
  frost: { id: 'glacier', ic: '🧊', vi: 'Đồng Băng', ds: 'TIẾN HOÁ: quỹ đạo thành vùng băng, đóng băng và gây sát thương quái áp sát.', apply: f => { f.w.glacier = true; } },
};
const SLOT_IDS = new Set(['fire', 'chain', 'split', 'frost', 'heavy', 'bolt', 'nova', 'aura', 'lifesteal', 'regen']);
export const slotsUsed = (f: Fight): number => [...f.taken].filter(id => SLOT_IDS.has(id)).length;
const upAvail = (f: Fight, u: UpDef): boolean => !(u.max && (u.lv ? u.lv(f) : 0) >= u.max);
function rollUps(f: Fight, n: number): string[] {
  const atCap = slotsUsed(f) >= f.slotCap;
  const bag = UP.filter(u => upAvail(f, u) && !(atCap && SLOT_IDS.has(u.id) && !f.taken.has(u.id))).map(u => u.id);
  const out: string[] = [];
  while (out.length < n && bag.length) out.push(bag.splice(Math.floor(rnd(f.rng) * bag.length), 1)[0]!);
  return out;
}
function openPick(f: Fight, chest: boolean): void {
  const opts: string[] = [];
  while (f.pendEvo.length && opts.length < 3) opts.push('evo:' + f.pendEvo.shift()!);
  opts.push(...rollUps(f, 3 - opts.length));
  f.pick = { chest, opts };
}
// Chọn thẻ thứ i của lượt lên cấp đang mở. Lên nhiều cấp một lúc thì mở lượt kế ngay.
export function choose(f: Fight, i: number): void {
  const pk = f.pick; if (!pk) return;
  const id = pk.opts[Math.max(0, Math.min(pk.opts.length - 1, i))];
  f.pick = null;
  if (id?.startsWith('evo:')) { EVO[id.slice(4)]!.apply(f); f.evos++; }
  else if (id) { f.taken.add(id); UP_BY[id]!.apply(f); }
  if (f.lvq > 0) { f.lvq--; openPick(f, false); }
}
export const pickInfo = (id: string): { ic: string; vi: string; ds: string; tag: string; acc: string; evo: boolean; lv: string } => {
  if (id.startsWith('evo:')) { const e = EVO[id.slice(4)]!; return { ic: e.ic, vi: e.vi, ds: e.ds, tag: 'Tiến hoá', acc: '#ffd447', evo: true, lv: '' }; }
  const u = UP_BY[id]!; return { ic: u.ic, vi: u.vi, ds: u.ds, tag: u.tag, acc: u.acc, evo: false, lv: '' };
};
export const pickLv = (f: Fight, id: string): string => { const u = UP_BY[id]; return u?.lv ? `Đang: cấp ${u.lv(f)}${u.max ? ` / ${u.max}` : ''}` : ''; };
function grant(f: Fight, id: string): void {
  const w = f.w as unknown as Record<string, number>;
  if (id === 'heavy') heavy(f);
  else if (['fire', 'chain', 'split', 'frost', 'bolt', 'nova', 'aura'].includes(id)) w[id] = (w[id] ?? 0) + 1;
  else if (id === 'lifesteal') { f.p.lifesteal += T.up_ls; f.p.lsLv++; }
  else if (id === 'regen') { f.p.regen += T.up_regen; f.p.regenLv++; }
  f.taken.add(id);
}

// ---------- Tạo trận ----------
export const atkOf = (tier: number): number => Math.pow(TIER_MUL, tier);
// Hệ số sát thương của Vũ khí trong một trận: đúng bậc cần = ngang máu quái khu (×1,32^need); lệch bậc thì lệch mạnh hơn (GAP_POW).
export const edgeOf = (def: Pick<FightDef, 'need'>, gear: Pick<Gear, 'w'>): number => atkOf(def.need) * Math.pow(TIER_MUL, GAP_POW * (gear.w - def.need));
export function newFight(def: FightDef, gear: Gear, seed: number, ch: CharId = 'orbiter', ev = false): Fight {
  const C = CHARS[ch] ?? CHARS.orbiter, giay = gear.giay ?? 0, hp = C.hp;
  const f: Fight = {
    def, seed, rng: { r: seed >>> 0 }, gear, ch, lvl: atkOf(def.need), t: 0,
    p: {
      x: 0, y: 0, px: 0, py: 0, r: 15, speed: C.speed * (1 + 0.03 * giay), hp, maxHp: hp, iframe: 0, level: 1, xp: 0, xpNext: T.xp_start,
      pickup: T.pl_pickup * C.pickup, dmgMult: C.dmg, crit: T.pl_crit + (C.crit ?? 0), lifesteal: C.lifesteal ?? 0, regen: C.regen ?? 0,
      faceX: 0, faceY: -1, dashT: 0, dashDX: 0, dashDY: 0, dashCd: 0, dashMax: T.ac_dashCd * (1 - 0.05 * giay), ult: 0, ultMul: 1 + 0.08 * (gear.bua ?? 0), ovT: 0,
      lsPend: 0, lsLv: 0, regenLv: 0, critLv: 0,
    },
    w: {
      count: 1, radius: T.wp_radius, spin: T.wp_spin, damage: T.wp_dmg * edgeOf(def, gear), angle: 0, heavy: false, hitPad: 0,
      fire: 0, chain: 0, split: 0, frost: 0, aura: 0, bolt: 0, nova: 0, solar: false, storm: false, prism: false, glacier: false,
      boltCd: 0, novaCd: 2, stormCd: 0, solarCd: 0, auraCd: 0, glacierCd: 0,
    },
    en: [], orbs: [], golds: [], chests: [], shots: [], novas: [], rings: [],
    kills: 0, gold: 0, combo: { n: 0, timer: 0, best: 0 }, spawnAcc: 0, eliteCd: T.el_every * 0.6, boss: null, bossAt: 0,
    pick: null, lvq: 0, pendEvo: [], taken: new Set(), slotCap: C.slot, evos: 0,
    over: null, why: '', dealt: 0, taken_: 0, ev: ev ? [] : null,
  };
  for (const id of C.starts) grant(f, id);
  for (let i = 0; i < T.sp_start; i++) spawn(f, 'normal');
  return f;
}

// ---------- Sát thương ----------
function dealDamage(f: Fight, e: Enemy, amt: number, crit: boolean): void {
  if (e.dead) return;
  amt *= f.p.dmgMult * (f.p.ovT > 0 ? T.ac_ovDmg : 1);
  const real = Math.min(e.hp, amt); e.hp -= amt; e.flash = 0.12; f.dealt += real;
  f.ev?.push({ k: 'hit', x: e.x, y: e.y - e.r, v: Math.round(amt), crit });
  if (e.hp <= 0) kill(f, e);
}
function rawHit(f: Fight, e: Enemy, amt: number): void {   // cháy / vòng: không nhân lại hệ số nhân vật
  if (e.dead) return; const real = Math.min(e.hp, amt); e.hp -= amt; e.flash = Math.max(e.flash, 0.05); f.dealt += real; if (e.hp <= 0) kill(f, e);
}
function dropXP(f: Fight, x: number, y: number, v: number): void { if (f.orbs.length >= 220) { f.orbs[Math.floor(rnd(f.rng) * f.orbs.length)]!.v += v; return; } f.orbs.push({ x, y, v, pull: false }); }
function kill(f: Fight, e: Enemy): void {
  e.dead = true; const c = f.combo; c.n++; c.timer = T.cb_window; if (c.n > c.best) c.best = c.n;
  if (c.n === 10 || c.n === 25 || c.n === 50 || c.n === 100) f.ev?.push({ k: 'combo', n: c.n });
  f.kills++; const p = f.p;
  if (p.lifesteal > 0 && !e.boss) p.lsPend += p.lifesteal;
  f.ev?.push({ k: 'kill', x: e.x, y: e.y, c: colorOf(e), n: e.boss ? 50 : e.elite ? 26 : 8 });
  if (e.boss) { f.over = 'win'; return; }
  p.ult = Math.min(1, p.ult + (e.elite ? T.ac_ultElite : T.ac_ultKill) * p.ultMul);
  if (e.elite) { f.chests.push({ x: e.x, y: e.y, v: 1, pull: false }); return; }
  const n = e.type === 'tank' ? 3 : e.type === 'swarm' ? 1 : 2;
  for (let i = 0; i < n; i++) dropXP(f, e.x + rr(f.rng, -8, 8), e.y + rr(f.rng, -8, 8), Math.max(1, Math.round(e.xp / n)));
  if (rnd(f.rng) < e.gc && f.golds.length < 100) f.golds.push({ x: e.x, y: e.y, v: e.type === 'tank' ? 3 : 1, pull: false });
}
function nearest(f: Fight, x: number, y: number, maxD: number, skip?: Set<Enemy>): Enemy | null {
  let best: Enemy | null = null, bd = maxD * maxD;
  for (const e of f.en) { if (e.dead || skip?.has(e)) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}
function chainFrom(f: Fight, src: Enemy, dmg: number, hops: number): void {
  let last = src; const hit = new Set([src]);
  for (let h = 0; h < hops; h++) {
    const b = nearest(f, last.x, last.y, 180, hit); if (!b) break;
    f.ev?.push({ k: 'zap', ax: last.x, ay: last.y, bx: b.x, by: b.y });
    dealDamage(f, b, dmg * T.sk_chain, false); hit.add(b); last = b;
  }
}
function shards(f: Fight, x: number, y: number, n: number, dmg: number, pierce: number): void {
  for (let s = 0; s < n; s++) { const a = rnd(f.rng) * TAU; f.shots.push({ x, y, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg, pierce, r: 3, life: 0.6, shard: true, hit: new Set() }); }
}
function hurt(f: Fight, dmg: number): void {
  const p = f.p; if (p.iframe > 0) return;
  const d = dmg * Math.pow(GIAP_MUL, f.gear.giap);
  p.hp -= d; f.taken_ += d; p.iframe = T.pl_iframe; f.ev?.push({ k: 'hurt' });
  if (p.hp <= 0) { p.hp = 0; f.over = 'lose'; f.why = 'dead'; }
}

// ---------- Kỹ năng chủ động ----------
export const canDash = (f: Fight): boolean => !f.over && !f.pick && f.p.dashT <= 0 && f.p.dashCd <= 0;
function dash(f: Fight): void {
  const p = f.p; if (!canDash(f)) return;
  let dx = p.faceX, dy = p.faceY; if (!dx && !dy) dy = -1; const l = Math.hypot(dx, dy) || 1;
  p.dashDX = dx / l; p.dashDY = dy / l; p.dashT = 0.14; p.dashCd = p.dashMax; p.iframe = Math.max(p.iframe, T.ac_dashIframe); f.ev?.push({ k: 'dash' });
}
function ult(f: Fight): void {
  const p = f.p; if (f.over || p.ult < 1) return;
  p.ult = 0; p.ovT = T.ac_ovDur; p.iframe = Math.max(p.iframe, 1); f.ev?.push({ k: 'ult' });
  f.novas.push({ x: p.x, y: p.y, rad: 0, maxRad: 700, dmg: (T.ac_ultBase + p.level * T.ac_ultLv) * edgeOf(f.def, f.gear), hit: new Set(), big: true });
}

// ---------- Một bước ----------
export interface Input { mx: number; my: number; dash?: boolean; ult?: boolean }
const comboBonus = (f: Fight): number => { const s = f.combo.n; return s >= 100 ? T.cb_100 : s >= 50 ? T.cb_50 : s >= 25 ? T.cb_25 : s >= 10 ? T.cb_10 : 0; };
function gainXP(f: Fight, v: number): void {
  const p = f.p; p.xp += v * (1 + comboBonus(f));
  while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.level++; p.xpNext = Math.round(p.xpNext * T.xp_curve + T.xp_add); if (f.pick) f.lvq++; else openPick(f, false); }
}
export const blades = (f: Fight): Array<{ x: number; y: number; a: number }> => {
  const w = f.w, out: Array<{ x: number; y: number; a: number }> = [];
  for (let i = 0; i < w.count; i++) { const a = w.angle + (i * TAU) / w.count; out.push({ x: f.p.x + Math.cos(a) * w.radius, y: f.p.y + Math.sin(a) * w.radius, a }); }
  return out;
};
export function step(f: Fight, inp: Input): void {
  if (f.over || f.pick) return;
  const p = f.p, w = f.w, dt = DT; f.t += dt;
  if (p.hp > p.maxHp) p.hp = p.maxHp;
  let mx = inp.mx, my = inp.my; const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  if (ml > 0.1) { p.faceX = mx; p.faceY = my; }
  p.px = p.x; p.py = p.y;
  p.x += mx * p.speed * dt; p.y += my * p.speed * dt;
  if (inp.dash) dash(f);
  if (inp.ult) ult(f);
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.dashT > 0) { p.dashT -= dt; p.x += p.dashDX * T.ac_dashSpeed * dt; p.y += p.dashDY * T.ac_dashSpeed * dt; p.iframe = Math.max(p.iframe, 0.05); }
  if (p.ovT > 0) p.ovT -= dt;
  if (p.regen > 0 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
  if (p.lsPend > 0) { const h = Math.min(p.lsPend, p.maxHp * T.up_lsCap * dt); if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + h); p.lsPend = Math.min(p.maxHp, p.lsPend - h); }
  if (p.iframe > 0) p.iframe -= dt;
  w.angle += w.spin * (p.ovT > 0 ? 2 : 1) * dt;

  // Sinh quái, Elite, boss; điều kiện thắng / thua theo giờ.
  const def = f.def;
  if (!def.boss && f.t >= def.dur) { f.over = 'win'; return; }
  if (def.boss && f.boss && f.t >= f.bossAt + def.boss.lim) { f.over = 'lose'; f.why = 'time'; return; }
  if (!f.boss) {   // pha boss: chỉ còn lính boss gọi ra (đấu đồng hồ với boss)
    f.spawnAcc += spawnRate(f) * dt;
    while (f.spawnAcc >= 1) { f.spawnAcc -= 1; if (f.en.length < T.sp_max) spawn(f, rollType(f)); }
  }
  if (def.elite && !f.boss) { f.eliteCd -= dt; if (f.eliteCd <= 0) { f.eliteCd = T.el_every; spawnElite(f); } }
  if (def.boss && !f.boss && f.t >= def.dur) spawnBoss(f);

  const bR = w.radius, bHit = (w.heavy ? 15 : 11) + w.hitPad, bl = blades(f), PD = p.dmgMult;
  if (w.solar) { w.solarCd -= dt; if (w.solarCd <= 0) { w.solarCd = T.sk_solarEvery; const i2 = (bR - 18) ** 2, o2 = (bR + 18) ** 2;
    for (const e of f.en) { if (e.dead) continue; const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2; if (d > i2 && d < o2) rawHit(f, e, w.damage * T.sk_solar * PD); } } }
  if (w.glacier) { w.glacierCd -= dt; if (w.glacierCd <= 0) { w.glacierCd = 0.2; const r2 = (bR + 14) ** 2;
    for (const e of f.en) { if (e.dead) continue; if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r2) { e.slow = T.sk_glacierSlow; e.slowT = 1; rawHit(f, e, w.damage * T.sk_glacier * PD); } } } }
  if (w.aura > 0) { w.auraCd -= dt; if (w.auraCd <= 0) { w.auraCd = T.sk_auraEvery; const ar2 = (58 + w.aura * 8) ** 2;
    for (const e of f.en) { if (!e.dead && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < ar2) dealDamage(f, e, w.damage * T.sk_aura * w.aura, false); } } }
  if (w.storm) { w.stormCd -= dt; if (w.stormCd <= 0) { w.stormCd = T.sk_stormEvery;
    for (const b of bl) { const tg = nearest(f, b.x, b.y, 220); if (tg) { f.ev?.push({ k: 'zap', ax: b.x, ay: b.y, bx: tg.x, by: tg.y }); dealDamage(f, tg, w.damage * T.sk_storm, false); } } } }
  if (w.bolt > 0) { w.boltCd -= dt; if (w.boltCd <= 0) { w.boltCd = Math.max(0.2, T.sk_boltRate - (w.bolt - 1) * 0.12);
    for (let i = 0; i < Math.min(3, 1 + ((w.bolt - 1) >> 1)); i++) { const tg = nearest(f, p.x, p.y, 520); if (!tg) break;
      const a = Math.atan2(tg.y - p.y, tg.x - p.x) + rr(f.rng, -0.12, 0.12);
      f.shots.push({ x: p.x, y: p.y, vx: Math.cos(a) * 440, vy: Math.sin(a) * 440, dmg: w.damage * T.sk_bolt, pierce: 0, r: 4, life: 1.1, shard: false, hit: new Set() }); } } }
  if (w.nova > 0) { w.novaCd -= dt; if (w.novaCd <= 0) { w.novaCd = Math.max(1, T.sk_novaEvery - (w.nova - 1) * 0.4);
    f.novas.push({ x: p.x, y: p.y, rad: 0, maxRad: 150 + w.nova * 32, dmg: w.damage * T.sk_nova, hit: new Set(), big: false }); f.ev?.push({ k: 'nova' }); } }

  for (const e of f.en) {
    if (e.dead) continue;
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 1; }
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, es = e.spd * e.slow;
    e.x += (dx / d) * es * dt; e.y += (dy / d) * es * dt;
    if (e.flash > 0) e.flash -= dt; e.pulse += dt;
    if (e.burn > 0) { e.burnT -= dt; if (e.burnT <= 0) { e.burnT = 0.5; rawHit(f, e, e.burn); f.ev?.push({ k: 'hit', x: e.x, y: e.y - e.r, v: Math.round(e.burn), crit: false }); if (e.dead) { if (f.over) return; continue; } } }
    const er2 = (e.r + bHit) ** 2;
    for (const b of bl) {
      if ((b.x - e.x) ** 2 + (b.y - e.y) ** 2 < er2) {
        if (f.t >= e.hcd) {
          e.hcd = f.t + T.wp_hitcd;
          const crit = rnd(f.rng) < p.crit, dmg = w.damage * (crit ? 2 : 1), kb = (w.heavy ? 18 : 11) * e.kb;
          e.x -= (dx / d) * kb; e.y -= (dy / d) * kb;
          dealDamage(f, e, dmg, crit);
          if (f.over) return;
          if (!e.dead && w.fire > 0) e.burn = Math.max(e.burn, w.damage * T.sk_fire * w.fire);
          if (!e.dead && w.frost > 0) { e.slow = Math.min(e.slow, Math.max(0.1, 1 - T.sk_frostSlow * w.frost)); e.slowT = T.sk_frostDur; }
          if (!e.dead && w.chain > 0 && rnd(f.rng) < T.sk_chainChance) chainFrom(f, e, w.damage, w.chain);
          if (w.prism) shards(f, e.x, e.y, 3, w.damage * T.sk_split, 2);
          else if (w.split > 0 && rnd(f.rng) < T.sk_splitChance) shards(f, e.x, e.y, w.split, w.damage * T.sk_split, 0);
          if (f.over) return;
        }
        break;
      }
    }
    if (!e.dead && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r + p.r) ** 2) { hurt(f, e.dmg); if (f.over) return; }
    if (e.boss && !e.dead) {
      e.mcd -= dt; e.scd -= dt;
      if (e.mcd <= 0) { e.mcd = T.bo_minEvery; for (let i = 0; i < T.bo_minCount; i++) { const a = rnd(f.rng) * TAU; if (f.en.length < T.sp_max + 20) spawn(f, 'fast', { x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 60 }); } }
      if (e.scd <= 0) {
        e.scd = T.bo_shockEvery; f.rings.push({ x: e.x, y: e.y, rad: 0, life: 0.7 }); f.ev?.push({ k: 'shock' });
        if (Math.hypot(p.x - e.x, p.y - e.y) < T.bo_shockR) { hurt(f, T.bo_shock * Math.sqrt(f.lvl) * (1 - 0.06 * f.gear.khien)); if (f.over) return; }
      }
    }
  }
  if (f.en.some(e => e.dead)) f.en = f.en.filter(e => !e.dead);

  for (const s of f.shots) {
    s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt;
    for (const e of f.en) {
      if (e.dead || s.hit.has(e)) continue;
      if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 < (e.r + s.r) ** 2) { dealDamage(f, e, s.dmg, false); if (f.over) return; s.hit.add(e); if (s.pierce > 0) s.pierce--; else { s.life = 0; break; } }
    }
  }
  if (f.shots.length) f.shots = f.shots.filter(s => s.life > 0);
  for (const nv of f.novas) {
    nv.rad += (nv.big ? 520 : 340) * dt;
    for (const e of f.en) {
      if (e.dead || nv.hit.has(e)) continue; const d = Math.hypot(e.x - nv.x, e.y - nv.y);
      if (d < nv.rad && d > nv.rad - 34) { nv.hit.add(e); const a = Math.atan2(e.y - nv.y, e.x - nv.x); e.x += Math.cos(a) * 16 * e.kb; e.y += Math.sin(a) * 16 * e.kb; dealDamage(f, e, nv.dmg, false); if (f.over) return; }
    }
  }
  if (f.novas.length) f.novas = f.novas.filter(n => n.rad < n.maxRad);
  if (f.en.some(e => e.dead)) f.en = f.en.filter(e => !e.dead);

  // Nhặt XP / xu / rương: trong tầm hút thì bay về người, ngoài tầm trôi chậm (khỏi dồn đống).
  const PK = p.pickup;
  for (const o of f.orbs) {
    const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
    if (o.pull || d < PK) { o.pull = true; const s = Math.min(600, 180 + (PK - d) * 3); o.x += (dx / d) * s * dt; o.y += (dy / d) * s * dt; if (d < p.r + 6) { o.got = true; gainXP(f, o.v); f.ev?.push({ k: 'xp', c: f.combo.n }); } }
    else { o.x += (dx / d) * 45 * dt; o.y += (dy / d) * 45 * dt; }
  }
  if (f.orbs.some(o => o.got)) f.orbs = f.orbs.filter(o => !o.got);
  for (const g of f.golds) {
    const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
    if (g.pull || d < PK * 0.8) { g.pull = true; const s = 210 + (PK - d) * 3; g.x += (dx / d) * s * dt; g.y += (dy / d) * s * dt; if (d < p.r + 6) { g.got = true; f.gold += g.v; f.ev?.push({ k: 'gold' }); } }
    else { g.x += (dx / d) * 40 * dt; g.y += (dy / d) * 40 * dt; }
  }
  if (f.golds.some(g => g.got)) f.golds = f.golds.filter(g => !g.got);
  for (const c of f.chests) {
    const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
    if (c.pull || d < PK) { c.pull = true; c.x += (dx / d) * 200 * dt; c.y += (dy / d) * 200 * dt; if (d < p.r + 8) { c.got = true; f.ev?.push({ k: 'chest' }); if (f.pick) f.lvq++; else openPick(f, true); } }
  }
  if (f.chests.some(c => c.got)) f.chests = f.chests.filter(c => !c.got);
  for (const r of f.rings) { r.life -= dt; r.rad += 520 * dt; }
  if (f.rings.length) f.rings = f.rings.filter(r => r.life > 0);
  const c = f.combo; if (c.n > 0) { c.timer -= dt; if (c.timer <= 0) c.n = 0; }
}
// Thời gian còn lại (giây) để hiện trên màn: luyện tay = tới khi thắng; boss = tới lúc boss ra, rồi tới hạn hạ boss.
export const timeLeft = (f: Fight): number => (f.def.boss ? (f.boss ? f.bossAt + f.def.boss.lim - f.t : f.def.dur - f.t) : f.def.dur - f.t);

// ---------- Bot (người chơi giả lập, C2) ----------
// Tay né: nhịp đổi hướng (re bước), nhiễu góc (nz rad), tầm nhìn quái (look), có dùng DASH không, mức chọn nâng cấp khôn (pick 0–1).
export const DODGE = {
  good: { re: 2, nz: 0.12, safe: 0.45, hunt: true, dash: true, pick: 1 },
  avg: { re: 4, nz: 0.4, safe: 0.75, hunt: true, dash: true, pick: 0.6 },
  poor: { re: 6, nz: 0.6, safe: 0.9, hunt: true, dash: false, pick: 0.3 },
} as const;
export type DodgeLv = keyof typeof DODGE;
export interface Bot { lv: (typeof DODGE)[DodgeLv]; rng: { r: number }; k: number; mx: number; my: number }
export const newBot = (lv: DodgeLv, seed: number): Bot => ({ lv: DODGE[lv], rng: { r: (seed * 2654435761) >>> 0 }, k: 0, mx: 0, my: 0 });
const PRIO = ['blade', 'damage', 'heavy', 'radius', 'aura', 'spin', 'nova', 'bolt', 'fire', 'chain', 'frost', 'split', 'maxhp', 'regen', 'crit', 'lifesteal', 'speed', 'magnet'];
export function botPick(f: Fight, b: Bot): number {
  const o = f.pick?.opts ?? []; if (!o.length) return 0;
  if (rnd(b.rng) >= b.lv.pick) return Math.floor(rnd(b.rng) * o.length);
  const ev = o.findIndex(x => x.startsWith('evo:')); if (ev >= 0) return ev;
  let best = 0, bs = 1e9; o.forEach((id, i) => { const s = PRIO.indexOf(id); const v = s < 0 ? 99 : s; if (v < bs) { bs = v; best = i; } });
  return best;
}
// Né như người chơi: quái lọt vào trong vòng an toàn (safe × bán kính quỹ đạo) thì đẩy ra; còn lại đi săn quái gần nhất cho lưỡi kiếm chém
// (tay kém không săn, chỉ chạy). Sóng rè sắp nổ thì ra ngoài bán kính sóng.
export function botInput(f: Fight, b: Bot): Input {
  const p = f.p, L = b.lv, R = f.w.radius, zone = R * L.safe;
  let dash = false;
  if (b.k-- <= 0) {
    b.k = L.re;
    let ax = 0, ay = 0, near = 1e9, tgt: Enemy | null = null, td = 1e9;
    for (const e of f.en) {
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, gap = d - e.r - p.r;
      if (gap < near) near = gap;
      if (d < td) { td = d; tgt = e; }
      if (gap > zone) continue;
      const wgt = (e.boss ? 2 : e.elite ? 1.5 : 1) * e.dmg / Math.max(3, gap);
      ax += (dx / d) * wgt; ay += (dy / d) * wgt;
    }
    const bs = f.boss && !f.boss.dead ? f.boss : null;
    if (bs) {
      const dx = p.x - bs.x, dy = p.y - bs.y, d = Math.hypot(dx, dy) || 1;
      if (L.hunt && bs.scd < 1.3 && d < T.bo_shockR + 25) { ax += (dx / d) * 2; ay += (dy / d) * 2; }
      else if (L.hunt) tgt = bs;
    }
    if (Math.hypot(ax, ay) < 1e-6) {
      if (L.hunt && tgt) { const d = Math.hypot(tgt.x - p.x, tgt.y - p.y), want = R * 0.85 + tgt.r; if (d > want) { ax = tgt.x - p.x; ay = tgt.y - p.y; } }
      if (Math.hypot(ax, ay) < 1e-6) { let o: Orb | null = null, od = 1e9; for (const q of f.orbs) { const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2; if (d < od) { od = d; o = q; } } if (o) { ax = o.x - p.x; ay = o.y - p.y; } }
    }
    const l = Math.hypot(ax, ay);
    if (l > 1e-6) { const a = Math.atan2(ay, ax) + (rnd(b.rng) * 2 - 1) * L.nz; b.mx = Math.cos(a); b.my = Math.sin(a); } else { b.mx = 0; b.my = 0; }
    if (L.dash && near < 4 && p.iframe <= 0) dash = true;
  }
  return { mx: b.mx, my: b.my, dash, ult: p.ult >= 1 };
}

// ---------- Mô phỏng cả trận ----------
export function simFight(def: FightDef, gear: Gear, lv: DodgeLv, seed: number, ch: CharId = 'orbiter'): Fight {
  const f = newFight(def, gear, seed, ch), b = newBot(lv, seed);
  const lim = Math.ceil(((def.dur + (def.boss?.lim ?? 0)) / DT) * 1.05) + 200;
  for (let k = 0; !f.over && k < lim; k++) { if (f.pick) choose(f, botPick(f, b)); else step(f, botInput(f, b)); }
  if (!f.over) { f.over = 'lose'; f.why = 'time'; }
  return f;
}
export function winRate(def: FightDef, gear: Gear, lv: DodgeLv, n: number, seed0 = 1, ch: CharId = 'orbiter'): number {
  let w = 0; for (let i = 0; i < n; i++) if (simFight(def, gear, lv, seed0 + i * 7919, ch).over === 'win') w++;
  return w / n;
}
