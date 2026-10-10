// Phố chung + số liệu chơi (v89): chỉ trình bày. Công trình là nút mở đúng game đó (phố cũng là chỗ chọn game).

import type { ECtx } from './views.ts';
import { GAMES } from './director.ts';
import { MAX_LV, LV_VI, townLevel, type Building } from './town.ts';
import { TH, MIN_N, type GReport } from './play.ts';

const stars = (lv: number) => '★'.repeat(lv) + '☆'.repeat(MAX_LV - lv);

export function viewTown(c: ECtx, b: Building[]): string {
  const esc = c.host.esc, lv = townLevel(b), built = b.filter(x => x.lv).length;
  const tiles = b.map(x => {
    const g = GAMES[x.game], tip = x.next === null ? 'cấp cao nhất' : `${x.v}/${x.next} ${x.unit} để lên cấp ${x.lv + 1}`;
    return `<button class="twt${x.lv ? '' : ' off'}" data-e="${g.start}" style="--lv:${x.lv}" aria-label="${esc(x.vi)}: ${esc(LV_VI[x.lv])}, ${esc(tip)}. Mở ${esc(g.vi)}">
      <span class="twi" aria-hidden="true">${x.ico}</span><b>${esc(x.vi)}</b><span class="tws" aria-hidden="true">${stars(x.lv)}</span><span class="twn">${esc(tip)}</span></button>`;
  }).join('');
  return `<section class="stack twbox"><div class="spread"><span class="eyebrow">🏙️ Phố của bạn · cấp ${lv}/${b.length * MAX_LV}</span><span class="hint">${built}/${b.length} công trình</span></div>
    <div class="twg">${tiles}</div>
    <p class="hint">Mỗi game xây một công trình trên phố. Chạm công trình để chơi. Phố chỉ để vui, không đổi đánh giá năng lực.</p></section>`;
}

// Màn kết: công trình vừa lên cấp + mốc gần nhất của game vừa chơi (gần đích thì muốn chơi tiếp, không dựa vào sợ mất).
export function viewTownGain(c: ECtx, gain: Building[], cur: Building | undefined): string {
  const esc = c.host.esc, ti = c.host.mascot?.(gain.length ? 'party' : 'happy', 52) ?? '';
  const up = gain.map(x => `<li><span aria-hidden="true">${x.ico}</span> <b>${esc(x.vi)}</b> lên ${esc(LV_VI[x.lv])} <span aria-hidden="true">${stars(x.lv)}</span></li>`).join('');
  const near = cur && cur.next !== null ? `Còn ${cur.next - cur.v} ${esc(cur.unit)} nữa để ${esc(cur.vi)} lên cấp ${cur.lv + 1}.` : cur ? `${esc(cur.vi)} đã ở cấp cao nhất.` : '';
  if (!up && !near) return '';
  return `<section class="twgain${gain.length ? ' up' : ''}" role="status">${ti ? `<span class="twti" aria-hidden="true">${ti}</span>` : ''}<div class="stack" style="gap:4px">
    ${up ? `<b>🏗️ Phố mới!</b><ul class="twup">${up}</ul>` : ''}${near ? `<span class="hint">${near}</span>` : ''}</div></section>`;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const mark = (ok: boolean | undefined) => (ok === undefined ? '' : ok ? ' ✓' : ' ✗');
export function viewPlayStats(c: ECtx, rows: GReport[]): string {
  if (!rows.length) return '';
  const esc = c.host.esc;
  const body = rows.map(r => {
    const g = GAMES[r.game];
    return `<tr><td>${g.ico} ${esc(g.vi)}</td><td class="num">${r.n}</td><td class="num">${pct(r.quit)}${mark(r.ok?.quit)}</td><td class="num">${pct(r.self)}${mark(r.ok?.self)}</td><td class="num">${r.first ?? '—'}${r.first !== null ? ' s' : ''}${mark(r.ok?.first)}</td><td class="num">${r.dur !== null ? (r.dur / 60).toFixed(1) + ' ph' : '—'}${mark(r.ok?.dur)}</td></tr>`;
  }).join('');
  return `<details class="gall"><summary>📊 Số liệu chơi trên máy này</summary><div class="tablewrap" tabindex="0" role="region" aria-label="Số liệu chơi từng game"><table style="min-width:0"><thead><tr><th>Game</th><th>Ván</th><th>Bỏ giữa</th><th>Tự chọn</th><th>Thao tác đầu</th><th>Một ván</th></tr></thead><tbody>${body}</tbody></table></div>
    <p class="hint">Ngưỡng tốt: bỏ giữa dưới ${pct(TH.quit)}, tự chọn / chơi lại từ ${pct(TH.self)}, thao tác đầu trong ${TH.first} giây, một ván ${TH.durLo / 60}–${TH.durHi / 60} phút. Cần từ ${MIN_N} ván mới đánh ✓ / ✗. Số liệu chỉ nằm trên máy này, giúp app biết game nào cần làm hay hơn.</p></details>`;
}
