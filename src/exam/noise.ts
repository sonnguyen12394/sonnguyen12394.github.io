// Bản "có tiếng ồn" của bài nghe luyện tập (6.6): trộn tiếng ồn hồng nhỏ ngay trên máy người học bằng Web Audio,
// thay vì lưu thêm một tệp MP3 cho mỗi bài. Mức ồn khớp bản ffmpeg cũ (anoisesrc pink, biên độ 0,03).

export const NOISE_AMP = 0.03;

// Tiếng ồn hồng (bộ lọc Paul Kellet), lặp được; rnd truyền vào để test được.
export function pinkNoise(len: number, amp = NOISE_AMP, rnd: () => number = Math.random): Float32Array {
  const out = new Float32Array(len);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = rnd() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    const p = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    out[i] = Math.max(-1, Math.min(1, p * 0.11 * amp));   // p·0,11 ≈ biên độ 1 → nhân với mức mong muốn
  }
  return out;
}

type AC = typeof AudioContext;
let ctx: AudioContext | null = null, src: MediaElementAudioSourceNode | null = null, el: HTMLMediaElement | null = null, noise: AudioBufferSourceNode | null = null;

export const noiseSupported = (): boolean => typeof window !== 'undefined' && !!((window as unknown as { AudioContext?: AC; webkitAudioContext?: AC }).AudioContext || (window as unknown as { webkitAudioContext?: AC }).webkitAudioContext);

// Gọi trong thao tác của người dùng (bấm nút) để iOS cho phép phát.
export function unlockAudio(): void {
  if (!noiseSupported()) return;
  const C = (window as unknown as { AudioContext?: AC }).AudioContext ?? (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
  ctx ??= new C();
  void ctx.resume();
}

// Nối tiếng ồn vào phần tử <audio>: chỉ kêu khi bài đang phát. Mỗi phần tử chỉ nối một lần (giới hạn của Web Audio).
export function attachNoise(audio: HTMLMediaElement): void {
  if (!noiseSupported()) return;
  unlockAudio();
  if (!ctx || el === audio) return;
  detachNoise();
  el = audio; src = ctx.createMediaElementSource(audio); src.connect(ctx.destination);
  const sr = ctx.sampleRate, buf = ctx.createBuffer(1, sr * 4, sr);
  buf.copyToChannel(pinkNoise(sr * 4) as Float32Array<ArrayBuffer>, 0);
  const start = () => { if (!ctx || noise) return; noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true; noise.connect(ctx.destination); noise.start(); };
  const stop = () => { noise?.stop(); noise?.disconnect(); noise = null; };
  audio.addEventListener('play', start); audio.addEventListener('pause', stop); audio.addEventListener('ended', stop);
  if (!audio.paused) start();
}

export function detachNoise(): void {
  noise?.stop(); noise?.disconnect(); noise = null;
  src?.disconnect(); src = null; el = null;
}
