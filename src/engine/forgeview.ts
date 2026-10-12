// v129 Màn Lò rèn năng lực + Bản đồ phủ cấp (forge.ts). Thuần hàm.

import type { ECtx } from './views.ts';
import type { MicroCard } from './host.ts';
import { TIER_F, LEVEL_DO, AREA_F, FORGE_CAP, FORGE_LEN, type FRun, type Cov, type coverage } from './forge.ts';

const ladder = (tier: number, need: number) => `<ol class="fgladder" aria-label="Bậc của món: ${tier}/5, mục tiêu cần ${need}">${TIER_F.slice(1).map(([ico, vi], i) => `<li class="${i + 1 <= tier ? 'on' : ''}${i + 1 === need ? ' need' : ''}"><span aria-hidden="true">${ico}</span><span>${vi}</span></li>`).join('')}</ol>`;

export interface ForgeNext { node: string; vi: string; need: number; tier: number; left: number }
// Trang chính của Lò rèn: vài món mục tiêu đang thiếu (bộ chọn của engine xếp thứ tự), hai cách rèn, lối sang Bản đồ phủ.
export function viewForgeHome(c: ECtx, next: ForgeNext[], cov: { done: number; total: number; lv: string } | null): string {
  const esc = c.host.esc;
  const items = next.map(n => `<li class="bgcell"><b>${TIER_F[n.tier]![0]} ${esc(n.vi)}</b><span class="hint">Đang: ${TIER_F[n.tier]![1]} · mục tiêu cần: ${TIER_F[n.need]![0]} ${TIER_F[n.need]![1]} (${esc(LEVEL_DO[n.need as 1])})</span>
      ${n.left > 0 ? `<span class="row"><button class="btn small primary" data-e="bgfgo" data-n="${esc(n.node)}" data-m="up">🔨 Rèn từ dưới</button><button class="btn small" data-e="bgfgo" data-n="${esc(n.node)}" data-m="jump">⚡ Vượt bậc</button></span>` : '<span class="hint">🔥 Lò đã nóng hết lượt hôm nay cho món này: mai rèn tiếp (cách ngày giúp nhớ lâu).</span>'}</li>`).join('');
  return `<h2>🔥 Lò rèn năng lực</h2><p>Rèn kỹ năng mục tiêu lên từng bậc: bậc đạt thật được tính vào năng lực.</p>
    <details class="dwhy"><summary>❓ Cách rèn</summary><p class="hint">Mỗi kỹ năng mục tiêu cần là một món đồ 5 bậc: ${TIER_F.slice(1).map(([i, v], k) => `${i} ${v} = ${LEVEL_DO[(k + 1) as 1]}`).join(' · ')}. Bậc chính là mức bạn đạt thật: <b>có tính vào bằng chứng</b>. Câu lấy từ kho của app, không học thuộc được.</p>
    <p class="hint">🔨 <b>Từ dưới</b>: cho kỹ năng mới, đi từng bậc. ⚡ <b>Vượt bậc</b>: nếu bạn nghĩ mình đã biết, thử bậc cao trước; đúng thì bậc dưới được tính luôn, sai thì lùi một bậc, không mất gì.</p></details>
    ${cov ? `<p><button class="btn ghost small" data-e="bgtab" data-t="map">🗺️ Bản đồ phủ ${esc(cov.lv)}: ${cov.done}/${cov.total}</button></p>` : ''}
    ${items ? `<ul class="bggrid fgnext">${items}</ul>` : '<p class="hint">Chưa có món nào để rèn: chọn mục tiêu CEFR trước, hoặc bạn đã đạt mọi kỹ năng rèn được của mục tiêu.</p>'}`;
}

export function viewForgeTeach(c: ECtx, r: FRun, card: MicroCard): string {
  const esc = c.host.esc;
  return `<h2>🔨 Rèn: ${esc(r.vi)}</h2><p class="hint">Món mới: đọc bí kíp 1 phút rồi mới rèn.</p>
    <section class="panel stack"><b>${esc(card.title)}${card.en ? ` · <span lang="en">${esc(card.en)}</span>` : ''}</b>${card.concept.map((x, i) => `<p${i ? ' lang="en"' : ''}>${esc(x)}</p>`).join('')}
    ${card.contrast ? `<p class="hint">${esc(card.contrast)}</p>` : ''}<ul>${card.examples.slice(0, 3).map(([en, vi]) => `<li><b lang="en">${esc(en)}</b>${vi ? ` <span class="hint">· ${esc(vi)}</span>` : ''}</li>`).join('')}</ul></section>
    <div class="row"><button class="btn primary" data-e="bgfteach">Đã hiểu: bắt đầu rèn</button><button class="btn ghost" data-e="bgfhome">← Lò rèn</button></div>`;
}

export function viewForgeRun(c: ECtx, r: FRun, tier: number, tts: boolean): string {
  const esc = c.host.esc, it = r.item;
  const head = `<h2>${r.mode === 'jump' ? '⚡' : '🔨'} ${esc(r.vi)}</h2>${ladder(tier, r.need)}<p class="hint">Câu ${Math.min(r.n + 1, FORGE_LEN)}/${FORGE_LEN} · đang thử bậc ${TIER_F[r.cur]![0]} ${TIER_F[r.cur]![1]} (${esc(LEVEL_DO[r.cur as 1])})</p>`;
  if (r.done || !it) {
    const up = r.up.length ? `<p class="bgok">🎉 Lên bậc: ${r.up.map(t => `${TIER_F[t]![0]} ${TIER_F[t]![1]}`).join(' → ')}</p>` : '';
    return `<h2>${r.capped ? '🔥 Lò nóng' : '✅ Xong lượt rèn'}: ${esc(r.vi)}</h2>${ladder(tier, r.need)}
      <p>Đúng ${r.ok}/${r.n} câu.${r.capped ? ` Món này đã đủ ${FORGE_CAP} lượt có tính hôm nay: mai rèn tiếp.` : ''}${!r.n && !r.capped ? ' Kho app chưa có câu cho bậc này.' : ''}</p>${up}
      ${tier >= r.need ? `<p class="hint">Đã đạt bậc mục tiêu cần. Muốn lên ${TIER_F[5]![0]} Báu vật (dùng tự do): dùng kỹ năng này khi nói ở Quán, viết Thư.</p>` : `<p class="hint">Bậc chỉ lên khi đủ bằng chứng (đúng nhiều, chắc chắn, ở câu khác nhau). Bậc 4–5 cần đúng ở câu chưa gặp và cách ngày.</p>`}
      <div class="row"><button class="btn primary" data-e="bgfgo" data-n="${esc(r.node)}" data-m="${r.mode}">🔁 Rèn tiếp</button><button class="btn ghost" data-e="bgfhome">← Lò rèn</button><button class="btn ghost" data-e="bgtab" data-t="map">🗺️ Bản đồ phủ</button></div>`;
  }
  const say = it.say && tts ? `<button class="btn small" data-e="bgfsay">🔊 Nghe</button>` : '';
  const fb = r.res ? `<p class="${r.res.ok ? 'bgok' : 'bgno'}" role="status">${r.res.ok ? '✓ Đúng!' : `Chưa đúng. Đáp án: <b lang="en">${esc(r.res.right)}</b>`}${r.res.why ? ` <span class="hint">${esc(r.res.why)}</span>` : ''}</p><div class="row"><button class="btn primary" data-e="bgfnext">Tiếp ▸</button></div>` : '';
  let body = '';
  if (it.kind === 'mcq') body = `<div class="stack" role="group" aria-label="Chọn đáp án">${(it.opts ?? []).map((o, i) => `<button class="btn${r.res ? (i === it.ans ? ' primary' : '') : ''}" data-e="bgfpick" data-i="${i}" ${r.res ? 'disabled' : ''} lang="en">${esc(o)}</button>`).join('')}</div>`;
  else if (it.kind === 'order') body = `<p class="bgline" lang="en" aria-live="polite">${r.sel.length ? esc(r.sel.map(i => it.tiles![i]).join(' ')) : '<span class="hint">Chạm lá chữ theo thứ tự (có lá thừa)…</span>'}</p>
      <div class="bgtiles" role="group" aria-label="Lá chữ">${(it.tiles ?? []).map((w, i) => `<button class="bgtile" data-e="bgftile" data-i="${i}" lang="en" ${r.sel.includes(i) || r.res ? 'disabled' : ''}>${esc(w)}</button>`).join('')}</div>
      ${r.res ? '' : `<div class="row"><button class="btn ghost small" data-e="bgfundo">↶ Bỏ lá cuối</button><button class="btn primary small" data-e="bgfdone" ${r.sel.length ? '' : 'disabled'}>✓ Xong câu</button></div>`}`;
  else body = `${it.bad ? `<p class="bgline" lang="en">❌ ${esc(it.bad)}</p>` : ''}${r.res ? '' : `<form class="row" data-eform="bgftype"><label class="sr-only" for="bgfin">${it.kind === 'fix' ? 'Viết lại câu đúng' : 'Gõ câu trả lời'}</label><input id="bgfin" name="a" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${it.kind === 'fix' ? 'Viết lại câu đúng…' : 'Gõ câu trả lời…'}" required><button class="btn primary">✓</button></form>`}`;
  return `${head}<section class="panel stack"><p>${esc(it.prompt)}</p>${say}${body}</section>${fb}
    <div class="row"><button class="btn ghost small" data-e="bgfhome">⏹ Dừng rèn</button></div>`;
}

export function viewCoverage(c: ECtx, lv: string, cv: ReturnType<typeof coverage>): string {
  const esc = c.host.esc;
  if (!cv.total) return `<h2>🗺️ Bản đồ phủ</h2><p class="hint">Chọn mục tiêu CEFR để xem bản đồ phủ của cấp đó.</p>`;
  const cell = (r: Cov) => `<li class="fgcell${r.pass ? ' ok' : ''}" title="${esc(`${r.vi}: ${TIER_F[r.tier]![1]} / cần ${TIER_F[r.need]![1]}`)}"><span aria-hidden="true">${r.pass ? '✅' : TIER_F[r.tier]![0]}</span><span>${esc(r.vi)}</span><span class="sr-only">${r.pass ? 'đã đạt' : `${TIER_F[r.tier]![1]}, cần ${TIER_F[r.need]![1]}`}</span>${!r.pass && /^(u|g|ph|fn):/.test(r.node) ? `<button class="btn small ghost" data-e="bgfgo" data-n="${esc(r.node)}" data-m="jump" aria-label="Rèn ${esc(r.vi)}">⚡</button>` : ''}</li>`;
  const miss = cv.missing.slice(0, 6).map(r => r.vi);
  return `<h2>🗺️ Bản đồ phủ ${esc(lv)}</h2>
    <p style="font-size:20px">Đã phủ <b>${cv.done}/${cv.total}</b> kỹ năng (${Math.round((100 * cv.done) / cv.total)}%)</p>
    ${miss.length ? `<p class="hint">Chưa đạt ${esc(lv)} vì còn thiếu: ${miss.map(esc).join(', ')}${cv.missing.length > 6 ? ` và ${cv.missing.length - 6} kỹ năng khác` : ''}.</p>` : `<p class="bgok">Đã phủ đủ mọi kỹ năng của ${esc(lv)}. Xác nhận cấp bằng trận cổng.</p>`}
    ${cv.by.map(g => `<details class="fgarea"${g.done < g.total ? ' open' : ''}><summary><b>${esc(AREA_F[g.area])}</b> · ${g.done}/${g.total}</summary><ul class="fgmap">${g.rows.map(cell).join('')}</ul></details>`).join('')}
    <p class="hint">Bản đồ đọc thẳng từ bằng chứng của engine (giống trang Mục tiêu). Ô ✅ là đã Đạt ở mức mục tiêu cần và đang vững.</p>`;
}
