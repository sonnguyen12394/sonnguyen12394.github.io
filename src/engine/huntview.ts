// Mỏ Chữ (v95): màn chơi toàn màn hình vẽ bằng canvas (cùng chuẩn Vòng Chữ: M2 cảm giác điều khiển, M4 hình – tiếng, M5 nhập vai).
// Lớp phủ ngoài #app; luật, lượt và bằng chứng ở main.ts / wordhunt.ts. Ở đây: vẽ lưới, vuốt qua ô kề nhau, rơi, vỡ, hạt, âm.

import { COLS, ROWS, adjacent, idx as idx2, type Cell, type Mission } from './wordhunt.ts';
import { snd, Music, musicOff, STILL } from './wheelview.ts';
import { muted } from './sfx.ts';

export interface HuntState {
  grid: Cell[]; missions: Mission[]; done: Set<string>; moves: number; movesMax: number; score: number;
  title: string; sub: string; daily: boolean; coins: number; gained: number; scene: number;
  win: { stars: number; at: number } | null; lose: { at: number } | null;
  hint: number; combo: number; note: { text: string; t: number } | null;
  fall: Record<number, number>; fallAt: number; burst: Array<{ i: number; ch: string }>; burstAt: number;
}
export type HuntResult = 'mission' | 'word' | 'dup' | 'short' | 'no';
export interface HuntHandle { refresh(): void; result(v: HuntResult, word: string): void; close(): void; music(): void }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }

const THEMES = [
  { a: '#2a1052', b: '#0b0620', c: '#c084fc', gem: '#e879f9', vi: 'Hang pha lê' },
  { a: '#4a2a06', b: '#140a02', c: '#fbbf24', gem: '#fde68a', vi: 'Mỏ vàng' },
  { a: '#073b4c', b: '#03141c', c: '#67e8f9', gem: '#a5f3fc', vi: 'Hang băng' },
];
export const huntTheme = (k: number) => THEMES[k % THEMES.length]!;

export function openHunt(st: () => HuntState | null, onWord: (path: number[]) => void, mascot?: (m: 'happy' | 'party', n: number) => string): HuntHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx hnfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Mỏ Chữ');
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="hnexit" aria-label="Thoát về sảnh">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><span class="whco" aria-label="Lượt vuốt còn lại">⛏️ <b class="hnmv">0</b></span><button class="whb" data-e="hnmusic" aria-label="Bật / tắt nhạc nền">🎵</button></div>
    <div class="whbot"><form class="whform" data-eform="hntyped"><input name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Gõ từ có trên lưới" placeholder="vuốt ô kề nhau hoặc gõ từ"><button class="whb" aria-label="Gửi từ">↵</button></form><button class="whb whhint" data-e="hnhint" aria-label="Gợi ý chữ đầu (10 xu)">💡<small>10</small></button></div>
    <div class="whwin" hidden></div><p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  const cv = root.querySelector('canvas')!, g = cv.getContext('2d')!, live = root.querySelector('.whlive')!, winBox = root.querySelector<HTMLElement>('.whwin')!;
  const still = STILL(), music = new Music();
  let W = 0, H = 0, dpr = 1, raf = 0, alive = true, drag = false;
  const path: number[] = [], parts: Particle[] = [];
  let pointer: { x: number; y: number } | null = null, flash: { kind: HuntResult; t: number; word: string } | null = null;
  const dust = Array.from({ length: 24 }, () => ({ x: Math.random(), y: Math.random(), s: 0.2 + Math.random() * 0.6 }));
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
  resize(); addEventListener('resize', resize);

  const geo = () => {
    const s = st()!, top = 70, rowH = 26, mh = s.missions.length * rowH + 10, bot = 76;
    const cell = Math.max(30, Math.min((W - 32) / COLS, (H - top - mh - bot - 20) / ROWS, 64));
    const gx = (W - cell * COLS) / 2, gy = top + mh + 6 + Math.max(0, (H - top - mh - bot - 20 - cell * ROWS) / 2);
    return { top, rowH, cell, gx, gy, center: (i: number) => ({ x: gx + (i % COLS) * cell + cell / 2, y: gy + Math.floor(i / COLS) * cell + cell / 2 }) };
  };
  const hit = (p: { x: number; y: number }): number => { const gm = geo(); const c = Math.floor((p.x - gm.gx) / gm.cell), r = Math.floor((p.y - gm.gy) / gm.cell); if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return -1; const i = r * COLS + c, q = gm.center(i); return Math.hypot(p.x - q.x, p.y - q.y) <= gm.cell * 0.42 ? i : -1; };
  const add = (i: number) => {
    if (i < 0) return;
    if (path.length >= 2 && path[path.length - 2] === i) { path.pop(); return; }
    if (path.includes(i) || (path.length && !adjacent(path[path.length - 1]!, i))) return;
    path.push(i); snd.letter(path.length - 1); try { navigator.vibrate?.(8); } catch { /* bỏ qua */ }
  };
  const local = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  cv.addEventListener('pointerdown', e => { const s = st(); if (!s || s.win || s.lose) return; const p = local(e), i = hit(p); if (i < 0) return; cv.setPointerCapture(e.pointerId); drag = true; path.length = 0; add(i); pointer = p; music.start(); });
  cv.addEventListener('pointermove', e => { if (!drag) return; pointer = local(e); add(hit(pointer)); });
  const up = () => { if (!drag) return; drag = false; pointer = null; const p = path.slice(); path.length = 0; if (p.length) onWord(p); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

  const rr = (x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const burst = (x: number, y: number, c: string, n: number) => { for (let k = 0; k < (still ? Math.ceil(n / 4) : n); k++) { const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c, r: 2 + Math.random() * 3 }); } };

  function frame(now: number): void {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const s = st(); if (!s) return;
    const th = huntTheme(s.scene), gm = geo();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Hang: nền tối, tinh thể phát sáng ở hai mép, bụi bay.
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, th.a); bg.addColorStop(1, th.b); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 7; k++) {
      const side = k % 2 ? W : 0, y = H * (0.2 + k * 0.11), h = 40 + (k * 37) % 60, glow = still ? 0.5 : 0.4 + 0.25 * Math.sin(now / 900 + k);
      g.globalAlpha = glow; g.fillStyle = th.gem; g.beginPath(); g.moveTo(side, y); g.lineTo(side + (side ? -1 : 1) * (18 + (k % 3) * 10), y - h / 2); g.lineTo(side, y - h); g.closePath(); g.fill();
    }
    g.globalAlpha = 0.25; g.fillStyle = '#fff';
    for (const d of dust) { const y = ((d.y - (still ? 0 : now * d.s / 30000)) % 1 + 1) % 1; g.fillRect(d.x * W, y * H, 2, 2); }
    g.globalAlpha = 1;
    // Nhiệm vụ: ô chữ (mở khi tìm ra) + nghĩa tiếng Việt.
    s.missions.forEach((m, k) => {
      const y = gm.top + k * gm.rowH, got = s.done.has(m.en), b = 18;
      for (let j = 0; j < m.en.length; j++) {
        const x = 16 + j * (b + 3);
        g.fillStyle = got ? th.c : 'rgba(255,255,255,0.14)'; rr(x, y, b, b, 4); g.fill();
        if (got) { g.fillStyle = '#140a28'; g.font = '800 12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m.en[j]!.toUpperCase(), x + b / 2, y + b / 2 + 1); }
      }
      g.fillStyle = got ? th.c : 'rgba(255,255,255,0.88)'; g.font = `${got ? 700 : 500} 13px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(`${got ? '✓ ' : ''}${m.pic ? m.pic + ' ' : ''}${m.vi}`.slice(0, 48), 16 + m.en.length * (b + 3) + 8, y + b / 2);
    });
    // Lưới: ô đá, chữ; ô rơi xuống theo `fall` (chậm dần); ô vàng / đá quý phát sáng; ô gợi ý nhấp nháy.
    const ft = s.fallAt ? Math.min(1, (now - s.fallAt) / 320) : 1, ease = still ? 1 : 1 - Math.pow(1 - ft, 3);
    s.grid.forEach((c, i) => {
      const q = gm.center(i), drop = (s.fall[c.id] ?? 0) * gm.cell * (1 - ease), x = q.x - gm.cell / 2 + 3, y = q.y - gm.cell / 2 + 3 - drop, w = gm.cell - 6;
      const on = path.includes(i), hint = s.hint === i && !still ? 0.5 + 0.5 * Math.sin(now / 160) : s.hint === i ? 1 : 0;
      g.fillStyle = on ? th.c : c.sp === 'gem' ? th.gem : c.sp === 'gold' ? '#fcd34d' : '#f5f3ff';
      g.shadowColor = c.sp ? th.gem : 'rgba(0,0,0,0.35)'; g.shadowBlur = c.sp && !still ? 14 + 6 * Math.sin(now / 300 + i) : 6; g.shadowOffsetY = c.sp ? 0 : 3;
      rr(x, y, w, w, w * 0.22); g.fill(); g.shadowBlur = 0; g.shadowOffsetY = 0;
      if (hint) { g.strokeStyle = `rgba(255,255,255,${hint})`; g.lineWidth = 4; g.stroke(); }
      g.fillStyle = '#140a28'; g.font = `800 ${Math.round(w * 0.5)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(c.ch.toUpperCase(), x + w / 2, y + w / 2 + 1);
      if (c.sp) { g.font = `${Math.round(w * 0.26)}px system-ui`; g.fillText(c.sp === 'gem' ? '💎' : '✦', x + w - w * 0.18, y + w * 0.18); }
    });
    // Đường vuốt.
    if (path.length) {
      g.strokeStyle = th.c; g.globalAlpha = 0.75; g.lineWidth = gm.cell * 0.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = th.c; g.shadowBlur = still ? 0 : 14;
      g.beginPath(); path.forEach((i, k) => { const p = gm.center(i); if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); if (pointer && drag) g.lineTo(pointer.x, pointer.y); g.stroke();
      g.shadowBlur = 0; g.globalAlpha = 1;
    }
    // Hướng dẫn lần đầu (M9): bàn tay vuốt chéo qua ba ô (không lộ đáp án) + một dòng chữ.
    if (s.title.endsWith(' 1') && !s.done.size && !path.length && !s.daily) {
      const demo = [idx2(1, 2), idx2(2, 3), idx2(3, 3)], t = (now % 2400) / 2400, seg = Math.min(1, Math.floor(t * 2)), f = t * 2 - seg;
      const a = gm.center(demo[seg]!), b = gm.center(demo[seg + 1]!), hx = a.x + (b.x - a.x) * f, hy = a.y + (b.y - a.y) * f;
      g.globalAlpha = 0.85; g.font = '34px system-ui'; g.textAlign = 'center'; g.fillText('👆', hx + 10, hy + 26); g.globalAlpha = 1;
      g.font = '700 15px system-ui, sans-serif'; g.fillStyle = '#fff'; g.fillText('Vuốt qua các ô kề nhau (cả chéo) để tạo từ', W / 2, gm.gy - 14);
    }
    // Bong bóng chữ đang ghép / kết quả.
    const fresh = flash && now - flash.t < 700 ? flash : null, w = path.length ? path.map(i => s.grid[i]!.ch).join('') : fresh?.word ?? '';
    if (w) {
      const shake = fresh && fresh.kind === 'no' && !path.length && !still ? Math.sin((now - fresh.t) / 22) * 8 * (1 - (now - fresh.t) / 700) : 0;
      g.font = '800 22px system-ui, sans-serif'; const tw = g.measureText(w.toUpperCase()).width + 30, bx = W / 2 - tw / 2 + shake, by = gm.gy - 44;
      g.fillStyle = !path.length && fresh ? (fresh.kind === 'mission' ? '#22c55e' : fresh.kind === 'word' ? '#f59e0b' : fresh.kind === 'dup' ? 'rgba(255,255,255,0.6)' : '#ef4444') : 'rgba(255,255,255,0.95)';
      rr(bx, by, tw, 36, 18); g.fill();
      g.fillStyle = !path.length && fresh && fresh.kind !== 'dup' ? '#fff' : '#140a28'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w.toUpperCase(), W / 2 + shake, by + 19);
    }
    if (s.note && now - s.note.t < 1400) {
      const k = (now - s.note.t) / 1400; g.globalAlpha = 1 - k * k; g.font = '800 19px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fde68a';
      g.fillText(s.note.text, W / 2, gm.gy - 56 - (still ? 0 : k * 18)); g.globalAlpha = 1;
    }
    for (let k = parts.length - 1; k >= 0; k--) { const q = parts[k]!; q.x += q.vx; q.y += q.vy; q.vy += 0.15; q.life -= 0.02; if (q.life <= 0) { parts.splice(k, 1); continue; } g.globalAlpha = q.life; g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    const end = s.win ?? s.lose;
    if (end) {
      const k = Math.min(1, (now - end.at) / 600);
      g.fillStyle = `rgba(6,3,16,${0.82 * k})`; g.fillRect(0, 0, W, H);
      g.font = '800 32px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff';
      g.fillText(s.win ? (s.daily ? 'Xong thử thách ngày!' : 'Khai thác xong!') : 'Hết lượt vuốt', W / 2, H * 0.2);
      if (s.win) for (let i = 0; i < 3; i++) { const on = i < s.win.stars, t = Math.min(1, Math.max(0, (now - s.win.at - 300 - i * 220) / 300)); g.font = `${44 * (still ? 1 : 0.4 + 0.6 * t)}px system-ui`; g.globalAlpha = on ? t : 0.35; g.fillText('⭐', W / 2 + (i - 1) * 56, H * 0.3); }
      g.globalAlpha = 1;
    }
  }
  raf = requestAnimationFrame(frame);

  const h: HuntHandle = {
    refresh() {
      const s = st(); if (!s) return;
      root.querySelector('.whti')!.textContent = s.title; root.querySelector('.whsu')!.textContent = s.sub;
      root.querySelector('.hnmv')!.textContent = String(s.moves);
      (root.querySelector('[data-e="hnmusic"]') as HTMLElement).textContent = musicOff() || muted() ? '🔇' : '🎵';
      const hb = root.querySelector<HTMLButtonElement>('.whhint')!; hb.disabled = s.coins < 10 || !!s.win || !!s.lose; hb.setAttribute('aria-label', s.coins < 10 ? 'Gợi ý: cần 10 xu' : 'Gợi ý chữ đầu của một từ nhiệm vụ (10 xu)');
      if (s.win || s.lose) {
        winBox.hidden = false;
        const left = s.missions.filter(m => !s.done.has(m.en));
        winBox.innerHTML = `${mascot && s.win ? `<span aria-hidden="true">${mascot('party', 64)}</span>` : ''}<p>${s.win ? `${s.win.stars} sao · ${s.score} điểm · +${s.gained} xu` : `Còn ${left.length} từ: ${left.map(m => m.vi).join(', ')}`}</p>
          <div class="whrow">${s.win ? (s.daily ? '<button class="whbig" data-e="hnshare">📤 Chia sẻ</button>' : '<button class="whbig" data-e="hnnext">▶ Màn tiếp</button>') : '<button class="whbig" data-e="hnretry">↺ Chơi lại màn</button>'}<button class="whb wide" data-e="hnexit">Về sảnh</button></div>`;
        live.textContent = s.win ? `Xong màn, ${s.win.stars} sao.` : 'Hết lượt vuốt.';
        setTimeout(() => (winBox.querySelector('.whbig') as HTMLElement | null)?.focus(), 50);
      } else { winBox.hidden = true; winBox.innerHTML = ''; }
    },
    result(v, word) {
      const s = st(); if (!s) return;
      flash = { kind: v, t: performance.now(), word };
      const gm = geo(), th = huntTheme(s.scene);
      if (v === 'mission' || v === 'word') {
        for (const b of s.burst) { const q = gm.center(b.i); burst(q.x, q.y, v === 'mission' ? th.c : '#fde68a', v === 'mission' ? 10 : 6); }
        v === 'mission' ? snd.found() : snd.bonus();
        const m = s.missions.find(x => x.en === word);
        live.textContent = v === 'mission' ? `Tìm được ${word}${m ? `: ${m.vi}` : ''}.` : `Từ ${word}: +điểm.`;
      } else if (v === 'dup') { snd.dup(); live.textContent = `${word} đã tìm rồi.`; }
      else { snd.no(); live.textContent = `${word || 'Từ'} chưa phải từ hợp lệ.`; }
      if (s.win) { snd.win(); for (let k = 0; k < 4; k++) burst(W * (0.2 + k * 0.2), H * 0.3, ['#fde68a', '#22c55e', '#67e8f9', '#e879f9'][k]!, 30); }
      h.refresh();
    },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    close() { alive = false; cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
  (root as HTMLElement & { _pos?: () => Array<{ ch: string; x: number; y: number }> })._pos = () => { const s = st(), gm = geo(), b = cv.getBoundingClientRect(); return s ? s.grid.map((c, i) => { const q = gm.center(i); return { ch: c.ch, x: b.left + q.x, y: b.top + q.y }; }) : []; };
  h.refresh();
  return h;
}
