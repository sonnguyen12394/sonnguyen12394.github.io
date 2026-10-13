// v133 Chiến Binh Chữ, mốc 1 (docs/KE-HOACH-A2.md §2 C1–C2, docs/MOC1-KE-HOACH.md): trận ngắm bắn theo lượt kiểu Gunny.
// Game thuần: KHÔNG có câu tiếng Anh, KHÔNG ghi bằng chứng (P13); đồ (Vũ khí) quyết định phần lớn sát thương, tay ngắm phần còn lại.
// Thuần hàm, tất định: cùng hạt giống + cùng cú bắn = cùng kết quả (bước vật lý cố định 1/60 giây). fightview.ts chỉ vẽ.

// ---------- Hằng số thế giới ----------
export const W = 1000, H = 600, COLS = 250, CW = W / COLS;
export const BED = 585;                 // đá nền: hố không khoét sâu hơn
export const GRAV = 400, VMAX = 620, WK = 9, DT = 1 / 60;
export const UR = 20;                   // bán kính thân nhân vật (hộp va chạm tròn)
export const BLAST = 60, CRATER = 34;   // bán kính nổ (sát thương) / bán kính hố
export const BASE = 100, TIER_MUL = 1.32, GIAP_MUL = 0.97;
export const MAX_ROUND = 14;            // hết vòng mà chưa hạ boss = thua (trận 2–4 phút)
export const STAMINA = 100, STEP_COST = 1;   // thể lực đi lại mỗi lượt (1 đơn vị / px)
export const MAX_STEPS = 900;

// ---------- Ngẫu nhiên có hạt giống (mulberry32) ----------
export function rnd(s: { r: number }): number {
  s.r = (s.r + 0x6d2b79f5) >>> 0; let t = s.r;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function gauss(s: { r: number }): number { const u = Math.max(1e-9, rnd(s)), v = rnd(s); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// ---------- Định nghĩa trận ----------
export type Kind = 'hero' | 'mob' | 'boss';
export interface FoeDef { kind: 'mob' | 'boss'; vi: string; x: number; hp: number; atk: number; aim: { p: number; a: number } }
export type WindRule = 'none' | 'calm' | 'gust';
export interface FightDef {
  id: string; vi: string; sub: string; zone: number;
  need: number;                 // bậc Vũ khí cần (bậc đồ "đúng tầm")
  wind: WindRule; foes: FoeDef[]; heroX: number;
  coins: number; first: number; // xu rơi khi thắng; thưởng thêm lần thắng đầu
  volley?: boolean;             // boss Rè: mỗi lượt thứ 3 bắn Sóng rè 3 viên toả
  terrain: number;              // hạt giống địa hình
  tip: string;                  // một dòng cơ chế (hiện ở màn mở trận)
}
// Khu 1 (A1): hai trận luyện tay + boss Tiếng Ồn Rè. Số liệu chỉnh bằng mô phỏng (tools/sim/fight.ts, test khoá dải).
export const FIGHTS: FightDef[] = [
  { id: 'k1-l1', vi: 'Luyện tay 1', sub: 'Lính Rè đứng yên, trời lặng gió', zone: 1, need: 0, wind: 'none', heroX: 140, terrain: 11,
    foes: [{ kind: 'mob', vi: 'Lính Rè', x: 600, hp: 300, atk: 0.55, aim: { p: 14, a: 8 } }], coins: 15, first: 15,
    tip: 'Kéo ngược từ nhân vật (như kéo ná) để chọn góc và lực, thả tay để bắn.' },
  { id: 'k1-l2', vi: 'Luyện tay 2', sub: 'Lính Rè ở xa, có gió', zone: 1, need: 0, wind: 'calm', heroX: 130, terrain: 23,
    foes: [{ kind: 'mob', vi: 'Lính Rè', x: 780, hp: 380, atk: 0.75, aim: { p: 11, a: 6 } }], coins: 20, first: 20,
    tip: 'Gió đẩy đạn theo chiều mũi tên trên cùng. Gió mạnh thì bắn lệch ngược lại.' },
  { id: 'k1-boss', vi: 'Tiếng Ồn Rè', sub: 'Boss khu 1 · cần Vũ khí bậc 2', zone: 1, need: 2, wind: 'gust', heroX: 120, terrain: 37, volley: true,
    foes: [{ kind: 'boss', vi: 'Tiếng Ồn Rè', x: 870, hp: 1060, atk: 1.75, aim: { p: 7, a: 4 } }, { kind: 'mob', vi: 'Lính Rè', x: 690, hp: 250, atk: 0.8, aim: { p: 12, a: 7 } }],
    coins: 60, first: 60,
    tip: 'Rè làm gió mạnh và đảo chiều mỗi 2 lượt. Cứ 3 lượt Rè bắn Sóng rè 3 viên: Khiên (Nghe) giảm sát thương này.' },
];
export const fightById = (id: string): FightDef | undefined => FIGHTS.find(f => f.id === id);

// ---------- Trạng thái ----------
export interface Unit { id: number; kind: Kind; vi: string; x: number; y: number; hp: number; hpMax: number; atk: number; giap: number; face: 1 | -1; aim: { p: number; a: number }; shots: number; ang: number; pow: number }
export interface Gear { w: number; giap: number; khien: number }   // bậc đang mặc: Vũ khí, Giáp, Khiên
export interface Impact { x: number; y: number; direct: number | null; hits: Array<{ id: number; dmg: number; hit: number; kill: boolean }> }
export interface Shot { by: number; ang: number; pow: number; wind: number; path: number[]; impact: Impact | null; out: boolean; volley: boolean }
export interface Fight {
  def: FightDef; seed: number; rng: { r: number };
  ground: number[]; units: Unit[]; gear: Gear;
  turn: number;          // chỉ số trong units của bên đang bắn
  round: number;         // vòng (bắt đầu 1); qua vòng khi tới lượt người chơi
  nTurn: number;         // tổng số lượt đã qua (đổi gió theo lượt)
  wind: number; stamina: number;
  over: 'win' | 'lose' | null; why: '' | 'dead' | 'time';
  shots: number; hits: number; hitSum: number;   // thống kê của người chơi
  dealt: number; taken: number;
}

// ---------- Địa hình ----------
export function genTerrain(seed: number, def: Pick<FightDef, 'heroX' | 'foes'>): number[] {
  const s = { r: seed * 2654435761 >>> 0 }, k = [0, 1, 2, 3].map(() => ({ a: 20 + rnd(s) * 45, f: 1 + rnd(s) * 3.2, p: rnd(s) * Math.PI * 2 }));
  const g: number[] = [];
  for (let i = 0; i < COLS; i++) {
    const x = i / COLS; let y = 430;
    for (const w of k) y += Math.sin(x * w.f * Math.PI * 2 + w.p) * w.a * (0.5 + 0.5 * Math.sin(x * Math.PI));
    g.push(y);
  }
  // Chỗ đứng bằng phẳng quanh mỗi nhân vật (khỏi trượt ngay lượt đầu); cao vừa phải để có thể bắn vòng qua đồi.
  const flat = (cx: number, hw: number) => { const c = Math.round(cx / CW), y0 = g[Math.max(0, Math.min(COLS - 1, c))]!; for (let i = c - hw; i <= c + hw; i++) if (i >= 0 && i < COLS) { const t = Math.abs(i - c) / hw; g[i] = y0 * (1 - t * t) + g[i]! * t * t; } };
  flat(def.heroX, 8); for (const f of def.foes) flat(f.x, 8);
  return g.map(y => Math.max(220, Math.min(BED - 40, Math.round(y * 10) / 10)));
}
export function groundAt(g: number[], x: number): number {
  if (x <= 0) return g[0]!; if (x >= W - CW) return g[COLS - 1]!;
  const f = x / CW - 0.5, i = Math.max(0, Math.floor(f)), t = Math.min(1, Math.max(0, f - i));
  return g[i]! * (1 - t) + g[Math.min(COLS - 1, i + 1)]! * t;
}
export function carve(g: number[], cx: number, cy: number, r: number): void {
  for (let i = 0; i < COLS; i++) {
    const x = (i + 0.5) * CW, dx = x - cx; if (Math.abs(dx) > r) continue;
    const dy = Math.sqrt(r * r - dx * dx), bot = cy + dy;
    // Mặt đất nằm trong vòng hố thì hạ xuống đáy hố. Vách đồi cao hơn đỉnh hố giữ nguyên (bản đồ độ cao không có hang).
    if (g[i]! < bot && g[i]! >= cy - dy) g[i] = Math.min(BED, bot);
  }
}

// ---------- Tạo trận ----------
export const atkOf = (tier: number): number => Math.pow(TIER_MUL, tier);
export function newFight(def: FightDef, gear: Gear, seed: number): Fight {
  const ground = genTerrain(def.terrain, def);
  const hero: Unit = { id: 0, kind: 'hero', vi: 'Bạn', x: def.heroX, y: 0, hp: 1000, hpMax: 1000, atk: atkOf(gear.w), giap: gear.giap, face: 1, aim: { p: 0, a: 0 }, shots: 0, ang: 45, pow: 60 };
  const units = [hero, ...def.foes.map((f, i): Unit => ({ id: i + 1, kind: f.kind, vi: f.vi, x: f.x, y: 0, hp: f.hp, hpMax: f.hp, atk: f.atk, giap: 0, face: -1, aim: { ...f.aim }, shots: 0, ang: 45, pow: 60 }))];
  for (const u of units) u.y = groundAt(ground, u.x);
  const f: Fight = { def, seed, rng: { r: seed >>> 0 }, ground, units, gear, turn: 0, round: 1, nTurn: 0, wind: 0, stamina: STAMINA, over: null, why: '', shots: 0, hits: 0, hitSum: 0, dealt: 0, taken: 0 };
  f.wind = windFor(f);
  return f;
}
// Gió: lặng (luyện tay 1), nhẹ ±3, Rè: mạnh 2–6, đảo chiều mỗi 2 lượt (đọc được: màn ghi "gió đảo sau …").
export function windFor(f: Fight): number {
  const r = f.def.wind;
  if (r === 'none') return 0;
  if (r === 'calm') return Math.round((rnd(f.rng) * 6 - 3) * 2) / 2;
  const sign = (f.nTurn >> 1) % 2 ? -1 : 1, mag = 2 + Math.round(rnd(f.rng) * 8) / 2;
  return sign * mag;
}
export const gustFlipIn = (f: Fight): number => (f.def.wind === 'gust' ? 2 - (f.nTurn % 2) : 0);

// ---------- Đạn ----------
export const center = (u: Pick<Unit, 'x' | 'y'>): { x: number; y: number } => ({ x: u.x, y: u.y - UR });
export function muzzle(u: Unit, ang: number): { x: number; y: number; vx: number; vy: number } {
  const c = center(u), a = (ang * Math.PI) / 180;
  return { x: c.x + Math.cos(a) * u.face * (UR + 4), y: c.y - Math.sin(a) * (UR + 4), vx: Math.cos(a) * u.face, vy: -Math.sin(a) };
}
export interface Trace { path: number[]; end: { x: number; y: number } | null; direct: number | null; out: boolean }
// Bay tới khi chạm đất / chạm thân / ra khỏi bản đồ. path: toạ độ mỗi 2 bước (để vẽ). Không đổi trạng thái.
export function trace(ground: number[], units: Unit[], by: number, ang: number, pow: number, wind: number): Trace {
  const u = units[by]!, m = muzzle(u, ang), sp = (Math.max(0, Math.min(100, pow)) / 100) * VMAX;
  let x = m.x, y = m.y, vx = m.vx * sp, vy = m.vy * sp;
  const path = [x, y];
  for (let k = 1; k <= MAX_STEPS; k++) {
    vx += wind * WK * DT; vy += GRAV * DT; x += vx * DT; y += vy * DT;
    if (k % 2 === 0) path.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    if (x < -120 || x > W + 120 || y > H + 60) return { path, end: null, direct: null, out: true };
    for (const t of units) {
      if (t.hp <= 0 || (t.id === by && k < 12)) continue;
      const c = center(t); if ((x - c.x) ** 2 + (y - c.y) ** 2 <= UR * UR) { path.push(x, y); return { path, end: { x, y }, direct: t.id, out: false }; }
    }
    if (x >= 0 && x <= W && y >= groundAt(ground, x)) { const gy = groundAt(ground, x); path.push(x, gy); return { path, end: { x, y: gy }, direct: null, out: false }; }
  }
  return { path, end: null, direct: null, out: true };
}
// Sát thương (C2): đồ nhân, tay ngắm chỉ đổi phần (0,56 + 0,44 × hit): trúng tâm so với trúng rìa chênh ≤ 1,8 lần.
export const hitOf = (d: number): number => Math.max(0, Math.min(1, 1 - Math.max(0, d - 8) / BLAST));
export function damage(atk: number, hit: number, giap: number, mul = 1): number {
  if (hit <= 0) return 0;
  return Math.max(1, Math.round(BASE * atk * (0.56 + 0.44 * hit) * Math.pow(GIAP_MUL, giap) * mul));
}

function settle(f: Fight): void { for (const u of f.units) if (u.hp > 0) u.y = groundAt(f.ground, u.x); }
function explode(f: Fight, by: number, t: Trace, mul: number): Impact | null {
  if (!t.end) return null;
  const sh = f.units[by]!, imp: Impact = { x: t.end.x, y: t.end.y, direct: t.direct, hits: [] };
  for (const u of f.units) {
    if (u.hp <= 0) continue;
    const c = center(u), hit = t.direct === u.id ? 1 : hitOf(Math.hypot(c.x - t.end.x, c.y - t.end.y));
    if (hit <= 0) continue;
    const self = u.id === by ? 0.5 : 1, khien = sh.kind === 'boss' && mul < 1 && u.kind === 'hero' ? 1 - 0.06 * f.gear.khien : 1;
    const dmg = damage(sh.atk, hit, u.giap, mul * self * khien);
    u.hp = Math.max(0, u.hp - dmg);
    imp.hits.push({ id: u.id, dmg, hit, kill: u.hp <= 0 });
    if (by === 0 && u.id !== 0) f.dealt += dmg;
    if (u.id === 0) f.taken += dmg;
  }
  carve(f.ground, t.end.x, t.end.y, CRATER);
  settle(f);
  return imp;
}

// Một lượt bắn của bên đang đến lượt. Trả các phát (Sóng rè: 3 phát) để màn vẽ lại; trạng thái đã đổi xong.
export function fire(f: Fight, ang: number, pow: number): Shot[] {
  if (f.over) return [];
  const by = f.turn, u = f.units[by]!;
  ang = Math.max(0, Math.min(90, ang)); pow = Math.max(0, Math.min(100, pow));
  u.ang = ang; u.pow = pow; u.shots++;
  const volley = u.kind === 'boss' && !!f.def.volley && u.shots % 3 === 0;
  const list = volley ? [-7, 0, 7] : [0], out: Shot[] = [];
  for (const da of list) {
    const t = trace(f.ground, f.units, by, ang + da, pow, f.wind);
    const imp = explode(f, by, t, volley ? 0.45 : 1);
    out.push({ by, ang: ang + da, pow, wind: f.wind, path: t.path, impact: imp, out: t.out, volley });
  }
  if (by === 0) {
    f.shots++;
    const best = Math.max(0, ...out.flatMap(s => s.impact?.hits.filter(h => h.id !== 0).map(h => h.hit) ?? []));
    if (best > 0) f.hits++;
    f.hitSum += best;
  }
  advance(f);
  return out;
}
function advance(f: Fight): void {
  const hero = f.units[0]!, foes = f.units.filter(u => u.id !== 0);
  if (hero.hp <= 0) { f.over = 'lose'; f.why = 'dead'; return; }
  if (foes.every(u => u.hp <= 0)) { f.over = 'win'; return; }
  let n = f.turn;
  do { n = (n + 1) % f.units.length; } while (f.units[n]!.hp <= 0);
  if (n === 0) { f.round++; if (f.round > MAX_ROUND) { f.over = 'lose'; f.why = 'time'; return; } }
  f.turn = n; f.nTurn++; f.stamina = STAMINA; f.wind = windFor(f);
}
// Bỏ lượt (hết giờ): lượt chuyển cho bên kế tiếp, không bắn.
export function pass(f: Fight): void { if (!f.over) advance(f); }
// Đi lại theo địa hình (chỉ người chơi, trong lượt của mình). dx âm = sang trái. Trả số px đã đi.
export function walk(f: Fight, dx: number): number {
  if (f.over || f.turn !== 0) return 0;
  const u = f.units[0]!, can = Math.min(Math.abs(dx), f.stamina / STEP_COST), dir = Math.sign(dx);
  if (!dir || can <= 0) return 0;
  const nx = Math.max(20, Math.min(W - 20, u.x + dir * can));
  // Dốc quá đứng (> 1,6 px cao / px) thì không leo được.
  const climb = groundAt(f.ground, u.x) - groundAt(f.ground, nx);
  if (climb > Math.abs(nx - u.x) * 1.6 + 2) return 0;
  const moved = Math.abs(nx - u.x);
  u.x = nx; u.face = dir > 0 ? 1 : -1; u.y = groundAt(f.ground, u.x); f.stamina -= moved * STEP_COST;
  return moved;
}

// ---------- Máy ngắm (đối thủ, bot mô phỏng) ----------
// Tìm (góc, lực) rơi gần đích nhất với gió hiện tại: thử vài góc, chia đôi lực theo khoảng lệch dọc trục x.
export function solve(f: Fight, by: number, target: number): { ang: number; pow: number; err: number } {
  const u = f.units[by]!, tg = f.units[target]!, tc = center(tg);
  const face = tc.x >= u.x ? 1 : -1, saved = u.face; u.face = face as 1 | -1;
  let best = { ang: 45, pow: 60, err: Infinity };
  for (const ang of [30, 42, 54, 66]) {
    let lo = 5, hi = 100;
    for (let k = 0; k < 14; k++) {
      const mid = (lo + hi) / 2, t = trace(f.ground, f.units, by, ang, mid, f.wind);
      const px = t.direct === target ? tc.x : t.end ? t.end.x : (t.path[t.path.length - 2] ?? u.x);
      const e = (px - tc.x) * face;
      const d = t.direct === target ? 0 : t.end ? Math.hypot(t.end.x - tc.x, t.end.y - tc.y) : Infinity;
      if (d < best.err) best = { ang, pow: mid, err: d };
      if (t.direct === target) break;
      if (e < 0 && !(t.out && px * face > tc.x * face)) lo = mid; else hi = mid;
    }
    if (best.err === 0) break;
  }
  u.face = saved;
  return best;
}
// Ngắm có sai số: sai số giảm dần qua các lượt (như người chỉnh tay theo phát trước), không dưới 45% ban đầu.
export function aimWith(f: Fight, by: number, target: number, sig: { p: number; a: number }): { ang: number; pow: number } {
  const u = f.units[by]!, s = solve(f, by, target), k = Math.max(0.45, Math.pow(0.82, u.shots));
  u.face = center(f.units[target]!).x >= u.x ? 1 : -1;
  return { ang: Math.max(5, Math.min(88, s.ang + gauss(f.rng) * sig.a * k)), pow: Math.max(5, Math.min(100, s.pow + gauss(f.rng) * sig.p * k)) };
}
// Lượt của máy: đối thủ luôn nhắm người chơi.
export function aiTurn(f: Fight): Shot[] {
  if (f.over || f.turn === 0) return [];
  const u = f.units[f.turn]!, a = aimWith(f, f.turn, 0, u.aim);
  return fire(f, a.ang, a.pow);
}

// ---------- Mô phỏng cả trận (bot người chơi, C2) ----------
export const AIM = { good: { p: 2.5, a: 1.5 }, avg: { p: 4.5, a: 2.5 }, poor: { p: 7, a: 4 } } as const;
export type AimLv = keyof typeof AIM;
export function simFight(def: FightDef, gear: Gear, aim: { p: number; a: number }, seed: number): Fight {
  const f = newFight(def, gear, seed);
  for (let guard = 0; !f.over && guard < 200; guard++) {
    if (f.turn === 0) {
      const tgt = f.units.filter(u => u.id !== 0 && u.hp > 0).sort((a, b) => a.hp - b.hp)[0]!;   // hạ đứa sắp chết trước (bớt một bên bắn)
      const a = aimWith(f, 0, tgt.id, aim); fire(f, a.ang, a.pow);
    } else aiTurn(f);
  }
  return f;
}
export function winRate(def: FightDef, gear: Gear, aim: { p: number; a: number }, n: number, seed0 = 1): number {
  let w = 0; for (let i = 0; i < n; i++) if (simFight(def, gear, aim, seed0 + i * 7919).over === 'win') w++;
  return w / n;
}
