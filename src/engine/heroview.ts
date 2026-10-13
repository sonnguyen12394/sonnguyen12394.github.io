// v132 Màn Trang bị · Thời trang · Tạo nhân vật (avatar.ts). Thuần hàm: nhận số liệu, trả HTML. heroctl.ts giữ trạng thái và thao tác.
// Bố cục theo màn nhân vật của Gunny: nhân vật lớn ở giữa, 4 ô trái + 3 ô phải, Lực chữ ở trên; chạm ô → thẻ món (bậc, chỉ số nuôi nó,
// mốc kế, nút "Luyện ngay" tới đúng game của chỉ số đó: cường hoá = học thật).

import type { ECtx } from './views.ts';
import { STAT, type StatRow } from './bag.ts';
import {
  SLOT, LEFT, RIGHT, TIER_VI, FASH, FSLOTS, FSLOT_VI, HAIRS, HAIR_VI, HAIR_C, SKIN_C, EYES, EYES_VI, MOUTHS, MOUTH_VI, fashById, itemVi,
  type Slot, type GearRow, type AvSave, type Look, type FSlot,
} from './avatar.ts';

export interface HeroIn {
  av: AvSave; gear: GearRow[]; rows: StatRow[]; lv: number; power: number; coins: number;
  sel: Slot | null; tryId: string | null; party: Slot[];          // party: ô vừa lên bậc (ăn mừng lần này)
  pop: boolean;                                                   // vừa mặc / tháo / đổi ngoại hình: nhân vật nảy một lần
  hero: (size: number, o?: { wear?: Partial<Record<FSlot, string>>; showF?: boolean; label?: string; cls?: string; look?: Look }) => string;
  pet: string;                                                    // SVG Tí (thú cưng)
}
const fmt = (n: number) => n.toLocaleString('vi-VN');

function slotBtn(c: ECtx, g: GearRow, sel: boolean, party: boolean): string {
  const s = SLOT[g.slot], st = STAT[s.stat];
  const say = `${itemVi(g.slot, g.lv)}. Nuôi bởi ${st.vi} cấp ${g.lv}`;
  return `<li><button class="eqslot t${g.tier}${sel ? ' sel' : ''}${party ? ' new' : ''}" data-e="bgavslot" data-s="${g.slot}" aria-pressed="${sel}" aria-label="${c.host.esc(say)}">
    <span class="eqi" aria-hidden="true">${g.lv ? s.ico : '🔒'}</span><b aria-hidden="true">${g.lv ? `+${g.lv}` : '–'}</b><span class="eqn" aria-hidden="true">${s.vi}</span></button></li>`;
}

function card(c: ECtx, g: GearRow): string {
  const esc = c.host.esc, s = SLOT[g.slot], st = STAT[s.stat];
  const steps = TIER_VI.slice(1).map((t, i) => `<li class="eqstep t${i + 1}${g.tier === i + 1 ? ' cur' : g.tier > i ? ' done' : ''}">${t}<span class="hint">Lv ${i * 2 + 1}–${i * 2 + 2}</span></li>`).join('');
  return `<div class="eqcard stack" role="region" aria-labelledby="eqc-${g.slot}">
    <div class="spread"><h3 id="eqc-${g.slot}">${s.ico} ${esc(itemVi(g.slot, g.lv))}</h3><button class="btn ghost small" data-e="bgavslot" data-s="${g.slot}" aria-label="Đóng thẻ món">✕</button></div>
    <p>Nuôi bởi <b>${st.ico} ${esc(st.vi)} · Lv ${g.lv}/10</b>. Món tự lên cấp khi chỉ số thật lên: không mua được, không bao giờ hỏng.</p>
    <ol class="eqsteps" aria-label="Các bậc của món">${steps}</ol>
    <p class="hint">${esc(st.src)} · ${esc(g.next)}</p>
    <div class="row"><button class="btn primary" data-e="${st.start}">⚒️ Luyện ngay ở ${esc(st.up)}</button></div></div>`;
}

export function viewEquip(c: ECtx, x: HeroIn): string {
  const esc = c.host.esc, by = (s: Slot) => x.gear.find(g => g.slot === s)!;
  const col = (ss: Slot[], side: string) => `<ul class="eqcol ${side}" aria-label="Ô trang bị ${side === 'l' ? 'bên trái' : 'bên phải'}">${ss.map(s => slotBtn(c, by(s), x.sel === s, x.party.includes(s))).join('')}</ul>`;
  const party = x.party.length ? `<p class="eqparty" role="status">✨ ${x.party.map(s => esc(itemVi(s, by(s).lv))).join(', ')} vừa lên bậc nhờ chỉ số thật của bạn!</p>` : '';
  const worn = FSLOTS.filter(f => x.av.wear[f]).length;
  return `<div class="eqstage stack">
    <div class="eqtop"><span class="eqpow" aria-label="Lực chữ ${x.power}">⚔️ Lực chữ <b>${fmt(x.power)}</b></span><span class="pill">🧑‍🔧 Thợ Chữ cấp ${x.lv}</span></div>
    ${party}
    <div class="eqgrid">${col(LEFT, 'l')}
      <div class="eqhero"><div class="eqfig${x.pop ? ' pop' : ''}">${x.hero(190, { label: 'Nhân vật của bạn', cls: 'big' })}</div><div class="eqpet" aria-hidden="true">${x.pet}</div></div>
      ${col(RIGHT, 'r')}</div>
    ${x.sel ? card(c, by(x.sel)) : '<p class="hint eqtip">Chạm một ô để xem món, bậc và cách nâng.</p>'}
    <div class="row eqbar"><button class="btn small" data-e="bgtab" data-t="look">👗 Thời trang${worn ? ` · ${worn}` : ''}</button><button class="btn small" data-e="bgavmake">🎨 Ngoại hình</button>${worn ? `<button class="btn small ghost" data-e="bgavshow" aria-pressed="${x.av.showF}">${x.av.showF ? '🙈 Ẩn thời trang' : '👀 Hiện thời trang'}</button>` : ''}<button class="btn small ghost" data-go="closet">🐯 Tủ đồ của Tí</button></div>
  </div>`;
}

export function viewLook(c: ECtx, x: HeroIn): string {
  const esc = c.host.esc, t = fashById(x.tryId ?? undefined);
  const wear = t ? { ...x.av.wear, [t.slot]: t.id } : x.av.wear;
  const own = (id: string) => x.av.fash.includes(id), on = (id: string) => Object.values(x.av.wear).includes(id);
  const act = !t ? '<p class="hint">Chạm một món để thử lên người. Thử thì miễn phí.</p>'
    : own(t.id) ? `<button class="btn primary" data-e="bgavwear" data-id="${t.id}">${on(t.id) ? `🧺 Tháo ${esc(t.vi)}` : `👕 Mặc ${esc(t.vi)}`}</button>`
    : `<button class="btn primary" data-e="bgavbuy" data-id="${t.id}"${x.coins >= t.price ? '' : ' aria-disabled="true"'}>🪙 Mua ${esc(t.vi)} · ${t.price} xu</button>${x.coins >= t.price ? '' : `<p class="hint">Còn thiếu ${t.price - x.coins} xu: chơi một ván ở bản đồ để kiếm thêm.</p>`}`;
  const sec = FSLOTS.map(fs => `<h3>${FSLOT_VI[fs]}</h3><ul class="fgrid">${FASH.filter(f => f.slot === fs).map(f => `<li><button class="fcard${x.tryId === f.id ? ' sel' : ''}${on(f.id) ? ' on' : ''}" data-e="bgavtry" data-id="${f.id}" aria-pressed="${x.tryId === f.id}" aria-label="${esc(`${f.vi}, ${own(f.id) ? (on(f.id) ? 'đang mặc' : 'đã có') : `${f.price} xu`}`)}">
      <span class="fimg" aria-hidden="true">${x.hero(84, { wear: { [f.slot]: f.id }, showF: true })}</span><b aria-hidden="true">${f.ico} ${esc(f.vi)}</b><span class="hint" aria-hidden="true">${own(f.id) ? (on(f.id) ? '✅ Đang mặc' : '✔ Đã có') : `🪙 ${f.price}`}</span></button></li>`).join('')}</ul>`).join('');
  return `<div class="lkstage stack"><div class="spread"><h2>👗 Thời trang</h2><span class="pill" aria-label="${x.coins} xu">🪙 ${x.coins}</span></div>
    <details class="dwhy"><summary>❓ Thời trang khác trang bị thế nào</summary><p class="hint">Thời trang chỉ đổi hình, không thêm chỉ số. Mua bằng xu kiếm trong game, không có nạp tiền, không quay thưởng. Thời trang mặc đè lên hình của trang bị; tắt "Hiện thời trang" để thấy lại trang bị.</p></details>
    <div class="lkprev"><div class="eqfig${x.pop ? ' pop' : ''}">${x.hero(170, { wear, showF: true, label: t ? `Bạn đang thử ${t.vi}` : 'Nhân vật của bạn', cls: 'big' })}</div><div class="eqpet" aria-hidden="true">${x.pet}</div></div>
    <div class="stack lkact" aria-live="polite">${act}</div>${sec}</div>`;
}

export function viewMake(c: ECtx, x: HeroIn): string {
  const L = x.av.look;
  const opt = (k: keyof Look, label: string, n: number, vi: (i: number) => string, sw?: string[]) => `<div class="mkrow" role="group" aria-label="${label}"><b>${label}</b><div class="mkopts">${Array.from({ length: n }, (_, i) => `<button class="mkopt${sw ? ' sw' : ''}" data-e="bgavset" data-k="${k}" data-v="${i}" aria-pressed="${L[k] === i}"${sw ? ` style="--sw:${sw[i]}" aria-label="${label} ${i + 1}"` : ''}>${sw ? '' : vi(i)}</button>`).join('')}</div></div>`;
  return `<div class="mkstage stack"><h2>🎨 ${x.av.made ? 'Đổi ngoại hình' : 'Tạo nhân vật của bạn'}</h2>
    <p class="hint">Chọn kiểu, không chọn giới tính. Đổi lại lúc nào cũng được, miễn phí.</p>
    <div class="lkprev"><div class="eqfig${x.pop ? ' pop' : ''}">${x.hero(170, { label: 'Nhân vật đang tạo', cls: 'big' })}</div><div class="eqpet" aria-hidden="true">${x.pet}</div></div>
    ${opt('h', 'Kiểu tóc', HAIRS.length, i => HAIR_VI[i]!)}${opt('hc', 'Màu tóc', HAIR_C.length, () => '', HAIR_C)}${opt('sk', 'Màu da', SKIN_C.length, () => '', SKIN_C)}${opt('ey', 'Mắt', EYES.length, i => EYES_VI[i]!)}${opt('mo', 'Miệng', MOUTHS.length, i => MOUTH_VI[i]!)}
    <div class="row"><button class="btn" data-e="bgavrand">🎲 Ngẫu nhiên</button><button class="btn primary" data-e="bgavdone">✓ Xong</button></div></div>`;
}
