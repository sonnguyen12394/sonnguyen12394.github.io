// v132 Nhạc nền sảnh (GAME-CRITERIA §19, M7): vòng lặp 16 ô nhịp, gam ngũ cung, 3 bè (bass, hợp âm rải, giai điệu), sinh từ hạt giống cố định.
// score() thuần (test được); phần phát dùng lịch Web Audio, không tệp âm thanh. Luật:
// - chỉ bắt đầu sau lần chạm đầu tiên của người dùng (chính sách tự phát của trình duyệt);
// - một công tắc: musicOff() (cài đặt chung của app, sfx.ts); chế độ tập trung đã tắt nhạc ở host;
// - tự dừng khi sảnh không còn trên màn (.lbstage biến mất: vào game, bài học, tab khác).

import { ac, musicOff } from './sfx.ts';

export interface Note { t: number; d: number; f: number; v: number; w: OscillatorType }   // t, d: phách; f: Hz; v: âm lượng
export const BPM = 84, BEATS = 64;   // 16 ô nhịp × 4 phách ≈ 46 giây
const PENTA = [0, 2, 4, 7, 9];       // ngũ cung trưởng (C D E G A)
const hz = (semi: number) => 261.63 * Math.pow(2, semi / 12);
// Vòng hợp âm I – vi – IV – V (C, Am, F, G): mỗi ô nhịp một hợp âm, lặp 4 lần.
const CHORDS = [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]];

export function score(seed = 132): Note[] {
  let x = seed >>> 0 || 1;
  const rnd = () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; };
  const out: Note[] = [];
  for (let bar = 0; bar < BEATS / 4; bar++) {
    const ch = CHORDS[bar % 4]!, t0 = bar * 4;
    out.push({ t: t0, d: 3.6, f: hz(ch[0]! - 12), v: 0.022, w: 'sine' });                                  // bass
    ch.forEach((s, i) => out.push({ t: t0 + 0.5 + i * 0.5, d: 1.2, f: hz(s), v: 0.012, w: 'triangle' }));   // hợp âm rải
    // Giai điệu: 2–4 nốt ngũ cung mỗi ô nhịp, ô nhịp chẵn của nửa sau nghỉ bớt cho đỡ đầy.
    const n = bar % 8 === 7 ? 1 : 2 + Math.floor(rnd() * 3);
    let beat = 0;
    for (let k = 0; k < n && beat < 4; k++) {
      const deg = PENTA[Math.floor(rnd() * PENTA.length)]!, oct = rnd() < 0.3 ? 24 : 12, d = n === 1 ? 3 : [0.5, 1, 1, 1.5][Math.floor(rnd() * 4)]!;
      out.push({ t: t0 + beat, d: Math.min(d, 4 - beat), f: hz(deg + oct), v: 0.018, w: 'sine' });
      beat += d;
    }
  }
  return out;
}

let timer: ReturnType<typeof setInterval> | null = null, bus: GainNode | null = null, t0 = 0, next = 0, want = false, armed = false;
const NOTES = score();
const SEC = 60 / BPM, LOOK = 1.2;   // lịch trước 1,2 giây

const onStage = (): boolean => typeof document !== 'undefined' && !!document.querySelector('.lbstage');
function tick(): void {
  const a = ac();
  if (!a || !bus || musicOff() || !onStage()) { stop(); return; }
  const end = a.currentTime + LOOK, loop = BEATS * SEC;
  while (t0 + next * SEC < end) {
    const base = t0 + Math.floor(next / BEATS) * loop, beat = next % BEATS;
    for (const n of NOTES) if (n.t >= beat && n.t < beat + 1) play(a, n, base + n.t * SEC);
    next++;
  }
}
function play(a: AudioContext, n: Note, at: number): void {
  const o = a.createOscillator(), g = a.createGain();
  o.type = n.w; o.frequency.setValueAtTime(n.f, at);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(n.v, at + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, at + n.d * SEC);
  o.connect(g).connect(bus!); o.start(at); o.stop(at + n.d * SEC + 0.05);
}
function begin(): void {
  if (timer || !want || musicOff() || !onStage()) return;
  const a = ac(); if (!a) return;
  bus = a.createGain(); bus.gain.value = 0.9; bus.connect(a.destination);
  t0 = a.currentTime + 0.1; next = 0;
  tick(); timer = setInterval(tick, 400);
}
export function stop(): void {
  if (timer) clearInterval(timer); timer = null;
  try { bus?.disconnect(); } catch { /* bỏ qua */ }
  bus = null;
}
// Sảnh vừa vẽ: muốn có nhạc. Nếu người dùng chưa chạm lần nào thì chờ lần chạm đầu (không tự phát).
export function lobbyMusic(on: boolean): void {
  want = on && !musicOff();
  if (!on) { stop(); return; }
  if (timer) return;
  // Đã có lần chạm trong trang (userActivation) thì phát luôn; chưa thì chờ, không tạo AudioContext trước lần chạm đầu.
  const act = (typeof navigator !== 'undefined' && (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) ?? false;
  if (act) { begin(); return; }
  if (armed || typeof document === 'undefined') return;
  armed = true;
  const go = () => { armed = false; document.removeEventListener('pointerdown', go, true); document.removeEventListener('keydown', go, true); setTimeout(begin, 0); };
  document.addEventListener('pointerdown', go, true); document.addEventListener('keydown', go, true);
}
export const playing = (): boolean => !!timer;
