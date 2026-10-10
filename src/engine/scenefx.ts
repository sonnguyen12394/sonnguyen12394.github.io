// v107–v108 Cảnh sống cho các game kỹ năng còn lại (GAME-CRITERIA §10.18): 1/3 trên màn, vẽ bằng canvas, đọc trạng thái lượt chơi.
// Chỉ trình bày (canvas aria-hidden): câu hỏi, đáp án, bằng chứng vẫn ở thẻ HTML bên dưới, không đổi.
// t: 0 → 1 trong 1,2 s kể từ khi trạng thái (key) đổi; still: người dùng bật giảm chuyển động.

export type MoreScene =
  | { kind: 'shop'; k: number; total: number; packed: number; ok: boolean | null; key: string }
  | { kind: 'letter'; who: string; name: string; phase: 'write' | 'reply' | 'rate' | 'done'; ok: boolean | null; key: string }
  | { kind: 'case' | 'radio'; flipped: boolean[]; cur: number; ok: boolean | null; key: string }
  | { kind: 'kara'; n: number; i: number; mine: boolean; combo: number; ok: boolean | null; key: string }
  | { kind: 'robot'; got: number; total: number; ok: boolean | null; key: string }
  | { kind: 'tower'; floor: number; hp: number; max: number; i: number; n: number; ok: boolean | null; key: string };

type G = CanvasRenderingContext2D;
// fillStyle đặc trước khi vẽ emoji: emoji kế thừa độ trong của màu tô trước đó (rgba) và bị mờ.
const emo = (g: G, s: string, x: number, y: number, px: number): void => { g.fillStyle = '#000'; g.font = `${px}px system-ui`; g.textAlign = 'center'; g.fillText(s, x, y); g.textAlign = 'start'; };
function frame(g: G, W: number, top: number, h: number, a: string, b: string): void {
  const sky = g.createLinearGradient(0, top, 0, top + h); sky.addColorStop(0, a); sky.addColorStop(1, b); g.fillStyle = sky;
  g.beginPath(); g.roundRect(8, top, W - 16, h, 18); g.fill();
}
function tag(g: G, text: string, x: number, y: number): void {
  g.font = '700 14px system-ui'; const w = g.measureText(text).width + 16;
  g.fillStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.roundRect(x, y - 16, w, 22, 8); g.fill(); g.fillStyle = '#fff'; g.fillText(text, x + 8, y);
}
function bubble(g: G, text: string, x: number, y: number): void {
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x, y, 52, 40, 12); g.fill();
  g.beginPath(); g.moveTo(x + 10, y + 40); g.lineTo(x + 4, y + 50); g.lineTo(x + 20, y + 40); g.fill(); emo(g, text, x + 26, y + 30, 24);
}
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function drawMore(g: G, sc: MoreScene, W: number, top: number, h: number, now: number, t: number, still: boolean): void {
  const bob = still ? 0 : Math.sin(now / 320) * 3;
  switch (sc.kind) {
    case 'shop': {   // băng chuyền: hộp đã đóng gói trôi sang phải, hộp đang sửa ở giữa, đúng thì đóng dấu, sai thì rung + cờ lê
      frame(g, W, top, h, '#c9d3e0', '#8995a8');
      const by = top + h * 0.66, step = Math.max(46, (W - 60) / sc.total);
      g.fillStyle = '#3b4250'; g.beginPath(); g.roundRect(16, by, W - 32, 18, 9); g.fill();
      g.fillStyle = '#5b6474'; for (let x = 24 - ((still ? 0 : now / 20) % 24); x < W - 24; x += 24) { g.beginPath(); g.arc(x + 8, by + 9, 5, 0, Math.PI * 2); g.fill(); }
      for (let k = 0; k < sc.total; k++) {
        const done = k < sc.k || (k === sc.k && sc.ok === true), cur = k === sc.k && !done;
        let x = 30 + step * k + step / 2; if (k === sc.k && sc.ok === true) x += ease(t) * step * 0.4;
        const wob = cur && sc.ok === false && t < 1 ? Math.sin(t * 34) * 6 : 0;
        if (!done && !cur) { g.fillStyle = '#b08a5a'; g.beginPath(); g.roundRect(x - 13, by - 26, 26, 22, 3); g.fill(); g.fillStyle = '#8a6a42'; g.fillRect(x - 13, by - 18, 26, 3); }
        else emo(g, done ? '📦' : '🛠️', x + wob, by - 4 + (cur ? bob : 0), cur ? 40 : 30);
        if (done && k === sc.k && t < 1) emo(g, '✅', x + 16, by - 34, 22);
        if (cur && sc.ok === false) emo(g, '🔧', x + 26, by - 30, 22);
      }
      emo(g, '⚙️', 36, top + 34, 26); emo(g, '⚙️', W - 40, top + 30, 20);
      tag(g, `Đơn ${Math.min(sc.k + 1, sc.total)}/${sc.total} · 📦 ${sc.packed}`, 20, top + h - 10);
      break;
    }
    case 'letter': {   // bàn viết bên cửa sổ; cư dân đứng chờ; gửi đủ → thư bay tới, tim; thiếu → dấu hỏi
      frame(g, W, top, h, '#ffe9c7', '#f2c98f');
      g.fillStyle = '#8fd3ff'; g.beginPath(); g.roundRect(W - 150, top + 16, 120, h * 0.48, 10); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(W - 150, top + 16, 120, h * 0.48);
      g.fillStyle = '#8a5a34'; g.beginPath(); g.roundRect(8, top + h * 0.7, W - 16, h * 0.3, [0, 0, 18, 18]); g.fill();
      const px = W - 90, py = top + h * 0.6;
      emo(g, sc.who, px, py + bob, 56); tag(g, sc.name, px - 40, top + h - 10);
      if (sc.phase === 'write') {
        emo(g, '📝', 70, top + h * 0.7 - 6, 40);
        emo(g, '✒️', 96 + (still ? 0 : Math.sin(now / 120) * 6), top + h * 0.7 - 30, 26);
        bubble(g, '💭', px - 70, py - 92);
      } else if (sc.phase === 'reply' && sc.ok === false) {
        emo(g, '✉️', 70, top + h * 0.7 - 6, 36); bubble(g, '❓', px - 70, py - 92);
      } else {   // gửi đủ / tự chấm / xong: phong thư bay tới cư dân, tim nổi
        const k = sc.phase === 'reply' ? ease(Math.min(1, t * 1.4)) : 1, ex = 70 + (px - 110) * k, ey = top + h * 0.6 - Math.sin(k * Math.PI) * 50;
        emo(g, '💌', ex, ey, 34); bubble(g, sc.phase === 'reply' ? '😊' : '💖', px - 70, py - 92);
      }
      break;
    }
    case 'case':
    case 'radio': {   // bảng manh mối ghim (đọc) / máy thu với vạch sóng (nghe); manh mối đúng thì lật, kim / ghim nảy
      const read = sc.kind === 'case';
      frame(g, W, top, h, read ? '#5a4632' : '#2a1a4a', read ? '#3a2c1f' : '#140828');
      const n = Math.max(1, sc.flipped.length), f = sc.flipped.filter(Boolean).length;
      if (read) {
        g.fillStyle = '#c79a62'; g.beginPath(); g.roundRect(24, top + 14, W - 48, h - 46, 10); g.fill();
        const step = (W - 72) / n;
        sc.flipped.forEach((on, k) => {
          const x = 36 + step * k + step / 2, y = top + 18 + (h - 46) / 2, cur = k === sc.cur;
          const pop = cur && sc.ok && t < 1 ? 1 + Math.sin(t * Math.PI) * 0.35 : 1;
          g.fillStyle = on ? '#fffbe6' : '#e9dcc2'; g.save(); g.translate(x, y); g.rotate(((k * 37) % 9 - 4) / 40); g.scale(pop, pop);
          g.beginPath(); g.roundRect(-22, -28, 44, 56, 4); g.fill(); g.restore();
          emo(g, on ? '🔍' : cur ? '❔' : '🔒', x, y + 10, on ? 24 : 20); emo(g, '📌', x, y - 22, 16);
          if (cur && sc.ok === false && t < 1) emo(g, '❌', x + 16, y - 20, 16);
        });
        if (!still) { g.globalAlpha = 0.22; g.fillStyle = '#fff6c7'; const sx = 40 + ((now / 12) % (W - 80)); g.beginPath(); g.arc(sx, top + h * 0.45, 46, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
        tag(g, `Manh mối ${f}/${n}`, 20, top + h - 10);
      } else {
        const q = 1 - f / n, cx = W / 2, cy = top + h * 0.48;
        g.fillStyle = '#7a4fb8'; g.beginPath(); g.roundRect(cx - 120, cy - 44, 240, 88, 16); g.fill();
        g.fillStyle = '#21123b'; g.beginPath(); g.roundRect(cx - 100, cy - 30, 140, 60, 8); g.fill();
        g.strokeStyle = '#d6b8ff'; g.lineWidth = 2; g.beginPath();
        for (let x = 0; x <= 140; x += 3) { const ph = still ? 0 : now / 140, s = Math.sin(x / 9 + ph) * 18 * (1 - q * 0.6) + (q * 20 * (((x * 37 + Math.floor(ph * 5) * 13) % 17) / 17 - 0.5)); g[x ? 'lineTo' : 'moveTo'](cx - 100 + x, cy + s); }
        g.stroke();
        emo(g, '🔊', cx + 76, cy + 10, 26);
        for (let k = 0; k < n; k++) { g.fillStyle = sc.flipped[k] ? '#8ef0b5' : 'rgba(255,255,255,.25)'; g.fillRect(cx + 48 + k * 8, cy + 30 - 6 - k * 4, 6, 6 + k * 4); }
        if (sc.ok === false && t < 1) emo(g, '⚡', cx - 130, cy, 26);
        if (sc.ok && t < 1) emo(g, '📶', cx - 132, cy - 6 - Math.sin(t * Math.PI) * 10, 26);
        tag(g, `Sóng rõ ${Math.round((1 - q) * 100)}%`, 20, top + h - 10);
      }
      break;
    }
    case 'kara': {   // sân khấu, đèn rọi; câu của bạn: micro sáng; combo: nốt nhạc bay
      frame(g, W, top, h, '#3a0d33', '#120410');
      const cx = W / 2, fy = top + h * 0.72;
      g.fillStyle = '#5b2a52'; g.beginPath(); g.roundRect(8, fy, W - 16, top + h - fy, [0, 0, 18, 18]); g.fill();
      g.globalAlpha = sc.mine ? 0.32 : 0.14; g.fillStyle = '#fff3b0'; g.beginPath(); g.moveTo(cx - 20, top + 6); g.lineTo(cx + 20, top + 6); g.lineTo(cx + 90, fy); g.lineTo(cx - 90, fy); g.closePath(); g.fill(); g.globalAlpha = 1;
      emo(g, sc.mine ? '🧑‍🎤' : '🧍', cx, fy - 4 + (sc.mine ? bob : 0), 56); emo(g, '🎤', cx + 34, fy - 34, 24);
      emo(g, '🤖', 50, fy - 4, 34);
      const notes = Math.min(6, sc.combo + (sc.ok ? 1 : 0));
      for (let k = 0; k < notes && !still; k++) emo(g, k % 2 ? '♪' : '♫', cx - 60 + k * 24, top + 40 - ((now / 25 + k * 30) % 40), 20);
      if (sc.ok === false && t < 1) bubble(g, '🔁', cx + 40, top + 18);
      for (let k = 0; k < sc.n; k++) { g.fillStyle = k < sc.i ? '#ffc6ee' : k === sc.i ? '#fff' : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(24 + k * 14, top + h - 16, 4, 0, Math.PI * 2); g.fill(); }
      break;
    }
    case 'robot': {   // xưởng robot: robot lớn đổi mặt theo lệnh vừa chạy, thanh pin = số món đã lấy
      frame(g, W, top, h, '#1d4a6b', '#0b2233');
      const cx = W / 2, cy = top + h * 0.5;
      emo(g, '🤖', cx, cy + 22 + bob, 76);
      if (sc.ok === true && t < 1) emo(g, '✨', cx + 44, cy - 20, 26);
      if (sc.ok === false && t < 1) bubble(g, '❓', cx + 34, cy - 66);
      const bw = 120, bx = W - bw - 28, byy = top + 22;
      g.strokeStyle = '#a7e3ff'; g.lineWidth = 2; g.strokeRect(bx, byy, bw, 20);
      g.fillStyle = '#8ef0b5'; g.fillRect(bx + 2, byy + 2, (bw - 4) * (sc.total ? sc.got / sc.total : 0), 16);
      tag(g, `Đã lấy ${sc.got}/${sc.total}`, 20, top + h - 10);
      break;
    }
    case 'tower': {   // tháp: người leo đứng ở bậc theo câu đúng trong tầng; tim; đúng → bước lên, sai → trượt
      frame(g, W, top, h, '#2a2a5c', '#0a0a20');
      const tx = W / 2 - 50, steps = Math.max(1, sc.n), sh = (h - 40) / steps;
      g.fillStyle = '#4a4a8c'; g.fillRect(tx, top + 16, 100, h - 24);
      for (let k = 0; k < steps; k++) { g.fillStyle = k < sc.i ? '#fde68a' : 'rgba(255,255,255,.18)'; g.fillRect(tx + 8, top + h - 16 - (k + 1) * sh, 84, 3); }
      emo(g, '🏰', tx + 50, top + 34, 26);
      let lv = Math.min(sc.i, steps); if (sc.ok === true && t < 1) lv = lv - 1 + ease(t); if (sc.ok === false && t < 1) lv -= Math.sin(t * Math.PI) * 0.3;
      emo(g, '🧗', tx + 50, top + h - 18 - lv * sh, 30);
      g.font = '18px system-ui'; g.fillText('❤️'.repeat(Math.max(0, sc.hp)) + '🤍'.repeat(Math.max(0, sc.max - sc.hp)), 24, top + 30);
      tag(g, `Tầng ${sc.floor} · ${Math.min(sc.i, sc.n)}/${sc.n}`, 20, top + h - 10);
      break;
    }
  }
}
