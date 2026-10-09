// Âm thanh game (v72): tổng hợp bằng WebAudio ngay trên máy, không dùng tệp âm thanh nào (không bản quyền bên ngoài, không tải thêm).
// Tắt / bật lưu ở máy này (localStorage, tiện ích theo máy). Máy không hỗ trợ hoặc bị chặn → im lặng, không lỗi.

type Kind = 'ok' | 'bad' | 'place' | 'clear' | 'boom' | 'end';
let ctx: AudioContext | null = null;
const KEY = 'el-sfx-off';

export function muted(): boolean { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
export function setMuted(v: boolean): void { try { if (v) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* bỏ qua */ } }

function tone(a: AudioContext, f: number, t0: number, dur: number, type: OscillatorType = 'triangle', vol = 0.06): void {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.02);
}

export function sfx(k: Kind): void {
  if (muted() || typeof window === 'undefined') return;
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ||= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime;
    if (k === 'ok') { tone(ctx, 660, t, 0.12); tone(ctx, 990, t + 0.09, 0.16); }
    else if (k === 'bad') tone(ctx, 196, t, 0.22, 'sine', 0.05);
    else if (k === 'place') tone(ctx, 440, t, 0.06, 'square', 0.025);
    else if (k === 'clear') [523, 659, 784, 1047].forEach((f, i) => tone(ctx!, f, t + i * 0.06, 0.14));
    else if (k === 'boom') { tone(ctx, 110, t, 0.3, 'sawtooth', 0.05); tone(ctx, 82, t + 0.05, 0.3, 'sine', 0.05); }
    else if (k === 'end') [784, 659, 523].forEach((f, i) => tone(ctx!, f, t + i * 0.1, 0.18));
  } catch { /* âm thanh là phụ, không làm hỏng lượt chơi */ }
}
