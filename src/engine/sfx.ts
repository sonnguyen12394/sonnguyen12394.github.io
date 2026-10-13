// Âm thanh game (v72): tổng hợp bằng WebAudio ngay trên máy, không dùng tệp âm thanh nào (không bản quyền bên ngoài, không tải thêm).
// Máy không hỗ trợ hoặc bị chặn → im lặng, không lỗi.
// v132: MỘT công tắc. Trước đây Cài đặt (st.set.sfx) không tắt được âm của engine (engine đọc riêng localStorage). Giờ engine hỏi
// app qua host (soundFrom); khoá localStorage cũ chỉ còn là đường lui khi chưa nối host (test) và được chuyển sang một lần (migrateSound).

export type Kind = 'ok' | 'bad' | 'place' | 'clear' | 'boom' | 'end' | 'tap' | 'open' | 'close' | 'equip' | 'unequip' | 'tierup' | 'coin' | 'buy' | 'nope';
export interface Sound { sfx: boolean; music: boolean }
let ctx: AudioContext | null = null;
const KEY = 'el-sfx-off', MKEY = 'el-music-off';
let src: (() => Sound) | null = null, setM: ((on: boolean) => void) | null = null;
const ls = (k: string): boolean => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };

export function soundFrom(get: (() => Sound) | null, setMusic: ((on: boolean) => void) | null = null): void { src = get; setM = setMusic; }
// Chuyển khoá cũ của engine (nhạc tắt ở game) sang cài đặt chung của app, một lần.
export function migrateSound(): void {
  try { if (ls(MKEY)) { setM?.(false); localStorage.removeItem(MKEY); } if (ls(KEY)) localStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}
export function muted(): boolean { return src ? !src().sfx : ls(KEY); }
export function musicOff(): boolean { return src ? !src().music : ls(MKEY); }
export function toggleMusic(): boolean {
  const on = musicOff();
  if (setM) setM(on); else try { if (on) localStorage.removeItem(MKEY); else localStorage.setItem(MKEY, '1'); } catch { /* bỏ qua */ }
  return on;
}
export function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ||= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(a: AudioContext, f: number, t0: number, dur: number, type: OscillatorType = 'triangle', vol = 0.06, glide = 0): void {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}

export function sfx(k: Kind): void {
  if (muted() || typeof window === 'undefined') return;
  try {
    const a = ac(); if (!a) return;
    const t = a.currentTime;
    if (k === 'ok') { tone(a, 660, t, 0.12); tone(a, 990, t + 0.09, 0.16); }
    else if (k === 'bad') tone(a, 196, t, 0.22, 'sine', 0.05);
    else if (k === 'place') tone(a, 440, t, 0.06, 'square', 0.025);
    else if (k === 'clear') [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.06, 0.14));
    else if (k === 'boom') { tone(a, 110, t, 0.3, 'sawtooth', 0.05); tone(a, 82, t + 0.05, 0.3, 'sine', 0.05); }
    else if (k === 'end') [784, 659, 523].forEach((f, i) => tone(a, f, t + i * 0.1, 0.18));
    // v132 âm giao diện sảnh / nhân vật: ngắn (40–400 ms), nhỏ (≤ 0,06), không lặp.
    else if (k === 'tap') tone(a, 880, t, 0.05, 'sine', 0.03);
    else if (k === 'open') tone(a, 520, t, 0.14, 'sine', 0.035, 780);
    else if (k === 'close') tone(a, 700, t, 0.12, 'sine', 0.03, 440);
    else if (k === 'equip') { tone(a, 330, t, 0.06, 'square', 0.025); tone(a, 990, t + 0.04, 0.12, 'triangle', 0.05); }
    else if (k === 'unequip') { tone(a, 660, t, 0.08, 'triangle', 0.04); tone(a, 330, t + 0.05, 0.1, 'square', 0.02); }
    else if (k === 'tierup') { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(a, f, t + i * 0.07, 0.3, 'triangle', 0.05)); tone(a, 2093, t + 0.4, 0.4, 'sine', 0.025); }
    else if (k === 'coin') { tone(a, 1319, t, 0.06, 'square', 0.02); tone(a, 1760, t + 0.05, 0.16, 'square', 0.02); }
    else if (k === 'buy') { tone(a, 1047, t, 0.07, 'square', 0.02); tone(a, 1568, t + 0.06, 0.1, 'square', 0.02); [784, 1047].forEach((f, i) => tone(a, f, t + 0.14 + i * 0.07, 0.2, 'triangle', 0.045)); }
    else if (k === 'nope') { tone(a, 220, t, 0.09, 'square', 0.025); tone(a, 185, t + 0.1, 0.12, 'square', 0.025); }
  } catch { /* âm thanh là phụ, không làm hỏng lượt chơi */ }
}
