// Sảnh "Chơi" và màn Xếp Khối Chữ (v72). Chỉ trình bày: câu hỏi do engine chọn (questInner dùng chung với tháp), bàn và khay khối
// lấy từ blocks.ts. Hình vẽ bằng CSS (ô màu), không dùng hình / âm thanh của game khác.

import type { ECtx } from './views.ts';
import { loaded } from './data.ts';
import { questInner, type QuestRun } from './questview.ts';
import { N, SHAPES, canPlace, fits, anchor, type Piece } from './blocks.ts';
import type { BlocksSave } from './blocks.ts';
import { TILES, SIZE, ROLLS, price, canBuild, type BoardSave } from './board.ts';
import type { CardsSave } from './cards.ts';
import type { CafeSave } from './cafe.ts';
import type { BubblesSave } from './bubbles.ts';
import type { PuzzleSave } from './puzzle.ts';
import type { CaseSave } from './detective.ts';
import type { KaraSave } from './karaoke.ts';
import type { ShopSave } from './workshop.ts';
import type { LetterSave } from './letters.ts';
import type { RobotSave } from './robot.ts';
import type { GardenSave } from './garden.ts';
import { ENC_VI } from './quest.ts';
import { GAMES, needVi, type DirIn, type DirPick } from './director.ts';

// Sảnh: thẻ các game ở trên, tháp (Leo nhanh) giữ nguyên ở dưới.
export function viewLobby(c: ECtx, bk: BlocksSave | undefined, bd?: BoardSave, gc?: CardsSave, gq?: CafeSave, gs?: BubblesSave, gd?: PuzzleSave, gt?: CaseSave, gr?: CaseSave, tts = true, gk?: KaraSave, gw?: ShopSave, gl?: LetterSave, gb?: RobotSave, gf?: { runs: number; day: number }, gv?: GardenSave, dir?: Dir | null, hero = '', goal = ''): string {
  if (!c.e.goals.length) return '';
  const s = bk ?? { best: 0, runs: 0, day: 0, streak: 0 }, houses = (bd?.lots ?? []).reduce((a, b) => a + b, 0);
  return `<section class="stack"><span class="eyebrow">Chơi</span><h1>🎮 Hôm nay chơi gì?</h1>
    ${dir ? '' : '<p class="hint">Mọi game đều dùng cùng một bộ câu tiếng Anh app chọn cho bạn. Chỉ câu trả lời được tính vào năng lực; điểm game chỉ để vui.</p>'}</section>
    ${goal}
    ${dir ? viewDirector(c, dir) : ''}
    ${hero ? `<span class="eyebrow gsec" style="display:block;margin-top:8px">⭐ Game chủ lực: chơi nhiều nhất, chữ chính là cách chơi</span>${hero}` : ''}
    <details class="gall"${dir ? '' : ' open'}><summary>📚 Luyện tập theo kỹ năng (nghe, nói, đọc, viết, xếp lớp…)</summary>
    <p class="hint" style="margin:8px 0">Các bài luyện riêng từng kỹ năng. Bộ não chọn game vẫn đưa bạn vào đây khi lộ trình cần kỹ năng đó.</p>
    <section class="gcards">
      <span class="eyebrow gsec">🧭 Xếp lớp</span>
      <button class="gcard" data-e="fgstart"><span class="gico" aria-hidden="true" style="font-size:30px">🗺️</span><span class="stack" style="gap:2px;text-align:left"><b>Thám hiểm sương mù</b><span class="hint">Xếp lại cấp CEFR: chọn đường Từ vựng hay Ngữ pháp, mỗi điểm dò mở một ô bản đồ. Trả lời thật, đúng hay sai ô đều mở. 10–15 phút.</span><span class="hint">🧭 ${gf?.runs ?? 0} lần thám hiểm${gf?.day && c.host.today() - gf.day < 7 ? ` · bản đồ mới sau ${7 - (c.host.today() - gf.day)} ngày` : ''}</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">🔁 Từ mới & ôn tập mỗi ngày</span>
      <button class="gcard" data-e="gdstart"><span class="gico" aria-hidden="true" style="font-size:30px">🌱</span><span class="stack" style="gap:2px;text-align:left"><b>Vườn từ</b><span class="hint">Từ mới: gieo hạt (làm quen từ có hình, âm, câu ví dụ), mỗi ngày tưới một lần: nhận ra → nhớ ngược → tự gõ thì cây nở hoa.</span><span class="hint">🌸 ${gv?.blooms ?? 0} hoa · ${Object.keys(gv?.plants ?? {}).length} cây</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <button class="gcard" data-e="bkstart"><span class="gico" aria-hidden="true">${miniBoard()}</span><span class="stack" style="gap:2px;text-align:left"><b>Xếp Khối Chữ</b><span class="hint">Trả lời đúng để nhận khối, xếp đầy hàng để nổ. Ván 3–5 phút.</span><span class="hint">🏆 ${s.best} · 🔥 ${s.streak} ngày</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <button class="gcard" data-e="pzstart"><span class="gico" aria-hidden="true" style="font-size:30px">📅</span><span class="stack" style="gap:2px;text-align:left"><b>Câu đố ngày</b><span class="hint">Ôn từ: tìm 4 nhóm từ cùng chủ đề trong 16 ô, rồi nhớ lại thêm một từ mỗi nhóm. Mỗi ngày một câu đố mới.</span><span class="hint">${gd && gd.last === c.host.today() ? '✅ Đã giải hôm nay' : '🆕 Câu đố hôm nay đang chờ'} · ${gd?.days ?? 0} ngày đã giải</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">✍️ Ngữ pháp & viết</span>
      <button class="gcard" data-e="wsstart"><span class="gico" aria-hidden="true" style="font-size:30px">🛠️</span><span class="stack" style="gap:2px;text-align:left"><b>Xưởng sửa câu</b><span class="hint">Ngữ pháp & viết: câu hỏng chạy trên băng chuyền, tự gõ lại cho đúng để đóng gói. 6 đơn mỗi ca.</span><span class="hint">📦 ${gw?.packed ?? 0} câu đã sửa · kỷ lục ${gw?.best ?? 0}/6</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <button class="gcard" data-e="ltstart"><span class="gico" aria-hidden="true" style="font-size:30px">✉️</span><span class="stack" style="gap:2px;text-align:left"><b>Thư gửi cư dân phố</b><span class="hint">Viết: cư dân nhờ bạn viết thư (tin nhắn, thiệp mời, thư…), gửi đi và nhận hồi âm. Đủ ý thì được quà trang trí phố.</span><span class="hint">💌 ${gl?.runs ?? 0} thư · ${gl?.gifts ?? 0} món quà</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">📖 Đọc hiểu</span>
      <button class="gcard" data-e="dtstart"><span class="gico" aria-hidden="true" style="font-size:30px">🔍</span><span class="stack" style="gap:2px;text-align:left"><b>Thám tử</b><span class="hint">Đọc hồ sơ (biển báo, thư, bài báo) để tìm manh mối và phá án. Bài đúng cấp bạn đang học.</span><span class="hint">🗂️ ${gt?.solved ?? 0} hồ sơ đã phá · ${gt?.runs ?? 0} hồ sơ</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">🎧 Nghe & giao tiếp</span>
      ${tts ? `<button class="gcard" data-e="rdstart"><span class="gico" aria-hidden="true" style="font-size:30px">📻</span><span class="stack" style="gap:2px;text-align:left"><b>Đài phát thanh</b><span class="hint">Nghe cả bản tin / cuộc trò chuyện rồi trả lời ý chính và chi tiết. Nghe lại, nghe chậm thoải mái.</span><span class="hint">📼 ${gr?.solved ?? 0} bản tin bắt được sóng</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>` : '<p class="hint gsec">📻 Đài phát thanh cần giọng đọc tiếng Anh của máy (máy này chưa có).</p>'}
      <button class="gcard" data-e="cfstart"><span class="gico" aria-hidden="true" style="font-size:30px">☕</span><span class="stack" style="gap:2px;text-align:left"><b>Quán Cà Phê</b><span class="hint">Nghe & giao tiếp: nghe khách nói, hiểu ý, chọn câu đáp đúng văn phong. 6 khách mỗi ca.</span><span class="hint">⭐ ${gq?.stars ?? 0} sao · ${gq?.runs ?? 0} ca</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">🗣️ Phát âm & nói</span>
      <button class="gcard" data-e="bbstart"><span class="gico" aria-hidden="true" style="font-size:30px">🎯</span><span class="stack" style="gap:2px;text-align:left"><b>Bắt Âm</b><span class="hint">Phát âm: nghe một từ, chạm đúng bong bóng (ship hay sheep?). 10 từ mỗi màn, không tính giờ.</span><span class="hint">🏆 ${gs?.best ?? 0} điểm · màn ${gs?.stage ?? 1}</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <button class="gcard" data-e="krstart"><span class="gico" aria-hidden="true" style="font-size:30px">🎤</span><span class="stack" style="gap:2px;text-align:left"><b>Karaoke hội thoại</b><span class="hint">Nói: đóng một vai trong hội thoại, nghe mẫu rồi nói theo; máy cho biết nó nghe ra từ nào (máy không nghe được thì tự chấm).</span><span class="hint">🎵 kỷ lục ${gk?.best ?? 0} · ${gk?.runs ?? 0} bài</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <button class="gcard" data-e="rbstart"><span class="gico" aria-hidden="true" style="font-size:30px">🤖</span><span class="stack" style="gap:2px;text-align:left"><b>Ra lệnh cho robot</b><span class="hint">Nói (hoặc gõ) lệnh tiếng Anh để robot đi lấy đồ: phải gọi đúng tên đồ vật thì robot mới nhặt.</span><span class="hint">🏁 ${gb?.wins ?? 0} nhiệm vụ · ${gb?.picked ?? 0} đồ đã nhặt</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
      <span class="eyebrow gsec">🏙️ Thói quen & sưu tập</span>
      <button class="gcard" data-e="bdstart"><span class="gico" aria-hidden="true" style="font-size:30px">🎲</span><span class="stack" style="gap:2px;text-align:left"><b>Bàn Cờ Phố</b><span class="hint">Tung xúc xắc đi quanh phố, gặp thử thách tiếng Anh, xây nhà bằng xu. ${ROLLS} lượt tung.</span><span class="hint">🏠 ${houses} tầng nhà · vòng phố ${bd?.laps ?? 0}</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>
    </section></details>`;
}

// v88 Bộ não chọn game: một nút "Chơi tiếp" kèm lý do (nhu cầu học lúc này) + lộ trình 3 chặng hôm nay. Người học không phải chọn.
export interface Dir { x: DirIn; plan: DirPick[]; next: DirPick; inPlan: boolean }
const planRow = (c: ECtx, d: Dir): string => {
  const esc = c.host.esc, done = d.plan.filter(p => d.x.played.includes(p.game)).length;
  return `<ol class="dplan" aria-label="Lộ trình chơi hôm nay">${d.plan.map((p, i) => {
    const ok = d.x.played.includes(p.game), cur = !ok && d.inPlan && p.game === d.next.game, g = GAMES[p.game];
    return `<li class="${ok ? 'ok' : cur ? 'cur' : ''}"><span class="dnum" aria-hidden="true">${ok ? '✓' : i + 1}</span><span>${g.ico} ${esc(g.vi)}<small> · ${esc(needVi(p.need))}</small></span>${ok ? '<span class="sr-only">(xong)</span>' : ''}</li>`;
  }).join('')}</ol><p class="hint">${done >= d.plan.length ? '🎉 Xong lộ trình hôm nay. Chơi thêm nếu muốn: app vẫn chọn phần bạn cần nhất.' : `Hôm nay: ${done}/${d.plan.length} chặng`}</p>`;
};
const why = (c: ECtx, d: Dir): string => {
  const esc = c.host.esc, top = d.next;
  return `<details class="dwhy"><summary>Vì sao là game này?</summary><p class="hint">${esc(top.why)}</p>
    <p class="hint">App đọc những gì bạn cần lúc này (phần sắp quên, từ đến ngày tưới, phần đầu lộ trình, điểm nghẽn, kỹ năng còn thiếu) rồi chọn dạng game hợp nhất, và đổi dạng sau mỗi game để não không chán. Nội dung câu hỏi trong game vẫn do lộ trình của bạn quyết định.</p></details>`;
};
// v89 Tí dẫn đường (T7): nhân vật của app nói một câu theo tiến độ lộ trình hôm nay. Không nói điểm game (P13).
const TI_GO = ['Mình bắt đầu chặng đầu nhé!', 'Tí chọn sẵn game hợp nhất cho bạn rồi nè.', 'Ba chặng nhỏ thôi, xong là phố thêm đẹp!'];
const TI_MID = ['Đang vào guồng rồi, chặng tiếp nào!', 'Giỏi lắm! Còn chút nữa là xong hôm nay.', 'Đổi game cho khỏi chán, mà vẫn học đúng phần cần.'];
const TI_END = ['Xong hết rồi! Chơi thêm thì cứ thoải mái.', 'Tí tự hào về bạn hôm nay!', 'Mai mình gặp lại ở phố nhé!'];
function tiSay(c: ECtx, d: Dir, big = false): string {
  const done = d.plan.filter(p => d.x.played.includes(p.game)).length, all = done >= d.plan.length, k = c.host.today();
  const svg = c.host.mascot?.(all ? 'party' : 'happy', big ? 56 : 44);
  if (!svg) return '';
  const L = all ? TI_END : done ? TI_MID : TI_GO;
  return `<div class="tisay"><span aria-hidden="true">${svg}</span><span class="tisay-b">${c.host.esc(L[k % L.length]!)}</span></div>`;
}
export function viewDirector(c: ECtx, d: Dir): string {
  const g = GAMES[d.next.game], esc = c.host.esc;
  return `<section class="dbox stack"><span class="eyebrow">${d.inPlan ? 'Chặng tiếp theo' : 'Chơi thêm'}</span>${tiSay(c, d)}
    <button class="gcard dgo" data-e="${g.start}" data-g="${d.next.game}"><span class="gico" aria-hidden="true" style="font-size:34px">${g.ico}</span><span class="stack" style="gap:2px;text-align:left"><b>▶ Chơi tiếp: ${esc(g.vi)}</b><span class="hint">Vì: ${esc(d.next.why)}</span></span></button>
    ${planRow(c, d)}${why(c, d)}</section>`;
}
// Thanh cuối màn kết của mọi game: đi thẳng tới game kế (không quay về danh sách để chọn).
export function viewNextBar(c: ECtx, d: Dir): string {
  const g = GAMES[d.next.game], esc = c.host.esc;
  return `<section class="dbox stack" style="margin-top:14px"><span class="eyebrow">${d.inPlan ? 'Tiếp theo trong lộ trình hôm nay' : 'Chơi thêm'}</span>${tiSay(c, d, true)}
    <button class="btn primary big dgo" data-e="${g.start}" data-g="${d.next.game}">▶ Tiếp: ${g.ico} ${esc(g.vi)}</button><p class="hint">Vì: ${esc(d.next.why)}</p>${planRow(c, d)}</section>`;
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

// ---------- Bàn Cờ Phố (v73) ----------
const DIE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const HOUSE = ['', '🏠', '🏡', '🏘️'];
// Vị trí 16 ô trên vòng 5 × 5 (đi theo chiều kim đồng hồ từ góc trên trái).
const RING: Array<[number, number]> = [[1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [5, 4], [5, 3], [5, 2], [5, 1], [4, 1], [3, 1], [2, 1]];
function tileHtml(i: number, s: BoardSave, here: boolean, landed: boolean): string {
  const t = TILES[i]!, [r, col] = RING[i]!;
  const face = t.t === 'home' ? '🏁' : t.t === 'lot' ? (s.lots[i] ? HOUSE[s.lots[i]!] : t.ico) : ENC_VI[t.k].ico;
  const name = t.t === 'home' ? 'Nhà' : t.t === 'lot' ? t.name : ENC_VI[t.k].vi;
  return `<div class="bdt${t.t === 'lot' ? ' lot' : ''}${landed ? ' land' : ''}" style="grid-row:${r};grid-column:${col}" aria-label="${name}${t.t === 'lot' && s.lots[i] ? `, nhà cấp ${s.lots[i]}` : ''}${here ? ', bạn đang ở đây' : ''}"><span class="f">${face}</span><span class="n">${name}</span>${here ? '<span class="me" aria-hidden="true">🧑‍🎓</span>' : ''}</div>`;
}
export function viewBoard(c: ECtx, r: QuestRun, s: BoardSave, wallet: number): string {
  const esc = c.host.esc, bd = r.bd!, ix = loaded()!, m = bd.move;
  const top = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🎲 Bàn Cờ Phố · còn ${bd.rolls}/${ROLLS} lượt tung</span><span>🪙 <b>${wallet}</b> · ✓ ${r.ok}/${r.n}</span></div></section>`;
  if (bd.phase === 'ask') {
    const ch = r.plan[r.i]!, t = ENC_VI[ch.gameType];
    return `${top}<p class="hint">${m ? `<span class="bddie" style="display:inline-block">${DIE[m.die]}</span> Đi ${m.die} ô → ` : ''}<b>${t.ico} ${esc(t.vi)}</b>${ch.node ? ` · ${esc(ix.node.get(ch.node)?.vi ?? '')}` : ''}</p>${questInner(c, r)}`;
  }
  const at = s.pos, tile = TILES[at]!;
  let center = '';
  if (bd.phase === 'lot' && tile.t === 'lot') {
    const lv = s.lots[at] ?? 0, can = canBuild(s, at, wallet);
    center = `<p><b>${tile.ico} ${esc(tile.name)}</b>${lv ? ` · nhà cấp ${lv}` : ' · lô đất trống'}</p>
      ${lv >= 3 ? '<p class="hint">Nhà đã cấp cao nhất.</p>' : `<p class="hint">${can ? `Xây ${lv ? 'thêm tầng' : 'nhà'}: ${price(lv)} xu. Lần sau đi qua được thêm xu.` : `Cần ${price(lv)} xu để xây (bạn có ${wallet}).`}</p>`}
      <div class="row" style="justify-content:center">${can ? `<button class="btn primary" data-e="bdbuild">🏗 Xây (${price(lv)} xu)</button>` : ''}<button class="btn ghost" data-e="bdskip">Đi tiếp</button></div>`;
  } else {
    center = `<p class="bddie" aria-live="polite">${m ? DIE[m.die] : '🎲'}</p>${bd.msg ? `<p class="hint">${esc(bd.msg)}</p>` : m && tile.t === 'home' ? '<p class="hint">Về Nhà!</p>' : ''}
      <button class="btn primary big" data-e="bdroll">🎲 Tung xúc xắc</button>`;
  }
  const tiles = TILES.map((_, i) => tileHtml(i, s, i === at, !!m && m.to === i)).join('');
  return `${top}<div class="bdg">${tiles}<div class="bdc stack">${center}</div></div>
    <p class="hint" style="text-align:center">${ENC_VI.monster.ico} câu mới · ${ENC_VI.chest.ico} ôn lại · ${ENC_VI.scout.ico} thử sức · ${ENC_VI.camp.ico} bí kíp · ${ENC_VI.boss.ico} câu khó · 🥐📚🍵🚉 lô đất: xây nhà bằng xu</p>`;
}
export function viewBoardEnd(c: ECtx, r: QuestRun, s: BoardSave): string {
  const esc = c.host.esc, ix = loaded()!, houses = s.lots.reduce((a, b) => a + b, 0);
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">🎲 Bàn Cờ Phố</span><h1>🏙️ Hết lượt tung</h1>
    <p>${r.ok}/${r.n} câu đúng · +${r.coins} xu · ${r.bd?.built ? `xây ${r.bd.built} lần · ` : ''}phố có ${houses} tầng nhà.</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu trả lời của bạn, không phải từ xu hay nhà)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Lượt sau app sẽ hỏi lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Xu, nhà và vị trí trên bàn chỉ để vui, không đổi đánh giá năng lực. Mọi câu trả lời đã được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="bdstart">🎲 Chơi tiếp</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
void SIZE;
