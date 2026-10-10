// Phố chung + số liệu chơi (v89): chỉ trình bày. Công trình là nút mở đúng game đó (phố cũng là chỗ chọn game).

import type { ECtx } from './views.ts';
import { GAMES } from './director.ts';
import { MAX_LV, LV_VI, townLevel, DECO, canDeco, type Building, type TownSave } from './town.ts';
import { TH, MIN_N, type GReport } from './play.ts';

const stars = (lv: number) => '★'.repeat(lv) + '☆'.repeat(MAX_LV - lv);

export function viewTown(c: ECtx, b: Building[], t: TownSave, wallet: number): string {
  const esc = c.host.esc, lv = townLevel(b), built = b.filter(x => x.lv).length;
  const tiles = b.map(x => {
    const g = GAMES[x.game], tip = x.next === null ? 'đủ 4 ★' : `${x.v}/${x.next} ${x.unit} tới ★ thứ ${x.lv + 1}`;
    return `<button class="twt${x.lv ? '' : ' off'}" data-e="${g.start}" style="--lv:${x.lv}" aria-label="${esc(x.vi)}: ${esc(LV_VI[x.lv])}, ${x.lv} trên 4 sao, ${esc(tip)}. Mở ${esc(g.vi)}">
      <span class="twi" aria-hidden="true">${x.ico}</span>${t.deco[x.game] ? `<span class="twd" aria-hidden="true">${DECO[x.game].slice(0, t.deco[x.game]).join('')}</span>` : ''}<b>${esc(x.vi)}</b><span class="tws" aria-hidden="true">${stars(x.lv)}</span><span class="twn">${esc(tip)}</span></button>`;
  }).join('');
  return `<section class="stack twbox"><div class="spread"><span class="eyebrow">🏙️ Phố của bạn · ${lv}/${b.length * MAX_LV} ★</span><span class="hint">${built}/${b.length} công trình</span></div>
    <div class="twg">${tiles}</div>
    ${built ? viewDecoShop(c, b, t, wallet) : ''}
    <p class="hint">Mỗi game xây một công trình trên phố. Chạm công trình để chơi. ★ của phố chỉ để vui, không phải cấp tiếng Anh: cấp của bạn chỉ lên từ câu trả lời.</p></section>`;
}

// Màn kết: công trình vừa lên cấp + mốc gần nhất của game vừa chơi (gần đích thì muốn chơi tiếp, không dựa vào sợ mất).
export function viewTownGain(c: ECtx, gain: Building[], cur: Building | undefined): string {
  const esc = c.host.esc, ti = c.host.mascot?.(gain.length ? 'party' : 'happy', 52) ?? '';
  const up = gain.map(x => `<li><span aria-hidden="true">${x.ico}</span> <b>${esc(x.vi)}</b>: ${esc(LV_VI[x.lv])} <span aria-hidden="true">${stars(x.lv)}</span><span class="sr-only">${x.lv} trên 4 sao</span></li>`).join('');
  const near = cur && cur.next !== null ? `Còn ${cur.next - cur.v} ${esc(cur.unit)} nữa để ${esc(cur.vi)} có ★ thứ ${cur.lv + 1}.` : cur ? `${esc(cur.vi)} đã đủ 4 ★.` : '';
  if (!up && !near) return '';
  return `<section class="twgain${gain.length ? ' up' : ''}" role="status">${ti ? `<span class="twti" aria-hidden="true">${ti}</span>` : ''}<div class="stack" style="gap:4px">
    ${up ? `<b>🏗️ Phố mới!</b><ul class="twup">${up}</ul>` : ''}${near ? `<span class="hint">${near}</span>` : ''}</div></section>`;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const mark = (ok: boolean | null | undefined) => (ok === undefined || ok === null ? '' : ok ? ' ✓' : ' ✗');
export function viewPlayStats(c: ECtx, rows: GReport[]): string {
  if (!rows.length) return '';
  const esc = c.host.esc;
  const body = rows.map(r => {
    const g = GAMES[r.game];
    return `<tr><td>${g.ico} ${esc(g.vi)}</td><td class="num">${r.n}</td><td class="num">${pct(r.quit)}${mark(r.ok?.quit)}</td><td class="num">${r.done ? pct(r.cont) : '—'}${mark(r.ok?.cont)}</td><td class="num">${r.er !== null ? r.er.toFixed(1) : 'Can-Do'}${mark(r.ok?.er)}</td><td class="num">${r.first ?? '—'}${r.first !== null ? ' s' : ''}${mark(r.ok?.first)}</td><td class="num">${r.dur !== null ? (r.dur / 60).toFixed(1) + ' ph' : '—'}${mark(r.ok?.dur)}</td></tr>`;
  }).join('');
  return `<details class="gall"><summary>📊 Số liệu chơi trên máy này</summary><div class="tablewrap" tabindex="0" role="region" aria-label="Số liệu chơi từng game"><table style="min-width:0"><thead><tr><th>Game</th><th>Ván</th><th>Bỏ giữa</th><th>Chơi tiếp sau ván</th><th>Câu / phút</th><th>Thao tác đầu</th><th>Một ván</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="hint">Ngưỡng tốt: bỏ giữa dưới ${pct(TH.quit)}; xong ván rồi chơi tiếp từ ${pct(TH.cont)}; từ ${TH.er} câu tính vào năng lực mỗi phút (game kỹ năng ghi vào Can-Do nên không đếm theo câu); thao tác đầu trong ${TH.first} giây; một ván không quá ${TH.dur / 60} phút. Cần từ ${MIN_N} ván mới đánh ✓ / ✗.</p>
    <p class="hint">App không cố giữ bạn lâu hơn: số liệu chỉ để biết game nào vui mà vẫn học được nhiều trong ít thời gian. Chỉ nằm trên máy này.</p></details>`;
}

// v91 Trang trí phố bằng xu chung: chọn công trình nào trang trí trước. Mỗi ★ mở chỗ cho một món; giá tăng dần.
function viewDecoShop(c: ECtx, b: Building[], t: TownSave, wallet: number): string {
  const esc = c.host.esc;
  const rows = b.filter(x => x.lv).map(x => {
    const d = canDeco(t, x, wallet), next = DECO[x.game][d.k];
    const have = DECO[x.game].slice(0, t.deco[x.game] ?? 0).join(' ');
    const btn = !next ? '<span class="hint">đủ đồ</span>'
      : d.ok ? `<button class="btn small" data-e="twbuy" data-g="${x.game}">＋ ${next} · ${d.price} xu</button>`
      : `<span class="hint">${next} ${esc(d.why)}</span>`;
    return `<li class="spread"><span>${x.ico} ${esc(x.vi)} <span aria-hidden="true">${have}</span></span>${btn}</li>`;
  }).join('');
  return `<details class="gall twshop"><summary>🛍️ Trang trí phố · 🪙 ${wallet} xu</summary><ul class="twlist">${rows}</ul>
    <p class="hint">Xu kiếm được nhiều hơn khi bạn trả lời câu mới, câu khó, phần sắp quên: học đúng chỗ thì phố đẹp nhanh hơn. Đồ trang trí chỉ để vui.</p></details>`;
}
