// Bài Câu bản chủ lực (v97, GAME-CRITERIA §10.9): màn toàn màn hình ngoài #app. Nền bàn nỉ, hạt, chữ điểm vẽ bằng canvas; lá bài là nút DOM
// thật đặt trên canvas, di chuyển bằng transform mỗi khung hình (không vẽ lại #app). Nhờ vậy kéo thả mượt mà vẫn bấm được bằng bàn phím /
// trình đọc màn hình, và giữ nguyên data-e="cdtile" / "cdback" của luồng bằng chứng. Luật, điểm, bằng chứng: cards.ts / main.ts.

import type { CardsRun } from './cardsview.ts';
import { TABLES, PLAYS, target, CHARMS } from './cards.ts';
import { snd, Music, musicOff, STILL } from './wheelview.ts';
import { muted } from './sfx.ts';

export type CardsFxState = CardsRun & { nodeVi: string; best: number; prevBest?: number; story?: string };
export interface CardsHandle { close(): void; music(): void; refresh(): void }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number }
interface Pos { x: number; y: number; w: number }

const TH = 52, GAP = 8, FONT = '700 20px system-ui, sans-serif';
const charmName = (id: string) => CHARMS.find(c => c.id === id)?.name ?? id;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// Xếp các lá thành hàng, tự xuống dòng, canh giữa. Trả vị trí góc trái trên của từng lá.
export function flow(ws: number[], x0: number, y0: number, maxW: number): { pos: Pos[]; h: number } {
  const rows: number[][] = [[]]; let lw = 0;
  ws.forEach((w, i) => { const cur = rows[rows.length - 1]!; if (cur.length && lw + GAP + w > maxW) { rows.push([i]); lw = w; } else { cur.push(i); lw += (cur.length > 1 ? GAP : 0) + w; } });
  const pos: Pos[] = new Array(ws.length);
  rows.forEach((r, k) => {
    const rw = r.reduce((a, i) => a + ws[i]!, 0) + GAP * Math.max(0, r.length - 1);
    let x = x0 + (maxW - rw) / 2;
    for (const i of r) { pos[i] = { x, y: y0 + k * (TH + GAP), w: ws[i]! }; x += ws[i]! + GAP; }
  });
  return { pos, h: rows.length * (TH + GAP) - GAP };
}

export function openCards(st: () => CardsFxState | null, onBuilt: (order: number[]) => void, mascot?: (m: 'happy' | 'party', n: number) => string): CardsHandle {
  document.getElementById('whfx')?.remove();
  const root = document.createElement('div');
  root.id = 'whfx'; root.className = 'whfx cdfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Bài Câu');
  root.innerHTML = `<canvas class="whcv" aria-hidden="true"></canvas>
    <div class="whtop"><button class="whb" data-e="cdexit" aria-label="Thoát về sảnh">✕</button><div class="whtt"><b class="whti"></b><span class="whsu"></span></div><span class="whco cdsc" aria-label="Điểm bàn">🎯 <b>0</b></span><button class="whb" data-e="cdmusic" aria-label="Bật / tắt nhạc nền">🎵</button></div>
    <div class="cdhud"><div class="cdbar" role="progressbar" aria-label="Điểm bàn" aria-valuemin="0"><i></i></div><div class="cdcharms"></div></div>
    <p class="cdprompt"></p>
    <div class="cdlayer"></div>
    <div class="cdfb" hidden></div>
    <div class="whbot cdbot"><button class="whb wide" data-e="cdclear">↺ Xếp lại</button><button class="whb wide" data-e="cdskip">Không biết</button><button class="whbig" data-e="cdplay">🂠 Ra bài</button></div>
    <div class="whwin cdwin" hidden></div><p class="sr-only whlive" role="status" aria-live="polite"></p>`;
  document.body.appendChild(root);
  document.documentElement.classList.add('whopen');
  const cv = root.querySelector('canvas')!, g = cv.getContext('2d')!, live = root.querySelector('.whlive')!;
  const layer = root.querySelector<HTMLElement>('.cdlayer')!, fb = root.querySelector<HTMLElement>('.cdfb')!, win = root.querySelector<HTMLElement>('.cdwin')!;
  const bot = root.querySelector<HTMLElement>('.cdbot')!, prompt = root.querySelector<HTMLElement>('.cdprompt')!;
  const still = STILL(), music = new Music(), parts: Particle[] = [], dlog: string[] = [];   // dlog: nhật ký kéo thả (chẩn đoán trình duyệt, đọc qua root._log)
  const L = (m: string) => { dlog.push(m); if (dlog.length > 40) dlog.shift(); };
  let W = 0, H = 0, dpr = 1, raf = 0, alive = true;
  let tiles: HTMLButtonElement[] = [], handKey = '', boxKey = '', fbKey = '', ansSeen: unknown = null, zone = { x: 0, y: 0, w: 0, h: 0 };
  let drag: { i: number; id: number; sx: number; sy: number; ox: number; oy: number; x: number; y: number; moved: boolean } | null = null, suppressTo = 0;   // chặn click ngay sau khi thả (chạm cảm ứng có thể không phát click: dùng cửa sổ thời gian, không dùng cờ dính)
  let flyer: { text: string; t: number; x: number; y: number } | null = null, shake: { k: number; t: number } | null = null;
  const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = root.clientWidth; H = root.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; };
  resize(); addEventListener('resize', resize);
  const measure = (t: string) => { g.font = FONT; return Math.max(TH, Math.ceil(g.measureText(t).width) + 30); };
  const burst = (x: number, y: number, c: string, n: number) => { if (still) return; for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c, r: 2 + Math.random() * 3 }); } };

  // Hình học: vùng câu (bàn nỉ sẫm) ở trên, tay bài ở dưới; cả hai co theo chiều ngang màn.
  const geo = (s: CardsFxState) => {
    const maxW = Math.min(W - 32, 720), x0 = (W - maxW) / 2, top = 100 + (prompt.hidden ? 0 : prompt.offsetHeight) + 14;
    const built = s.built.map(i => measure(s.hand[i]!));
    const bz = flow(built.length ? built : [0], x0 + 12, top + 14, maxW - 24);
    const zh = Math.max(TH * 2 + GAP + 28, (built.length ? bz.h : TH) + 28);
    const hand = flow(s.hand.map(t => measure(t)), x0, top + zh + 40, maxW);
    return { maxW, x0, top, zh, hand: hand.pos, built: built.length ? bz.pos : [] };
  };
  // Chỗ chèn khi kéo vào vùng câu: trước lá đầu tiên nằm sau con trỏ (theo hàng rồi theo cột).
  const insertAt = (pos: Pos[], x: number, y: number): number => { for (let k = 0; k < pos.length; k++) { const p = pos[k]!; if (y < p.y - GAP / 2) return k; if (y < p.y + TH + GAP / 2 && x < p.x + p.w / 2) return k; } return pos.length; };
  const inZone = (x: number, y: number) => x >= zone.x - 10 && x <= zone.x + zone.w + 10 && y >= zone.y - 24 && y <= zone.y + zone.h + 24;

  function build(s: CardsFxState): void {
    layer.innerHTML = ''; tiles = s.hand.map((t, i) => {
      const b = document.createElement('button');
      b.className = 'cdtile'; b.lang = 'en'; b.textContent = t; b.dataset.i = String(i);
      // Kéo thả: nghe pointermove / pointerup trên window trong lúc kéo (không dựa vào pointer capture của từng lá: WebKit có lúc
      // không nhả capture của lá trước, lần kéo sau mất sự kiện). Thả xong gỡ trình nghe.
      b.addEventListener('pointerdown', e => {
        const r = st(); L(`down i=${i} t=${e.pointerType} x=${Math.round(e.clientX)},${Math.round(e.clientY)} busy=${!!drag}`); if (!r || r.ans || r.tableEnd || r.done || drag) return;
        const box = b.getBoundingClientRect(), lb = layer.getBoundingClientRect();
        drag = { i, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - box.left, oy: e.clientY - box.top, x: box.left - lb.left, y: box.top - lb.top, moved: false };
        music.start();
        const move = (ev: PointerEvent) => {
          if (!drag || drag.id !== ev.pointerId) return;
          if (!drag.moved && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) < 6) return;
          const l2 = layer.getBoundingClientRect(); if (!drag.moved) L(`move1 i=${drag.i}`); drag.moved = true; drag.x = ev.clientX - l2.left - drag.ox; drag.y = ev.clientY - l2.top - drag.oy;
        };
        const end = (ev: PointerEvent) => {
          if (!drag || drag.id !== ev.pointerId) return;
          removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end);
          try { if (b.hasPointerCapture?.(ev.pointerId)) b.releasePointerCapture(ev.pointerId); } catch { /* bỏ qua */ }
          const d = drag; drag = null; L(`${ev.type} i=${d.i} x=${Math.round(ev.clientX)},${Math.round(ev.clientY)} moved=${d.moved}`);
          // Vị trí thả lấy từ chính pointerup: máy chậm / vuốt nhanh thì trình duyệt gộp pointermove, điểm cuối của move có thể còn ở giữa đường.
          if (!d.moved && Math.hypot(ev.clientX - d.sx, ev.clientY - d.sy) >= 6) d.moved = true;
          if (!d.moved || ev.type === 'pointercancel') return;   // chạm: để sự kiện click đi tiếp (cdtile / cdback)
          const l2 = layer.getBoundingClientRect(); d.x = ev.clientX - l2.left - d.ox; d.y = ev.clientY - l2.top - d.oy;
          suppressTo = performance.now() + 350;
          const r2 = st(); if (!r2 || r2.ans) return;
          const cx = d.x + b.offsetWidth / 2, cy = d.y + TH / 2, rest = r2.built.filter(k => k !== d.i);
          L(`drop c=${Math.round(cx)},${Math.round(cy)} zone=${Math.round(zone.x)},${Math.round(zone.y)},${Math.round(zone.w)}x${Math.round(zone.h)} in=${inZone(cx, cy)}`);
          if (inZone(cx, cy)) {
            const gm = geo({ ...r2, built: rest }), at = insertAt(gm.built, cx, cy), next = [...rest]; next.splice(at, 0, d.i); L(`insert at=${at} -> ${next.join(',')}`);
            onBuilt(next); snd.letter(Math.min(7, at)); try { navigator.vibrate?.(8); } catch { /* bỏ qua */ }
          } else if (r2.built.includes(d.i)) onBuilt(rest);
        };
        addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
      });
      layer.appendChild(b); return b;
    });
  }
  root.addEventListener('click', e => { if (performance.now() < suppressTo && (e.target as HTMLElement).closest('.cdtile')) { suppressTo = 0; e.stopPropagation(); e.preventDefault(); } else if ((e.target as HTMLElement).closest('.cdtile')) { const s = st(); if (s) snd.letter(Math.min(7, s.built.length)); } }, true);

  function sync(s: CardsFxState): void {
    // Thanh trên + vùng điểm
    root.querySelector('.whti')!.textContent = s.done ? '🃏 Bài Câu' : `🃏 Bàn ${s.table + 1}/${TABLES} · lượt ${Math.min(s.play + 1, PLAYS)}/${PLAYS}`;
    root.querySelector('.whsu')!.textContent = `${s.story ? `${s.story} · ` : ''}${s.nodeVi ? `Ngữ pháp: ${s.nodeVi}` : 'Xếp lá từ thành câu đúng'}`;
    root.querySelector('.cdsc b')!.textContent = `${s.tableScore}/${target(s.table)}`;
    const bar = root.querySelector<HTMLElement>('.cdbar')!; bar.setAttribute('aria-valuemax', String(target(s.table))); bar.setAttribute('aria-valuenow', String(s.tableScore));
    (bar.firstElementChild as HTMLElement).style.width = `${Math.min(100, Math.round((s.tableScore / target(s.table)) * 100))}%`;
    const ck = s.charms.join(','); const cs = root.querySelector<HTMLElement>('.cdcharms')!;
    if (cs.dataset.k !== ck) { cs.dataset.k = ck; cs.innerHTML = s.charms.map(id => `<span class="cdcharm-on">✨ ${esc(charmName(id))}</span>`).join(''); }
    (root.querySelector('[data-e="cdmusic"]') as HTMLElement).textContent = musicOff() || muted() ? '🔇' : '🎵';
    const playing = !s.done && !s.tableEnd && !!s.item;
    prompt.hidden = !playing; if (playing && prompt.textContent !== s.item!.prompt) prompt.textContent = s.item!.prompt;
    bot.hidden = !playing || !!s.ans;
    for (const b of bot.querySelectorAll<HTMLButtonElement>('button')) b.disabled = !!s.ans || (b.dataset.e !== 'cdskip' && !s.built.length);
    // Lá bài: dựng lại khi chia lá mới
    const hk = `${s.n}|${s.table}|${s.play}|${s.hand.join('\u0001')}`;
    if (hk !== handKey) { handKey = hk; build(s); }
    layer.hidden = !playing;
    tiles.forEach((b, i) => {   // thuộc tính lá (bấm thêm / bỏ, trạng thái): cập nhật ngay, không đợi khung hình
      b.classList.toggle('on', s.built.includes(i));
      b.classList.toggle('bad', !!s.ans && !s.ans.ok && s.built.indexOf(i) === s.ans.at);
      b.classList.toggle('good', !!s.ans?.ok && s.built.includes(i));
      b.disabled = !!s.ans;
      const k = s.built.indexOf(i);
      if (k >= 0) { if (b.dataset.e !== 'cdback' || b.dataset.k !== String(k)) { b.dataset.e = 'cdback'; b.dataset.k = String(k); b.setAttribute('aria-label', `${s.hand[i]}: vị trí ${k + 1} trong câu. Bấm để bỏ ra`); } }
      else if (b.dataset.e !== 'cdtile') { b.dataset.e = 'cdtile'; delete b.dataset.k; b.setAttribute('aria-label', `${s.hand[i]}: thêm vào câu`); }
    });
    // Hộp phản hồi sau khi ra bài
    const showFb = !!s.ans && !s.tableEnd && !s.done, fk = showFb ? `${s.n}|${s.ans!.ok}` : '';
    if (fk !== fbKey) {
      fbKey = fk; fb.hidden = !showFb;
      if (showFb) {
        const a = s.ans!;
        fb.innerHTML = `<div class="fb ${a.ok ? 'good' : 'bad'}"><strong>${a.ok ? `Ra bài! ${a.chips} chip × ${a.mult} = ${a.total}` : 'Câu chưa đúng: lượt này 0 điểm'}</strong>${a.ok ? '' : `<span>Câu đúng: <b lang="en">${esc(a.right)}</b></span>${a.why ? `<span>💡 ${esc(a.why)}</span>` : ''}`}<span>+${a.coins} xu${s.novel ? ' · câu mới' : ''}</span></div>
          ${a.ok ? '<button class="whb wide" data-e="cdgo">Tiếp ▸ (tự chuyển)</button>' : `<button class="whbig" data-e="cdnext">${s.play + 1 >= PLAYS ? 'Kết thúc bàn' : 'Lượt tiếp ▸'}</button>`}`;
        live.textContent = a.ok ? `Đúng. ${a.total} điểm.` : `Chưa đúng. Câu đúng: ${a.right}.`;
        setTimeout(() => (fb.querySelector('.whbig') as HTMLElement | null)?.focus(), 30);
      } else fb.innerHTML = '';
    }
    // Hộp giữa: hết bàn (chọn bùa) / hết ván / không có câu
    const bk = s.done ? `done|${s.total}` : s.tableEnd ? `te|${s.table}|${s.offer?.map(o => o.id).join(',')}` : !s.item ? `none|${s.n}` : '';
    if (bk !== boxKey) {
      boxKey = bk; win.hidden = !bk;
      if (s.done) {
        const rec = s.total > (s.prevBest ?? 0);
        win.innerHTML = `${mascot ? `<span aria-hidden="true">${mascot('party', 72)}</span>` : ''}<h2 class="cdh">🃏 Xong ván!</h2>
          <p>🏆 Thắng ${s.won}/${TABLES} bàn · ⭐ ${s.total} điểm${rec ? ' · Kỷ lục mới!' : ''}</p><p>${s.ok}/${s.n} câu đúng · +${s.coins} xu</p>
          ${s.passed?.length ? `<p>⬆ Đã vững: ${s.passed.slice(0, 4).map(esc).join(', ')}</p>` : ''}
          <p class="cdsmall">Điểm, bàn thắng và bùa chỉ để vui, không đổi đánh giá năng lực. Mọi câu bạn tự xếp đã được ghi vào bản đồ năng lực.</p>
          <div class="whrow"><button class="whbig" data-e="cdstart">🃏 Ván mới</button><button class="whb wide" data-e="cdexit">Về sảnh</button></div>`;
        live.textContent = `Xong ván, thắng ${s.won} trên ${TABLES} bàn.`;
        if (s.won) { snd.win(); for (let k = 0; k < 4; k++) burst(W * (0.2 + k * 0.2), H * 0.3, ['#fde68a', '#22c55e', '#f472b6', '#67e8f9'][k]!, 26); }
      } else if (s.tableEnd) {
        const t = s.tableEnd;
        win.innerHTML = `<h2 class="cdh">${t.won ? '🏆 Thắng bàn!' : '🙂 Chưa đủ điểm bàn này'}</h2><p>${t.score} / ${target(s.table)} điểm</p>
          ${s.offer?.length ? `<p class="cdsmall">Chọn một lá bùa cho các bàn sau (chỉ đổi cách tính điểm):</p><div class="cdoffer">${s.offer.map(o => `<button class="cdcharm" data-e="cdcharm" data-c="${o.id}"><b>✨ ${esc(o.name)}</b><span>${esc(o.desc)}</span></button>`).join('')}</div>` : ''}
          <div class="whrow"><button class="${s.offer?.length ? 'whb wide' : 'whbig'}" data-e="cdnext">${s.table + 1 >= TABLES ? 'Xem kết quả' : s.offer?.length ? 'Bỏ qua bùa' : 'Bàn tiếp ▸'}</button></div>`;
        live.textContent = t.won ? 'Thắng bàn.' : 'Chưa đủ điểm bàn này.';
        if (t.won) { snd.win(); burst(W / 2, H * 0.3, '#fde68a', 40); }
      } else if (!s.item && bk) {
        win.innerHTML = '<p>Chưa có câu ngữ pháp nào để xếp cho mục tiêu này.</p><div class="whrow"><button class="whbig" data-e="cdnext">Tiếp</button></div>';
      } else win.innerHTML = '';
      if (bk) setTimeout(() => (win.querySelector('.cdcharm, .whbig') as HTMLElement | null)?.focus(), 40);
    }
  }

  // Đặt vị trí từng lá (transform). Gọi mỗi khung hình và ngay sau mỗi thao tác (refresh), để lá phản hồi tức thì cả khi khung hình chậm.
  function place(s: CardsFxState, now: number, gm = geo(s)): void {
    // Khi đang kéo vào vùng câu: chừa chỗ cho lá
    let built = gm.built, order = s.built;
    if (drag?.moved) {
      const rest = s.built.filter(k => k !== drag!.i), cx = drag.x + (tiles[drag.i]?.offsetWidth ?? TH) / 2, cy = drag.y + TH / 2;
      order = rest;
      if (inZone(cx, cy)) { const at = insertAt(geo({ ...s, built: rest }).built, cx, cy); order = [...rest]; order.splice(at, 0, drag.i); }
      built = geo({ ...s, built: order }).built;
    }
    const lb = layer.getBoundingClientRect(), cb = cv.getBoundingClientRect(), dx = cb.left - lb.left, dy = cb.top - lb.top;
    tiles.forEach((b, i) => {
      const k = order.indexOf(i), inRow = k >= 0, p = inRow ? built[k]! : gm.hand[i]!;
      const isDrag = drag?.moved && drag.i === i;
      let x = isDrag ? drag!.x : p.x + dx, y = isDrag ? drag!.y : p.y + dy;
      if (s.ans?.ok && inRow && !still) y -= Math.min(10, (now - (flyer?.t ?? now)) / 20);
      if (shake && s.ans && !s.ans.ok && k === shake.k && !still && now - shake.t < 420) x += Math.sin((now - shake.t) / 28) * 6;
      b.style.transform = `translate(${x}px,${y}px)${isDrag ? ' scale(1.08) rotate(-2deg)' : ''}`;
      b.style.width = `${p.w}px`;
      b.classList.toggle('drag', !!isDrag);
    });
  }
  function frame(now: number): void {
    if (!alive) return;
    const s = st();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Bàn nỉ: xanh sẫm, đèn rọi giữa, viền gỗ dưới.
    const bg = g.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#13704a'); bg.addColorStop(1, '#042417'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalAlpha = 0.06; g.fillStyle = '#fff'; g.font = '28px system-ui';
    for (let y = 40; y < H; y += 90) for (let x = ((y / 90) % 2) * 45; x < W; x += 90) g.fillText(['♠', '♥', '♦', '♣'][((x + y) / 45) % 4 | 0]!, x, y);
    g.globalAlpha = 1;
    if (s) {
      if (s.ans && s.ans !== ansSeen) {   // vừa ra bài: âm, hạt, chữ điểm, rung lá sai
        ansSeen = s.ans; const gm = geo(s), mid = gm.built.length ? gm.built[Math.floor(gm.built.length / 2)]! : { x: W / 2, y: H / 2, w: 0 };
        if (s.ans.ok) { snd.found(); flyer = { text: `+${s.ans.total}`, t: now, x: mid.x + mid.w / 2, y: mid.y }; gm.built.forEach(p => burst(p.x + p.w / 2, p.y + TH / 2, '#fde68a', 6)); }
        else { snd.no(); shake = { k: s.ans.at, t: now }; try { navigator.vibrate?.([20, 40, 20]); } catch { /* bỏ qua */ } }
      }
      if (!s.ans) ansSeen = null;
      sync(s);
      if (!layer.hidden) {
        const gm = geo(s);
        zone = { x: gm.x0, y: gm.top, w: gm.maxW, h: gm.zh };
        // Vùng câu
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.roundRect(zone.x, zone.y, zone.w, zone.h, 18); g.fill();
        g.setLineDash([8, 6]); g.strokeStyle = s.ans ? (s.ans.ok ? '#86efac' : '#fca5a5') : 'rgba(253,230,138,.7)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
        if (!s.built.length && !drag) { g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '600 16px system-ui'; g.textAlign = 'center'; g.fillText('Kéo lá vào đây, hoặc chạm lá để xếp', W / 2, zone.y + zone.h / 2 + 5); g.textAlign = 'start'; }
        // Khay tay bài
        if (gm.hand.length) {
          const hy = Math.min(...gm.hand.map(p => p.y)) - 12, hb = Math.max(...gm.hand.map(p => p.y)) + TH + 12;
          g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.roundRect(zone.x, hy, zone.w, hb - hy, 18); g.fill();
          g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '600 12px system-ui'; g.fillText('TAY BÀI', zone.x + 12, hy - 6);
        }
        place(s, now, gm);
      }
    }
    // Hạt + chữ điểm bay
    for (let k = parts.length - 1; k >= 0; k--) { const p = parts[k]!; p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02; if (p.life <= 0) { parts.splice(k, 1); continue; } g.globalAlpha = p.life; g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1;
    if (flyer) { const t = (now - flyer.t) / 1100; if (t > 1) flyer = null; else { g.globalAlpha = 1 - t; g.fillStyle = '#fde68a'; g.font = `800 ${34 + t * 10}px system-ui`; g.textAlign = 'center'; g.fillText(flyer.text, flyer.x, flyer.y - 20 - t * 60); g.textAlign = 'start'; g.globalAlpha = 1; } }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  const s0 = st(); if (s0) sync(s0);

  (root as HTMLElement & { _pos?: () => Array<{ t: string; x: number; y: number; on: boolean; k: number }> })._pos = () => tiles.map((b, i) => { const r = b.getBoundingClientRect(); return { t: st()?.hand[i] ?? '', x: r.left + r.width / 2, y: r.top + r.height / 2, on: !!st()?.built.includes(i), k: st()?.built.indexOf(i) ?? -1 }; });
  (root as HTMLElement & { _log?: () => string[] })._log = () => [...dlog];
  (root as HTMLElement & { _zone?: () => { x: number; y: number; w: number; h: number } })._zone = () => { const b = cv.getBoundingClientRect(); return { x: b.left + zone.x, y: b.top + zone.y, w: zone.w, h: zone.h }; };
  return {
    // Đồng bộ DOM ngay sau mỗi thao tác (main.ts gọi). Không đợi khung hình: WebKit chạy khung hình chậm, nút cũ (vd "Lượt tiếp") còn hiện
    // một nhịp sau khi trạng thái đã đổi thì người chơi / test bấm trúng nút "ma" (CI Safari iOS v96–v98).
    refresh() { const s = st(); if (s && alive) { sync(s); if (!layer.hidden) place(s, performance.now()); } },
    music() { if (musicOff() || muted()) music.stop(); else music.start(); },
    close() { alive = false; cancelAnimationFrame(raf); music.stop(); removeEventListener('resize', resize); root.remove(); document.documentElement.classList.remove('whopen'); },
  };
}
