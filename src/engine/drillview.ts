// v134 Màn Sân tập trước cổng (drill.ts). Chỉ trình bày. Lời của truyện: sân tập, bài, phần; không dùng chữ thi / đề / kiểm tra.
// Khác trận cổng: chữa ngay sau mỗi bài, nghe lại được (có bản chậm), làm lại được; lần làm đầu là số đo của phần.

import type { ECtx } from './views.ts';
import type { Group } from '../exam/content.ts';
import type { Given } from '../exam/score.ts';
import { itemInput, feedback } from '../exam/views/items.ts';
import { DRILL_PARTS, PART, partStat, weakest, type DrillMark, type DrillPart, type DrillSave } from './drill.ts';

export interface DrillRun { q: DrillPart; ids: string[]; g: Group; given: Record<string, Given>; marks: DrillMark[] | null; first: boolean; ok: number; n: number }

const SK_VI = { R: 'Đọc', L: 'Nghe' } as const;
const pc = (x: number) => `${Math.round(x * 100)}%`;
const HOME = '<button class="btn ghost" data-e="drhome">Về sân tập</button>';
const back = (to = 'gate', label = 'Về cổng khu') => `<button class="btn ghost" data-e="go" data-r="${to}">${label}</button>`;

export function viewDrillHome(c: ECtx, lv: string, dr: DrillSave | undefined, totals: Record<string, number> | null, err: string): string {
  const esc = c.host.esc;
  const head = `<section class="stack"><span class="eyebrow">🏹 Sân tập trước cổng khu ${esc(lv)}</span><h1>Sân tập</h1>
    <p class="muted">Luyện đúng 10 kiểu bài của cổng khu A2 (theo dạng A2 Key của Cambridge). Khác trận cổng: <b>chữa ngay</b> sau mỗi bài, bài nghe <b>nghe lại được</b>, bài nào cũng làm lại được. Câu ở đây không bao giờ xuất hiện trong trận cổng.</p></section>`;
  if (err) return `${head}<p class="warnt" role="alert">${esc(err)}</p><div class="row"><button class="btn" data-e="drhome">Thử lại</button>${back()}</div>`;
  if (!totals) return `${head}<p class="muted" role="status" style="padding:24px 0;text-align:center">Tí đang dọn sân tập…</p>`;
  const w = weakest(dr, totals);
  const row = (p: (typeof DRILL_PARTS)[number]) => {
    const total = totals[p.q] ?? 0, s = partStat(dr, p.q, total);
    const meta = !total ? 'đang soạn' : `${s.done}/${total} bài${s.acc !== null ? ` · lần đầu đúng ${pc(s.acc)}` : ''}`;
    return `<li class="spread" style="gap:8px"><span><b>Phần ${p.no} · ${esc(p.vi)}</b>${p.q === w ? ' <span class="pill">nên luyện</span>' : ''}<br><span class="hint">${esc(p.how)}</span><br><span class="hint">${meta}</span></span>
      ${total ? `<button class="btn small${p.q === w ? ' primary' : ''}" data-e="drpart" data-q="${p.q}">Luyện</button>` : ''}</li>`;
  };
  return `${head}${(['R', 'L'] as const).map(k => `<section class="panel stack"><h3>${SK_VI[k]}</h3><ul class="sklist">${DRILL_PARTS.filter(p => p.sk === k).map(row).join('')}</ul></section>`).join('')}
    <p class="hint">Lần làm đầu của mỗi bài được giữ để biết bạn yếu phần nào; làm lại chỉ để luyện, không đổi con số đó. Sân tập không mở cổng: cổng chỉ mở bằng trận cổng với câu lạ.</p>
    <div class="row">${back()}</div>`;
}

function source(c: ECtx, g: Group, done: boolean): string {
  const esc = c.host.esc;
  if (g.kind === 'reading') return `<section class="panel stack">${(g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>`;
  const a = g.audio;
  const script = done && g.script ? `<details class="panel"><summary>Xem lời thoại</summary><div class="stack" style="gap:4px;margin-top:8px">${g.script.map((l, i) => `<p><b>${esc(l.sp)}:</b> <span lang="en">${esc(l.t)}</span>${g.vi?.[i] ? `<br><span class="hint">${esc(g.vi[i])}</span>` : ''}</p>`).join('')}</div></details>` : '';
  return `<section class="panel stack"><p class="muted">${done ? 'Nghe lại để thấy chỗ có đáp án.' : 'Đọc câu hỏi trước, rồi nghe. Ở sân tập được nghe lại; trận cổng chỉ nghe một lần.'}</p>
    ${a ? `<audio controls preload="none" src="${esc(a.file)}" style="width:100%"></audio>${a.slow ? `<p class="hint">Bản chậm:</p><audio controls preload="none" src="${esc(a.slow)}" style="width:100%"></audio>` : ''}` : '<p class="warnt">Bài này chưa có âm thanh.</p>'}</section>${script}`;
}

export function viewDrillRun(c: ECtx, r: DrillRun): string {
  const esc = c.host.esc, p = PART[r.q]!, g = r.g, i = r.ids.indexOf(g.id) + 1;
  const head = `<section class="stack"><span class="eyebrow">🏹 Sân tập · ${SK_VI[p.sk]} phần ${p.no} · bài ${i}/${r.ids.length}</span>
    <h2 lang="en" style="font-size:20px">${esc(g.title)}</h2><p class="muted" lang="en">${esc(g.instr)}</p>
    ${g.options ? `<section class="panel"><ul class="stack" style="gap:4px;list-style:none;padding:0;margin:0">${g.options.map(o => `<li><b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></li>`).join('')}</ul></section>` : ''}</section>`;
  if (!r.marks) return `${head}${source(c, g, false)}
    <form class="panel stack" data-eform="drmark">${g.items.map(it => itemInput(it, g, r.given[it.id], esc)).join('')}
      <div class="row"><button class="btn primary">Chấm bài</button></div></form>
    <div class="row">${HOME}</div>`;
  const by = Object.fromEntries(r.marks.map(m => [m.id, m]));
  return `${head}<section class="panel stack gres${r.ok === r.n ? ' ok' : ''}"><h3>Đúng ${r.ok}/${r.n}</h3>
      <p class="hint">${r.first ? 'Lần làm đầu: đã ghi vào số đo của phần này.' : 'Lần làm lại: chỉ để luyện, không đổi số đo.'}</p></section>
    ${source(c, g, true)}
    <section class="stack">${g.items.map(it => `<div class="panel stack">${itemInput(it, g, r.given[it.id], esc, true)}${feedback(it, g, r.given[it.id], by[it.id]?.got ?? 0, by[it.id]?.of ?? 1, esc)}</div>`).join('')}</section>
    <div class="row"><button class="btn primary" data-e="drpart" data-q="${r.q}">Bài tiếp</button>${HOME}</div>`;
}
