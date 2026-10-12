// v128 Màn Túi chữ · Album · Kỷ vật · Xưởng của Tí · Chỉ số (bag.ts). Thuần hàm: nhận số liệu đã tính, trả HTML.

import type { ECtx } from './views.ts';
import type { Clue } from './story.ts';
import {
  MAT, MATS, ITEM, ITEMS, GEAR, STAT, TIER, CRAFT_COST, costVi, have, canPay, reqOk, charLv, ALB_COINS, SPELL,
  type BagSave, type Earned, type StatRow, type Album, type Gem, type MorphTask, type ColTask, type SentTask,
} from './bag.ts';

export type BagTab = 'forge' | 'map' | 'bag' | 'alb' | 'clue' | 'craft' | 'stat';
export interface CraftRun {
  kind: 'morph' | 'col' | 'sent'; seed: number;
  morph?: MorphTask; col?: ColTask; sent?: SentTask;
  phase: 'pick' | 'type' | 'order' | 'soul' | 'done';
  sel: number[]; tries: number; msg: string; ok: boolean | null; gold: boolean; via: 'mic' | 'type' | null; key: string;
}
export interface BagIn {
  s: BagSave; e: Earned; rows: StatRow[]; tab: BagTab; act: number;
  gems: Array<Gem & { en: string; vi: string; fading: boolean }>; albums: Array<Album & { vi: string }>; clues: Clue[]; clueTotal: number;
  who: [string, string] | null; giftDone: boolean; cr: CraftRun | null; mic: { has: boolean; busy: boolean | string; heard: string | null };
  forge: string;   // v129 HTML của tab Lò rèn / Bản đồ phủ (forgectl)
}

const TABS: Array<[BagTab, string]> = [['forge', '🔥 Lò rèn'], ['map', '🗺️ Bản đồ phủ'], ['bag', '🎒 Túi'], ['craft', '🔨 Luyện tay'], ['stat', '📊 Chỉ số'], ['alb', '📖 Album'], ['clue', '📜 Kỷ vật']];
const bar = (v: number, max: number, label: string) => `<span class="bgbar" role="img" aria-label="${label}"><i style="width:${Math.round((100 * Math.min(max, v)) / Math.max(1, max))}%"></i></span>`;

// Thẻ ở sảnh: nguyên liệu, cấp Thợ Chữ, hai lối vào.
export function viewBagHub(c: ECtx, s: BagSave, e: Earned, rows: StatRow[], ready: number, cov: { done: number; total: number } | null = null): string {
  const mats = MATS.map(m => `<span class="pill" title="${MAT[m].vi}">${MAT[m].ico} ${have(e, s, m)}</span>`).join(' ');
  const items = ITEMS.filter(i => s.it[i]).map(i => `<span class="pill" title="${ITEM[i].vi}">${ITEM[i].ico} ${s.it[i]}</span>`).join(' ');
  return `<section class="panel stack bghub" aria-label="Túi chữ và Xưởng của Tí">
    <div class="spread"><h2>🎒 Túi chữ · Xưởng của Tí</h2><span class="pill">🧑‍🔧 Thợ Chữ cấp ${charLv(rows)}</span></div>
    <p class="hint">Đồ là tiếng Anh: từ bạn tìm được thành ngọc, chế tạo bằng cách ghép từ, ghép cụm, đúc câu rồi nói. Chỉ số là năng lực thật của bạn.</p>
    <div class="row">${mats} ${items}</div>
    <div class="row"><button class="btn primary small" data-e="bgopen" data-t="forge">🔥 Lò rèn năng lực</button>${cov?.total ? `<button class="btn small" data-e="bgopen" data-t="map">🗺️ Đã phủ ${cov.done}/${cov.total}</button>` : ''}<button class="btn small" data-e="bgopen" data-t="craft">🔨 Luyện tay${ready ? ` · ${ready}` : ''}</button><button class="btn ghost small" data-e="bgopen" data-t="bag">🎒 Túi</button><button class="btn ghost small" data-e="bgopen" data-t="stat">📊 Chỉ số</button></div>
  </section>`;
}

export function viewBag(c: ECtx, x: BagIn): string {
  const tabs = `<div class="bgtabs" role="tablist" aria-label="Túi chữ">${TABS.map(([t, vi]) => `<button role="tab" class="btn small${t === x.tab ? ' primary' : ' ghost'}" aria-selected="${t === x.tab}" data-e="bgtab" data-t="${t}">${vi}</button>`).join('')}</div>`;
  const body = x.tab === 'forge' || x.tab === 'map' ? x.forge : x.tab === 'craft' ? (x.cr ? craftRun(c, x) : craftMenu(c, x)) : x.tab === 'stat' ? stats(c, x) : x.tab === 'alb' ? albums(c, x) : x.tab === 'clue' ? clues(c, x) : bag(c, x);
  return `<section class="stack bgroot"><span class="eyebrow">🎒 Túi chữ · Thợ Chữ cấp ${charLv(x.rows)}</span>${tabs}${body}</section>
    <div class="row"><button class="btn ghost" data-e="qhome">← Về sảnh</button></div>`;
}

function bag(c: ECtx, x: BagIn): string {
  const esc = c.host.esc;
  const mats = MATS.map(m => `<li class="bgcell"><span class="bgico" aria-hidden="true">${MAT[m].ico}</span><b>${have(x.e, x.s, m)}</b><span>${MAT[m].vi}</span><span class="hint">${esc(MAT[m].how)}</span></li>`).join('');
  const items = ITEMS.map(i => `<li class="bgcell"><span class="bgico" aria-hidden="true">${ITEM[i].ico}</span><b>${x.s.it[i]}</b><span>${ITEM[i].vi}</span><span class="hint">${esc(ITEM[i].how)}</span></li>`).join('');
  const gear = GEAR.filter(g => x.s.gear.includes(g.id)).map(g => { const on = reqOk(g, x.rows);
    return `<li class="bgcell${on ? ' on' : ' off'}"><span class="bgico" aria-hidden="true">${g.ico}</span><b>${esc(g.vi)}</b><span>${esc(g.eff)}</span><span class="hint">${on ? '✅ Đang phát huy' : `💤 Cần ${reqVi(g.req)} để phát huy: ôn lại là dùng được`}</span></li>`; }).join('');
  const gems = x.gems.slice(0, 48).map(g => `<li class="bggem t${g.tier}${g.fading ? ' fade' : ''}" title="${esc(`${g.vi} · ${TIER[g.tier][1]}${g.fading ? ' · đang mờ: sắp quên' : ''}`)}"><span aria-hidden="true">${TIER[g.tier][0]}</span><b lang="en">${esc(g.en)}</b><span class="sr-only">${esc(g.vi)}, ${TIER[g.tier][1]}${g.fading ? ', đang mờ' : ''}</span></li>`).join('');
  const fading = x.gems.filter(g => g.fading).length;
  const gift = x.who ? `<section class="panel stack"><b>🎁 Tặng ${esc(x.who[1])} một Lời</b>${x.giftDone ? `<p class="hint">✅ ${esc(x.who[1])} đã nhận Lời của bạn ở chương này.</p>` : x.s.it.loi + x.s.it.loiv > 0 ? `<p class="hint">${esc(x.who[1])} đang cần giúp trong truyện. Tặng một 💬 Lời (hoặc 🌟 Lời vàng) bạn đã đúc: +10 xu, việc phụ của chương.</p><div class="row"><button class="btn primary small" data-e="bggift">🎁 Tặng ${esc(x.who[1])}</button></div>` : `<p class="hint">Đúc một câu ở Xưởng để có 💬 Lời tặng ${esc(x.who[1])}.</p><div class="row"><button class="btn small" data-e="bgmk" data-k="sent">🔨 Đúc câu</button></div>`}</section>` : '';
  return `<h2>Nguyên liệu</h2><p class="hint">Suy ra từ việc học bạn đã làm, không mua được. Nguyên liệu quý (🗣️, 🧠) chỉ có khi tự nói hoặc nhớ lâu.</p><ul class="bggrid">${mats}</ul>
    <h2>Đồ đã làm</h2><ul class="bggrid">${items}</ul>
    ${gift}
    ${gear ? `<h2>Trang bị</h2><ul class="bggrid">${gear}</ul>` : ''}
    <h2>💎 Ngọc từ (${x.gems.length})</h2>
    <p class="hint">Mỗi từ bạn tìm / trả lời đúng là một viên ngọc. Độ hiếm là độ nhớ thật: ${TIER.map(t => `${t[0]} ${t[1]} (${t[2]})`).join(' · ')}.${fading ? ` <b>${fading} viên đang mờ</b> (sắp quên): thắp lại ở <button class="stlink inl" data-e="sgstart">🌫️ Sương quay lại</button>.` : ''}</p>
    ${gems ? `<ul class="bggems">${gems}</ul>` : '<p class="hint">Chưa có ngọc: tìm từ ở ⛏️ Mỏ Chữ hoặc 🎡 Vòng Chữ.</p>'}
    ${x.s.words.length ? `<p class="hint">🔩 Từ bạn tự ghép: <span lang="en">${x.s.words.slice(-20).map(esc).join(', ')}</span></p>` : ''}`;
}

const reqVi = (r: Partial<Record<keyof typeof STAT, number>>): string => (Object.entries(r) as Array<[keyof typeof STAT, number]>).map(([k, v]) => `${STAT[k].ico} ${STAT[k].vi} Lv ${v}`).join(', ');

function craftMenu(c: ECtx, x: BagIn): string {
  const esc = c.host.esc;
  const rec = (k: 'morph' | 'col' | 'sent', ico: string, name: string, line: string) => { const ok = canPay(x.e, x.s, CRAFT_COST[k]);
    return `<button class="gcard" data-e="bgmk" data-k="${k}" ${ok ? '' : 'aria-disabled="true"'}><span class="gico" aria-hidden="true" style="font-size:30px">${ico}</span><span class="stack" style="gap:2px;text-align:left"><b>${name}</b><span class="hint">${line}</span><span class="hint">Tốn ${costVi(CRAFT_COST[k])}${ok ? '' : ' · chưa đủ: tìm thêm từ ở Mỏ Chữ / Vòng Chữ'}</span></span><span class="btn primary small" aria-hidden="true">▶ Làm</span></button>`; };
  const gear = GEAR.filter(g => !x.s.gear.includes(g.id)).map(g => {
    const locked = (g.act ?? 0) > x.act || (g.after && !x.s.gear.includes(g.after)), pay = canPay(x.e, x.s, g.cost), req = reqOk(g, x.rows);
    const need = (Object.entries(g.cost) as Array<[keyof typeof MAT | keyof typeof ITEM, number]>).map(([k, v]) => { const h = have(x.e, x.s, k); return `<span class="pill${h >= v ? ' ok' : ''}">${k in MAT ? MAT[k as keyof typeof MAT].ico : ITEM[k as keyof typeof ITEM].ico} ${h}/${v}</span>`; }).join(' ');
    return `<li class="bgcell${locked ? ' off' : ''}"><span class="bgico" aria-hidden="true">${locked ? '🔒' : g.ico}</span><b>${esc(g.vi)}</b><span>${esc(g.eff)}</span>
      ${locked ? `<span class="hint">${g.act && g.act > x.act ? 'Mở khi tới khu Phố Đêm trong truyện' : 'Cần có đồ trước đó'}</span>` : `<span class="row">${need}</span><span class="hint">Phát huy khi: ${reqVi(g.req)} ${req ? '✅' : '(chỉ số thật của bạn chưa đủ: vẫn rèn được, phát huy khi đạt)'}</span>
      <button class="btn small${pay ? ' primary' : ''}" data-e="bgforge" data-id="${g.id}" ${pay ? '' : 'aria-disabled="true"'}>🔥 Rèn</button>`}</li>`; }).join('');
  return `<h2>🔨 Xưởng của Tí · Luyện tay</h2><p class="hint">Mini-game luyện tay: <b>không tính vào bằng chứng</b> (bộ đề cố định, làm nhiều lần là nhớ đáp án). Muốn app ghi nhận năng lực thật, rèn ở <button class="stlink inl" data-e="bgtab" data-t="forge">🔥 Lò rèn năng lực</button>. Làm sai không mất nguyên liệu.</p>
    <div class="stack">${rec('morph', '🔩', 'Ghép từ', `Từ gốc + tiền tố / hậu tố, rồi tự gõ từ mới. Linh kiện đang mở: theo khu truyện.`)}
    ${rec('col', '🔗', 'Ghép cụm', 'Chọn đúng động từ: make a mistake hay do a mistake?')}
    ${rec('sent', '💬', 'Đúc câu', `Xếp lá chữ thành câu của cư dân${x.who ? ` (ưu tiên câu của ${esc(x.who[1])})` : ''}, rồi thổi hồn: nói hoặc gõ lại không nhìn → 🌟 Lời vàng.`)}</div>
    ${gear ? `<h2>🔥 Rèn trang bị</h2><p class="hint">Trang bị chỉ giúp trong game (thêm lượt, thêm xu), không đổi cách chấm. Muốn trang bị phát huy thì chỉ số THẬT phải đủ.</p><ul class="bggrid">${gear}</ul>` : '<p class="hint">Bạn đã rèn đủ mọi trang bị của mùa 1.</p>'}`;
}

function craftRun(c: ECtx, x: BagIn): string {
  const esc = c.host.esc, r = x.cr!, msg = r.msg ? `<p class="${r.ok ? 'bgok' : 'bgno'}" role="status">${esc(r.msg)}</p>` : '';
  const done = `<div class="row"><button class="btn primary" data-e="bgmk" data-k="${r.kind}">🔁 Làm tiếp</button><button class="btn ghost" data-e="bgdone">← Xưởng</button></div>`;
  const micBtn = x.mic.has ? `<button class="btn" data-e="bgmic" ${x.mic.busy === true ? 'aria-busy="true"' : ''}>${x.mic.busy === true ? '👂 Đang nghe…' : '🎙 Nói'}</button>` : '';
  if (r.kind === 'morph' && r.morph) {
    const t = r.morph;
    if (r.phase === 'pick') return `<h2>🔩 Ghép từ</h2><p>Làm từ có nghĩa <b>“${esc(t.vi)}”</b> từ gốc <b lang="en" class="bgword">${esc(t.base)}</b></p>
      <div class="row" role="group" aria-label="Chọn linh kiện">${t.opts.map(o => `<button class="btn" data-e="bgaff" data-v="${esc(o)}" lang="en">${esc(o)}</button>`).join('')}</div>${msg}<div class="row"><button class="btn ghost small" data-e="bgdone">← Xưởng</button></div>`;
    if (r.phase === 'type') return `<h2>🔩 Ghép từ</h2><p><b lang="en">${esc(t.base)}</b> + <b lang="en">${esc(t.aff)}</b> = ? <span class="hint">(${esc(t.vi)})</span></p>
      <form class="row" data-eform="bgtype"><label class="sr-only" for="bgin">Gõ từ mới</label><input id="bgin" name="a" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ mới…" required><button class="btn primary">✓ Ghép</button></form>${msg}`;
    return `<h2>🔩 Ghép từ</h2><p class="bgbig">${r.ok ? '🔩' : '💥'} <b lang="en">${esc(t.out)}</b> · ${esc(t.vi)}</p>${msg}${SPELL[t.out] ? `<p class="hint">✏️ ${esc(SPELL[t.out]!)}</p>` : ''}${done}`;
  }
  if (r.kind === 'col' && r.col) {
    const t = r.col;
    if (r.phase === 'pick') return `<h2>🔗 Ghép cụm</h2><p>Nghĩa: <b>“${esc(t.vi)}”</b></p><p class="bgbig"><span lang="en">___ ${esc(t.rest)}</span></p>
      <div class="row" role="group" aria-label="Chọn động từ">${t.opts.map(o => `<button class="btn" data-e="bgverb" data-v="${esc(o)}" lang="en">${esc(o)}</button>`).join('')}</div>${msg}<div class="row"><button class="btn ghost small" data-e="bgdone">← Xưởng</button></div>`;
    return `<h2>🔗 Ghép cụm</h2><p class="bgbig">🔗 <b lang="en">${esc(t.verb)} ${esc(t.rest)}</b> · ${esc(t.vi)}</p>${msg}${done}`;
  }
  if (r.kind === 'sent' && r.sent) {
    const t = r.sent, built = r.sel.map(i => t.tiles[i]!).join(' ');
    if (r.phase === 'order') return `<h2>💬 Đúc câu cho ${esc(t.who)}</h2><p>Nghĩa: <b>“${esc(t.vi)}”</b></p>
      <p class="bgline" lang="en" aria-live="polite">${built ? esc(built) : '<span class="hint">Chạm lá chữ theo đúng thứ tự…</span>'}</p>
      <div class="bgtiles" role="group" aria-label="Lá chữ">${t.tiles.map((w, i) => `<button class="bgtile" data-e="bgtile" data-i="${i}" lang="en" ${r.sel.includes(i) ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>
      ${msg}<div class="row"><button class="btn ghost small" data-e="bgundo">↶ Bỏ lá cuối</button><button class="btn ghost small" data-e="bgdone">← Xưởng</button></div>`;
    if (r.phase === 'soul') return `<h2>✨ Thổi hồn cho Lời</h2><p>Câu đã đúc thành 💬 Lời. Giờ <b>nói</b> câu đó${x.mic.has ? '' : ' (máy này chưa nghe được giọng)'} hoặc <b>gõ lại không nhìn</b> để thành 🌟 Lời vàng.</p>
      <p class="hint">Nghĩa: “${esc(t.vi)}”</p>
      <div class="row">${micBtn}</div>
      <form class="row" data-eform="bgsoul"><label class="sr-only" for="bgsoul">Gõ lại câu</label><input id="bgsoul" name="a" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ lại cả câu, không nhìn…"><button class="btn primary">✓</button></form>
      ${msg}<div class="row"><button class="btn ghost small" data-e="bgskip">Giữ 💬 Lời thường ▸</button></div>`;
    return `<h2>💬 Lời cho ${esc(t.who)}</h2><p class="bgbig">${r.gold ? '🌟' : '💬'} <span lang="en">${esc(t.en)}</span></p><p class="hint">${esc(t.vi)}</p>${msg}${done}`;
  }
  return craftMenu(c, x);
}

function stats(c: ECtx, x: BagIn): string {
  const esc = c.host.esc;
  const li = x.rows.map(r => { const s = STAT[r.id];
    return `<li class="vhrow"><div class="stack" style="gap:2px"><b>${s.ico} ${esc(s.vi)} · Lv ${r.lv}</b>${bar(r.lv, 10, `${s.vi} cấp ${r.lv} trên 10`)}<span class="hint">${esc(s.src)} · ${esc(r.next)}</span></div>
      <button class="btn small" data-e="${s.start}">Nâng ở ${esc(s.up)}</button></li>`; }).join('');
  return `<h2>📊 Chỉ số thật</h2><p class="hint">Không mua được, không đeo đồ mà tăng: chỉ lên khi bạn giỏi lên thật (kỹ năng vững trên bản đồ năng lực, số đo đã đủ trên Bảng đo H). Quên thì có thể tụt: ôn là lên lại.</p>
    <p style="font-size:20px">🧑‍🔧 Thợ Chữ cấp <b>${charLv(x.rows)}</b> <span class="hint">(tổng chỉ số ÷ 3 + 1)</span></p>
    <ul class="vhlist" aria-label="Chỉ số">${li}</ul>
    <div class="row"><button class="btn ghost small" data-e="hmeter">📏 Xem Bảng đo H</button></div>`;
}

function albums(c: ECtx, x: BagIn): string {
  const esc = c.host.esc;
  if (!x.albums.length) return `<h2>📖 Album từ</h2><p class="hint">Mỗi chủ đề từ vựng là một album. Tìm từ ở ⛏️ Mỏ Chữ, 🎡 Vòng Chữ, 🌱 Vườn từ để bắt đầu sưu tập.</p>`;
  const li = x.albums.slice(0, 24).map(a => { const can = a.tier > a.claimed, coins = ALB_COINS.slice(a.claimed + 1, a.tier + 1).reduce((p: number, q: number) => p + q, 0);
    return `<li class="vhrow"><div class="stack" style="gap:2px"><b>${a.tier === 2 ? '🏆' : a.tier === 1 ? '⭐' : '📘'} ${esc(a.vi)}</b>${bar(a.got, a.total, `${a.got} trên ${a.total} từ`)}<span class="hint">${a.got}/${a.total} từ · ⭐ ở 50%, 🏆 khi đủ</span></div>
      ${can ? `<button class="btn primary small" data-e="bgclaim" data-n="${esc(a.node)}">Nhận +${coins} xu</button>` : `<span class="hint">${a.claimed ? '✓ đã nhận' : ''}</span>`}</li>`; }).join('');
  return `<h2>📖 Album từ</h2><p class="hint">Album là bản đồ từ vựng của bạn: chủ đề nào còn trống là chỗ nên học thêm.</p><ul class="vhlist">${li}</ul>`;
}

function clues(c: ECtx, x: BagIn): string {
  const esc = c.host.esc, left = Math.max(0, x.clueTotal - x.clues.length);
  return `<h2>📜 Kỷ vật Phố Chữ (${x.clues.length}/${x.clueTotal})</h2><p class="hint">Mỗi chương truyện để lại một kỷ vật: các mảnh của bí ẩn Sương Câm.</p>
    <ul class="bggrid">${x.clues.map(k => `<li class="bgcell"><span class="bgico" aria-hidden="true">${k.ico}</span><b>${esc(k.name)}</b><span>${esc(k.vi)}</span></li>`).join('')}${Array.from({ length: left }, () => '<li class="bgcell off"><span class="bgico" aria-hidden="true">❔</span><b>Chưa tìm thấy</b><span class="hint">Đi tiếp câu chuyện để mở.</span></li>').join('')}</ul>`;
}
