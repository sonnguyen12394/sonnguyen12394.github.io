// v102 "Sân khấu" dùng chung cho các game kỹ năng (GAME-CRITERIA §10.14). Gốc rễ chung của 14 game cũ: nằm trong khung app (M5),
// không hình / tiếng (M4), phản hồi nhạt (M2). Thay vì làm lại từng game, khi một game cũ đang chạy:
// - ẩn thanh trên / thanh tab của app, thêm thanh sân khấu gọn (✕ về sảnh, tên game);
// - cảnh động theo game vẽ bằng canvas phía sau (bong bóng, hơi cà phê, lá, bánh răng, sóng, nốt nhạc, sao, sương…);
// - nội dung game vẫn trên thẻ nền đặc (giữ tương phản WCAG AA);
// - câu đúng / sai: hạt nổ, âm, hiệu ứng nảy / rung.
// Không đổi luật, câu hỏi hay bằng chứng của game nào.

import { snd, STILL } from './wheelview.ts';
import { drawMore, type MoreScene } from './scenefx.ts';

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
  // v109 trò nhanh cũ trong app.js (Thử thách): cùng sân khấu
  speed: { vi: 'Tốc độ 60 giây', ico: '⚡', a: '#6b4a10', b: '#241805', fx: 'spark' },
  match: { vi: 'Ghép cặp', ico: '🧠', a: '#1d5a6b', b: '#071f26', fx: 'star' },
  ch: { vi: 'Thách đấu', ico: '🤝', a: '#5a1d3a', b: '#1f0714', fx: 'star' },
};
interface P { x: number; y: number; vx: number; vy: number; r: number; life: number; c: string; rot: number }

// v105–v106 Cảnh sống ở 1/3 trên màn (bố cục game di động: cảnh trên, điều khiển dưới). Thẻ câu hỏi HTML giữ nguyên bên dưới.
export type Scene =
  | { kind: 'garden'; pots: number[]; cur: number; ok: boolean | null; key: string }
  | { kind: 'cafe'; guest: string; prop?: string; mood: string | null; name: string; k: number; total: number; key: string }
  | MoreScene;
const POT = ['🌰', '🌱', '🌿', '🌸'];
// pop: canvas trong suốt phía TRÊN thẻ câu hỏi cho hạt nổ (v108: trước đây hạt vẽ ở canvas nền, nằm sau thẻ đặc nên gần như không thấy).
let pop: HTMLCanvasElement | null = null, popUsed = false;
let cv: HTMLCanvasElement | null = null, raf = 0, game = '', parts: P[] = [], amb: P[] = [], lastFb = '';
let scene: Scene | null = null, sceneKey = '', sceneAt = 0, guestKey = '', guestAt = 0;
export const sceneH = () => Math.round(Math.min(innerHeight * 0.3, 240));

function drawScene(g: CanvasRenderingContext2D, sc: Scene, W: number, now: number, still: boolean): void {
  const top = 56, h = sceneH(), t = still ? 1 : Math.min(1, (now - sceneAt) / 1200);
  if (sc.kind === 'garden') {
    const sky = g.createLinearGradient(0, top, 0, top + h); sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(1, '#d9f2c7'); g.fillStyle = sky;
    g.beginPath(); g.roundRect(8, top, W - 16, h, 18); g.fill();
    g.fillStyle = '#7a4a26'; g.beginPath(); g.roundRect(8, top + h * 0.72, W - 16, h * 0.28, [0, 0, 18, 18]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '28px system-ui'; g.fillText('☀️', W - 52, top + 36);
    const n = Math.max(1, sc.pots.length), step = (W - 40) / n;
    sc.pots.forEach((st, i) => {
      const cx = 20 + step * i + step / 2, by = top + h * 0.76, cur = i === sc.cur;
      g.fillStyle = cur ? '#d9733f' : '#b95f33'; g.beginPath(); g.moveTo(cx - 16, by - 14); g.lineTo(cx + 16, by - 14); g.lineTo(cx + 11, by + 10); g.lineTo(cx - 11, by + 10); g.closePath(); g.fill();
      let sz = 20 + st * 7; if (cur && sc.ok && t < 1) sz *= 1 + Math.sin(t * Math.PI) * 0.45;
      const wob = cur && sc.ok === false && t < 1 ? Math.sin(t * 30) * 5 : 0;
      g.font = `${sz}px system-ui`; g.textAlign = 'center'; g.fillText(POT[Math.min(3, st)]!, cx + wob, by - 16); g.textAlign = 'start';
      if (cur) { g.globalAlpha = 0.8; g.fillStyle = '#fff'; g.font = '16px system-ui'; g.textAlign = 'center'; g.fillText('▼', cx, top + 22 + (still ? 0 : Math.sin(now / 300) * 4)); g.textAlign = 'start'; g.globalAlpha = 1; }
      if (cur && sc.ok && t < 1) {   // bình tưới + giọt nước
        g.font = '34px system-ui'; g.save(); g.translate(cx + 34, top + 40); g.rotate(-0.5); g.fillText('🚿', -17, 12); g.restore();
        g.fillStyle = '#4fb3ff'; for (let k = 0; k < 6; k++) { const yy = top + 52 + ((now / 4 + k * 23) % (h * 0.4)); g.beginPath(); g.arc(cx + 10 - k * 3, yy, 2.5, 0, Math.PI * 2); g.fill(); }
      }
    });
  } else if (sc.kind !== 'cafe') {
    drawMore(g, sc, W, top, h, now, t, still);
  } else {
    const wall = g.createLinearGradient(0, top, 0, top + h); wall.addColorStop(0, '#f3d9b1'); wall.addColorStop(1, '#e2b07a'); g.fillStyle = wall;
    g.beginPath(); g.roundRect(8, top, W - 16, h, 18); g.fill();
    g.fillStyle = '#8a5a34'; g.fillRect(24, top + 30, W - 48, 6); g.font = '20px system-ui'; for (let x = 36; x < W - 40; x += 44) g.fillText(x % 88 ? '☕' : '🫖', x, top + 28);
    g.fillStyle = '#6b3d1d'; g.beginPath(); g.roundRect(8, top + h * 0.68, W - 16, h * 0.32, [0, 0, 18, 18]); g.fill();
    g.font = '30px system-ui'; g.fillText('☕', 30, top + h * 0.68 - 4);
    if (!still) { g.globalAlpha = 0.5; g.fillStyle = '#fff'; for (let k = 0; k < 3; k++) { const yy = top + h * 0.68 - 40 - ((now / 30 + k * 12) % 30); g.beginPath(); g.arc(46 + Math.sin(now / 300 + k) * 4, yy, 3, 0, Math.PI * 2); g.fill(); } g.globalAlpha = 1; }
    // khách bước vào từ phải
    const tg = still ? 1 : Math.min(1, (now - guestAt) / 700), gx = W - 40 - (W * 0.4) * (1 - Math.pow(1 - tg, 3)), gy = top + h * 0.68 - 6;
    g.font = '64px system-ui'; g.textAlign = 'center'; g.fillText(sc.guest, gx, gy); g.textAlign = 'start';
    if (sc.prop) { g.font = '28px system-ui'; g.fillText(sc.prop, gx - 52, gy - 6); }
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(gx + 22, gy - 96, 52, 40, 12); g.fill(); g.font = '24px system-ui'; g.fillText(sc.mood ?? '💬', gx + 34, gy - 66);
    if (sc.name) { g.font = '700 14px system-ui'; const w = g.measureText(sc.name).width + 16; g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.roundRect(gx - w / 2, gy + 6, w, 22, 8); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(sc.name, gx, gy + 22); g.textAlign = 'start'; }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.font = '700 14px system-ui'; g.fillText(`Khách ${Math.min(sc.k + 1, sc.total)}/${sc.total}`, 24, top + h - 12);
  }
}

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
  const pg = pop?.getContext('2d') ?? null;
  if (pop && pg) { if (pop.width !== cv.width || pop.height !== cv.height) { pop.width = cv.width; pop.height = cv.height; } pg.setTransform(dpr, 0, 0, dpr, 0, 0); if (popUsed) pg.clearRect(0, 0, W, H); }   // chỉ xoá khi khung trước có hạt (WebKit chậm)
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = g.createLinearGradient(0, 0, W * 0.4, H); bg.addColorStop(0, t.a); bg.addColorStop(1, t.b); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const still = STILL();
  for (const p of amb) {
    if (!still) { p.x += p.vx; p.y += p.vy; if (p.y < -60) p.y = H + 40; if (p.y > H + 60) p.y = -40; if (p.x < -60) p.x = W + 40; if (p.x > W + 60) p.x = -40; }
    drawAmb(g, t, p, still ? 0 : now);
  }
  if (scene) drawScene(g, scene, W, now, still);
  for (let k = parts.length - 1; k >= 0; k--) {
    const p = parts[k]!; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.022;
    if (p.life <= 0) { parts.splice(k, 1); continue; }
    const q = pg ?? g; q.globalAlpha = p.life; q.fillStyle = p.c; q.beginPath(); q.arc(p.x, p.y, p.r, 0, Math.PI * 2); q.fill();
  }
  if (pg) pg.globalAlpha = 1;
  popUsed = parts.length > 0;
  g.globalAlpha = 1;
  raf = requestAnimationFrame(loop);
}

function burst(x: number, y: number, good: boolean, k = 1): void {
  if (STILL()) return;
  const cs = good ? ['#fde68a', '#86efac', '#67e8f9', '#f9a8d4'] : ['#fca5a5', '#fdba74'];
  for (let j = 0, m = Math.round((good ? 34 : 12) * k); j < m; j++) { const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * (good ? 5 : 2.5); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (good ? 3 : 0), r: 2 + Math.random() * 3, life: 1, c: cs[j % cs.length]!, rot: 0 }); }
}

// v108 Hiệu ứng trên bàn chơi có sẵn (Xếp Khối nổ hàng, Câu đố giải nhóm, Thám hiểm mở ô, Bàn Cờ đổ xúc xắc / xây nhà):
// hạt nổ ở đúng phần tử, âm, lớp CSS nảy / xoay. Chỉ trình bày; gọi sau khi app vẽ lại.
export function stageBurst(sel: string, opts: { big?: boolean; cls?: string; all?: boolean; last?: boolean } = {}): void {
  if (typeof document === 'undefined') return;
  const found = [...document.querySelectorAll<HTMLElement>(sel)], els = opts.all ? found.slice(0, 16) : opts.last ? found.slice(-1) : found.slice(0, 1);
  if (!els.length) return;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (cv) burst(r.left + r.width / 2, r.top + r.height / 2, true, opts.big ? 2 : 1);
    if (opts.cls) { el.classList.remove(opts.cls); void el.offsetWidth; el.classList.add(opts.cls); }
  }
  snd.found();
}

// Gọi sau mỗi lần app vẽ lại #app. g: game cũ đang chạy (null = không có, hoặc game chủ lực / màn khác).
export function stageSync(g: string | null, sc: Scene | null = null, exit = 'data-e="stexit"'): void {
  if (typeof document === 'undefined' || !document.body) return;
  const on = !!g && !!STAGES[g], b = document.body;
  b.classList.toggle('stage', on);
  b.classList.toggle('scene', on && !!sc);
  if (on && sc) { b.style.setProperty('--sceneh', `${sceneH()}px`); if (sc.key !== sceneKey) { sceneKey = sc.key; sceneAt = performance.now(); } if (sc.kind === 'cafe' && `${sc.k}` !== guestKey) { guestKey = `${sc.k}`; guestAt = performance.now(); } }
  scene = on ? sc : null;
  if (!on) { if (game) { cancelAnimationFrame(raf); cv?.remove(); cv = null; pop?.remove(); pop = null; game = ''; parts = []; lastFb = ''; delete b.dataset.game; } return; }
  const t = STAGES[g!]!;
  b.dataset.game = g!;
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'stagefx'; cv.setAttribute('aria-hidden', 'true'); b.prepend(cv); }
  if (!pop) { pop = document.createElement('canvas'); pop.id = 'stagepop'; pop.setAttribute('aria-hidden', 'true'); b.appendChild(pop); }
  if (game !== g) { game = g!; amb = ambient(t, innerWidth, innerHeight); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  const app = document.getElementById('app'); if (!app) return;
  // Thanh sân khấu: ✕ về sảnh + tên game (app vẽ lại #app mỗi thao tác nên chèn lại mỗi lần).
  if (!app.querySelector('.stagebar')) app.insertAdjacentHTML('afterbegin', `<div class="stagebar"><button class="stagex" ${exit} aria-label="Đóng game">✕</button><b>${t.ico} ${t.vi}</b></div>`);
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
