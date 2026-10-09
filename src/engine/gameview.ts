// Sảnh "Chơi" và màn Xếp Khối Chữ (v72). Chỉ trình bày: câu hỏi do engine chọn (questInner dùng chung với tháp), bàn và khay khối
// lấy từ blocks.ts. Hình vẽ bằng CSS (ô màu), không dùng hình / âm thanh của game khác.

import type { ECtx } from './views.ts';
import { loaded } from './data.ts';
import { questInner, type QuestRun } from './questview.ts';
import { N, SHAPES, canPlace, fits, anchor, type Piece } from './blocks.ts';
import type { BlocksSave } from './blocks.ts';

// Sảnh: thẻ các game ở trên, tháp (Leo nhanh) giữ nguyên ở dưới.
export function viewLobby(c: ECtx, bk: BlocksSave | undefined): string {
  if (!c.e.goals.length) return '';
  const s = bk ?? { best: 0, runs: 0, day: 0, streak: 0 };
  return `<section class="stack"><span class="eyebrow">Chơi</span><h1>🎮 Hôm nay chơi gì?</h1>
    <p class="hint">Mọi game đều dùng cùng một bộ câu tiếng Anh app chọn cho bạn. Chỉ câu trả lời được tính vào năng lực; điểm game chỉ để vui.</p></section>
    <section class="gcards">
      <button class="gcard" data-e="bkstart"><span class="gico" aria-hidden="true">${miniBoard()}</span><span class="stack" style="gap:2px;text-align:left"><b>Xếp Khối Chữ</b><span class="hint">Trả lời đúng để nhận khối, xếp đầy hàng để nổ. Ván 3–5 phút.</span><span class="hint">🏆 ${s.best} · 🔥 ${s.streak} ngày</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
    </section>`;
}
const miniBoard = () => `<span class="bkmini">${[1, 0, 2, 3, 3, 0, 0, 4, 5].map(v => `<i class="c${v}"></i>`).join('')}</span>`;

const pieceHtml = (p: Piece, cls = ''): string => {
  if (p.sp) return `<span class="bkp ${cls}" style="--w:1"><i class="sp">${p.sp === 'bomb' ? '💣' : '⚡'}</i></span>`;
  const cells = SHAPES[p.s]!, w = Math.max(...cells.map(x => x[1])) + 1, h = Math.max(...cells.map(x => x[0])) + 1, set = new Set(cells.map(([r, c]) => r * 9 + c));
  let out = '';
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) out += set.has(r * 9 + c) ? `<i class="c${p.c}"></i>` : '<i></i>';
  return `<span class="bkp ${cls}" style="--w:${w}">${out}</span>`;
};

export function viewBlocks(c: ECtx, r: QuestRun): string {
  const esc = c.host.esc, bk = r.bk!, ix = loaded()!, ch = r.plan[r.i];
  const place = bk.phase === 'place', sel = place && bk.sel !== null ? bk.tray[bk.sel] ?? null : null, last = new Set(bk.last), [ar, ac] = sel ? anchor(sel) : [0, 0];
  let grid = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = bk.g[y * N + x]!, ok = !!sel && canPlace(bk.g, sel, y - ar, x - ac), boom = last.has(y * N + x) ? ' boom' : '';
    grid += place && sel
      ? `<button class="bkc c${v}${ok ? ' ok' : ''}${boom}" data-e="bkput" data-r="${y}" data-c="${x}"${ok ? ' data-ok="1"' : ' aria-disabled="true"'} aria-label="Hàng ${y + 1}, cột ${x + 1}${v ? ', có khối' : ''}"></button>`
      : `<i class="bkc c${v}${boom}"></i>`;
  }
  const top = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🧱 Xếp Khối · câu ${Math.min(r.i + 1, r.plan.length)}/${r.plan.length}</span><span>⭐ <b>${bk.score}</b> · 🏆 ${Math.max(bk.best, bk.score)} · 🪙 ${r.coins}</span></div>
    ${bk.combo > 1 ? `<p class="bkcombo" role="status">🔥 Combo x${bk.combo}</p>` : ''}${bk.gain ? `<span class="bkgain" aria-live="polite">+${bk.gain}</span>` : ''}</section>`;
  const board = `<div class="bkg${place ? ' live' : ' mini'}" role="${place ? 'grid' : 'img'}" aria-label="Bàn 8 × 8">${grid}</div>`;
  if (!place) {
    const tag = ch && ch.gameType !== 'camp' && ch.node ? `<p class="hint">${ch.gameType === 'chest' ? '🎁 Ôn lại' : ch.gameType === 'boss' ? '👑 Câu khó' : ch.gameType === 'scout' ? '❓ Thử sức' : '✏️ Câu mới'} · ${esc(ix.node.get(ch.node)?.vi ?? '')}</p>` : '';
    const sos = bk.rescue ? `<p class="warnt" role="status">🧯 <b>Hết chỗ đặt!</b> Trả lời câu này để nhận 💣 bom và ⚡ sét dọn bàn (cứu bàn ${bk.saves}/2).</p>` : '';
    return `${top}${sos}${tag}${questInner(c, r)}${board}`;   // lúc hỏi: câu hỏi trước, bàn thu nhỏ bên dưới (màn hình điện thoại)
  }
  const tray = bk.tray.map((p, i) => !p ? '<span class="bkslot" aria-hidden="true"></span>' : fits(bk.g, p)
    ? `<button class="bkslot${bk.sel === i ? ' on' : ''}" data-e="bksel" data-p="${i}" data-fit="1" aria-pressed="${bk.sel === i}" aria-label="Khối ${i + 1}${p.sp === 'bomb' ? ': bom nổ 3 × 3' : p.sp === 'bolt' ? ': sét xoá hàng và cột' : ''}">${pieceHtml(p)}</button>`
    : `<span class="bkslot off" aria-label="Khối ${i + 1}: không còn chỗ">${pieceHtml(p)}</span>`).join('');
  return `${top}${board}<p class="hint" style="text-align:center">${sel ? (sel.sp === 'bomb' ? 'Chạm ô bất kỳ để nổ vùng 3 × 3.' : sel.sp === 'bolt' ? 'Chạm ô bất kỳ để xoá cả hàng và cột.' : 'Chạm ô có chấm để đặt ô đầu tiên (trên cùng bên trái) của khối.') : 'Chọn một khối.'}</p><div class="bktray">${tray}</div>`;
}

export function viewBlocksEnd(c: ECtx, r: QuestRun): string {
  const esc = c.host.esc, bk = r.bk!, ix = loaded()!, rec = bk.score > bk.best;
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">🧱 Xếp Khối</span><h1>${r.done === 'win' ? '🏁 Xong ván!' : '🧱 Hết chỗ đặt'}</h1>
    <p style="font-size:22px">⭐ <b>${bk.score}</b> điểm${rec ? ' · <b>🏆 Kỷ lục mới!</b>' : ` · kỷ lục ${bk.best}`}</p>
    <p>${r.ok}/${r.n} câu đúng · ${bk.lines} hàng đã nổ · +${r.coins} xu.</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu trả lời của bạn, không phải từ điểm game)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Ván sau app sẽ hỏi lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Điểm và kỷ lục chỉ để vui, không đổi đánh giá năng lực. Mọi câu trả lời đã được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="bkstart">▶ Ván mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
