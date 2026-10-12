// v124 Âm cảnh từng khu (GAME-CRITERIA §13.2, H4 "nghe tiếng thật"): tiếng nền tổng hợp bằng WebAudio ngay trên máy, không tệp ngoài.
//   market (Chợ Sáng): ồn rì rầm + tiếng gọi xa; harbor (Bến Cảng): gió lên xuống + còi tàu trầm; forest (Rừng Trúc): gió lá + chim.
// Âm lượng thấp (nghe được câu nói phía trên), tắt khi bật "giảm chuyển động / tắt âm" của app (sfx muted). Lỗi / không hỗ trợ → im lặng.

import { muted } from './sfx.ts';

export type Amb = 'market' | 'harbor' | 'forest';
let ctx: AudioContext | null = null, out: GainNode | null = null, timer: ReturnType<typeof setInterval> | null = null, cur: Amb | null = null;
const nodes: AudioNode[] = [];

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ||= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
function noise(a: AudioContext, brown: boolean): AudioBufferSourceNode {
  const len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
  const s = a.createBufferSource(); s.buffer = buf; s.loop = true; return s;
}
function blip(a: AudioContext, f: number, dur: number, vol: number, type: OscillatorType = 'sine', glide = 0): void {
  if (!out) return;
  const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + glide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.05, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}

export const ambOn = (): Amb | null => cur;
export function ambStop(): void {
  if (timer) { clearInterval(timer); timer = null; }
  for (const n of nodes.splice(0)) { try { (n as AudioScheduledSourceNode).stop?.(); } catch { /* bỏ qua */ } try { n.disconnect(); } catch { /* bỏ qua */ } }
  if (out) { try { out.disconnect(); } catch { /* bỏ qua */ } out = null; }
  cur = null;
}
export function ambStart(kind: Amb, level = 0.06): void {
  if (cur === kind) return;
  ambStop();
  if (muted()) return;
  try {
    const a = ac(); if (!a) return;
    out = a.createGain(); out.gain.value = level; out.connect(a.destination);
    const src = noise(a, kind !== 'market'), f = a.createBiquadFilter();
    f.type = kind === 'market' ? 'bandpass' : 'lowpass'; f.frequency.value = kind === 'market' ? 700 : kind === 'harbor' ? 420 : 900; f.Q.value = kind === 'market' ? 0.6 : 0.3;
    src.connect(f).connect(out); src.start(); nodes.push(src, f);
    if (kind === 'harbor' || kind === 'forest') {   // gió: âm lượng lên xuống chậm
      const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = kind === 'harbor' ? 0.12 : 0.2; lg.gain.value = level * 0.6;
      lfo.connect(lg).connect(out.gain); lfo.start(); nodes.push(lfo, lg);
    }
    cur = kind;
    timer = setInterval(() => {
      const b = ctx; if (!b || !out || Math.random() < 0.45) return;
      if (kind === 'market') blip(b, 220 + Math.random() * 260, 0.25 + Math.random() * 0.3, 0.012, 'triangle', (Math.random() - 0.5) * 120);   // tiếng gọi xa
      else if (kind === 'harbor') { if (Math.random() < 0.18) blip(b, 98, 1.6, 0.03, 'sawtooth'); else blip(b, 1800, 0.08, 0.004); }   // còi tàu / tiếng xích
      else blip(b, 2200 + Math.random() * 1400, 0.12, 0.01, 'sine', 600);   // chim
    }, 1200);
  } catch { ambStop(); }
}
