// v111 Chương mở đầu: hai ngọn đèn Nghe và Đọc (docs/SPEC.md "Mô hình học v111" §2). Chỉ trình bày: câu do bộ xếp lớp thích ứng
// của phần ôn thi chọn (src/exam/placement.ts qua host.lr), engine vẽ bằng lời của truyện. Không đồng hồ trên màn (luật 2 của
// "Game hoá mọi chức năng"); bài nghe phát một lần như khi đo thật, không nghe được thì bỏ qua phần Nghe.

import type { ECtx } from './views.ts';
import type { LrCur } from '../exam/main.ts';

export function viewLrRun(c: ECtx, cur: LrCur | null, plays: number, err: string): string {
  const esc = c.host.esc;
  if (err) return `<section class="stack"><span class="eyebrow">🔦 Sương Câm</span><p class="warnt" role="alert">${esc(err)}</p></section>
    <div class="row"><button class="btn primary" data-e="lrstart">Thử lại</button><button class="btn ghost" data-e="go" data-r="diag-result">Để sau</button></div>`;
  if (!cur) return '<p class="muted" role="status" style="padding:40px 0;text-align:center">Tí đang tìm mẩu tin trong sương…</p>';
  const g = cur.g, lis = g.kind === 'listening', opts = (it: (typeof g.items)[number]) => it.opts ?? g.options ?? [];
  const head = `<section class="stack"><span class="eyebrow">🔦 Sương Câm · đèn ${lis ? 'Nghe' : 'Đọc'} · mẩu ${cur.n + 1}</span>
    <div class="bar" role="progressbar" aria-label="Đèn ${lis ? 'Nghe' : 'Đọc'}" aria-valuemin="0" aria-valuemax="${cur.max}" aria-valuenow="${cur.n}"><i style="width:${Math.min(100, Math.round((cur.n / cur.max) * 100))}%"></i></div>
    <h2 lang="en" style="font-size:20px">${esc(g.title)}</h2></section>`;
  const src = lis
    ? `<section class="panel stack"><p class="muted">Tí bắt được một mẩu tin trong sương. Đọc câu hỏi trước, rồi nghe <b>một lần</b>.</p>
        <audio id="elaudio" preload="auto" src="${esc(g.audio?.file ?? '')}"></audio>
        <div class="row"><button class="btn${plays < 1 ? ' primary' : ''}" data-e="lrplay"${plays < 1 ? '' : ' disabled'}>${plays < 1 ? '▶ Nghe' : 'Đã nghe'}</button></div>
        <p class="hint"><button class="linkbtn" data-e="lrskip">Không nghe được lúc này? Bỏ qua đèn Nghe</button></p></section>`
    : `<section class="panel stack"><p class="muted">Một tấm biển hiện ra trong sương:</p>${(g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>`;
  const qs = `<form class="panel stack" data-eform="lrnext">${g.items.map(it => `<fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b lang="en">${esc(it.q)}</b></legend>
      ${opts(it).map(o => `<label class="chip opt-row"><input type="radio" name="${esc(it.id)}" value="${esc(o.k)}"> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></label>`).join('')}</fieldset>`).join('')}
    <p class="hint">Không chắc thì cứ để trống: Tí đoán cấp của bạn đúng hơn khi bạn không đoán bừa.</p>
    <div class="row"><button class="btn primary">Thắp tiếp</button></div></form>`;
  return head + src + qs;
}
