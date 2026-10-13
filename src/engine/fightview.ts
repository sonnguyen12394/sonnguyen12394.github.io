// v133 Chiến Binh Chữ: màn trận vẽ bằng canvas (lớp phủ ngoài #app, cùng khuôn Vòng Chữ / Mỏ Chữ). Luật ở fight.ts, lượt ở fightctl.ts.
// Ở đây: kéo ngược như ná để ngắm, mũi tên quỹ đạo 1/3 đường (không tính gió), dấu ✕ phát trước, cờ gió, đồng hồ lượt, camera theo đạn,
// nổ khoét đất, số sát thương bay, rung màn, chậm thời gian khi kết liễu, bản đồ nhỏ, âm tổng hợp. Hình tự vẽ (docs/ASSETS.md).

import { W, H, COLS, CW, UR, BLAST, CRATER, MAX_ROUND, groundAt, carve, center, trace, gustFlipIn, type Fight, type Shot, type Unit } from './fight.ts';
import { Music, musicOff, STILL, snd } from './wheelview.ts';
import { ac, muted } from './sfx.ts';

export interface Snap { ground: number[]; units: Array<{ x: number; y: number; hp: number }> }
export const snap = (f: Fight): Snap => ({ ground: f.ground.slice(), units: f.units.map(u => ({ x: u.x, y: u.y, hp: u.hp })) });
export interface FightUi {
  f: () => Fight | null;
  hero: string;                       // SVG nhân vật (chibi v132, cầm Vũ khí đúng bậc đang mặc)
  timer: number;                      // giây mỗi lượt; 0 = không đếm (trận luyện tay đầu)
  onFire(ang: number, pow: number): void;
  onPass(): void;
  onWalk(dx: number): void;
}
export interface FightHandle { play(shots: Shot[], before: Snap, done: () => void): void; refresh(): void; end(html: string | null): void; banner(t: string, ms?: number): void; busy(): boolean; close(): void; music(): void; fb(open: boolean): void }

interface Part { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }
interface Pop { x: number; y: number; t: number; text: string; c: string; big: boolean }
const PAL = { sky: ['#2b2257', '#7a3f7d', '#f08a6b', '#ffd39a'], dirt: ['#8a5a33', '#4a2c18'], grass: '#7ed957', city: '#3a2a5e', hill: '#5b3d72' };

// ---------- Âm ----------
function noise(dur: number, f0: number, f1: number, vol: number): void {
  if (muted()) return; const a = ac(); if (!a) return;
  try {
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f0, a.currentTime); fl.frequency.exponentialRampToValueAtTime(Math.max(40, f1), a.currentTime + dur);
    g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    s.connect(fl).connect(g).connect(a.destination); s.start(); s.stop(a.currentTime + dur + 0.02);
  } catch { /* bỏ qua */ }
}
function tone(f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'triangle'): void {
  if (muted()) return; const a = ac(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch { /* bỏ qua */ }
}
const fx = {
  shoot: () => { noise(0.18, 2400, 300, 0.12); tone(520, 180, 0.22, 0.05); },
  boom: (big: boolean) => { noise(big ? 0.7 : 0.45, big ? 1600 : 1100, 60, big ? 0.32 : 0.22); tone(110, 40, 0.5, 0.08, 'sine'); },
  hurt: () => { tone(300, 120, 0.25, 0.06, 'square'); },
  pull: (p: number) => { tone(200 + p * 4, 210 + p * 4, 0.04, 0.012, 'sine'); },
  tick: () => tone(880, 880, 0.05, 0.02, 'square'),
  lose: () => { [0, 1, 2].forEach(i => setTimeout(() => tone(330 - i * 60, 300 - i * 60, 0.35, 0.05, 'triangle'), i * 220)); },
};

export function openFight(ui: FightUi): FightHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx cbfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Trận đấu');
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="cbexit" aria-label="Thoát trận">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><button class="whb" data-e="cbfbopen" aria-label="Góp ý nhanh">💬</button><button class="whb" data-e="cbmusic" aria-label="Bật / tắt nhạc nền">🎵</button></div>
    <div class="whbot cbbot"><button class="whb cbmv" data-k="-1" aria-label="Đi sang trái (giữ)">◀</button><button class="whb cbmv" data-k="1" aria-label="Đi sang phải (giữ)">▶</button>
      <span class="cbaim" aria-label="Góc và lực"></span><span class="cbtime" aria-hidden="true"></span><button class="whbig cbfire" data-e="cbfire" aria-label="Bắn với góc và lực đang chọn">🔥 Bắn</button></div>
    <div class="whwin cbend" hidden></div>
    <form class="cbfb" data-eform="cbfb" hidden><b>💬 Góp ý nhanh</b><div class="cbstars" role="radiogroup" aria-label="Chấm 1 đến 5 sao">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="cbst" data-e="cbstar" data-s="${i}" role="radio" aria-checked="false" aria-label="${i} sao">☆</button>`).join('')}</div>
      <input name="t" maxlength="200" autocomplete="off" placeholder="Một dòng: vui ở đâu, chán ở đâu?" aria-label="Một dòng góp ý"><input type="hidden" name="s" value="0">
      <div class="whrow"><button class="whbig" type="submit">Gửi</button><button class="whb wide" type="button" data-e="cbfbclose">Đóng</button></div></form>
    <p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  root.tabIndex = -1;   // nhận phím (mũi tên chỉnh góc / đi, +/− lực, Enter bắn)
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  setTimeout(() => { if (!root.contains(document.activeElement)) root.focus({ preventScroll: true }); }, 30);
  const cv = root.querySelector('canvas')!, g = cv.getContext('2d')!, live = root.querySelector('.whlive')!, endBox = root.querySelector<HTMLElement>('.cbend')!;
  const fbBox = root.querySelector<HTMLFormElement>('.cbfb')!, aimEl = root.querySelector<HTMLElement>('.cbaim')!, timeEl = root.querySelector<HTMLElement>('.cbtime')!;
  const still = STILL(), music = new Music();
  let Wp = 0, Hp = 0, dpr = 1, raf = 0, alive = true, s = 1, camX = 0, offY = 0;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1); Wp = root.clientWidth; Hp = root.clientHeight;
    cv.width = Wp * dpr; cv.height = Hp * dpr; cv.style.width = Wp + 'px'; cv.style.height = Hp + 'px';
    const av = Math.max(200, Hp - 150);   // trừ thanh trên / dưới
    s = Math.max(Math.min(av / H, Wp / W), Math.min(Wp / 540, av / H));
    offY = Hp - 74 - H * s + 30 * s;
  };
  resize(); addEventListener('resize', resize);

  // Hình nhân vật: SVG chibi → ảnh (thêm xmlns để trình duyệt vẽ được từ data URL).
  const heroImg = new Image();
  heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ui.hero.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));

  // ---------- Trạng thái hiển thị (trễ hơn trạng thái thật khi đang chạy hoạt cảnh) ----------
  let disp: Snap | null = null;
  const sync = () => { const f = ui.f(); if (f) disp = snap(f); };
  sync();
  interface Anim { shots: Shot[]; k: number; t: number; done: () => void; hold: number }
  let anim: Anim | null = null, last: { x: number; y: number } | null = null, lastAim: { ang: number; pow: number } | null = null;
  let bannerTxt = '', bannerAt = 0, bannerMs = 1600, turnAt = performance.now(), shake = 0, shakeAt = 0, slow = 0, tickLeft = -1;
  const parts: Part[] = [], pops: Pop[] = [], flash: Record<number, number> = {}, rings: Array<{ x: number; y: number; t: number }> = [];
  let drag: { x0: number; y0: number } | null = null, aiming = false, fbOpen = false, endOn = false;
  const clouds = Array.from({ length: 6 }, (_, i) => ({ x: (i * 211) % W, y: 40 + (i * 53) % 140, w: 60 + (i * 37) % 70 }));

  const sx = (x: number) => (x - camX) * s, sy = (y: number) => offY + y * s;
  const wx = (px: number) => px / s + camX, wy = (py: number) => (py - offY) / s;
  const vw = () => Wp / s;
  const clampCam = (x: number) => { const v = vw(); return v >= W ? (W - v) / 2 : Math.max(0, Math.min(W - v, x)); };
  const myTurn = () => { const f = ui.f(); return !!f && !f.over && f.turn === 0 && !anim && !endOn; };

  // ---------- Ngắm ----------
  const hero = (): Unit | null => ui.f()?.units[0] ?? null;
  function setAim(ang: number, pow: number): void {
    const u = hero(); if (!u) return;
    u.ang = Math.round(Math.max(0, Math.min(90, ang))); u.pow = Math.round(Math.max(0, Math.min(100, pow)));
  }
  const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  cv.addEventListener('pointerdown', e => {
    if (!myTurn()) return; const p = local(e);
    cv.setPointerCapture(e.pointerId); drag = { x0: p.x, y0: p.y }; aiming = false; music.start();
  });
  cv.addEventListener('pointermove', e => {
    if (!drag || !myTurn()) return; const p = local(e), dx = drag.x0 - p.x, dy = drag.y0 - p.y, len = Math.hypot(dx, dy);
    if (len < 10) return;
    const u = hero()!; aiming = true;
    if (Math.abs(dx) > 6) u.face = dx >= 0 ? 1 : -1;
    const ang = Math.atan2(dy, Math.abs(dx)) * 180 / Math.PI, pow = Math.min(100, (len / Math.max(120, Math.min(Wp, Hp) * 0.42)) * 100);
    const before = u.pow; setAim(ang, pow); if (Math.abs(u.pow - before) >= 5) fx.pull(u.pow);
  });
  const up = () => { if (!drag) return; const was = aiming; drag = null; aiming = false; const u = hero(); if (was && u && myTurn() && u.pow >= 8) shoot(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; aiming = false; });
  function shoot(): void { const u = hero(); if (!u || !myTurn()) return; lastAim = { ang: u.ang, pow: u.pow }; tickLeft = -1; ui.onFire(u.ang, u.pow); }
  // Đi lại: giữ nút ◀ ▶ (hoặc phím mũi tên trái / phải).
  let walkT: ReturnType<typeof setInterval> | null = null;
  const walkStop = () => { if (walkT) clearInterval(walkT); walkT = null; };
  const walkGo = (k: number) => { walkStop(); if (!myTurn()) return; ui.onWalk(k * 3); sync(); walkT = setInterval(() => { if (!myTurn()) return walkStop(); ui.onWalk(k * 3); sync(); }, 30); };
  root.querySelectorAll<HTMLElement>('.cbmv').forEach(b => {
    b.addEventListener('pointerdown', e => { e.preventDefault(); walkGo(Number(b.dataset.k)); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, walkStop);
  });
  root.addEventListener('keydown', e => {
    if (fbOpen || endOn || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    const u = hero(); if (!u || !myTurn()) return;
    const k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); setAim(u.ang + (k === 'ArrowUp' ? 1 : -1), u.pow); }
    else if (k === '+' || k === '=' || k === 'PageUp') { e.preventDefault(); setAim(u.ang, u.pow + 2); }
    else if (k === '-' || k === 'PageDown') { e.preventDefault(); setAim(u.ang, u.pow - 2); }
    else if ((k === 'ArrowLeft' || k === 'ArrowRight') && !walkT) { e.preventDefault(); ui.onWalk((k === 'ArrowLeft' ? -1 : 1) * 6); sync(); }
    else if (k === ' ' || k === 'Enter') { if ((e.target as HTMLElement)?.tagName === 'BUTTON') return; e.preventDefault(); shoot(); }
  });

  // ---------- Hiệu ứng ----------
  const burst = (x: number, y: number, n: number, cs: string[]) => { for (let k = 0; k < (still ? Math.ceil(n / 4) : n); k++) { const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 260; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, life: 1, c: cs[k % cs.length]!, r: 2 + Math.random() * 4 }); } };
  function impact(sh: Shot): void {
    const f = ui.f(); if (!disp || !f || !sh.impact) return;
    const im = sh.impact, kill = im.hits.some(h => h.kill && h.id !== 0), dealt = im.hits.reduce((a, h) => a + h.dmg, 0);
    carve(disp.ground, im.x, im.y, CRATER);
    for (const h of im.hits) {
      const u = disp.units[h.id]; if (!u) continue;
      u.hp = Math.max(0, u.hp - h.dmg); flash[h.id] = performance.now();
      const c = center(u);
      pops.push({ x: c.x, y: c.y - UR - 10, t: performance.now(), text: `−${h.dmg}`, c: h.id === 0 ? '#ff6b6b' : '#ffd166', big: h.hit >= 0.9 && h.id !== 0 });
      if (h.hit >= 0.9 && h.id !== 0) pops.push({ x: c.x, y: c.y - UR - 34, t: performance.now() + 60, text: 'Chí mạng!', c: '#fff3b0', big: false });
      if (h.id === 0) fx.hurt();
    }
    for (const u of disp.units) if (u.hp > 0) u.y = groundAt(disp.ground, u.x);
    burst(im.x, im.y, 28, ['#ffd166', '#ff8c42', '#8a5a33', '#ffe8b0', '#6b4a2a']);
    rings.push({ x: im.x, y: im.y, t: performance.now() });
    shake = still ? 0 : Math.min(16, 3 + dealt / 22); shakeAt = performance.now();
    fx.boom(dealt >= 150 || kill);
    if (kill && !still) slow = performance.now() + 420;
    const names = im.hits.filter(h => h.dmg).map(h => `${f.units[h.id]?.vi ?? ''} mất ${h.dmg} máu${h.kill ? ', bị hạ' : ''}`).join('; ');
    live.textContent = names || 'Trượt.';
    if (sh.by === 0) last = { x: im.x, y: im.y };
  }

  // ---------- Vẽ ----------
  function sky(now: number, f: Fight): void {
    const gr = g.createLinearGradient(0, 0, 0, Hp); PAL.sky.forEach((c, i) => gr.addColorStop(i / (PAL.sky.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, Wp, Hp);
    g.fillStyle = 'rgba(255,240,200,.85)'; g.beginPath(); g.arc(Wp * 0.78, sy(170), 34 * s + 10, 0, Math.PI * 2); g.fill();
    // Mây trôi theo gió (người chơi đọc gió bằng mắt, không chỉ bằng số).
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (const c of clouds) {
      const x = ((c.x + (still ? 0 : now / 1000 * f.wind * 9)) % (W + 300) + W + 300) % (W + 300) - 150, px = (x - camX * 0.4) * s;
      g.beginPath(); g.ellipse(px, sy(c.y), c.w * s, c.w * 0.32 * s, 0, 0, Math.PI * 2); g.ellipse(px + c.w * 0.5 * s, sy(c.y - 8), c.w * 0.6 * s, c.w * 0.3 * s, 0, 0, Math.PI * 2); g.fill();
    }
    // Phố Chữ ở xa (mái nhà, cửa sổ sáng) và đồi giữa, trôi chậm hơn mặt đất.
    for (const [par, col, base, step, hgt] of [[0.3, PAL.city, 330, 46, 90], [0.6, PAL.hill, 380, 70, 60]] as Array<[number, string, number, number, number]>) {
      const ph = camX * par, k0 = Math.floor(ph / step) - 1, n = Math.ceil(vw() / step) + 3;
      g.fillStyle = col; g.beginPath(); g.moveTo(0, Hp);
      for (let k = k0; k < k0 + n; k++) {
        const X = (k * step - ph) * s, hh = hgt * (0.5 + 0.5 * Math.abs(Math.sin(k * 1.7)));
        if (par < 0.5) { g.lineTo(X, sy(base - hh)); g.lineTo(X + step * s * 0.45, sy(base - hh - 18)); g.lineTo(X + step * s * 0.9, sy(base - hh)); g.lineTo(X + step * s * 0.9, sy(base)); g.lineTo(X + step * s, sy(base)); }
        else { g.lineTo(X, sy(base)); g.quadraticCurveTo(X + step * s * 0.5, sy(base - hh), X + step * s, sy(base)); }
      }
      g.lineTo(Wp, Hp); g.closePath(); g.fill();
      if (par < 0.5) {
        g.fillStyle = 'rgba(255,214,130,.55)';
        for (let k = k0; k < k0 + n; k++) if (k % 3) { const X = (k * step - ph) * s, hh = hgt * (0.5 + 0.5 * Math.abs(Math.sin(k * 1.7))); g.fillRect(X + step * s * 0.3, sy(base - hh + 20), 5 * s + 2, 6 * s + 2); }
      }
    }
  }
  function ground(gr: number[]): void {
    const i0 = Math.max(0, Math.floor(camX / CW) - 1), i1 = Math.min(COLS - 1, Math.ceil((camX + vw()) / CW) + 1);
    const dg = g.createLinearGradient(0, sy(260), 0, sy(H)); dg.addColorStop(0, PAL.dirt[0]!); dg.addColorStop(1, PAL.dirt[1]!);
    g.beginPath(); g.moveTo(sx(i0 ? i0 * CW : -400), sy(H + 40)); if (!i0) g.lineTo(sx(-400), sy(gr[0]!));
    for (let i = i0; i <= i1; i++) g.lineTo(sx((i + 0.5) * CW), sy(gr[i]!));
    if (i1 === COLS - 1) g.lineTo(sx(W + 400), sy(gr[COLS - 1]!)); g.lineTo(sx(i1 === COLS - 1 ? W + 400 : (i1 + 1) * CW), sy(H + 40)); g.closePath(); g.fillStyle = dg; g.fill();
    g.strokeStyle = PAL.grass; g.lineWidth = Math.max(3, 6 * s); g.lineJoin = 'round'; g.beginPath();
    for (let i = i0; i <= i1; i++) { const X = sx((i + 0.5) * CW), Y = sy(gr[i]!) + 2 * s; if (i === i0) g.moveTo(X, Y); else g.lineTo(X, Y); }
    g.stroke();
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let i = i0; i <= i1; i += 3) g.fillRect(sx(i * CW), sy(gr[i]! + 22 + (i * 7) % 30), 3 * s + 1, 3 * s + 1);
  }
  function hpBar(u: Unit, d: { x: number; y: number; hp: number }, top: number): void {
    const w = (u.kind === 'boss' ? 74 : 54) * s, x = sx(d.x) - w / 2, y = top - 12 * s, fr = Math.max(0, d.hp / u.hpMax);
    g.fillStyle = 'rgba(16,14,40,.75)'; g.fillRect(x - 2, y - 2, w + 4, 8 * s + 4);
    g.fillStyle = u.id === 0 ? '#5ee07a' : fr > 0.5 ? '#ff8c42' : '#ff4d6d'; g.fillRect(x, y, w * fr, 8 * s);
    g.font = `700 ${Math.max(10, 11 * s)}px system-ui, sans-serif`; g.textAlign = 'center'; g.fillStyle = '#fff';
    g.fillText(`${u.vi} ${Math.ceil(d.hp)}`, sx(d.x), y - 5 * s);
  }
  function drawRe(x: number, y: number, r: number, now: number, boss: boolean, hit: boolean): void {
    const wob = still ? 0 : Math.sin(now / 180) * r * 0.06;
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.2, x, y, r * 1.2);
    gr.addColorStop(0, hit ? '#ffffff' : boss ? '#a98be0' : '#9fb3c8'); gr.addColorStop(1, hit ? '#ffd0d0' : boss ? '#3a2466' : '#3d4f63');
    g.fillStyle = gr; g.beginPath();
    for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2, j = r * (1 + 0.12 * Math.sin(a * 5 + now / (still ? 1e9 : 120))) + wob; const px = x + Math.cos(a) * j, py = y + Math.sin(a) * j * 0.9; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.fill();
    // Nhiễu sóng (tiếng rè) chạy trong thân.
    g.save(); g.clip(); g.globalAlpha = 0.28;
    for (let k = 0; k < (boss ? 40 : 18); k++) { g.fillStyle = (k + Math.floor(now / 70)) % 2 ? '#fff' : '#000'; g.fillRect(x - r + ((k * 37 + Math.floor(now / 50) * 13) % (2 * r)), y - r + ((k * 53) % (2 * r)), 3 * s + 1, 2 * s + 1); }
    g.restore(); g.globalAlpha = 1;
    const blink = !still && Math.floor(now / 2600) % 5 === 0 && (now % 2600) < 140;
    g.fillStyle = '#ff5d73'; g.shadowColor = '#ff5d73'; g.shadowBlur = still ? 0 : 10;
    for (const ex of boss ? [-0.35, 0.35] : [0]) { g.beginPath(); g.ellipse(x + ex * r, y - r * 0.15, r * 0.14, blink ? 1 : r * 0.17, 0, 0, Math.PI * 2); g.fill(); }
    g.shadowBlur = 0; g.strokeStyle = '#1b1030'; g.lineWidth = Math.max(2, 3 * s); g.beginPath();
    for (let k = 0; k <= 6; k++) { const px = x - r * 0.4 + (k / 6) * r * 0.8, py = y + r * 0.3 + (k % 2 ? -1 : 1) * r * 0.08; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
    if (boss) {   // ăng-ten phát sóng
      g.strokeStyle = '#d8c8ff'; g.lineWidth = Math.max(1.5, 2 * s); g.beginPath(); g.moveTo(x, y - r * 0.85); g.lineTo(x + r * 0.2, y - r * 1.35); g.stroke();
      for (let k = 1; k <= 3; k++) { const ph = still ? 1 : (now / 400 + k / 3) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(x + r * 0.2, y - r * 1.35, r * 0.2 * k * (0.6 + ph), -2.4, -0.7); g.stroke(); }
      g.globalAlpha = 1;
    }
  }
  function units(f: Fight, now: number): void {
    if (!disp) return;
    f.units.forEach((u, i) => {
      const d = disp!.units[i]!; if (d.hp <= 0 && !(anim && flash[u.id] && now - flash[u.id]! < 600)) return;
      const c = center(d), hit = !!flash[u.id] && now - flash[u.id]! < 140;
      const fade = d.hp <= 0 ? Math.max(0, 1 - (now - (flash[u.id] ?? now)) / 600) : 1;
      g.globalAlpha = fade;
      let top: number;
      if (u.kind === 'hero') {
        const hgt = 70 * s, wdt = hgt * 0.8, X = sx(d.x), Y = sy(d.y) + 2 * s;
        g.save(); g.translate(X, Y); if (u.face < 0) g.scale(-1, 1);
        if (heroImg.complete && heroImg.naturalWidth) g.drawImage(heroImg, -wdt / 2, -hgt, wdt, hgt);
        else { g.fillStyle = '#ffd166'; g.beginPath(); g.arc(0, -UR * s, UR * s, 0, Math.PI * 2); g.fill(); }
        if (hit) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,80,80,.5)'; g.fillRect(-wdt / 2, -hgt, wdt, hgt); g.globalCompositeOperation = 'source-over'; }
        g.restore(); top = Y - hgt;
      } else { const r = (u.kind === 'boss' ? 1.55 : 1) * UR * s; drawRe(sx(c.x), sy(c.y) - (u.kind === 'boss' ? r * 0.45 : 0), r, now + i * 300, u.kind === 'boss', hit); top = sy(c.y) - r * (u.kind === 'boss' ? 1.9 : 1.1); }
      hpBar(u, d, top);
      if (f.turn === i && !f.over && !anim) {   // mũi tên lượt đang đến
        const b = still ? 0 : Math.sin(now / 160) * 4; g.fillStyle = u.id === 0 ? '#5ee07a' : '#ff8c42';
        g.beginPath(); g.moveTo(sx(d.x) - 8, top - 44 * s + b); g.lineTo(sx(d.x) + 8, top - 44 * s + b); g.lineTo(sx(d.x), top - 32 * s + b); g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    });
  }
  function aimUi(f: Fight, now: number): void {
    const u = f.units[0]!, d = disp!.units[0]!, c = center(d), a = (u.ang * Math.PI) / 180;
    // Thước góc nửa vòng quanh nhân vật (như Gunny) + kim góc đang chọn.
    const R = 46 * s; g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; g.beginPath();
    g.arc(sx(c.x), sy(c.y), R, u.face > 0 ? -Math.PI / 2 : Math.PI, u.face > 0 ? 0 : -Math.PI / 2); g.stroke();
    g.strokeStyle = '#ffd166'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx(c.x), sy(c.y)); g.lineTo(sx(c.x) + Math.cos(a) * u.face * R * 1.1, sy(c.y) - Math.sin(a) * R * 1.1); g.stroke();
    // Quỹ đạo dự đoán: 1/3 đầu đường bay, KHÔNG tính gió (đọc gió là việc của tay).
    const t = trace(disp!.ground, f.units.map((x, i) => ({ ...x, x: disp!.units[i]!.x, y: disp!.units[i]!.y, hp: disp!.units[i]!.hp })), 0, u.ang, u.pow, 0);
    const n = Math.max(4, Math.floor(t.path.length / 2 / 3));
    g.fillStyle = '#fff';
    for (let k = 1; k < n; k += 2) { g.globalAlpha = 0.9 - (k / n) * 0.7; g.beginPath(); g.arc(sx(t.path[k * 2]!), sy(t.path[k * 2 + 1]!), Math.max(2, 3 * s), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    // Thanh lực dưới chân.
    const bw = 70 * s, bx = sx(c.x) - bw / 2, by = sy(d.y) + 10 * s;
    g.fillStyle = 'rgba(16,14,40,.7)'; g.fillRect(bx - 2, by - 2, bw + 4, 8 * s + 4);
    const pg = g.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, '#5ee07a'); pg.addColorStop(0.6, '#ffd166'); pg.addColorStop(1, '#ff4d6d');
    g.fillStyle = pg; g.fillRect(bx, by, (bw * u.pow) / 100, 8 * s);
    if (lastAim) { g.fillStyle = '#fff'; g.fillRect(bx + (bw * lastAim.pow) / 100 - 1, by - 3, 2, 8 * s + 6); }
    // Hướng dẫn lần đầu: bàn tay kéo ngược từ nhân vật.
    if (f.shots === 0 && !drag && f.def.id === 'k1-l1') {
      const p = (now % 1800) / 1800, hx = sx(c.x) - u.face * (20 + p * 70) * s, hy = sy(c.y) + (10 + p * 50) * s;
      g.globalAlpha = 0.9; g.font = `${Math.round(30 * Math.max(0.8, s))}px system-ui`; g.textAlign = 'center'; g.fillText('👆', hx, hy); g.globalAlpha = 1;
    }
  }
  function windUi(f: Fight): void {
    const w = Math.min(170, Wp * 0.42), x = vw() >= W ? Wp / 2 : 10 + w / 2, y = 80;
    g.fillStyle = 'rgba(16,14,40,.72)'; rr(x - w / 2, y - 14, w, 40, 12); g.fill();
    const n = Math.abs(f.wind), dir = Math.sign(f.wind);
    g.font = '800 14px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = n >= 4 ? '#ff8c42' : '#fff';
    g.fillText(n ? `Gió ${String(n).replace('.', ',')} ${dir > 0 ? '→' : '←'}` : 'Lặng gió', x, y);
    const flip = gustFlipIn(f); g.font = '600 11px system-ui, sans-serif'; g.fillStyle = '#e8e6ff';
    g.fillText(flip ? `đảo chiều sau ${flip} lượt` : `Vòng ${f.round}`, x, y + 16);
    if (n) { g.strokeStyle = n >= 4 ? '#ff8c42' : '#7fd3ff'; g.lineWidth = 4; g.beginPath(); const L = 10 + n * 6; g.moveTo(x - dir * L, y - 22); g.lineTo(x + dir * L, y - 22); g.lineTo(x + dir * (L - 6), y - 27); g.moveTo(x + dir * L, y - 22); g.lineTo(x + dir * (L - 6), y - 17); g.stroke(); }
    g.textBaseline = 'alphabetic';
  }
  function mini(f: Fight): void {
    if (vw() >= W) return;
    const w = Math.min(160, Wp * 0.4), h = 30, x = Wp - w - 10, y = 66, k = w / W;
    g.fillStyle = 'rgba(16,14,40,.6)'; rr(x - 3, y - 3, w + 6, h + 6, 6); g.fill();
    g.fillStyle = '#8a5a33'; g.beginPath(); g.moveTo(x, y + h);
    for (let i = 0; i < COLS; i += 5) g.lineTo(x + (i + 0.5) * CW * k, y + (disp!.ground[i]! / H) * h);
    g.lineTo(x + w, y + h); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.strokeRect(x + camX * k, y, vw() * k, h);
    f.units.forEach((u, i) => { const d = disp!.units[i]!; if (d.hp <= 0) return; g.fillStyle = u.id === 0 ? '#5ee07a' : u.kind === 'boss' ? '#ff4d6d' : '#ff8c42'; g.fillRect(x + d.x * k - 2, y + (d.y / H) * h - 4, 4, 4); });
  }
  // Ngắt dòng chữ thông báo theo bề ngang (đã đặt font trước khi gọi).
  const wrap = (t: string, max: number): string[] => { const out: string[] = []; let cur = ''; for (const w of t.split(' ')) { const nx = cur ? cur + ' ' + w : w; if (g.measureText(nx).width > max && cur) { out.push(cur); cur = w; } else cur = nx; } if (cur) out.push(cur); return out.slice(0, 4); };
  const rr = (x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  let prev = performance.now();
  function frame(now: number): void {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const f = ui.f(); if (!f || !disp) return;
    // Thời gian trận theo đồng hồ thật (tối đa 0,5 giây mỗi khung): máy chậm / ít khung hình vẫn xong lượt đúng giờ, chỉ giật hơn.
    const scale = slow > now ? 0.28 : 1, dt = Math.max(0, Math.min(0.5, (now - prev) / 1000)) * scale; prev = now;
    // Hoạt cảnh đạn: mỗi điểm đường bay = 2 bước vật lý (1/30 giây). Chạy nhanh hơn thật 1,25 lần.
    let proj: { x: number; y: number } | null = null, focus = disp.units[f.turn]?.x ?? 0;
    if (anim) {
      const sh = anim.shots[anim.k]!;
      if (anim.hold > 0) { anim.hold -= dt; focus = sh.impact?.x ?? focus; if (anim.hold <= 0) { anim.k++; anim.t = 0; if (anim.k >= anim.shots.length) { const d = anim.done; anim = null; sync(); d(); } } }
      else {
        anim.t += dt * 30 * 1.25; const n = sh.path.length / 2, i = Math.min(n - 1, Math.floor(anim.t));
        proj = { x: sh.path[i * 2]!, y: sh.path[i * 2 + 1]! }; focus = proj.x;
        if (!still && i % 2 === 0) parts.push({ x: proj.x, y: proj.y, vx: 0, vy: 0, life: 0.5, c: sh.by === 0 ? '#ffe08a' : '#d8a8ff', r: 3 });
        if (anim.t >= n - 1) { if (sh.impact) impact(sh); else { live.textContent = 'Đạn bay ra ngoài.'; if (sh.by === 0) last = null; } anim.hold = sh.impact ? 0.55 : 0.3; }
      }
    } else if (f.turn === 0 && !f.over) { const u = disp.units[0]!, tg = disp.units.find((x, i) => i > 0 && x.hp > 0); focus = tg ? u.x + Math.sign(tg.x - u.x) * Math.min(Math.abs(tg.x - u.x) * 0.5, vw() * 0.3) : u.x; }
    camX += (clampCam(focus - vw() / 2) - camX) * (still ? 1 : Math.min(1, dt * 5));
    const shk = shake && now - shakeAt < 320 ? shake * (1 - (now - shakeAt) / 320) : 0;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (shk) g.translate((Math.random() - 0.5) * shk, (Math.random() - 0.5) * shk);
    sky(now, f); ground(disp.ground);
    if (last && myTurn()) { const X = sx(last.x), Y = sy(last.y) - 6; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(X - 7, Y - 7); g.lineTo(X + 7, Y + 7); g.moveTo(X + 7, Y - 7); g.lineTo(X - 7, Y + 7); g.stroke(); }
    units(f, now);
    if (myTurn()) aimUi(f, now);
    if (proj) { g.fillStyle = '#fff'; g.shadowColor = '#ffd166'; g.shadowBlur = still ? 0 : 16; g.beginPath(); g.arc(sx(proj.x), sy(proj.y), Math.max(4, 7 * s), 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; }
    for (let k = rings.length - 1; k >= 0; k--) { const r = rings[k]!, p = Math.max(0, (now - r.t) / 280); if (p >= 1) { rings.splice(k, 1); continue; } g.strokeStyle = `rgba(255,230,160,${1 - p})`; g.lineWidth = 4; g.beginPath(); g.arc(sx(r.x), sy(r.y), BLAST * s * p, 0, Math.PI * 2); g.stroke(); }
    for (let k = parts.length - 1; k >= 0; k--) { const q = parts[k]!; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt * 1.4; if (q.life <= 0) { parts.splice(k, 1); continue; } g.globalAlpha = Math.min(1, q.life); g.fillStyle = q.c; g.beginPath(); g.arc(sx(q.x), sy(q.y), q.r * Math.max(0.6, s), 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    for (let k = pops.length - 1; k >= 0; k--) {
      const p = pops[k]!, a = (now - p.t) / 1100; if (a < 0) continue; if (a >= 1) { pops.splice(k, 1); continue; }
      g.globalAlpha = 1 - a * a; g.font = `900 ${Math.round((p.big ? 30 : 20) * Math.max(0.8, s) * (a < 0.12 ? 0.6 + a * 3.4 : 1))}px system-ui, sans-serif`; g.textAlign = 'center';
      g.lineWidth = 4; g.strokeStyle = 'rgba(16,14,40,.85)'; const Y = sy(p.y) - (still ? 0 : a * 46); g.strokeText(p.text, sx(p.x), Y); g.fillStyle = p.c; g.fillText(p.text, sx(p.x), Y);
    }
    g.globalAlpha = 1;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    windUi(f); mini(f);
    if (bannerTxt && now - bannerAt < bannerMs) {
      const a = (now - bannerAt) / bannerMs; g.globalAlpha = a > 0.8 ? (1 - a) * 5 : 1;
      g.font = '800 16px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const lines = wrap(bannerTxt, Math.min(Wp - 48, 520)), lh = 21, bh = lines.length * lh + 16, tw = Math.min(Wp - 24, Math.max(...lines.map(l => g.measureText(l).width)) + 32);
      g.fillStyle = 'rgba(16,14,40,.84)'; rr(Wp / 2 - tw / 2, 124, tw, bh, 14); g.fill(); g.fillStyle = '#fff';
      lines.forEach((l, i) => g.fillText(l, Wp / 2, 124 + 8 + lh / 2 + i * lh));
      g.textBaseline = 'alphabetic'; g.globalAlpha = 1;
    }
    // Đồng hồ lượt (chỉ lượt của người chơi; hộp góp ý đang mở thì dừng).
    if (ui.timer && myTurn() && !fbOpen) {
      const left = Math.ceil(ui.timer - (now - turnAt) / 1000);
      if (left !== tickLeft) { tickLeft = left; timeEl.textContent = `⏱ ${Math.max(0, left)}`; timeEl.classList.toggle('low', left <= 5); if (left <= 3 && left > 0) fx.tick(); }
      if (left <= 0) { tickLeft = -1; if (aiming && hero()!.pow >= 8) { drag = null; aiming = false; shoot(); } else { drag = null; aiming = false; ui.onPass(); } }
    } else if (fbOpen) turnAt += dt * 1000 / scale; else if (timeEl.textContent) timeEl.textContent = '';
    const u = hero(); if (u) { const t = `${u.ang}° · lực ${u.pow}`; if (aimEl.textContent !== t) aimEl.textContent = t; }
  }
  raf = requestAnimationFrame(frame);

  const h: FightHandle = {
    play(shots, before, done) {
      if (!shots.length) { sync(); done(); return; }
      disp = { ground: before.ground.slice(), units: before.units.map(u => ({ ...u })) };
      anim = { shots, k: 0, t: 0, done, hold: 0 };
      fx.shoot(); if (shots[0]!.volley) h.banner('📡 Sóng rè!', 1200);
    },
    refresh() {
      const f = ui.f(); if (!f) return;
      root.querySelector('.whti')!.textContent = f.def.vi;
      root.querySelector('.whsu')!.textContent = `Vòng ${Math.min(f.round, MAX_ROUND)}/${MAX_ROUND} · ${f.def.sub}`;
      (root.querySelector('[data-e="cbmusic"]') as HTMLElement).textContent = musicOff() || muted() ? '🔇' : '🎵';
      const mine = myTurn();
      root.querySelectorAll<HTMLButtonElement>('.cbmv, .cbfire').forEach(b => { b.disabled = !mine; });
      if (mine) turnAt = performance.now();
      if (!anim) sync();
    },
    end(html) {
      endOn = !!html; endBox.hidden = !html; endBox.innerHTML = html ?? '';
      root.querySelector<HTMLElement>('.cbbot')!.hidden = !!html;
      if (html) { const f = ui.f(); if (f?.over === 'win') { snd.win(); burst(disp?.units[0]?.x ?? W / 2, 200, 40, ['#ffd166', '#5ee07a', '#7fd3ff', '#ff8cc6']); } else fx.lose(); live.textContent = endBox.innerText.slice(0, 200); setTimeout(() => (endBox.querySelector('.whbig') as HTMLElement | null)?.focus(), 60); }
    },
    banner(t, ms = 1600) { bannerTxt = t; bannerAt = performance.now(); bannerMs = ms; live.textContent = t; },
    busy: () => !!anim,
    fb(open) {
      fbOpen = open; fbBox.hidden = !open;
      if (open) { fbBox.reset(); (fbBox.elements.namedItem('s') as HTMLInputElement).value = '0'; fbBox.querySelectorAll('.cbst').forEach(b => { b.textContent = '☆'; b.setAttribute('aria-checked', 'false'); }); setTimeout(() => (fbBox.querySelector('.cbst') as HTMLElement | null)?.focus(), 30); }
    },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    close() { alive = false; walkStop(); cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
  // Móc cho test e2e: bắn đúng (góc, lực) cho trước, đọc trạng thái hiển thị.
  (root as HTMLElement & { _fire?: (a: number, p: number) => void; _ready?: () => boolean })._fire = (a, p) => { setAim(a, p); shoot(); };
  (root as HTMLElement & { _ready?: () => boolean })._ready = () => myTurn();
  h.refresh();
  return h;
}
