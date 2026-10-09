// Màn Ra lệnh cho robot (v84). Chỉ trình bày: đồ vật do engine chọn (main.ts), luật ở robot.ts. Lưới vẽ bằng CSS + emoji.

import type { ECtx } from './views.ts';
import { N, won, type Board } from './robot.ts';

export interface RobotRun { floor: number; seed: number; t0: number; node: string; b: Board; log: Array<{ ok: boolean; msg: string }>; done: boolean; asr: boolean; heard: string | null; picked: number; misnamed: number }
export const robotKey = (r: RobotRun): string => `rb:${r.floor}:${r.b.cmds}`;

export function viewRobot(c: ECtx, r: RobotRun, busy: boolean | string): string {
  const esc = c.host.esc, b = r.b, targets = b.items.filter(i => i.target);
  let grid = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const it = b.items.find(i => i.r === y && i.c === x && !i.got), bot = b.r === y && b.c === x, home = y === 0 && x === 0;
    grid += `<span class="rbcell${home ? ' home' : ''}${bot ? ' bot' : ''}">${bot ? '🤖' : it ? it.pic : home ? '🏠' : ''}${bot && it ? `<small>${it.pic}</small>` : ''}</span>`;
  }
  const mission = targets.map(i => `<span class="pill${i.got ? ' good' : ''}">${i.got ? '✓ ' : ''}${i.pic} ${esc(i.vi)}</span>`).join(' ');
  const log = r.log.slice(-4).map(l => `<p class="rblog ${l.ok ? 'ok' : 'no'}">${l.ok ? '✓' : '✗'} ${esc(l.msg)}</p>`).join('');
  const mic = r.asr
    ? busy === true ? '<div class="row"><button class="btn" data-act="asrstop">■ Đang nghe… bấm khi nói xong</button></div>'
      : `<div class="row"><button class="btn" data-e="rbmic">🎙 Nói lệnh</button></div>${typeof busy === 'string' ? `<p class="hint">${esc(busy)}</p>` : ''}${r.heard !== null ? `<div class="fb neutral" role="status"><span>Máy nghe: “<span lang="en">${esc(r.heard) || '…'}</span>”</span><div class="row"><button class="btn primary small" data-e="rbrun">▶ Chạy lệnh này</button></div></div>` : ''}`
    : '<p class="hint">Máy này không nghe được giọng: gõ lệnh tiếng Anh.</p>';
  return `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🤖 Ra lệnh cho robot · ${b.cmds} lệnh · ${b.moves} bước</span></div>
      <p>Nhiệm vụ: nhặt ${mission} rồi về Nhà 🏠.</p></section>
    <div class="rbgrid" role="img" aria-label="Bàn 5 × 5, robot ở hàng ${b.r + 1} cột ${b.c + 1}">${grid}</div>
    ${log}${mic}
    <form class="row" data-eform="rbcmd" style="gap:6px"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Lệnh cho robot" placeholder="go right two steps then pick up the …" style="flex:1;min-width:0"><button class="btn primary">▶ Chạy</button></form>
    <details><summary class="hint">Lệnh robot hiểu</summary><p class="hint" lang="en">go up / down / left / right · go down two steps · pick up the <i>(tên đồ)</i> · go home · nối bằng “then”</p><p class="hint">Robot chỉ nhặt khi bạn gọi đúng tên tiếng Anh của đồ vật.</p></details>
    <div class="row"><button class="btn ghost" data-e="rbgive">Bỏ cuộc (xem tên đồ)</button></div>`;
}

export function viewRobotEnd(c: ECtx, r: RobotRun): string {
  const esc = c.host.esc, b = r.b, win = won(b);
  return `<section class="stack"><span class="eyebrow">🤖 Ra lệnh cho robot</span><h1>${win ? '🤖 Về Nhà an toàn!' : '🤖 Robot nghỉ'}</h1>
    <p style="font-size:20px">${win ? `Xong nhiệm vụ với ${b.cmds} lệnh · ${b.moves} bước` : 'Lần sau thử lại nhé'}</p>
    <p>Đồ trên bàn: ${b.items.map(i => `${i.pic} <b lang="en">${esc(i.en)}</b> (${esc(i.vi)})`).join(' · ')}</p>
    <p class="hint">Lệnh nói / gõ chỉ để luyện, không đổi mức thuộc. Máy nghe ra chưa chắc là phát âm chuẩn.</p></section>
    <div class="row"><button class="btn primary" data-e="rbstart">🤖 Nhiệm vụ mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
