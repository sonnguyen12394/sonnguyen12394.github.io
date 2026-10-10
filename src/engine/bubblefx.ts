// v104 Bắt Âm bản toàn màn hình (GAME-CRITERIA §10.16). Theo mẫu Bài Câu (cardsfx.ts): lớp phủ ngoài #app; cảnh dưới nước vẽ bằng canvas;
// bong bóng chữ là nút DOM thật (giữ data-e="bbans" của luồng bằng chứng) trôi lơ lửng bằng transform mỗi khung hình. Đúng: bong bóng nổ
// ra hạt, tự sang từ kế. Sai: bong bóng xẹp, bong bóng đúng sáng lên, nghe lại hai từ của cặp, dừng chờ đọc. Luật, điểm, bằng chứng:
// bubbles.ts / main.ts (không đổi).

import type { BubbleRun } from './bubbleview.ts';
import { WORDS, size } from './bubbles.ts';
import { snd, Music, musicOff, STILL } from './wheelview.ts';
import { muted } from './sfx.ts';

export type BubbleFxState = BubbleRun & { nodeVi: string; best: number; prevBest?: number; asrHtml?: string; tts: boolean };
export interface BubbleHandle { close(): void; music(): void; refresh(): void }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const HUES = [195, 320, 45, 140];

export function openBubbles(st: () => BubbleFxState | null, mascot?: (m: 'happy' | 'party', n: number) => string): BubbleHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx bbfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Bắt Âm');
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="bbexit" aria-label="Thoát về sảnh">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><span class="whco bbsc" aria-label="Điểm">✨ <b>0</b></span><button class="whb" data-e="bbmusic" aria-label="Bật / tắt nhạc nền">🎵</button></div>
    <div class="bbsay"></div>
    <div class="bblayer"></div>
    <div class="cdfb bbfb" hidden></div>
    <div class="whbot bbbot"><button class="whb wide" data-e="bbans" data-i="-1">Không biết</button></div>
    <div class="whwin cdwin bbwin" hidden></div><p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  const cv = root.querySelector('canvas')!, g = cv.getContext('2d')!, live = root.querySelector('.whlive')!;
  const layer = root.querySelector<HTMLElement>('.bblayer')!, fb = root.querySelector<HTMLElement>('.bbfb')!, win = root.querySelector<HTMLElement>('.bbwin')!;
  const sayBox = root.querySelector<HTMLElement>('.bbsay')!, bot = root.querySelector<HTMLElement>('.bbbot')!;
  const still = STILL(), music = new Music(), parts: Particle[] = [];
  const amb = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 7, v: 0.0006 + Math.random() * 0.0012 }));
  let W = 0, H = 0, dpr = 1, raf = 0, alive = true, bubs: HTMLButtonElement[] = [], key = '', fbKey = '', boxKey = '', ansSeen: unknown = null;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
  resize(); addEventListener('resize', resize);
  const burst = (x: number, y: number, c: string, n: number) => { if (still) return; for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 4.5; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, life: 1, c, r: 2 + Math.random() * 3 }); } };
  // Vị trí bong bóng i: làn ngang đều nhau, trôi nhấp nhô (giảm chuyển động: đứng yên).
  const spot = (i: number, n: number, now: number, s: number) => {
    const lane = (W - 40) / Math.max(1, n), d = Math.min(150, Math.max(96, lane - 16)) * s;
    const x = 20 + lane * i + lane / 2 - d / 2, y = H * 0.5 - d / 2 + (i % 2 ? 26 : -26);
    return { x, y, d, now };
  };

  function build(s: BubbleFxState): void {
    layer.innerHTML = '';
    bubs = (s.item?.opts ?? []).map((o, i) => {
      const b = document.createElement('button');
      b.className = 'bbbub'; b.lang = 'en'; b.dataset.e = 'bbans'; b.dataset.i = String(i);
      const inner = document.createElement('span'); inner.className = 'bbin'; inner.textContent = o; b.appendChild(inner);   // vùng chạm đứng yên, chỉ hình bên trong nhấp nhô (CSS)
      b.style.setProperty('--h', String(HUES[i % HUES.length])); b.style.setProperty('--d', `${i * 0.6}s`);
      b.setAttribute('aria-label', `${o}: chọn bong bóng này`);
      layer.appendChild(b); return b;
    });
  }
  function sync(s: BubbleFxState): void {
    root.querySelector('.whti')!.textContent = s.done ? '🎯 Bắt Âm' : `🎯 Màn ${s.stage} · từ ${Math.min(s.k + 1, WORDS)}/${WORDS}`;
    root.querySelector('.whsu')!.textContent = s.nodeVi ? `Âm: ${s.nodeVi}` : 'Nghe rồi chạm đúng bong bóng';
    root.querySelector('.bbsc b')!.textContent = `${s.score}${s.streak > 1 ? ` · 🔥x${s.streak}` : ''}`;
    (root.querySelector('[data-e="bbmusic"]') as HTMLElement).textContent = musicOff() || muted() ? '🔇' : '🎵';
    const playing = !s.done && !!s.item;
    const k = `${s.n}|${s.k}|${s.item?.id ?? ''}`;
    if (k !== key) {
      key = k; build(s);
      sayBox.innerHTML = playing && s.item?.say ? `<p class="bbhint">🎧 Nghe rồi chạm bong bóng có từ vừa đọc</p><div class="whrow"><button class="whbig" data-say="${esc(s.item.say)}">🔊 Nghe lại</button><button class="whb wide" data-say="${esc(s.item.say)}" data-slow="1">🐢 Chậm</button></div>` : '';
    }
    layer.hidden = !playing; sayBox.hidden = !playing; bot.hidden = !playing || !!s.ans;
    bubs.forEach((b, i) => {
      b.disabled = !!s.ans;
      b.classList.toggle('right', !!s.ans && i === (s.item?.ans ?? -1));
      b.classList.toggle('pop', !!s.ans?.ok && i === s.ans.i);
      b.classList.toggle('wrong', !!s.ans && !s.ans.ok && i === s.ans.i);
      b.classList.toggle('dim', !!s.ans && i !== (s.item?.ans ?? -1) && i !== s.ans.i);
    });
    // Phản hồi
    const show = !!s.ans && !s.done, fk = show ? `${s.n}|${s.ans!.ok}` : '';
    if (fk !== fbKey) {
      fbKey = fk; fb.hidden = !show;
      if (show) {
        const a = s.ans!, it = s.item!, right = it.opts?.[it.ans ?? 0] ?? '';
        fb.innerHTML = `<div class="fb ${a.ok ? 'good' : 'bad'}"><strong>${a.ok ? `Bắt trúng! +${a.pts}` : 'Trượt rồi, nghe lại hai từ nhé'}</strong>${a.ok ? '' : `<span>Từ vừa đọc: <b lang="en">${esc(right)}</b></span>`}${!a.ok && it.pair ? `<span class="whrow" style="justify-content:flex-start">${it.pair.map(w => `<button class="btn small" data-say="${esc(w)}" lang="en">🔊 ${esc(w)}</button>`).join('')}</span>` : ''}${!a.ok && it.tip ? `<span>💡 ${esc(it.tip)}</span>` : ''}<span>+${a.coins} xu</span>${s.asrHtml ?? ''}</div>
          ${a.ok && !s.asrHtml ? '<button class="whb wide" data-e="bbgo">Tiếp ▸ (tự chuyển)</button>' : `<button class="whbig" data-e="bbnext">${s.k + 1 >= WORDS ? 'Xong màn' : 'Từ kế ▸'}</button>`}`;
        live.textContent = a.ok ? `Đúng. ${right}.` : `Chưa đúng. Từ vừa đọc: ${right}.`;
        setTimeout(() => (fb.querySelector('.whbig, .whb') as HTMLElement | null)?.focus(), 30);
      } else fb.innerHTML = '';
    }
    // Hết màn / không có từ
    const bk = s.done ? `done|${s.score}` : !s.item ? `none|${s.n}` : '';
    if (bk !== boxKey) {
      boxKey = bk; win.hidden = !bk;
      if (s.done) {
        const rec = s.score > (s.prevBest ?? 0);
        win.innerHTML = `${mascot ? `<span aria-hidden="true">${mascot('party', 72)}</span>` : ''}<h2 class="cdh">🎯 Xong màn ${s.stage}!</h2>
          <p>✨ ${s.score} điểm${rec ? ' · 🏆 Kỷ lục mới!' : ''}</p><p>${s.ok}/${s.n} từ bắt trúng · +${s.coins} xu</p>
          ${s.passed?.length ? `<p>⬆ Đã vững: ${s.passed.slice(0, 4).map(esc).join(', ')}</p>` : ''}
          <p class="cdsmall">Điểm và màn chỉ để vui, không đổi đánh giá năng lực. Mọi câu trả lời đã được ghi vào bản đồ năng lực.</p>
          <div class="whrow"><button class="whbig" data-e="bbstart">🎯 Màn mới</button><button class="whb wide" data-e="bbexit">Về sảnh</button></div>`;
        live.textContent = `Xong màn, ${s.ok} trên ${s.n} từ.`;
        if (s.ok) { snd.win(); for (let k = 0; k < 4; k++) burst(W * (0.2 + k * 0.2), H * 0.3, ['#fde68a', '#86efac', '#67e8f9', '#f9a8d4'][k]!, 26); }
      } else if (bk) {
        win.innerHTML = `<p>${s.tts ? 'Chưa có cặp âm nào cho mục tiêu này.' : 'Máy này không có giọng đọc tiếng Anh nên chưa chơi được Bắt Âm.'}</p><div class="whrow"><button class="whbig" data-e="bbnext">Tiếp</button><button class="whb wide" data-e="bbexit">Về sảnh</button></div>`;
      } else win.innerHTML = '';
      if (bk) setTimeout(() => (win.querySelector('.whbig') as HTMLElement | null)?.focus(), 40);
    }
  }
  function place(s: BubbleFxState, now: number): void {
    const sc = size(s.streak), n = bubs.length;
    bubs.forEach((b, i) => {
      const p = spot(i, n, now, sc);
      b.style.width = b.style.height = `${p.d}px`;
      b.style.transform = `translate(${p.x}px,${p.y}px)`;
    });
  }

  function frame(now: number): void {
    if (!alive) return;
    const s = st();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b4f6c'); bg.addColorStop(1, '#041722'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // tia sáng mặt nước
    g.globalAlpha = 0.07; g.fillStyle = '#bde9ff';
    for (let k = 0; k < 4; k++) { const x = W * (0.15 + k * 0.25) + (still ? 0 : Math.sin(now / 2000 + k) * 30); g.beginPath(); g.moveTo(x - 30, 0); g.lineTo(x + 30, 0); g.lineTo(x + 90, H); g.lineTo(x - 10, H); g.fill(); }
    g.globalAlpha = 0.25; g.strokeStyle = '#bde9ff'; g.lineWidth = 1.2;
    for (const a of amb) { if (!still) { a.y -= a.v; if (a.y < -0.05) { a.y = 1.05; a.x = Math.random(); } } g.beginPath(); g.arc(a.x * W, a.y * H, a.r, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1;
    if (s) {
      if (s.ans && s.ans !== ansSeen) {
        ansSeen = s.ans; const b = bubs[s.ans.i], r = b?.getBoundingClientRect(), cb = cv.getBoundingClientRect();
        if (s.ans.ok) { snd.found(); if (r) burst(r.left - cb.left + r.width / 2, r.top - cb.top + r.height / 2, '#bde9ff', 36); }
        else { snd.no(); try { navigator.vibrate?.([20, 40, 20]); } catch { /* bỏ qua */ } }
      }
      if (!s.ans) ansSeen = null;
      sync(s);
      if (!layer.hidden) place(s, now);
    }
    for (let k = parts.length - 1; k >= 0; k--) { const p = parts[k]!; p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.022; if (p.life <= 0) { parts.splice(k, 1); continue; } g.globalAlpha = p.life; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const s0 = st(); if (s0) { sync(s0); place(s0, performance.now()); }
  root.addEventListener('pointerdown', () => music.start(), { once: true });
  (root as HTMLElement & { _pos?: () => Array<{ t: string; x: number; y: number }> })._pos = () => bubs.map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent ?? '', x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  return {
    refresh() { const s = st(); if (s && alive) { sync(s); if (!layer.hidden) place(s, performance.now()); } },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    close() { alive = false; cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
}
