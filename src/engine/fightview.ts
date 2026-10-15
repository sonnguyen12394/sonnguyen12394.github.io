// v134 Chiến Binh Chữ: màn trận kiểu Chaos Orbit vẽ bằng canvas (lớp phủ ngoài #app, cùng khuôn Vòng Chữ / Mỏ Chữ).
// Luật ở fight.ts (bước cố định DT), điều phối ở fightctl.ts. Ở đây: điều khiển (phím, giữ & kéo trên màn, nút DASH / TUYỆT KỸ kéo được),
// HUD, thẻ lên cấp, số sát thương, hạt, rung, âm tổng hợp, bảng tinh chỉnh (?dev). Hình tự vẽ (docs/ASSETS.md), nhân vật là chibi SVG.

import { DT, T, T_DEF, blades, canDash, choose, pickInfo, pickLv, slotsUsed, step, timeLeft, colorOf, botInput, botPick, newBot, type Bot, type DodgeLv, type Enemy, type Fight, type Input } from './fight.ts';
import { Music, musicOff, STILL, snd } from './wheelview.ts';
import { ac, muted } from './sfx.ts';

export interface FightUi {
  f: () => Fight | null;
  hero: string;                       // SVG nhân vật (chibi v132, cầm Vũ khí đúng bậc đang mặc)
  pos: { x: number; y: number } | null;
  onMove(): void;                     // lần đầu người chơi điều khiển (số liệu "giây tới lần chạy đầu")
  onOver(): void;                     // trận vừa kết thúc (thắng / thua)
  onPos(p: { x: number; y: number }): void;   // người chơi kéo cụm nút sang chỗ mới
}
export interface FightHandle { refresh(): void; end(html: string | null): void; banner(t: string, ms?: number): void; close(): void; music(): void; fb(open: boolean): void }

interface Part { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number }
interface Num { x: number; y: number; v: number; crit: boolean; life: number; vy: number }
interface Zap { ax: number; ay: number; bx: number; by: number; life: number }

// ---------- Âm (port từ Chaos, nhỏ hơn) ----------
function tone(f: number, dur: number, vol: number, type: OscillatorType = 'square', slide = 0, delay = 0): void {
  if (muted()) return; const a = ac(); if (!a) return;
  try {
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain(); o.type = type;
    o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
  } catch { /* bỏ qua */ }
}
let lHit = 0, lKill = 0;
const fx = {
  hit: () => { const n = performance.now(); if (n - lHit < 50) return; lHit = n; tone(520, 0.05, 0.05); },
  crit: () => { tone(760, 0.06, 0.08); tone(1180, 0.06, 0.06, 'square', 0, 0.03); },
  kill: () => { const n = performance.now(); if (n - lKill < 60) return; lKill = n; tone(300, 0.09, 0.04, 'sawtooth', 0.5); },
  xp: (c: number) => tone(640 + Math.min(c, 40) * 8, 0.05, 0.035, 'sine'),
  level: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 0.1, 'triangle', 0, i * 0.06)),
  hurt: () => tone(170, 0.18, 0.12, 'sawtooth', 0.55),
  gold: () => { tone(940, 0.05, 0.05, 'sine'); tone(1300, 0.06, 0.04, 'sine', 0, 0.04); },
  elite: () => { tone(440, 0.12, 0.09); tone(620, 0.14, 0.08, 'square', 0, 0.13); },
  boss: () => tone(80, 0.7, 0.16, 'sawtooth', 0.7),
  evolve: () => [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.35, 0.1, 'sawtooth', 0, i * 0.07)),
  zap: () => tone(1250, 0.05, 0.03, 'square', 0.4),
  nova: () => tone(220, 0.2, 0.06, 'triangle', 1.6),
  chest: () => [659, 880, 1174].forEach((f, i) => tone(f, 0.14, 0.09, 'triangle', 0, i * 0.05)),
  dash: () => tone(880, 0.12, 0.06, 'sine', 1.6),
  ult: () => [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.4, 0.1, 'sawtooth', 0, i * 0.05)),
  shock: () => tone(140, 0.4, 0.1, 'sawtooth', 0.5),
  lose: () => [0, 1, 2].forEach(i => tone(330 - i * 60, 0.35, 0.05, 'triangle', 0.9, i * 0.22)),
};
const fmt = (s: number): string => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function openFight(ui: FightUi): FightHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx cbfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Trận đấu');
  const dev = typeof location !== 'undefined' && /[?&]dev\b/.test(location.search);
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="cbexit" aria-label="Thoát trận">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><button class="whb cbpause" type="button" aria-label="Tạm dừng">⏸</button><button class="whb" data-e="cbfbopen" aria-label="Góp ý nhanh">💬</button><button class="whb" data-e="cbmusic" aria-label="Bật / tắt nhạc nền">🎵</button>${dev ? '<button class="whb cbtune" type="button" aria-label="Bảng tinh chỉnh">⚙</button>' : ''}</div>
    <div class="cbhud" aria-hidden="true"><div class="cbhl"><div class="cbbar hp"><i></i><b></b></div><div class="cbbar xp"><i></i></div><span class="cblvl"></span></div>
      <div class="cbhc"><b class="cbclock"></b><small class="cbkill"></small></div><div class="cbhr"><b class="cbcombo"></b></div>
      <div class="cbboss" hidden><small></small><div class="cbbar bo"><i></i></div></div></div>
    <div class="cbskill"><span class="cbgrip" aria-hidden="true">⠿ kéo</span><div class="cbsrow"><button class="cbsk dash" type="button" aria-label="Lướt (Dash)"><span>DASH</span><i></i></button><button class="cbsk ult" type="button" aria-label="Tuyệt kỹ"><span>TUYỆT<br>KỸ</span><i></i></button></div></div>
    <div class="cblv" hidden role="group" aria-label="Chọn nâng cấp"><b class="cblvt"></b><small class="cblvs"></small><div class="cbcards"></div></div>
    <div class="whwin cbend" hidden></div>
    <form class="cbfb" data-eform="cbfb" hidden><b>💬 Góp ý nhanh</b><div class="cbstars" role="radiogroup" aria-label="Chấm 1 đến 5 sao">${[1, 2, 3, 4, 5].map(i => `<button type="button" class="cbst" data-e="cbstar" data-s="${i}" role="radio" aria-checked="false" aria-label="${i} sao">☆</button>`).join('')}</div>
      <input name="t" maxlength="200" autocomplete="off" placeholder="Một dòng: vui ở đâu, chán ở đâu?" aria-label="Một dòng góp ý"><input type="hidden" name="s" value="0">
      <div class="whrow"><button class="whbig" type="submit">Gửi</button><button class="whb wide" type="button" data-e="cbfbclose">Đóng</button></div></form>
    <div class="cbtn" hidden></div>
    <p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  root.tabIndex = -1;
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  setTimeout(() => { if (!root.contains(document.activeElement)) root.focus({ preventScroll: true }); }, 30);
  const q = <E extends HTMLElement>(sel: string): E => root.querySelector<E>(sel)!;
  const cv = q<HTMLCanvasElement>('canvas'), g = cv.getContext('2d')!, live = q('.whlive'), endBox = q('.cbend'), fbBox = q<HTMLFormElement>('.cbfb');
  const lvBox = q('.cblv'), skill = q('.cbskill'), dashB = q<HTMLButtonElement>('.cbsk.dash'), ultB = q<HTMLButtonElement>('.cbsk.ult'), pauseB = q<HTMLButtonElement>('.cbpause');
  const still = STILL(), music = new Music();
  let Wp = 0, Hp = 0, dpr = 1, s = 1, raf = 0, alive = true;
  const resize = () => {
    dpr = Math.min(2, devicePixelRatio || 1); Wp = root.clientWidth; Hp = root.clientHeight;
    cv.width = Wp * dpr; cv.height = Hp * dpr; cv.style.width = Wp + 'px'; cv.style.height = Hp + 'px';
    // Quái sinh ở vòng ngoài SPAWN_R ≈ 470: phóng sao cho nửa đường chéo màn ≈ 450 đơn vị (quái hiện ra từ mép, không bật giữa màn).
    s = Math.max(0.7, Math.min(1.6, Math.hypot(Wp, Hp) / 900));
    placeSkill();
  };
  // Cụm nút kỹ năng: kéo bằng tay cầm "⠿", lưu chỗ (cb.pos).
  let pos = ui.pos;
  function placeSkill(): void {
    if (!pos) { skill.style.left = ''; skill.style.top = ''; skill.style.right = ''; skill.style.bottom = ''; return; }
    const r = skill.getBoundingClientRect(), x = Math.max(4, Math.min(Wp - r.width - 4, pos.x)), y = Math.max(60, Math.min(Hp - r.height - 4, pos.y));
    skill.style.left = x + 'px'; skill.style.top = y + 'px'; skill.style.right = 'auto'; skill.style.bottom = 'auto';
  }
  resize(); addEventListener('resize', resize);
  {
    const grip = q('.cbgrip'); let drag: { dx: number; dy: number } | null = null;
    grip.addEventListener('pointerdown', e => { e.preventDefault(); const r = skill.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; try { grip.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ } });
    grip.addEventListener('pointermove', e => { if (!drag) return; e.preventDefault(); pos = { x: Math.round(e.clientX - drag.dx), y: Math.round(e.clientY - drag.dy) }; placeSkill(); });
    const upG = () => { if (!drag) return; drag = null; if (pos) ui.onPos(pos); };
    grip.addEventListener('pointerup', upG); grip.addEventListener('pointercancel', upG);
  }

  const heroImg = new Image();
  heroImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ui.hero.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));

  // ---------- Điều khiển ----------
  const keys: Record<string, boolean> = {};
  const touch = { on: false, id: -1, sx: 0, sy: 0, dx: 0, dy: 0 };
  let wantDash = false, wantUlt = false, moved = false, paused = false, fbOpen = false, endOn = false, tuneOn = false, speed = 1;
  let bot: Bot | null = null, overSent = false;
  const busy = () => paused || fbOpen || endOn || tuneOn || !!ui.f()?.pick;
  const firstMove = () => { if (!moved) { moved = true; ui.onMove(); music.start(); } };
  root.addEventListener('keydown', e => {
    if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { e.preventDefault(); keys[k] = true; firstMove(); }
    else if (k === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') { e.preventDefault(); wantDash = true; }
    else if (k === 'e' || k === 'q') wantUlt = true;
    else if ((k === 'p' || k === 'escape') && !endOn && !fbOpen) { e.preventDefault(); setPause(!paused); }
    else if (/^[123]$/.test(k) && ui.f()?.pick) { e.preventDefault(); doPick(Number(k) - 1); }
  });
  root.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  const blur = () => { for (const k in keys) keys[k] = false; touch.on = false; };
  addEventListener('blur', blur);
  cv.addEventListener('pointerdown', e => {
    if (busy()) return; e.preventDefault();
    touch.on = true; touch.id = e.pointerId; touch.sx = e.clientX; touch.sy = e.clientY; touch.dx = 0; touch.dy = 0;
    try { cv.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
  });
  cv.addEventListener('pointermove', e => { if (!touch.on || e.pointerId !== touch.id) return; touch.dx = e.clientX - touch.sx; touch.dy = e.clientY - touch.sy; if (Math.hypot(touch.dx, touch.dy) > 8) firstMove(); });
  const tEnd = (e: PointerEvent) => { if (e.pointerId === touch.id) { touch.on = false; touch.dx = touch.dy = 0; } };
  cv.addEventListener('pointerup', tEnd); cv.addEventListener('pointercancel', tEnd);
  const btn = (b: HTMLElement, fn: () => void) => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); fn(); });
  btn(dashB, () => { wantDash = true; }); btn(ultB, () => { wantUlt = true; });
  dashB.addEventListener('click', e => { if (e.detail === 0) wantDash = true; });   // bàn phím / trình đọc màn hình
  ultB.addEventListener('click', e => { if (e.detail === 0) wantUlt = true; });
  pauseB.addEventListener('click', () => setPause(!paused));
  function setPause(v: boolean): void { paused = v; pauseB.textContent = v ? '▶' : '⏸'; pauseB.setAttribute('aria-label', v ? 'Chơi tiếp' : 'Tạm dừng'); if (v) h.banner('Tạm dừng · bấm ▶ hoặc P để chơi tiếp', 600000); else bannerTxt = ''; }
  function input(): Input {
    const f = ui.f()!;
    if (bot) { const b = botInput(f, bot); wantDash = wantUlt = false; return b; }
    let mx = 0, my = 0;
    if (keys.w || keys.arrowup) my--; if (keys.s || keys.arrowdown) my++; if (keys.a || keys.arrowleft) mx--; if (keys.d || keys.arrowright) mx++;
    if (touch.on) { const l = Math.hypot(touch.dx, touch.dy); if (l > 8) { const m = Math.min(l, 60) / 60; mx = (touch.dx / l) * m; my = (touch.dy / l) * m; } }
    const out: Input = { mx, my, dash: wantDash, ult: wantUlt }; wantDash = wantUlt = false; return out;
  }

  // ---------- Thẻ lên cấp ----------
  let pickShown: Fight['pick'] = null;
  function showPick(f: Fight): void {
    const pk = f.pick; pickShown = pk; if (!pk) { lvBox.hidden = true; return; }
    q('.cblvt').textContent = pk.chest ? '🎁 Rương Elite: thêm một nâng cấp' : `⬆️ Lên cấp ${f.p.level}! Chọn một`;
    q('.cblvs').textContent = `Ô kỹ năng ${slotsUsed(f)}/${f.slotCap} · hết ô thì chỉ nâng thứ đã có`;
    q('.cbcards').innerHTML = pk.opts.map((id, i) => {
      const d = pickInfo(id), lv = d.evo ? '' : pickLv(f, id);
      return `<button type="button" class="cbcard${d.evo ? ' evo' : ''}" data-i="${i}" style="--acc:${d.acc}"><span class="cbtag">${d.tag}</span><span class="cbic" aria-hidden="true">${d.ic}</span><b>${i + 1}. ${d.vi}</b><span>${d.ds}</span>${lv ? `<small>${lv}</small>` : ''}</button>`;
    }).join('');
    lvBox.hidden = false;
    if (pk.chest) fx.chest(); else fx.level();
    live.textContent = `Chọn nâng cấp: ${pk.opts.map(id => pickInfo(id).vi).join(', ')}`;
    setTimeout(() => (lvBox.querySelector('.cbcard') as HTMLElement | null)?.focus({ preventScroll: true }), 40);
  }
  function doPick(i: number): void {
    const f = ui.f(); if (!f?.pick) return;
    const id = f.pick.opts[i]; choose(f, i);
    if (id?.startsWith('evo:')) { fx.evolve(); shake = 14; flash = 0.5; h.banner('🌟 ' + pickInfo(id).vi.toUpperCase(), 1600); }
    showPick(f);
  }
  lvBox.addEventListener('click', e => { const b = (e.target as HTMLElement).closest<HTMLElement>('.cbcard'); if (b) doPick(Number(b.dataset.i)); });

  // ---------- Bảng tinh chỉnh (?dev): sửa T lúc chạy ----------
  if (dev) {
    const box = q('.cbtn');
    q('.cbtune').addEventListener('click', () => {
      tuneOn = !tuneOn; box.hidden = !tuneOn;
      if (tuneOn) box.innerHTML = `<b>⚙ Tinh chỉnh (chỉ máy này, mất khi tải lại)</b><div class="cbtng">${(Object.keys(T) as Array<keyof typeof T>).map(k => `<label>${k}<input type="number" step="any" data-k="${k}" value="${T[k]}"></label>`).join('')}</div><button class="whb wide" type="button" data-r="1">↺ Mặc định</button>`;
    });
    box.addEventListener('input', e => { const t = e.target as HTMLInputElement, k = t.dataset.k as keyof typeof T | undefined; if (k && Number.isFinite(Number(t.value))) T[k] = Number(t.value); });
    box.addEventListener('click', e => { if ((e.target as HTMLElement).dataset.r) { Object.assign(T, T_DEF); box.querySelectorAll<HTMLInputElement>('input').forEach(i => { i.value = String(T[i.dataset.k as keyof typeof T]); }); } });
  }

  // ---------- Hiệu ứng ----------
  const parts: Part[] = [], nums: Num[] = [], zaps: Zap[] = [];
  let shake = 0, flash = 0, freeze = 0, bannerTxt = '', bannerAt = 0, bannerMs = 1600;
  const burst = (x: number, y: number, c: string, n: number) => { if (parts.length > 360) return; for (let i = 0; i < (still ? Math.ceil(n / 4) : n); i++) { const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 150; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.3 + Math.random() * 0.3, max: 0.6, c, r: 1.5 + Math.random() * 2 }); } };
  function drain(f: Fight): void {
    const ev = f.ev; if (!ev || !ev.length) return;
    for (const e of ev) {
      switch (e.k) {
        case 'hit': if (nums.length < 90) nums.push({ x: e.x, y: e.y, v: e.v, crit: e.crit, life: 0.7, vy: -34 }); if (e.crit) { fx.crit(); freeze = Math.max(freeze, 0.03); } else fx.hit(); break;
        case 'kill': burst(e.x, e.y, e.c, e.n); fx.kill(); if (e.n >= 26) shake = Math.max(shake, e.n >= 50 ? 20 : 6); break;
        case 'zap': zaps.push({ ...e, life: 0.18 }); fx.zap(); break;
        case 'hurt': fx.hurt(); shake = Math.max(shake, 7); break;
        case 'boss': fx.boss(); shake = 18; flash = 0.35; h.banner(`◆ ${f.def.boss?.vi ?? 'Boss'} xuất hiện! Hạ nó trong ${f.def.boss?.lim ?? 0} giây`, 2400); break;
        case 'elite': fx.elite(); h.banner('⚠ Elite xuất hiện: hạ nó để lấy rương', 1600); break;
        case 'shock': fx.shock(); shake = Math.max(shake, 10); break;
        case 'nova': fx.nova(); break;
        case 'dash': fx.dash(); shake = Math.max(shake, 3); break;
        case 'ult': fx.ult(); shake = 18; flash = 0.5; h.banner('⚡ OVERDRIVE', 1200); break;
        case 'gold': fx.gold(); break;
        case 'chest': break;
        case 'xp': fx.xp(e.c); break;
        case 'combo': fx.level(); shake = Math.max(shake, 4); break;
      }
    }
    ev.length = 0;
  }

  // ---------- Vẽ ----------
  const rr = (x: number, y: number, w: number, hh: number, r: number) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  function drawRe(x: number, y: number, r: number, now: number, boss: boolean, hit: boolean): void {
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.2, x, y, r * 1.2);
    gr.addColorStop(0, hit ? '#ffffff' : boss ? '#a98be0' : '#ff9ad8'); gr.addColorStop(1, hit ? '#ffd0d0' : boss ? '#3a2466' : '#7a1f5c');
    g.fillStyle = gr; g.beginPath();
    for (let k = 0; k <= 16; k++) { const a = (k / 16) * Math.PI * 2, j = r * (1 + 0.12 * Math.sin(a * 5 + now / (still ? 1e9 : 120))); const px = x + Math.cos(a) * j, py = y + Math.sin(a) * j * 0.9; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.closePath(); g.fill();
    g.save(); g.clip(); g.globalAlpha = 0.28;
    for (let k = 0; k < (boss ? 40 : 18); k++) { g.fillStyle = (k + Math.floor(now / 70)) % 2 ? '#fff' : '#000'; g.fillRect(x - r + ((k * 37 + Math.floor(now / 50) * 13) % (2 * r)), y - r + ((k * 53) % (2 * r)), 3 * s + 1, 2 * s + 1); }
    g.restore(); g.globalAlpha = 1;
    g.fillStyle = '#ff5d73'; g.shadowColor = '#ff5d73'; g.shadowBlur = still ? 0 : 10;
    for (const ex of boss ? [-0.35, 0.35] : [0]) { g.beginPath(); g.ellipse(x + ex * r, y - r * 0.15, r * 0.14, r * 0.17, 0, 0, Math.PI * 2); g.fill(); }
    g.shadowBlur = 0; g.strokeStyle = '#1b1030'; g.lineWidth = Math.max(2, 3 * s); g.beginPath();
    for (let k = 0; k <= 6; k++) { const px = x - r * 0.4 + (k / 6) * r * 0.8, py = y + r * 0.3 + (k % 2 ? -1 : 1) * r * 0.08; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
    if (boss) {
      g.strokeStyle = '#d8c8ff'; g.lineWidth = Math.max(1.5, 2 * s); g.beginPath(); g.moveTo(x, y - r * 0.85); g.lineTo(x + r * 0.2, y - r * 1.35); g.stroke();
      for (let k = 1; k <= 3; k++) { const ph = still ? 1 : (now / 400 + k / 3) % 1; g.globalAlpha = 1 - ph; g.beginPath(); g.arc(x + r * 0.2, y - r * 1.35, r * 0.2 * k * (0.6 + ph), -2.4, -0.7); g.stroke(); }
      g.globalAlpha = 1;
    }
  }
  function enemy(e: Enemy, X: number, Y: number, now: number, t: number): void {
    const r = e.r * s;
    if (e.boss || e.elite) { if (e.elite) { g.strokeStyle = `rgba(255,106,213,${0.4 + 0.3 * Math.sin(e.pulse * 6)})`; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, r + 6 * s, 0, Math.PI * 2); g.stroke(); } drawRe(X, Y, r, now, e.boss, e.flash > 0); return; }
    g.fillStyle = e.flash > 0 ? '#fff' : e.slow < 1 ? '#9fd4ff' : colorOf(e);
    g.beginPath();
    if (e.type === 'normal' || e.type === 'swarm') { g.arc(X, Y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#1b1030'; g.beginPath(); g.arc(X, Y - r * 0.1, r * 0.22, 0, Math.PI * 2); g.fill(); }
    else if (e.type === 'tank') { g.save(); g.translate(X, Y); g.rotate(t * 0.6); g.fillRect(-r, -r, r * 2, r * 2); g.restore(); }
    else { g.save(); g.translate(X, Y); g.rotate(Math.atan2(-Y + Hp / 2, -X + Wp / 2)); g.moveTo(r, 0); g.lineTo(-r, -r); g.lineTo(-r, r); g.closePath(); g.fill(); g.restore(); }
    if (e.burn > 0) { g.strokeStyle = 'rgba(255,122,60,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, r + 2, 0, Math.PI * 2); g.stroke(); }
  }
  let acc = 0, prev = performance.now(), alpha = 0;
  function draw(f: Fight, now: number): void {
    const p = f.p, w = f.w;
    const ix = p.px + (p.x - p.px) * alpha, iy = p.py + (p.y - p.py) * alpha;   // nội suy vị trí người chơi giữa hai bước
    const shk = still ? 0 : shake;
    const camX = ix - Wp / 2 / s + (shk ? (Math.random() - 0.5) * shk / s : 0), camY = iy - Hp / 2 / s + (shk ? (Math.random() - 0.5) * shk / s : 0);
    const X = (x: number) => (x - camX) * s, Y = (y: number) => (y - camY) * s;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#0a0e1a'; g.fillRect(0, 0, Wp, Hp);
    const gs = 64 * s; g.strokeStyle = '#141d33'; g.lineWidth = 1; g.beginPath();
    const sX = -(((camX * s) % gs) + gs) % gs, sY = -(((camY * s) % gs) + gs) % gs;
    for (let x = sX; x < Wp; x += gs) { g.moveTo(x, 0); g.lineTo(x, Hp); }
    for (let y = sY; y < Hp; y += gs) { g.moveTo(0, y); g.lineTo(Wp, y); }
    g.stroke();
    const vis = (x: number, y: number, m = 40) => x > -m && y > -m && x < Wp + m && y < Hp + m;
    g.fillStyle = '#7cff6b';
    for (const o of f.orbs) { const x = X(o.x), y = Y(o.y), r = 5 * s; if (!vis(x, y, 20)) continue; g.beginPath(); g.moveTo(x, y - r); g.lineTo(x + r, y); g.lineTo(x, y + r); g.lineTo(x - r, y); g.closePath(); g.fill(); }
    g.fillStyle = '#ffd447'; for (const o of f.golds) { const x = X(o.x), y = Y(o.y); if (vis(x, y, 20)) { g.beginPath(); g.arc(x, y, 6 * s, 0, Math.PI * 2); g.fill(); } }
    for (const c of f.chests) { g.save(); g.translate(X(c.x), Y(c.y)); g.rotate(Math.sin(f.t * 4) * 0.2); g.fillStyle = '#ffd447'; g.fillRect(-11 * s, -8 * s, 22 * s, 16 * s); g.fillStyle = '#8a6a00'; g.fillRect(-11 * s, -2 * s, 22 * s, 3 * s); g.restore(); }
    for (const nv of f.novas) { const a = Math.max(0, Math.min(1, 1 - nv.rad / nv.maxRad)); g.strokeStyle = nv.big ? `rgba(255,77,141,${a * 0.9})` : `rgba(201,163,255,${a * 0.8})`; g.lineWidth = nv.big ? 9 : 6; g.beginPath(); g.arc(X(nv.x), Y(nv.y), nv.rad * s, 0, Math.PI * 2); g.stroke(); }
    for (const r of f.rings) { g.strokeStyle = `rgba(255,45,111,${Math.max(0, Math.min(1, r.life / 0.7)) * 0.8})`; g.lineWidth = 5; g.beginPath(); g.arc(X(r.x), Y(r.y), r.rad * s, 0, Math.PI * 2); g.stroke(); }
    // Sóng rè sắp nổ: vòng cảnh báo mờ quanh boss (đọc được bằng mắt, như cờ gió của bản cũ).
    const bs = f.boss && !f.boss.dead ? f.boss : null;
    if (bs && bs.scd < 1.2) { g.strokeStyle = `rgba(255,45,111,${0.25 + 0.25 * Math.sin(now / 60)})`; g.setLineDash([8, 8]); g.lineWidth = 2; g.beginPath(); g.arc(X(bs.x), Y(bs.y), T.bo_shockR * s, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
    for (const z of zaps) { g.strokeStyle = `rgba(255,224,102,${Math.max(0, z.life / 0.18)})`; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(z.ax), Y(z.ay)); g.lineTo(X(z.bx), Y(z.by)); g.stroke(); }
    for (const e of f.en) { const x = X(e.x), y = Y(e.y); if (vis(x, y, e.r * s + 40)) enemy(e, x, y, now, f.t); }
    for (const sh of f.shots) { g.fillStyle = sh.shard ? '#8fd6ff' : '#9dff8a'; g.beginPath(); g.arc(X(sh.x), Y(sh.y), sh.r * s, 0, Math.PI * 2); g.fill(); }
    const PX = X(ix), PY = Y(iy), RR = w.radius * s;
    if (w.aura > 0) { const ar = (58 + w.aura * 8) * s; g.fillStyle = 'rgba(51,225,255,.06)'; g.strokeStyle = 'rgba(51,225,255,.25)'; g.lineWidth = 1.5; g.beginPath(); g.arc(PX, PY, ar, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (w.glacier || w.solar) { g.strokeStyle = w.glacier ? `rgba(150,220,255,${0.5 + 0.2 * Math.sin(f.t * 6)})` : `rgba(255,140,50,${0.5 + 0.2 * Math.sin(f.t * 8)})`; g.lineWidth = 9 * s; g.beginPath(); g.arc(PX, PY, RR, 0, Math.PI * 2); g.stroke(); }
    else { g.strokeStyle = 'rgba(51,225,255,.10)'; g.lineWidth = 1; g.beginPath(); g.arc(PX, PY, RR, 0, Math.PI * 2); g.stroke(); }
    for (const b of blades(f)) {
      g.save(); g.translate(PX + (b.x - p.x) * s, PY + (b.y - p.y) * s); g.rotate(b.a + Math.PI / 2);
      const bw = (w.heavy ? 12 : 8) * s, bh = (w.heavy ? 34 : 26) * s, grd = g.createLinearGradient(0, -bh / 2, 0, bh / 2);
      grd.addColorStop(0, '#fff'); grd.addColorStop(0.5, w.storm ? '#ffe066' : w.glacier ? '#9fe6ff' : w.solar ? '#ff9a3c' : '#8fe9ff'); grd.addColorStop(1, '#2b7dff');
      g.fillStyle = grd; g.shadowColor = w.storm ? '#ffe066' : w.solar ? '#ff7a3c' : '#33e1ff'; g.shadowBlur = still ? 0 : 12; g.fillRect(-bw / 2, -bh / 2, bw, bh); g.restore();
    }
    g.shadowBlur = 0;
    if (p.ovT > 0) { g.strokeStyle = `rgba(255,77,141,${0.4 + 0.3 * Math.sin(f.t * 14)})`; g.lineWidth = 3; g.beginPath(); g.arc(PX, PY, (p.r + 12) * s, 0, Math.PI * 2); g.stroke(); }
    const hh = 52 * s, ww = hh * 0.8;
    g.save(); g.translate(PX, PY + hh * 0.5); if (p.faceX < -0.1) g.scale(-1, 1);
    if (p.iframe > 0 && Math.floor(now / 70) % 2) g.globalAlpha = 0.55;
    if (heroImg.complete && heroImg.naturalWidth) g.drawImage(heroImg, -ww / 2, -hh, ww, hh); else { g.fillStyle = '#33e1ff'; g.beginPath(); g.arc(0, -hh / 2, p.r * s, 0, Math.PI * 2); g.fill(); }
    g.restore(); g.globalAlpha = 1;
    for (const q2 of parts) { g.globalAlpha = Math.max(0, Math.min(1, q2.life / q2.max)); g.fillStyle = q2.c; g.beginPath(); g.arc(X(q2.x), Y(q2.y), q2.r * s, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.textAlign = 'center';
    for (const n of nums) { g.globalAlpha = Math.max(0, Math.min(1, n.life / 0.7)); g.fillStyle = n.crit ? '#ffd447' : '#dfe9ff'; g.font = `${n.crit ? 900 : 700} ${Math.round((n.crit ? 20 : 14) * Math.max(0.8, s))}px system-ui, sans-serif`; g.fillText(n.crit ? `−${n.v}!` : `−${n.v}`, X(n.x), Y(n.y)); }
    g.globalAlpha = 1;
    // Cần điều khiển ảo khi giữ & kéo.
    if (touch.on) { const r = 46; g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; const b = cv.getBoundingClientRect(), cx = touch.sx - b.left, cy = touch.sy - b.top; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); const l = Math.hypot(touch.dx, touch.dy), m = Math.min(l, r); g.fillStyle = 'rgba(51,225,255,.45)'; g.beginPath(); g.arc(cx + (l ? (touch.dx / l) * m : 0), cy + (l ? (touch.dy / l) * m : 0), 18, 0, Math.PI * 2); g.fill(); }
    if (flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(0.6, flash)})`; g.fillRect(0, 0, Wp, Hp); }
    if (bannerTxt && now - bannerAt < bannerMs) {
      const a = (now - bannerAt) / bannerMs; g.globalAlpha = a > 0.85 ? (1 - a) * 6.6 : 1;
      g.font = '800 15px system-ui, sans-serif'; g.textBaseline = 'middle';
      const words = bannerTxt.split(' '), lines: string[] = []; let cur = '';
      for (const wd of words) { const nx = cur ? cur + ' ' + wd : wd; if (g.measureText(nx).width > Math.min(Wp - 48, 480) && cur) { lines.push(cur); cur = wd; } else cur = nx; }
      if (cur) lines.push(cur);
      const lh = 20, bh = lines.length * lh + 14, tw = Math.min(Wp - 24, Math.max(...lines.map(l => g.measureText(l).width)) + 28), top = 128;
      g.fillStyle = 'rgba(16,14,40,.84)'; rr(Wp / 2 - tw / 2, top, tw, bh, 14); g.fill(); g.fillStyle = '#fff';
      lines.slice(0, 5).forEach((l, i) => g.fillText(l, Wp / 2, top + 7 + lh / 2 + i * lh));
      g.textBaseline = 'alphabetic'; g.globalAlpha = 1;
    }
  }
  // HUD bằng DOM (chữ rõ, trình đọc màn hình bỏ qua; số liệu đọc qua whlive khi có việc lớn).
  const hud = { hp: q('.cbbar.hp i'), hpT: q('.cbbar.hp b'), xp: q('.cbbar.xp i'), lv: q('.cblvl'), clock: q('.cbclock'), kill: q('.cbkill'), combo: q('.cbcombo'), boss: q('.cbboss'), bossT: q('.cbboss small'), bossB: q('.cbbar.bo i'), dash: q('.cbsk.dash i'), ult: q('.cbsk.ult i') };
  let hudAt = 0;
  function syncHud(f: Fight): void {
    const p = f.p;
    hud.hp.style.width = `${(p.hp / p.maxHp) * 100}%`; hud.hpT.textContent = `${Math.ceil(p.hp)}/${Math.round(p.maxHp)}`;
    hud.xp.style.width = `${(p.xp / p.xpNext) * 100}%`; hud.lv.textContent = `Cấp ${p.level}`;
    const left = timeLeft(f);
    hud.clock.textContent = f.def.boss && !f.boss ? `Boss sau ${fmt(left)}` : fmt(left);
    hud.clock.classList.toggle('low', !!f.boss && left < 15);
    hud.kill.textContent = `Hạ ${f.kills}`;
    hud.combo.textContent = f.combo.n >= 5 ? `COMBO ×${f.combo.n}` : '';
    const bs = f.boss && !f.boss.dead ? f.boss : null;
    hud.boss.hidden = !bs || endOn; if (bs) { hud.bossT.textContent = `◆ ${f.def.boss?.vi} ◆`; hud.bossB.style.width = `${Math.max(0, bs.hp / bs.max) * 100}%`; }
    hud.dash.style.height = `${Math.max(0, Math.min(1, p.dashCd / p.dashMax)) * 100}%`; dashB.classList.toggle('ready', canDash(f));
    hud.ult.style.height = `${Math.max(0, Math.min(1, p.ult)) * 100}%`; ultB.classList.toggle('ready', p.ult >= 1);
  }
  function frame(now: number): void {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const f = ui.f(); if (!f) return;
    let dt = Math.min(0.1, (now - prev) / 1000); prev = now;
    if (freeze > 0) { freeze -= dt; dt = 0; }
    if (!busy() && !f.over && !(typeof document !== 'undefined' && document.hidden)) {
      acc += dt * speed;
      let n = 0;
      while (acc >= DT && n < 12 * speed) { acc -= DT; n++; step(f, input()); if (f.pick || f.over) { acc = 0; break; } }
      alpha = Math.min(1, acc / DT);
    } else acc = 0;
    if (f.pick && f.pick !== pickShown) { if (bot) choose(f, botPick(f, bot)); else showPick(f); }
    else if (!f.pick && pickShown) showPick(f);
    drain(f);
    if (f.over && !overSent) { overSent = true; touch.on = false; ui.onOver(); }
    for (let k = parts.length - 1; k >= 0; k--) { const q2 = parts[k]!; q2.life -= dt; q2.x += q2.vx * dt; q2.y += q2.vy * dt; q2.vx *= 0.92; q2.vy *= 0.92; if (q2.life <= 0) parts.splice(k, 1); }
    for (let k = nums.length - 1; k >= 0; k--) { const n2 = nums[k]!; n2.life -= dt; n2.y += n2.vy * dt; n2.vy *= 0.9; if (n2.life <= 0) nums.splice(k, 1); }
    for (let k = zaps.length - 1; k >= 0; k--) { zaps[k]!.life -= dt; if (zaps[k]!.life <= 0) zaps.splice(k, 1); }
    if (shake > 0) shake = Math.max(0, shake - dt * 40);
    if (flash > 0) flash = Math.max(0, flash - dt * 1.6);
    draw(f, now);
    if (now - hudAt > 90) { hudAt = now; syncHud(f); }
  }
  raf = requestAnimationFrame(frame);

  const h: FightHandle = {
    refresh() {
      const f = ui.f(); if (!f) return;
      q('.whti').textContent = f.def.vi; q('.whsu').textContent = f.def.sub;
      q('[data-e="cbmusic"]').textContent = musicOff() || muted() ? '🔇' : '🎵';
      syncHud(f);
    },
    end(html) {
      endOn = !!html; endBox.hidden = !html; endBox.innerHTML = html ?? '';
      skill.hidden = !!html; lvBox.hidden = true;
      if (html) { const f = ui.f(); if (f?.over === 'win') { snd.win(); burst(f.p.x, f.p.y, '#ffd166', 40); } else fx.lose(); live.textContent = endBox.innerText.slice(0, 200); setTimeout(() => (endBox.querySelector('.whbig') as HTMLElement | null)?.focus(), 60); }
    },
    banner(t, ms = 1600) { bannerTxt = t; bannerAt = performance.now(); bannerMs = ms; live.textContent = t; },
    fb(open) {
      fbOpen = open; fbBox.hidden = !open;
      if (open) { fbBox.reset(); (fbBox.elements.namedItem('s') as HTMLInputElement).value = '0'; fbBox.querySelectorAll('.cbst').forEach(b => { b.textContent = '☆'; b.setAttribute('aria-checked', 'false'); }); setTimeout(() => (fbBox.querySelector('.cbst') as HTMLElement | null)?.focus(), 30); }
    },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    close() { alive = false; cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); removeEventListener('blur', blur); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
  // Móc cho test e2e: đang chơi được không, bật bot (tay né cho trước, tự chọn nâng cấp), tăng tốc mô phỏng, chọn thẻ.
  const hook = root as HTMLElement & { _ready?: () => boolean; _auto?: (lv: DodgeLv) => void; _speed?: (k: number) => void; _pick?: (i: number) => void; _xp?: (v: number) => void; _state?: () => unknown };
  hook._ready = () => { const f = ui.f(); return !!f && !f.over && !endOn; };
  hook._auto = lv => { const f = ui.f(); bot = newBot(lv, f?.seed ?? 1); firstMove(); };
  hook._speed = k => { speed = Math.max(1, Math.min(40, k)); };
  hook._pick = i => doPick(i);
  hook._xp = v => { const f = ui.f(); if (f) f.orbs.push({ x: f.p.x, y: f.p.y, v, pull: true }); };
  hook._state = () => { const f = ui.f(); return f ? { t: f.t, hp: f.p.hp, level: f.p.level, kills: f.kills, pick: f.pick?.opts ?? null, x: f.p.x, y: f.p.y, dashCd: f.p.dashCd, over: f.over } : null; };
  h.refresh();
  return h;
}
