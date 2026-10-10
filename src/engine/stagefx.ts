// v102 "Sân khấu" dùng chung cho các game kỹ năng (GAME-CRITERIA §10.14). Gốc rễ chung của 14 game cũ: nằm trong khung app (M5),
// không hình / tiếng (M4), phản hồi nhạt (M2). Thay vì làm lại từng game, khi một game cũ đang chạy:
// - ẩn thanh trên / thanh tab của app, thêm thanh sân khấu gọn (✕ về sảnh, tên game);
// - cảnh động theo game vẽ bằng canvas phía sau (bong bóng, hơi cà phê, lá, bánh răng, sóng, nốt nhạc, sao, sương…);
// - nội dung game vẫn trên thẻ nền đặc (giữ tương phản WCAG AA);
// - câu đúng / sai: hạt nổ, âm, hiệu ứng nảy / rung.
// Không đổi luật, câu hỏi hay bằng chứng của game nào.

import { snd, STILL } from './wheelview.ts';

export interface StageTheme { vi: string; ico: string; a: string; b: string; fx: 'bubble' | 'steam' | 'leaf' | 'gear' | 'wave' | 'note' | 'star' | 'fog' | 'spark' }
export const STAGES: Record<string, StageTheme> = {
  bubbles: { vi: 'Bắt Âm', ico: '🎯', a: '#0b4f6c', b: '#06202e', fx: 'bubble' },
  cafe: { vi: 'Quán Cà Phê', ico: '☕', a: '#5a3215', b: '#1f0f05', fx: 'steam' },
  garden: { vi: 'Vườn từ', ico: '🌱', a: '#245c2a', b: '#0b2410', fx: 'leaf' },
  shop: { vi: 'Xưởng sửa câu', ico: '🛠️', a: '#3d4451', b: '#151a22', fx: 'gear' },
  radio: { vi: 'Đài phát thanh', ico: '📻', a: '#43206b', b: '#140828', fx: 'wave' },
  kara: { vi: 'Karaoke', ico: '🎤', a: '#6b1d5c', b: '#22071d', fx: 'note' },
  case: { vi: 'Thám tử', ico: '🔍', a: '#2b2f3a', b: '#0c0d12', fx: 'fog' },
  letter: { vi: 'Thư gửi cư dân', ico: '✉️', a: '#6b3d1d', b: '#24130a', fx: 'leaf' },
  robot: { vi: 'Ra lệnh cho robot', ico: '🤖', a: '#1d4a6b', b: '#081a26', fx: 'spark' },
  puzzle: { vi: 'Câu đố ngày', ico: '📅', a: '#4b2a6b', b: '#170b26', fx: 'star' },
  blocks: { vi: 'Xếp Khối Chữ', ico: '🧱', a: '#283a6b', b: '#0a1226', fx: 'spark' },
  board: { vi: 'Bàn Cờ Phố', ico: '🎲', a: '#1f5c4a', b: '#082019', fx: 'star' },
  tower: { vi: 'Leo tháp', ico: '🏰', a: '#2a2a5c', b: '#0a0a20', fx: 'star' },
  fog: { vi: 'Thám hiểm sương mù', ico: '🗺️', a: '#3a4a5a', b: '#11171d', fx: 'fog' },
};
interface P { x: number; y: number; vx: number; vy: number; r: number; life: number; c: string; rot: number }

let cv: HTMLCanvasElement | null = null, raf = 0, game = '', parts: P[] = [], amb: P[] = [], lastFb = '';

function ambient(t: StageTheme, W: number, H: number): P[] {
  const n = t.fx === 'fog' ? 10 : 26, out: P[] = [];
  for (let k = 0; k < n; k++) out.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: t.fx === 'bubble' || t.fx === 'steam' || t.fx === 'note' ? -(0.2 + Math.random() * 0.6) : t.fx === 'leaf' ? 0.3 + Math.random() * 0.5 : (Math.random() - 0.5) * 0.2, r: t.fx === 'fog' ? 80 + Math.random() * 120 : 3 + Math.random() * 9, life: 1, c: '#fff', rot: Math.random() * 6 });
  return out;
}
function drawAmb(g: CanvasRenderingContext2D, t: StageTheme, p: P, now: number): void {
  g.save(); g.translate(p.x, p.y);
  switch (t.fx) {
    case 'bubble': g.globalAlpha = 0.22; g.strokeStyle = '#bde9ff'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, p.r * 1.6, 0, Math.PI * 2); g.stroke(); break;
    case 'steam': g.globalAlpha = 0.1; g.fillStyle = '#fff'; g.beginPath(); g.arc(Math.sin(now / 700 + p.rot) * 8, 0, p.r * 2.4, 0, Math.PI * 2); g.fill(); break;
    case 'leaf': g.globalAlpha = 0.35; g.rotate(p.rot + now / 1500); g.fillStyle = '#8fd694'; g.beginPath(); g.ellipse(0, 0, p.r, p.r / 2.4, 0, 0, Math.PI * 2); g.fill(); break;
    case 'gear': g.globalAlpha = 0.12; g.rotate(p.rot + now / 3000); g.strokeStyle = '#d5dbe5'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, p.r * 3, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 8; k++) { g.rotate(Math.PI / 4); g.fillStyle = '#d5dbe5'; g.fillRect(p.r * 3 - 2, -3, 8, 6); } break;
    case 'wave': g.globalAlpha = 0.18; g.strokeStyle = '#d6b8ff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, ((now / 30 + p.rot * 40) % 120) + 4, -0.6, 0.6); g.stroke(); break;
    case 'note': g.globalAlpha = 0.35; g.fillStyle = '#ffc6ee'; g.font = `${p.r * 2.4}px system-ui`; g.fillText(p.rot > 3 ? '♪' : '♫', 0, 0); break;
    case 'star': g.globalAlpha = 0.3 + 0.3 * Math.sin(now / 500 + p.rot); g.fillStyle = '#fff6c7'; g.beginPath(); g.arc(0, 0, p.r / 3, 0, Math.PI * 2); g.fill(); break;
    case 'fog': g.globalAlpha = 0.06; g.fillStyle = '#e6edf3'; g.beginPath(); g.arc(0, 0, p.r, 0, Math.PI * 2); g.fill(); break;
    case 'spark': g.globalAlpha = 0.25 + 0.25 * Math.sin(now / 400 + p.rot); g.fillStyle = '#a7e3ff'; g.fillRect(-p.r / 4, -p.r / 4, p.r / 2, p.r / 2); break;
  }
  g.restore();
}

function loop(now: number): void {
  if (!cv || !game) return;
  const t = STAGES[game]!, g = cv.getContext('2d')!, dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); amb = ambient(t, W, H); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = g.createLinearGradient(0, 0, W * 0.4, H); bg.addColorStop(0, t.a); bg.addColorStop(1, t.b); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const still = STILL();
  for (const p of amb) {
    if (!still) { p.x += p.vx; p.y += p.vy; if (p.y < -60) p.y = H + 40; if (p.y > H + 60) p.y = -40; if (p.x < -60) p.x = W + 40; if (p.x > W + 60) p.x = -40; }
    drawAmb(g, t, p, still ? 0 : now);
  }
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k]!; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.022;
    if (p.life <= 0) { parts.splice(k, 1); continue; }
    g.globalAlpha = p.life; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  raf = requestAnimationFrame(loop);
}

function burst(x: number, y: number, good: boolean): void {
  if (STILL()) return;
  const cs = good ? ['#fde68a', '#86efac', '#67e8f9', '#f9a8d4'] : ['#fca5a5', '#fdba74'];
  for (let k = 0; k < (good ? 34 : 12); k++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * (good ? 5 : 2.5); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (good ? 3 : 0), r: 2 + Math.random() * 3, life: 1, c: cs[k % cs.length]!, rot: 0 }); }
}

// Gọi sau mỗi lần app vẽ lại #app. g: game cũ đang chạy (null = không có, hoặc game chủ lực / màn khác).
export function stageSync(g: string | null): void {
  if (typeof document === 'undefined' || !document.body) return;
  const on = !!g && !!STAGES[g], b = document.body;
  b.classList.toggle('stage', on);
  if (!on) { if (game) { cancelAnimationFrame(raf); cv?.remove(); cv = null; game = ''; parts = []; lastFb = ''; delete b.dataset.game; } return; }
  const t = STAGES[g!]!;
  b.dataset.game = g!;
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'stagefx'; cv.setAttribute('aria-hidden', 'true'); b.prepend(cv); }
  if (game !== g) { game = g!; amb = ambient(t, innerWidth, innerHeight); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  const app = document.getElementById('app'); if (!app) return;
  // Thanh sân khấu: ✕ về sảnh + tên game (app vẽ lại #app mỗi thao tác nên chèn lại mỗi lần).
  if (!app.querySelector('.stagebar')) app.insertAdjacentHTML('afterbegin', `<div class="stagebar"><button class="stagex" data-e="stexit" aria-label="Đóng game">✕</button><b>${t.ico} ${t.vi}</b></div>`);
  // Phản hồi mới (khác lần trước) → hạt + âm + nảy / rung.
  const fb = app.querySelector<HTMLElement>('.fb.good, .fb.bad, .sheet.good, .sheet.bad');
  const sig = fb ? `${fb.className}|${fb.textContent?.slice(0, 80)}` : '';
  if (fb && sig !== lastFb) {
    const good = fb.classList.contains('good'), r = fb.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + 20, good);
    if (good) snd.found(); else snd.no();
    fb.classList.add(good ? 'stpop' : 'stshake');
  }
  lastFb = sig;
}
