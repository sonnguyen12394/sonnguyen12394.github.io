// Vòng Chữ (v93): màn chơi toàn màn hình vẽ bằng canvas, 60 khung hình / giây (GAME-CRITERIA §10: M2 cảm giác điều khiển, M4 hình – tiếng,
// M5 nhập vai). Lớp phủ nằm ngoài #app nên không bị vẽ lại khi app render; mọi luật và bằng chứng ở main.ts / wordwheel.ts, ở đây chỉ trình
// bày + nhận thao tác (vuốt, bàn phím, ô gõ cho trình đọc màn hình / máy không vuốt được). Nút có data-e đi qua bộ bắt sự kiện chung.

import type { Level, Verdict } from './wordwheel.ts';
import { muted } from './sfx.ts';

export interface WheelState {
  level: Level; title: string; sub: string; theme: { a: string; b: string; c: string }; daily: boolean;
  found: Set<string>; bonusFound: Set<string>; shown: Record<string, number[]>; hints: number; coins: number; gained: number;
  win: { stars: number; at: number } | null;
  gold: number; combo: number; free: number; jar: number; jarMax: number; scene: number;   // v94: ô vàng, combo, gợi ý miễn phí, hũ từ thưởng, phong cảnh
  note?: { text: string; t: number } | null;   // dòng thông báo ngắn trên vòng (combo, ô vàng, hũ đầy)
  goalNote?: string;                           // v110: dòng tiến độ mục tiêu ở hộp thắng (chữ thuần)
}
type Pt = { x: number; y: number };
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }

const STILL = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MKEY = 'el-music-off';
const musicOff = () => { try { return localStorage.getItem(MKEY) === '1'; } catch { return false; } };

// ---- Âm thanh: nốt theo chữ (thang ngũ cung đi lên khi vuốt), hợp âm khi tìm ra từ, nhạc nền nhẹ (tắt được) ----
let ac: AudioContext | null = null;
function actx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ac ||= new AC(); if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch { return null; }
}
function note(f: number, t: number, dur: number, vol = 0.05, type: OscillatorType = 'sine', dest?: AudioNode): void {
  const a = actx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t);
  g.gain.setValueAtTime(0.0001, a.currentTime + t); g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + dur);
  o.connect(g).connect(dest ?? a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + dur + 0.05);
}
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51];
const snd = {
  letter: (k: number) => { if (!muted()) note(PENTA[Math.min(k, PENTA.length - 1)]!, 0, 0.18, 0.06, 'triangle'); },
  found: () => { if (!muted()) [0, 2, 4, 5].forEach((k, i) => note(PENTA[k]!, i * 0.07, 0.35, 0.05, 'triangle')); },
  bonus: () => { if (!muted()) [5, 6, 7].forEach((k, i) => note(PENTA[k]! * 1.5, i * 0.05, 0.25, 0.035, 'sine')); },
  no: () => { if (!muted()) { note(180, 0, 0.18, 0.05, 'sawtooth'); note(140, 0.06, 0.2, 0.04, 'sine'); } },
  dup: () => { if (!muted()) note(330, 0, 0.12, 0.03, 'square'); },
  win: () => { if (!muted()) [0, 2, 4, 7, 4, 7].forEach((k, i) => note(PENTA[k]! / (i < 3 ? 1 : 0.5), i * 0.11, 0.5, 0.05, 'triangle')); },
  hint: () => { if (!muted()) note(988, 0, 0.3, 0.04, 'sine'); },
};
// Nhạc nền: vòng 4 hợp âm êm, rất nhỏ, chỉ khi màn đang mở.
class Music {
  private t: ReturnType<typeof setInterval> | null = null; private k = 0; private bus: GainNode | null = null;
  start(): void {
    if (this.t || muted() || musicOff()) return;
    const a = actx(); if (!a) return;
    this.bus = a.createGain(); this.bus.gain.value = 0.5; this.bus.connect(a.destination);
    const CH = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];
    const play = () => { const c = CH[this.k++ % CH.length]!; c.forEach((f, i) => note(f / 2, i * 0.02, 2.6, 0.018, 'sine', this.bus!)); note(c[(this.k * 2) % 3]! * 2, 0.9, 0.6, 0.008, 'triangle', this.bus!); };
    play(); this.t = setInterval(play, 2400);
  }
  stop(): void { if (this.t) clearInterval(this.t); this.t = null; try { this.bus?.disconnect(); } catch { /* bỏ qua */ } this.bus = null; }
}

export interface WheelHandle { refresh(): void; result(v: Verdict, word: string): void; close(): void; shuffle(): void; music(): void }

export function openWheel(st: () => WheelState | null, onWord: (w: string) => void, mascot?: (m: 'happy' | 'party', n: number) => string): WheelHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Vòng Chữ');
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="whexit" aria-label="Thoát về sảnh">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><span class="whco" aria-label="Xu">🪙 <b>0</b></span><button class="whb" data-e="whmusic" aria-label="Bật / tắt nhạc nền">🎵</button></div>
    <div class="whbot"><button class="whb" data-e="whshuf" aria-label="Xáo chữ">🔀</button><form class="whform" data-eform="whtyped"><input name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Gõ từ tìm được" placeholder="vuốt chữ hoặc gõ từ"><button class="whb" aria-label="Gửi từ">↵</button></form><button class="whb whhint" data-e="whhint" aria-label="Gợi ý một chữ (10 xu)">💡<small>10</small></button></div>
    <div class="whwin" hidden></div><p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  const cv = root.querySelector('canvas')!, g = cv.getContext('2d')!, live = root.querySelector('.whlive')!, winBox = root.querySelector<HTMLElement>('.whwin')!;
  const still = STILL(), music = new Music();
  let W = 0, H = 0, dpr = 1, raf = 0, alive = true;
  const sel: number[] = [];           // chỉ số chữ đang chọn (theo thứ tự vuốt)
  let pointer: Pt | null = null, drag = false, order: number[] = [];   // order: thứ tự chữ trên vòng (xáo)
  let flash: { kind: Verdict; t: number; word: string } | null = null;
  const pops: Record<string, number> = {};   // ô vừa mở: thời điểm bắt đầu hiệu ứng
  const parts: Particle[] = [];
  const flyers: Array<{ ch: string; fx: number; fy: number; tx: number; ty: number; t0: number }> = [];   // chữ bay từ bong bóng vào ô
  const bokeh = Array.from({ length: 14 }, (_, i) => ({ x: Math.random(), y: Math.random(), r: 20 + Math.random() * 70, s: 0.02 + Math.random() * 0.04, p: i }));
  let lvKey = '';

  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
  resize(); addEventListener('resize', resize);

  // Bố cục: ô ở nửa trên, vòng chữ ở nửa dưới (trên thanh nút).
  const geo = () => {
    const s = st()!, top = 70, bot = 78, R = Math.max(70, Math.min(W * 0.36, (H - top - bot) * 0.27, 170));
    const cx = W / 2, cy = H - bot - R - 18, n = s.level.letters.length, lr = Math.min(R * 0.26, 34);
    const pos = order.map((_, k) => { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; return { x: cx + Math.cos(a) * R * 0.66, y: cy + Math.sin(a) * R * 0.66 }; });
    const slotTop = top, slotBot = cy - R - 64, rows = s.level.slots.length, rowH = Math.min(50, Math.max(28, (slotBot - slotTop) / Math.max(1, rows)));
    const maxLen = Math.max(...s.level.slots.map(x => x.en.length)), tile = Math.min(rowH - 8, (W - 32) * 0.6 / maxLen, 40);
    return { R, cx, cy, lr, pos, slotTop, rowH, tile };
  };
  const hitLetter = (p: Pt): number => { const gm = geo(); for (let k = 0; k < gm.pos.length; k++) { const q = gm.pos[k]!; if (Math.hypot(p.x - q.x, p.y - q.y) <= gm.lr * 1.15) return order[k]!; } return -1; };
  const word = () => { const s = st(); return s ? sel.map(i => s.level.letters[i]!).join('') : ''; };
  const add = (i: number) => { if (i < 0) return; if (sel.length >= 2 && sel[sel.length - 2] === i) { sel.pop(); return; } if (sel.includes(i)) return; sel.push(i); snd.letter(sel.length - 1); try { navigator.vibrate?.(8); } catch { /* bỏ qua */ } };
  const submit = () => { const w = word(); sel.length = 0; if (w.length) onWord(w); };
  const local = (e: PointerEvent): Pt => { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
  cv.addEventListener('pointerdown', e => { const s = st(); if (!s || s.win) return; const p = local(e), i = hitLetter(p); if (i < 0) return; cv.setPointerCapture(e.pointerId); drag = true; sel.length = 0; add(i); pointer = p; music.start(); });
  cv.addEventListener('pointermove', e => { if (!drag) return; pointer = local(e); add(hitLetter(pointer)); });
  const up = () => { if (!drag) return; drag = false; pointer = null; submit(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  // Bàn phím: gõ chữ có trên vòng (chưa dùng) → chọn; Backspace bỏ chữ cuối; Enter gửi; Esc xoá; Space xáo. Không cướp phím khi đang ở ô gõ.
  const key = (e: KeyboardEvent) => {
    const s = st(); if (!s || s.win || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    if (/^[a-zA-Z]$/.test(e.key)) { const i = s.level.letters.findIndex((ch, j) => ch === e.key.toLowerCase() && !sel.includes(j)); if (i >= 0) { sel.push(i); snd.letter(sel.length - 1); } e.preventDefault(); }
    else if (e.key === 'Backspace') { sel.pop(); e.preventDefault(); }
    else if (e.key === 'Enter') { submit(); e.preventDefault(); }
    else if (e.key === 'Escape') { sel.length = 0; }
  };
  addEventListener('keydown', key);

  const burst = (x: number, y: number, c: string, n: number) => { for (let k = 0; k < (still ? Math.ceil(n / 4) : n); k++) { const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c, r: 2 + Math.random() * 3 }); } };
  const rr = (x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };

  function frame(now: number): void {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const s = st(); if (!s) return;
    const key2 = s.level.base + s.level.letters.join('');
    if (key2 !== lvKey) { lvKey = key2; order = s.level.letters.map((_, i) => i); sel.length = 0; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Nền: dải màu của chương + đốm sáng trôi chậm.
    const bg = g.createLinearGradient(0, 0, W * 0.3, H); bg.addColorStop(0, s.theme.a); bg.addColorStop(1, s.theme.b); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (const b of bokeh) { const y = ((b.y - (still ? 0 : now * b.s / 4000)) % 1 + 1) % 1; g.globalAlpha = 0.08; g.fillStyle = '#fff'; g.beginPath(); g.arc(b.x * W, y * H, b.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    scenery(g, s.scene, W, H, now, still);
    const gm = geo();
    // Ô từ: chữ đã tìm hiện đủ, chữ gợi ý hiện mờ; nghĩa tiếng Việt làm gợi ý bên phải.
    s.level.slots.forEach((sl, r) => {
      const y = gm.slotTop + r * gm.rowH, got = s.found.has(sl.en), shown = s.shown[sl.en] ?? [], t0 = pops[sl.en];
      for (let k = 0; k < sl.en.length; k++) {
        const x = 16 + k * (gm.tile + 4), age = t0 ? (now - t0 - k * 55) / 260 : 1, sc = got && t0 && !still ? Math.max(0, Math.min(1, age)) : 1;
        const bump = got && t0 && age > 0 && age < 1 && !still ? 1 + Math.sin(age * Math.PI) * 0.18 : 1, sz = gm.tile * (got ? (sc === 0 ? 0.001 : bump) : 1);
        const ox = x + (gm.tile - sz) / 2, oy = y + (gm.tile - sz) / 2;
        const gold = r === s.gold;
        g.fillStyle = got ? (gold ? '#ffd166' : '#ffffff') : gold ? 'rgba(255,209,102,0.28)' : 'rgba(255,255,255,0.18)'; rr(ox, oy, sz, sz, 7); g.fill();
        if (!got) { g.strokeStyle = gold ? 'rgba(255,209,102,0.95)' : 'rgba(255,255,255,0.45)'; g.lineWidth = gold ? 2.5 : 1.5; g.stroke(); }
        if (got || shown.includes(k)) {
          g.fillStyle = got ? '#1d1b3a' : 'rgba(255,255,255,0.9)'; g.font = `800 ${Math.round(gm.tile * 0.58)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(sl.en[k]!.toUpperCase(), x + gm.tile / 2, y + gm.tile / 2 + 1);
        }
      }
      const tx = 16 + sl.en.length * (gm.tile + 4) + 8, maxW = W - tx - 12;
      g.fillStyle = got ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.8)'; g.font = `${got ? 600 : 500} 13px system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'middle';
      let clue = `${r === s.gold && !got ? '⭐ ' : ''}${sl.pic ? sl.pic + ' ' : ''}${sl.vi}`;
      while (clue.length > 3 && g.measureText(clue).width > maxW) clue = clue.slice(0, -2) + '…';
      g.fillText(clue, tx, y + gm.tile / 2);
    });
    // Vòng chữ.
    const disc = g.createRadialGradient(gm.cx, gm.cy - gm.R * 0.3, gm.R * 0.1, gm.cx, gm.cy, gm.R);
    disc.addColorStop(0, 'rgba(255,255,255,0.32)'); disc.addColorStop(1, 'rgba(255,255,255,0.12)');
    g.fillStyle = disc; g.beginPath(); g.arc(gm.cx, gm.cy, gm.R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2; g.stroke();
    // Đường vuốt.
    if (sel.length) {
      g.strokeStyle = s.theme.c; g.lineWidth = gm.lr * 0.42; g.lineCap = 'round'; g.lineJoin = 'round'; g.shadowColor = s.theme.c; g.shadowBlur = still ? 0 : 16;
      g.beginPath(); sel.forEach((i, k) => { const p = gm.pos[order.indexOf(i)]!; if (k) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); if (pointer && drag) g.lineTo(pointer.x, pointer.y); g.stroke();
      g.shadowBlur = 0;
    }
    order.forEach((i, k) => {
      const p = gm.pos[k]!, on = sel.includes(i);
      g.fillStyle = on ? s.theme.c : '#ffffff'; g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
      g.beginPath(); g.arc(p.x, p.y, gm.lr * (on ? 1.08 : 1), 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.fillStyle = '#1d1b3a'; g.font = `800 ${Math.round(gm.lr * 1.05)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(s.level.letters[i]!.toUpperCase(), p.x, p.y + 1);
    });
    // Hướng dẫn lần đầu (M9): bàn tay mờ vuốt qua ba chữ đầu trên vòng (không lộ đáp án), kèm một dòng chữ.
    if (s.title.endsWith(' 1') && !s.found.size && !sel.length && !s.daily && gm.pos.length >= 3) {
      const t = (now % 2400) / 2400, seg = Math.min(2, Math.floor(t * 3)), f = t * 3 - seg, a = gm.pos[seg]!, b = gm.pos[Math.min(2, seg + 1)]!;
      const hx = a.x + (b.x - a.x) * f, hy = a.y + (b.y - a.y) * f;
      g.globalAlpha = 0.85; g.font = '34px system-ui'; g.textAlign = 'center'; g.fillText('👆', hx + 10, hy + 26); g.globalAlpha = 1;
      g.font = '700 15px system-ui, sans-serif'; g.fillStyle = '#fff'; g.fillText('Vuốt qua các chữ để ghép thành từ', gm.cx, gm.cy - gm.R - 24);
    }
    // Bong bóng chữ đang ghép / kết quả vừa gửi.
    const fresh = flash && now - flash.t < 700 ? flash : null, w = sel.length ? word() : fresh?.word ?? '';
    if (w) {
      const shake = fresh && fresh.kind === 'no' && !still ? Math.sin((now - fresh.t) / 22) * 8 * (1 - (now - fresh.t) / 700) : 0;
      g.font = '800 24px system-ui, sans-serif'; const tw = g.measureText(w.toUpperCase()).width + 32, bx = gm.cx - tw / 2 + shake, by = gm.cy - gm.R - 52;
      g.fillStyle = !sel.length && fresh ? (fresh.kind === 'slot' ? '#22c55e' : fresh.kind === 'bonus' ? '#f59e0b' : fresh.kind === 'dup' ? 'rgba(255,255,255,0.6)' : '#ef4444') : 'rgba(255,255,255,0.95)';
      rr(bx, by, tw, 40, 20); g.fill();
      g.fillStyle = !sel.length && fresh && fresh.kind !== 'dup' ? '#fff' : '#1d1b3a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(w.toUpperCase(), gm.cx + shake, by + 21);
      if (!sel.length && fresh) { g.font = '700 13px system-ui, sans-serif'; g.fillStyle = '#fff'; g.fillText(fresh.kind === 'bonus' ? '+ từ thưởng!' : fresh.kind === 'dup' ? 'đã tìm rồi' : fresh.kind === 'short' ? 'từ cần ≥ 3 chữ' : fresh.kind === 'no' ? 'chưa phải từ của màn' : '', gm.cx, by - 12); }
    }
    // Dòng thông báo (combo / ô vàng / hũ đầy) và hũ từ thưởng.
    if (s.note && now - s.note.t < 1400) {
      const k = (now - s.note.t) / 1400, y = gm.cy - gm.R - 92 - (still ? 0 : k * 20);
      g.globalAlpha = 1 - k * k; g.font = '800 20px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffd166';
      g.shadowColor = 'rgba(0,0,0,0.4)'; g.shadowBlur = 6; g.fillText(s.note.text, gm.cx, y); g.shadowBlur = 0; g.globalAlpha = 1;
    }
    { const jx = W - 16 - 96, jy = gm.cy + gm.R - 18;
      g.fillStyle = 'rgba(16,14,40,0.72)'; rr(jx, jy, 96, 24, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.2)'; rr(jx + 26, jy + 8, 40, 8, 4); g.fill(); if (s.jar) { g.fillStyle = '#ffd166'; rr(jx + 26, jy + 8, 40 * (s.jar / s.jarMax), 8, 4); g.fill(); }
      g.font = '14px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('🫙', jx + 6, jy + 13); g.font = '700 11px system-ui'; g.fillText(`${s.jar}/${s.jarMax}`, jx + 70, jy + 13); }
    // Chữ bay vào ô (khoảng 0,3 giây, chậm dần).
    for (let k = flyers.length - 1; k >= 0; k--) {
      const f = flyers[k]!, t = (now - f.t0) / 320;
      if (t >= 1) { flyers.splice(k, 1); continue; }
      if (t < 0) continue;
      const e = 1 - Math.pow(1 - t, 3), x = f.fx + (f.tx - f.fx) * e, y = f.fy + (f.ty - f.fy) * e - Math.sin(t * Math.PI) * 40;
      g.fillStyle = '#fff'; rr(x - gm.tile / 2, y - gm.tile / 2, gm.tile, gm.tile, 7); g.fill();
      g.fillStyle = '#1d1b3a'; g.font = `800 ${Math.round(gm.tile * 0.58)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(f.ch.toUpperCase(), x, y + 1);
    }
    // Hạt.
    for (let k = parts.length - 1; k >= 0; k--) { const q = parts[k]!; q.x += q.vx; q.y += q.vy; q.vy += 0.15; q.life -= 0.02; if (q.life <= 0) { parts.splice(k, 1); continue; } g.globalAlpha = q.life; g.fillStyle = q.c; g.beginPath(); g.arc(q.x, q.y, q.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    // Màn thắng: sao rơi vào chỗ.
    if (s.win) {
      const k = Math.min(1, (now - s.win.at) / 600);
      g.fillStyle = `rgba(10,8,30,${0.82 * k})`; g.fillRect(0, 0, W, H);
      g.font = '800 34px system-ui, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(s.daily ? 'Xong thử thách ngày!' : 'Tuyệt vời!', W / 2, H * 0.2);
      for (let i = 0; i < 3; i++) { const on = i < s.win.stars, t = Math.min(1, Math.max(0, (now - s.win.at - 300 - i * 220) / 300)), sz = 44 * (still ? 1 : 0.4 + 0.6 * t) * (on ? 1 : 0.8);
        g.font = `${sz}px system-ui`; g.globalAlpha = on ? t : 0.35; g.fillText('⭐', W / 2 + (i - 1) * 56, H * 0.3); }
      g.globalAlpha = 1;
    }
  }
  raf = requestAnimationFrame(frame);

  const h: WheelHandle = {
    refresh() {
      const s = st(); if (!s) return;
      root.querySelector('.whti')!.textContent = s.title; root.querySelector('.whsu')!.textContent = s.sub;
      root.querySelector('.whco b')!.textContent = String(s.coins);
      (root.querySelector('[data-e="whmusic"]') as HTMLElement).textContent = musicOff() || muted() ? '🔇' : '🎵';
      const hb = root.querySelector<HTMLButtonElement>('.whhint')!; hb.disabled = (s.free < 1 && s.coins < 10) || !!s.win;
      hb.innerHTML = `💡<small>${s.free ? `×${s.free}` : '10'}</small>`;
      hb.setAttribute('aria-label', s.free ? `Gợi ý một chữ (miễn phí, còn ${s.free})` : s.coins < 10 ? 'Gợi ý: cần 10 xu' : 'Gợi ý một chữ (10 xu)');
      if (s.win) {
        winBox.hidden = false;
        winBox.innerHTML = `${mascot ? `<span aria-hidden="true">${mascot('party', 64)}</span>` : ''}<p>${s.win.stars} sao · +${s.gained} xu${s.bonusFound.size ? ` · ${s.bonusFound.size} từ thưởng` : ''}</p>
          <div class="whrow">${s.daily ? '<button class="whbig" data-e="whshare">📤 Chia sẻ kết quả</button>' : '<button class="whbig" data-e="whnext">▶ Màn tiếp</button>'}<button class="whb wide" data-e="whexit">Về sảnh</button></div>`;
        if (s.goalNote) { const g = document.createElement('p'); g.className = 'whgoal'; g.textContent = s.goalNote; winBox.querySelector('.whrow')!.before(g); }
        live.textContent = `Hoàn thành màn, ${s.win.stars} sao.`;
        setTimeout(() => (winBox.querySelector('.whbig') as HTMLElement | null)?.focus(), 50);
      } else { winBox.hidden = true; winBox.innerHTML = ''; }
    },
    result(v, w) {
      const s = st(); if (!s) return;
      flash = { kind: v, t: performance.now(), word: w };
      const gm = geo();
      if (v === 'slot') {
        const t0 = performance.now(), r = s.level.slots.findIndex(x => x.en === w), y = gm.slotTop + r * gm.rowH + gm.tile / 2, fly = still ? 0 : 340;
        pops[w] = t0 + fly; snd.found();
        if (!still) for (let k = 0; k < w.length; k++) flyers.push({ ch: w[k]!, fx: gm.cx + (k - (w.length - 1) / 2) * 16, fy: gm.cy - gm.R - 31, tx: 16 + k * (gm.tile + 4) + gm.tile / 2, ty: y, t0: t0 + k * 40 });
        setTimeout(() => { for (let k = 0; k < w.length; k++) burst(16 + k * (gm.tile + 4) + gm.tile / 2, y, s.theme.c, 6); }, fly);
        const sl = s.level.slots[r]; live.textContent = `Tìm được ${w}${sl ? `: ${sl.vi}` : ''}.`;
      } else if (v === 'bonus') { snd.bonus(); burst(gm.cx, gm.cy - gm.R - 30, '#ffd166', 18); live.textContent = `Từ thưởng: ${w}.`; }
      else if (v === 'dup') { snd.dup(); live.textContent = `${w} đã tìm rồi.`; }
      else { snd.no(); live.textContent = `${w} chưa phải từ của màn.`; }
      if (s.win) { snd.win(); for (let k = 0; k < 4; k++) burst(W * (0.2 + k * 0.2), H * 0.3, ['#ffd166', '#22c55e', '#60a5fa', '#f472b6'][k]!, 30); }
      h.refresh();
    },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    shuffle() { const r = order.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j]!, r[i]!]; } order = r; sel.length = 0; },
    close() { alive = false; cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); removeEventListener('keydown', key); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
  const ext = root as HTMLElement & { _wh?: WheelHandle; _pos?: () => Array<{ ch: string; x: number; y: number }> };
  ext._wh = h;
  ext._pos = () => { const s = st(), gm = geo(), b = cv.getBoundingClientRect(); return s ? order.map((i, k) => ({ ch: s.level.letters[i]!, x: b.left + gm.pos[k]!.x, y: b.top + gm.pos[k]!.y })) : []; };
  h.refresh();
  return h;
}
// Vị trí chữ trên vòng (để test / bot vuốt thật trên canvas): toạ độ theo màn hình.
export function letterCenters(): Array<{ ch: string; x: number; y: number }> {
  const root = document.getElementById('whfx') as (HTMLElement & { _pos?: () => Array<{ ch: string; x: number; y: number }> }) | null;
  return root?._pos ? root._pos() : [];
}
export { Music, musicOff, MKEY, snd, STILL };

// v94 Phong cảnh theo chương (M4), vẽ bằng canvas ở nửa dưới màn, chuyển động chậm (tắt khi giảm chuyển động):
// 0 bình minh: mặt trời có tia xoay + đồi · 1 biển: sóng trôi + thuyền · 2 rừng trúc: thân trúc đung đưa · 3 phố đêm: nhà cao, cửa sổ nhấp nháy
// 4 sa mạc: đồi cát + xương rồng + mặt trời · 5 băng tuyết: núi tuyết + tuyết rơi.
function scenery(g: CanvasRenderingContext2D, k: number, W: number, H: number, now: number, still: boolean): void {
  const t = still ? 0 : now / 1000, base = H * 0.62;
  g.save();
  const hill = (y0: number, amp: number, len: number, ph: number, col: string) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 + Math.sin(x / len + ph) * amp);
    g.lineTo(W, H); g.closePath(); g.fill();
  };
  switch (k % 6) {
    case 0: {   // bình minh
      const cx = W * 0.78, cy = base - H * 0.08, r = Math.min(W, H) * 0.09;
      g.globalAlpha = 0.35; g.strokeStyle = '#fff3c4'; g.lineWidth = 3;
      for (let i = 0; i < 12; i++) { const a = t * 0.15 + (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3); g.lineTo(cx + Math.cos(a) * r * 2, cy + Math.sin(a) * r * 2); g.stroke(); }
      g.globalAlpha = 0.55; g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.28; hill(base + 30, 18, 90, 0.5, '#5b2a86'); g.globalAlpha = 0.35; hill(base + 70, 14, 60, 2, '#3b1d63');
      break;
    }
    case 1: {   // biển
      for (let i = 0; i < 3; i++) { g.globalAlpha = 0.18 + i * 0.08; hill(base + i * 34, 8, 40 + i * 10, t * (0.8 + i * 0.3) + i, '#0b2a6b'); }
      const bx = ((t * 18) % (W + 80)) - 40, by = base - 6 + Math.sin(t * 1.6) * 3;
      g.globalAlpha = 0.6; g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 28, by); g.lineTo(bx + 22, by + 8); g.lineTo(bx + 6, by + 8); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(bx + 14, by - 22); g.lineTo(bx + 14, by - 2); g.lineTo(bx + 26, by - 4); g.closePath(); g.fill();
      break;
    }
    case 2: {   // rừng trúc
      g.globalAlpha = 0.3;
      for (let i = 0; i < 9; i++) {
        const x = (i + 0.5) * (W / 9), sway = Math.sin(t * 0.7 + i) * 6, top = base - 60 - (i % 3) * 40;
        g.strokeStyle = '#0f3d1f'; g.lineWidth = 7; g.beginPath(); g.moveTo(x, H); g.quadraticCurveTo(x, (H + top) / 2, x + sway, top); g.stroke();
        for (let j = 1; j < 5; j++) { const y = top + j * ((H - top) / 5); g.fillStyle = '#0f3d1f'; g.fillRect(x - 6 + sway * (1 - j / 5), y, 12, 3); }
        g.fillStyle = '#2f7d32'; g.beginPath(); g.ellipse(x + sway + 10, top + 6, 14, 4, -0.5, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case 3: {   // phố đêm
      g.globalAlpha = 0.45;
      for (let i = 0; i < 10; i++) {
        const bw = W / 10, x = i * bw, bh = 70 + ((i * 53) % 90), y = H - bh - 40;
        g.fillStyle = '#0d0726'; g.fillRect(x + 2, y, bw - 4, bh + 40);
        for (let r = 0; r < bh / 16; r++) for (let c = 0; c < 2; c++) {
          const on = Math.sin(t * 0.8 + i * 3.1 + r * 1.7 + c) > 0.2;
          g.fillStyle = on ? '#f9d423' : '#2a1f5c'; g.fillRect(x + 8 + c * (bw / 2 - 4), y + 8 + r * 16, 6, 8);
        }
      }
      g.globalAlpha = 0.6; g.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { const sx = (i * 97) % W, sy = (i * 41) % (H * 0.4); g.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + i); g.fillRect(sx, sy, 2, 2); }
      break;
    }
    case 4: {   // sa mạc
      g.globalAlpha = 0.3; g.fillStyle = '#fff1c1'; g.beginPath(); g.arc(W * 0.2, base - 40, Math.min(W, H) * 0.07, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.3; hill(base + 20, 26, 120, 1, '#8a3a1f'); g.globalAlpha = 0.4; hill(base + 60, 20, 80, 3, '#6b2a16');
      const cx = W * 0.82, cy = base + 30; g.globalAlpha = 0.45; g.fillStyle = '#1f4d2b';
      g.fillRect(cx - 5, cy - 50, 10, 60); g.fillRect(cx - 20, cy - 32, 8, 18); g.fillRect(cx - 20, cy - 20, 18, 6); g.fillRect(cx + 12, cy - 40, 8, 20); g.fillRect(cx + 5, cy - 26, 15, 6);
      break;
    }
    default: {  // băng tuyết
      g.globalAlpha = 0.35; g.fillStyle = '#e8f1ff';
      for (let i = 0; i < 4; i++) { const x = i * W / 3 - 40, w = W / 2.2, h = 90 + (i % 2) * 50; g.beginPath(); g.moveTo(x, H - 40); g.lineTo(x + w / 2, H - 40 - h); g.lineTo(x + w, H - 40); g.closePath(); g.fill(); }
      g.globalAlpha = 0.7; g.fillStyle = '#fff';
      for (let i = 0; i < 40; i++) { const x = (i * 73 + Math.sin(t + i) * 12) % W, y = ((i * 131) + t * 30 * (1 + (i % 3))) % H; g.beginPath(); g.arc(x, y, 1.5 + (i % 3), 0, Math.PI * 2); g.fill(); }
    }
  }
  g.restore();
}
