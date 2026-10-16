// v122–v127 Phố Chữ nói: màn chơi (chỉ trình bày; luật ở voice.ts, điều khiển ở voicectl.ts) + Bảng đo H.
// Lớp nhập "Lời nói" dùng chung: 🎙 nói (máy nghe của trình duyệt) · ⌨️ gõ · (bậc lùi cuối) chọn câu.

import type { ECtx } from './views.ts';
import type { Conv, Case, PortOrder, Fading, RealTask, VoiceSave, Via } from './voice.ts';
import { patience, rtOf } from './voice.ts';
import { H_VI, H_IDS, H_W, type HRow } from './hmeter.ts';
import { FACE } from './story.ts';

export interface Mic { has: boolean; busy: boolean | string; heard: string | null }
// Ô nhập chung. key: khoá máy nghe của lượt; form: tên data-eform; ph: chữ gợi ý ô gõ; picks: phương án chọn (bậc lùi), nếu có.
export function speakBox(c: ECtx, mic: Mic, form: string, ph: string, picks: string[] | null = null, label = 'Nói'): string {
  const esc = c.host.esc;
  const micRow = mic.has ? (mic.busy === true ? `<button class="btn primary" data-e="vstop">■ Đang nghe… nói xong bấm đây</button>`
    : `<button class="btn primary" data-e="vmic">🎙 ${esc(label)}</button>${typeof mic.busy === 'string' ? `<p class="hint" role="status">${esc(mic.busy)}</p>` : ''}${mic.heard ? `<p class="hint" role="status">Máy nghe được: “<span lang="en">${esc(mic.heard)}</span>”</p>` : ''}`) : '';
  const pick = picks?.length ? `<details class="stack vpick"><summary class="hint">Bí quá? Chọn một câu (không tính là tự nói)</summary><div class="stack" style="gap:6px">${picks.map((p, i) => `<button class="btn ghost" data-e="vpick" data-i="${i}" lang="en">${esc(p)}</button>`).join('')}</div></details>` : '';
  return `<div class="stack vsay" style="gap:8px">${micRow ? `<div class="row">${micRow}</div>` : ''}
    <form class="row" data-eform="${form}" autocomplete="off"><input name="a" class="field" lang="en" aria-label="Gõ câu tiếng Anh" placeholder="${esc(ph)}" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0"><button class="btn${mic.has ? '' : ' primary'}" type="submit">${mic.has ? '⌨️ Gửi' : 'Gửi ▸'}</button></form>${pick}</div>`;
}
const viaVi: Record<Via, string> = { mic: '🎙 nói', type: '⌨️ gõ', pick: '👆 chọn' };

// ---------- 🗣️ Quán Phố Chữ bằng giọng ----------
export interface TalkTurn { node: string; q: string; text: string; via: Via; hit: boolean; first: boolean; think: number | null; coins: number; tip: boolean }
export interface TalkRun {
  pm?: number;   // v128 Ấm Trà: hệ số thanh kiên nhẫn
  floor: number; seed: number; lv: string; convs: Conv[]; ci: number; node: string; pre: string; t0: number; miss: number; hint: boolean; vi: boolean;
  turns: TalkTurn[]; per: TalkTurn[][]; coins: number; tips: number; served: number; done: boolean; amb: boolean;
  special: { id: string; en: string; vi: string; node: string; done: boolean; ok: boolean | null; text: string } | null;
  phase: 'talk' | 'between' | 'special' | 'done'; picks: { opts: string[]; ans: number } | null; last: { hit: boolean; via: Via; tip: boolean; reply: string } | null;
}
export function viewTalk(c: ECtx, r: TalkRun, mic: Mic): string {
  const esc = c.host.esc, cv = r.convs[r.ci], head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🗣️ Quán Phố Chữ · khách ${Math.min(r.ci + 1, r.convs.length)}/${r.convs.length}${r.special ? ' + món đặc biệt' : ''}</span><span>🪙 <b>${r.coins}</b>${r.tips ? ` · 💁 ${r.tips} tip` : ''}</span></div>
    <div class="row" style="gap:6px"><button class="btn ghost small" data-e="vamb" aria-pressed="${r.amb}">${r.amb ? '🔊 Âm phố: bật' : '🔇 Âm phố: tắt'}</button></div></section>`;
  if (r.phase === 'special' && r.special) {
    const s = r.special, res = s.ok === null ? '' : s.ok ? `<div class="fb good" role="status"><strong>Khách hiểu ngay! Món “${esc(s.en)}” đã giao.</strong></div>` : `<div class="fb neutral" role="status"><strong>Câu cần có từ “<span lang="en">${esc(s.en)}</span>” và ít nhất 4 từ.</strong><span>Thử lại, ví dụ: <span lang="en">I can see a ${esc(s.en)} here.</span></span></div>`;
    return `${head}<section class="panel stack vtalk"><div class="vguest"><span class="vface" aria-hidden="true">🐯</span><div class="stack" style="gap:4px"><b>Tí mang tới một món đặc biệt</b>
      <p>Bạn vừa tìm được từ <b lang="en">${esc(s.en)}</b> (${esc(s.vi)}). Cô Chi muốn nghe <b>một câu của chính bạn</b> có từ này.</p></div></div>${res}
      ${s.ok ? `<div class="row"><button class="btn primary" data-e="tknext">Xong ca ▸</button></div>` : speakBox(c, mic, 'tksay', `Một câu có “${s.en}”…`, null, 'Nói câu có từ này') + `<div class="row"><button class="btn ghost small" data-e="tkskip">Bỏ qua món này</button></div>`}</section>`;
  }
  if (!cv) return head;
  const nd = cv.n[r.node]!, who = cv.who, face = FACE[who] ?? '🧑', line = (r.pre ? r.pre + ' ' : '') + nd.a;
  const bar = r.phase === 'talk' ? `<div class="vpat" role="img" aria-label="Thanh kiên nhẫn của khách"><i style="animation-duration:${Math.round(patience(r.lv, line) * (r.pm ?? 1))}s" data-k="${r.turns.length}:${r.miss}"></i></div>` : '';
  const last = r.last ? (r.last.hit ? `<p class="hint" role="status">✅ Khách hiểu (${viaVi[r.last.via]})${r.last.tip ? ' · 💁 trả lời nhanh: +tip' : ''}</p>` : `<p class="hint" role="status">🤔 Khách chưa hiểu, họ hỏi lại.</p>`) : '';
  const hist = r.turns.slice(-2).map(t => `<div class="dl me B"><span class="who">Bạn</span><span lang="en">${esc(t.text)}</span></div>`).join('');
  return `${head}<section class="panel stack vtalk"><div class="vguest"><span class="vface" aria-hidden="true">${face}</span><div class="stack" style="gap:2px"><b>${esc(who)}</b><span class="hint">${esc(cv.vi)} · ${esc(cv.lv)}</span></div></div>
    <div class="dlg">${hist}<div class="dl"><span class="who">${esc(who)}</span><span lang="en">${esc(line)}</span>${r.vi ? `<span class="hint">${esc(nd.v)}</span>` : ''}</div></div>${bar}
    <div class="row" style="gap:6px"><button class="btn small" data-e="tkplay">🔊 Nghe lại</button><button class="btn small" data-e="tkplay" data-slow="1">🐢 Chậm</button><button class="btn small" data-e="tkvi" aria-pressed="${r.vi}">Nghĩa</button><button class="btn small" data-e="tkhint" aria-pressed="${r.hint}">💡 Gợi ý</button></div>
    ${r.hint ? `<p class="hint">${esc(nd.h)}</p>` : ''}${last}
    ${speakBox(c, mic, 'tksay', 'Trả lời khách bằng tiếng Anh…', r.miss > 0 && r.picks ? r.picks.opts : null, 'Trả lời khách')}
    <p class="hint">Nói hoặc gõ câu của bạn. Đáp trong khoảng ${rtOf(r.lv)} giây được thêm tip; chậm cũng không sao, khách vẫn chờ.</p></section>`;
}
export function viewTalkEnd(c: ECtx, r: TalkRun, sv: VoiceSave['tk']): string {
  const esc = c.host.esc, all = r.turns, said = all.filter(t => t.via !== 'pick').length, first = all.filter(t => t.first && t.hit).length, lat = all.map(t => t.think).filter((x): x is number => x !== null);
  const med = lat.length ? lat.slice().sort((a, b) => a - b)[lat.length >> 1]! : null;
  const rows = r.convs.map((cv, i) => { const ts = r.per[i] ?? [], und = ts.length ? ts.filter(t => t.first && t.hit).length / ts.length : 0; return `<li><b>${esc(cv.who)}</b> · ${esc(cv.vi)}: hiểu ngay ${Math.round(und * 100)}% lượt</li>`; }).join('');
  return `<section class="stack"><span class="eyebrow">🗣️ Quán Phố Chữ</span><h1>🗣️ Hết ca!</h1>
    <p style="font-size:22px">🪙 ${r.coins} xu · 💁 ${r.tips} tip · ${r.served} khách nói lại được</p>
    <ul class="stack" style="gap:4px">${rows}</ul>
    <div class="stats"><div class="stat"><b>${said}/${all.length}</b><span>Lượt bạn tự nói / gõ</span></div><div class="stat"><b>${first}</b><span>Lượt khách hiểu ngay</span></div><div class="stat"><b>${med === null ? '–' : med.toFixed(1) + ' s'}</b><span>Thời gian nghĩ (trung vị, khi nói)</span></div></div>
    ${r.special ? `<p>${r.special.ok ? '✅' : '–'} Món đặc biệt: dùng từ <b lang="en">${esc(r.special.en)}</b> trong câu của bạn.</p>` : ''}
    <p class="hint">Mỗi hội thoại lưu như màn Hội thoại mở (tính vào Can-Do nói). Câu bạn tự nói / gõ và thời gian nghĩ vào Bảng đo H. Tổng ${sv.served} khách đã phục vụ.</p></section>
    <div class="row"><button class="btn primary" data-e="tkstart">🗣️ Ca mới</button><button class="btn ghost" data-e="hmeter">📏 Bảng đo H</button><button class="btn ghost" data-e="qhome">Về bản đồ</button></div>`;
}

// ---------- 🔎 Hỏi chuyện nhân chứng ----------
export interface AskRun { floor: number; seed: number; c: Case; got: string[]; log: Array<{ text: string; via: Via; fact: string | null; q: boolean }>; order: number[]; phase: 'ask' | 'pick' | 'done'; pick: number | null; tries: number; done: boolean; t0: number; reply: string; hints: Array<{ why: string; snip: string }> }
export function viewAsk(c: ECtx, r: AskRun, mic: Mic): string {
  const esc = c.host.esc, k = r.c, face = FACE[k.who] ?? '🧑';
  const sheet = k.facts.map(f => { const got = r.got.includes(f.id); return `<li class="${got ? 'got' : ''}"><span>${got ? '✅' : '❔'} ${esc(f.vi)}</span><b>${got ? esc(f.key) : '…'}</b></li>`; }).join('');
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🔎 Hỏi chuyện · ${esc(k.lv)} · ${esc(k.vi)}</span><span>📋 <b>${r.got.length}/${k.facts.length}</b></span></div>
    <div class="vguest"><span class="vface" aria-hidden="true">${face}</span><div class="stack" style="gap:2px"><b>${esc(k.who)}</b><span class="hint">${esc(k.intro)}</span></div></div></section>`;
  const notes = `<section class="panel stack"><b>📋 Sổ manh mối</b><ul class="vsheet">${sheet}</ul></section>`;
  if (r.phase === 'pick') {
    const opts = r.order.map(i => `<button class="btn${r.pick === i ? (i === k.ans ? ' good' : ' bad') : ''}" data-e="akpick" data-i="${i}"><span class="stack" style="gap:2px;text-align:left"><b>${esc(k.sus[i]!.name)}</b><span lang="en" class="hint">${esc(k.sus[i]!.en)}</span></span></button>`).join('');
    const fb = r.pick === null ? '' : r.pick === k.ans ? '' : `<div class="fb bad" role="status"><strong>Chưa khớp với sổ manh mối.</strong><span>Đọc lại mô tả: thời gian, nơi chốn, đặc điểm phải khớp cả.</span></div>`;
    return `${head}${notes}<section class="stack"><h2>Ai / cái gì khớp với mọi manh mối?</h2><p class="hint">Đọc mô tả tiếng Anh, chọn cái khớp với sổ.</p>${fb}<div class="stack" style="gap:8px">${opts}</div></section>`;
  }
  const last = r.log[r.log.length - 1];
  const fb = !last ? '' : !last.q ? `<div class="fb neutral" role="status"><strong>${esc(k.who)} chờ một câu hỏi.</strong><span>Bắt đầu bằng What / Where / When / Who / Why / How… hoặc Is / Do / Did / Can…</span></div>`
    : `<div class="dl"><span class="who">${esc(k.who)}</span><span lang="en">${esc(r.reply)}</span></div>${last.fact ? '' : '<p class="hint">Nhân chứng không biết điều đó. Hỏi điều khác trong sổ.</p>'}`;
  const tips = r.hints.length ? `<div class="stack" style="gap:2px">${r.hints.map(h => `<p class="gerr"><span lang="en">${esc(h.snip)}</span><span class="hint">${esc(h.why)}</span></p>`).join('')}</div>` : '';
  return `${head}${notes}<section class="panel stack"><div class="dlg">${last ? `<div class="dl me B"><span class="who">Bạn</span><span lang="en">${esc(last.text)}</span></div>` : ''}${fb}</div>${tips}
    ${speakBox(c, mic, 'aksay', 'Đặt câu hỏi, ví dụ: Where did you…?', null, 'Hỏi nhân chứng')}
    <div class="row">${r.got.length >= Math.max(2, k.facts.length - 1) ? `<button class="btn primary" data-e="akdone">🔍 Đủ manh mối: tìm ra</button>` : `<span class="hint">Cần ít nhất ${Math.max(2, k.facts.length - 1)} manh mối để kết luận.</span>`}</div></section>`;
}
export function viewAskEnd(c: ECtx, r: AskRun, sv: VoiceSave['ak']): string {
  const esc = c.host.esc, k = r.c, qs = r.log.filter(x => x.q), own = qs.filter(x => x.via !== 'pick').length;
  return `<section class="stack"><span class="eyebrow">🔎 Hỏi chuyện</span><h1>${r.pick === k.ans && r.tries <= 1 ? '🎉 Phá án!' : '🔍 Xong vụ'}</h1>
    <p style="font-size:20px">${esc(k.title)} · ${r.got.length}/${k.facts.length} manh mối · ${qs.length} câu hỏi bạn tự đặt (${own} nói / gõ)</p>
    <p>Đáp án: <b>${esc(k.sus[k.ans]!.name)}</b>. ${r.tries > 1 ? `Bạn chọn ${r.tries} lần mới đúng.` : ''}</p>
    <details class="panel stack"><summary><b>Câu hỏi mẫu cho từng manh mối</b></summary>${k.facts.map(f => `<p><b>${esc(f.vi)}</b> <span lang="en">${esc(f.q[0]!.split(' ').map(s => s.split('|')[0]).join(' '))}…?</span> → <span lang="en">${esc(f.a)}</span></p>`).join('')}</details>
    <p class="hint">Câu hỏi bạn tự đặt và nhân chứng hiểu được tính là "dùng ở tình huống mới" trong Bảng đo H. Đã phá ${sv.solved} vụ.</p></section>
    <div class="row"><button class="btn primary" data-e="akstart">🔎 Vụ khác</button><button class="btn ghost" data-e="hmeter">📏 Bảng đo H</button><button class="btn ghost" data-e="qhome">Về bản đồ</button></div>`;
}

// ---------- ⚓ Bến Cảng lệnh giọng ----------
export interface PortRun { floor: number; seed: number; orders: PortOrder[]; i: number; res: Array<'ok' | 'other' | 'unclear' | 'skip'>; mode: 'speak' | 'listen'; pos: 0 | 1; said: string; ans: 'ok' | 'other' | 'unclear' | null; tries: number; done: boolean; t0: number }
export const portKey = (r: PortRun): string => `pt:${r.floor}:${r.i}:${r.tries}`;
export function viewPort(c: ECtx, r: PortRun, asrHtml: string): string {
  const esc = c.host.esc, o = r.orders[r.i]!, words = r.pos === 0 ? [o.target, o.other] : [o.other, o.target], ok = r.res.filter(x => x === 'ok').length;
  const crate = (w: string, k: number) => { const lift = r.ans && ((r.ans === 'ok' && w === o.target) || (r.ans === 'other' && w === o.other)); return `<div class="vcrate${lift ? ' lift' : ''}${r.ans === 'other' && w === o.other ? ' wrong' : ''}" data-k="${k}"><span aria-hidden="true">📦</span><b lang="en">${esc(w)}</b></div>`; };
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">⚓ Bến Cảng · lệnh ${r.i + 1}/${r.orders.length} · ${esc(o.title)}</span><span>🚢 <b>${ok}</b></span></div></section>`;
  const yard = `<section class="panel stack vport"><div class="vcrane" aria-hidden="true">🏗️</div><div class="row vcrates">${words.map(crate).join('')}</div>`;
  let body = '';
  if (r.mode === 'speak') {
    const fb = r.ans === 'ok' ? `<div class="fb good" role="status"><strong>Cẩu nhấc đúng thùng “<span lang="en">${esc(o.target)}</span>”!</strong></div>`
      : r.ans === 'other' ? `<div class="fb bad" role="status"><strong>Cẩu nghe thành “<span lang="en">${esc(o.other)}</span>” và nhấc nhầm thùng.</strong><span>${esc(o.tip)}</span></div>`
      : r.ans === 'unclear' ? `<div class="fb neutral" role="status"><strong>Cẩu chưa nghe rõ.</strong><span>Nói chậm, rõ âm cuối.</span></div>` : '';
    body = `<p>Ra lệnh cho cẩu: nói to từ <b lang="en" style="font-size:22px">${esc(o.target)}</b></p><div class="row"><button class="btn small" data-say="${esc(o.target)}">🔊 Nghe mẫu</button><button class="btn small" data-say="${esc(o.target)}" data-slow="1">🐢 Chậm</button></div>
      ${fb}${r.ans === 'ok' || r.ans === 'other' || r.tries >= 2 ? `<div class="row"><button class="btn primary" data-e="ptnext">Lệnh tiếp ▸</button></div>` : asrHtml + `<div class="row"><button class="btn primary" data-e="ptsend">📢 Ra lệnh</button><button class="btn ghost small" data-e="ptskip">Bỏ qua</button></div>`}`;
  } else {
    const fb = r.ans === 'ok' ? `<div class="fb good" role="status"><strong>Đúng thùng “<span lang="en">${esc(o.target)}</span>”!</strong></div>` : r.ans ? `<div class="fb bad" role="status"><strong>Thuyền trưởng nói “<span lang="en">${esc(o.target)}</span>”.</strong><span>${esc(o.tip)}</span></div>` : '';
    body = `<p>Thuyền trưởng gọi tên một thùng. Nghe rồi chạm đúng thùng.</p><div class="row"><button class="btn primary" data-say="${esc(o.target)}">🔊 Nghe lệnh</button><button class="btn small" data-say="${esc(o.target)}" data-slow="1">🐢 Chậm</button></div>
      ${fb}${r.ans ? `<div class="row"><button class="btn primary" data-e="ptnext">Lệnh tiếp ▸</button></div>` : `<div class="row">${words.map(w => `<button class="btn" data-e="pttap" data-w="${esc(w)}" lang="en">📦 ${esc(w)}</button>`).join('')}</div>`}
      <p class="hint">Máy này không nghe được giọng: chơi chế độ nghe. Có micro (Chrome / Edge / Safari) thì bạn ra lệnh bằng giọng.</p>`;
  }
  return `${head}${yard}${body}</section>`;
}
export function viewPortEnd(c: ECtx, r: PortRun, sv: VoiceSave['pt']): string {
  const esc = c.host.esc, ok = r.res.filter(x => x === 'ok').length, n = r.res.filter(x => x !== 'skip').length;
  const miss = r.orders.map((o, i) => ({ o, x: r.res[i] })).filter(y => y.x === 'other' || y.x === 'unclear');
  return `<section class="stack"><span class="eyebrow">⚓ Bến Cảng</span><h1>⚓ Hết ca bốc hàng</h1><p style="font-size:22px">🚢 ${ok}/${n} thùng đúng ${r.mode === 'speak' ? '(máy nghe giọng của bạn)' : '(nghe phân biệt)'}</p>
    ${miss.length ? `<section class="panel stack"><b>Cặp âm nên luyện thêm</b>${[...new Map(miss.map(m => [m.o.set, m.o])).values()].map(o => `<p><b>${esc(o.title)}</b>: ${esc(o.tip)}</p>`).join('')}</section>` : ''}
    <p class="hint">${r.mode === 'speak' ? 'Máy nghe ra đúng từ là phép thử "người nghe có hiểu bạn không", không phải chấm phát âm chuẩn. Kết quả vào Bảng đo H (H7).' : 'Nghe phân biệt cặp âm là bằng chứng cho phần âm (như màn Âm).'} Kỷ lục ${sv.best}%.</p></section>
    <div class="row"><button class="btn primary" data-e="ptstart">⚓ Ca mới</button><button class="btn ghost" data-e="hmeter">📏 Bảng đo H</button><button class="btn ghost" data-e="qhome">Về bản đồ</button></div>`;
}

// ---------- 🌫️ Sương quay lại ----------
export interface SignRun { floor: number; signs: Fading[]; i: number; lit: boolean[]; res: Array<boolean | null>; ans: { ok: boolean; said: string } | null; done: boolean; t0: number }
export function viewSigns(c: ECtx, r: SignRun, mic: Mic): string {
  const esc = c.host.esc, s = r.signs[r.i]!;
  const street = r.signs.map((x, k) => `<div class="vsign${r.lit[k] ? ' lit' : ''}${k === r.i && !r.done ? ' cur' : ''}"><span aria-hidden="true">${r.lit[k] ? '🏮' : '🌫️'}</span><b lang="en">${r.lit[k] ? esc(x.en) : '· · ·'}</b></div>`).join('');
  const fb = !r.ans ? '' : r.ans.ok ? `<div class="fb good" role="status"><strong>Biển sáng lại: <span lang="en">${esc(s.en)}</span></strong>${s.gap >= 7 ? `<span>Bạn vẫn nhớ sau ${s.gap} ngày!</span>` : ''}</div>`
    : `<div class="fb bad" role="status"><strong>Từ đúng là “<span lang="en">${esc(s.en)}</span>”</strong><span>${r.ans.said ? `Bạn ${esc(r.ans.said.length > 30 ? 'nói / gõ' : `đưa ra “${r.ans.said}”`)}. ` : ''}Biển sẽ mờ lại sớm: ngày mai ôn lại.</span></div>`;
  return `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🌫️ Sương quay lại · biển ${r.i + 1}/${r.signs.length}</span><span>🏮 <b>${r.lit.filter(Boolean).length}</b></span></div>
    <p class="hint">Sương Câm phủ lại những biển hiệu có từ bạn sắp quên. Nhớ ra tên tiếng Anh thì biển sáng lại.</p></section>
    <div class="vstreet">${street}</div>
    <section class="panel stack"><div class="vclue">${s.pic ? `<span class="vpic" aria-hidden="true">${esc(s.pic)}</span>` : ''}<b style="font-size:20px">${esc(s.vi)}</b><span class="hint">Lần ôn trước: ${s.gap} ngày trước</span></div>
    ${fb}${r.ans ? `<div class="row"><button class="btn primary" data-e="sgnext">${r.i + 1 >= r.signs.length ? 'Xong ▸' : 'Biển tiếp ▸'}</button>${r.ans.ok ? '' : `<button class="btn ghost small" data-say="${esc(s.en)}">🔊 Nghe</button>`}</div>` : speakBox(c, mic, 'sgsay', 'Tên tiếng Anh…', null, 'Nói tên tiếng Anh') + `<div class="row"><button class="btn ghost small" data-e="sgno">Không nhớ</button></div>`}</section>`;
}
export function viewSignsEnd(c: ECtx, r: SignRun): string {
  const esc = c.host.esc, ok = r.res.filter(x => x === true).length;
  return `<section class="stack"><span class="eyebrow">🌫️ Sương quay lại</span><h1>🏮 ${ok}/${r.signs.length} biển sáng lại</h1>
    <ul class="stack" style="gap:4px">${r.signs.map((s, i) => `<li>${r.res[i] ? '🏮' : '🌫️'} <b lang="en">${esc(s.en)}</b> · ${esc(s.vi)} · ôn lần trước ${s.gap} ngày</li>`).join('')}</ul>
    <p class="hint">Mỗi biển là một lần ôn thật (lịch FSRS). Nhớ được sau ≥ 7 / ≥ 30 ngày vào Bảng đo H (H6 nhớ lâu).</p></section>
    <div class="row"><button class="btn ghost" data-e="hmeter">📏 Bảng đo H</button><button class="btn primary" data-e="qhome">Về bản đồ</button></div>`;
}

// ---------- Sảnh: Phố Chữ nói ----------
export function viewVoiceHub(c: ECtx, sv: VoiceSave, fading: number, task: RealTask, wk: number, hTotal: number): string {
  const esc = c.host.esc, doneWk = sv.rw.wk === wk;
  const card = (start: string, ico: string, name: string, line: string, stat: string) => `<button class="gcard" data-e="${start}"><span class="gico" aria-hidden="true" style="font-size:30px">${ico}</span><span class="stack" style="gap:2px;text-align:left"><b>${name}</b><span class="hint">${line}</span><span class="hint">${stat}</span></span><span class="btn primary small" aria-hidden="true">▶ Chơi</span></button>`;
  return `<section class="stack vhub" aria-label="Phố Chữ nói"><div class="spread"><h2>🗣️ Phố Chữ nói</h2><button class="btn ghost small" data-e="hmeter">📏 Bảng đo H · ${hTotal.toFixed(1)}/10</button></div>
    <p class="hint">Muốn thắng thì phải nói, hỏi, nghe ra bằng tiếng Anh. Không có micro thì gõ.</p>
    ${card('tkstart', '🗣️', 'Quán Phố Chữ', 'Khách đến, bạn nói (hoặc gõ) để hỏi và đáp. Trả lời nhanh được tip.', `${sv.tk.served} khách · 💁 ${sv.tk.tips} tip`)}
    ${card('akstart', '🔎', 'Hỏi chuyện nhân chứng', 'Manh mối chỉ có khi bạn tự đặt câu hỏi đúng.', `${sv.ak.solved} vụ đã phá`)}
    ${card('ptstart', '⚓', 'Bến Cảng lệnh giọng', 'Nói “back” hay “bag”? Nói thiếu âm cuối thì cẩu nhấc nhầm thùng.', `kỷ lục ${sv.pt.best}%`)}
    ${card('sgstart', '🌫️', 'Sương quay lại', fading ? `${fading} biển hiệu đang mờ: từ bạn sắp quên.` : 'Chưa có biển nào mờ: học thêm từ rồi quay lại.', `${sv.sg.lit} biển đã thắp lại`)}
    <section class="panel stack vreal"><b>🌍 Phố thật tuần này</b><p>${esc(task.vi)}</p><p class="hint">${esc(task.how)}</p>
      ${doneWk ? `<p class="hint">✅ Bạn đã làm nhiệm vụ tuần này. Tuần sau có nhiệm vụ mới.</p>` : `<div class="row"><button class="btn" data-e="rwdone" data-id="${esc(task.id)}">✅ Tôi đã làm (+30 xu)</button></div>`}</section></section>`;
}

// ---------- 📏 Bảng đo H ----------
export function viewHMeter(c: ECtx, rows: HRow[], total: number, measured: number): string {
  const esc = c.host.esc;
  const li = H_IDS.map(id => { const r = rows.find(x => x.id === id)!, [name, how] = H_VI[id];
    return `<li class="vhrow"><div class="stack" style="gap:2px"><b>${id}${H_W[id] > 1 ? ' (×2)' : ''} · ${esc(name)}</b><span class="hint">${esc(how)}</span><span>📐 ${esc(r.value)}</span></div>
      <div class="vhsc"><b>${r.score.toFixed(1)}</b><span class="hint">${r.measured ? 'đã đo' : 'ước tính'}</span></div></li>`; }).join('');
  return `<section class="stack"><span class="eyebrow">📏 Bảng đo H</span><h1>Học xong có dùng được không?</h1>
    <p style="font-size:22px">Điểm H: <b>${total.toFixed(1)}</b>/10 · ${measured}/10 tiêu chí đã đủ số liệu</p>
    <p class="hint">Đo trên chính bạn, 28 ngày gần nhất. Tiêu chí chưa đủ số liệu chỉ là ước tính, tối đa 6. Không đo chuỗi ngày, XP hay số bài đã xong: những số đó không cho biết bạn dùng được tiếng Anh.</p>
    <ul class="vhlist" aria-label="Bảng đo H, 10 tiêu chí">${li}</ul>
    <p class="hint">Muốn tăng: Quán Phố Chữ (H1, H5, H8), Hỏi chuyện (H2), Đài Phố Chữ có âm phố (H3, H4), Sương quay lại (H6), Bến Cảng (H7), thi chuyển cấp (H9), Phố thật (H10).</p></section>
    <div class="row"><button class="btn primary" data-e="qhome">Về bản đồ</button></div>`;
}
