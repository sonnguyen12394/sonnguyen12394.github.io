// Sổ lỗi sai: danh sách theo dạng câu hỏi, và lượt ôn các câu đến hạn (làm lại, xem giải thích ngay, lịch FSRS).

import type { Ctx } from '../main.ts';
import type { Group } from '../content.ts';
import { QT, itemOptions } from '../content.ts';
import { groups, dueList, mastered } from '../notebook.ts';
import { hiddenItems } from '../net.ts';
import { back, dayVi } from './ui.ts';
import { FLAG_REASONS } from './place.ts';

export interface NbRun { queue: string[]; i: number; groups: Record<string, Group>; answered: { given: string | undefined; correct: boolean } | null; right: number }

export function viewNb(c: Ctx, loading: boolean, err: string): string {
  const { x, host } = c, esc = host.esc, today = host.today(), due = dueList(x, today, hiddenItems());
  const gs = groups(x, today), total = Object.keys(x.nb).length;
  const nextDue = Object.values(x.nb).filter(e => e.due > today).sort((a, b) => a.due - b.due)[0];
  return `<section class="stack"><span class="eyebrow">Ôn thi · Sổ lỗi sai</span><h1>Sổ lỗi sai</h1>
    <p class="muted">Câu bạn làm sai tự vào đây. App hẹn ôn lại đúng lúc sắp quên (thuật toán FSRS-5); làm đúng thì lần sau giãn ra, sai lại thì ôn sớm.</p></section>
  <section class="panel stack"><p><b class="num">${due.length}</b> câu đến hạn hôm nay · ${total} câu trong sổ · ${Object.values(x.nb).filter(mastered).length} câu đã vững</p>
    ${err ? `<p class="warnt" role="alert">${esc(err)}</p>` : ''}
    <div class="row">${due.length ? `<button class="btn primary" data-x="nbstart"${loading ? ' disabled aria-busy="true"' : ''}>${loading ? 'Đang tải…' : `Ôn ${Math.min(due.length, 20)} câu`}</button>` : `<span class="hint">${total ? `Chưa có câu đến hạn.${nextDue ? ` Lần ôn tới: ${esc(dayVi(nextDue.due))}.` : ''}` : 'Sổ đang trống. Làm kiểm tra đầu vào hoặc bài luyện, câu sai sẽ vào đây.'}</span>`}</div></section>
  ${gs.length ? `<section class="panel stack"><h3>Theo dạng câu hỏi</h3><div class="tablewrap" tabindex="0" role="region" aria-label="Sổ lỗi sai theo dạng câu"><table class="tbl"><thead><tr><th>Dạng câu</th><th>Trong sổ</th><th>Đến hạn</th><th>Đã vững</th></tr></thead><tbody>
    ${gs.map(g => `<tr><td>${esc(QT[g.key]?.vi ?? g.key)}</td><td class="num">${g.total}</td><td class="num">${g.due}</td><td class="num">${g.mastered}</td></tr>`).join('')}</tbody></table></div>
    <p class="hint">Dạng câu nào nhiều lỗi nhất nên được luyện thêm; kế hoạch học tự ưu tiên ôn sổ trước.</p></section>` : ''}
  ${back()}`;
}

export function viewNbRun(c: Ctx, r: NbRun): string {
  const esc = c.host.esc, id = r.queue[r.i];
  const g = id ? Object.values(r.groups).find(q => q.items.some(i => i.id === id)) : undefined, it = g?.items.find(i => i.id === id);
  if (!g || !it) return `<p class="muted" role="status">Đang tải…</p>`;
  const a = r.answered, opts = itemOptions(it, g);
  const text = g.kind === 'reading'
    ? (g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')
    : `${g.audio?.file ? `<audio controls preload="none" src="${esc(g.audio.file)}"></audio>` : ''}
       <details${a ? ' open' : ''}><summary>Lời thoại${a ? '' : ' (mở khi cần)'}</summary>${(g.script ?? []).map(l => `<p lang="en"><b>${esc(l.sp)}:</b> ${esc(l.t)}</p>`).join('')}</details>`;
  const qa = `<form class="panel stack" data-xform="nbanswer"><fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b lang="en">${esc(it.q)}</b></legend>
    ${opts.map(o => `<label class="chip"><input type="radio" name="a" value="${esc(o.k)}"${a?.given === o.k ? ' checked' : ''}${a ? ' disabled' : ''}> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span>${a && o.k === it.ans ? ' <span class="pill good">đáp án</span>' : ''}</label>`).join('')}</fieldset>
    ${a ? `<p role="status"><b>${a.correct ? '✓ Đúng rồi.' : '✕ Chưa đúng.'}</b> ${esc(it.why)}</p>
      ${a.given && !a.correct && it.wrong?.[a.given] ? `<p><b>Vì sao ${esc(a.given)} sai:</b> ${esc(it.wrong[a.given])}</p>` : ''}
      <p class="hint">Câu chứa đáp án: <span lang="en">“${esc(it.ev.s)}”</span></p>
      <div class="row" style="gap:6px"><span class="hint">Báo lỗi:</span>${FLAG_REASONS.map((t, k) => `<button type="button" class="btn small ghost" data-x="nbflag" data-i="${esc(it.id)}" data-r="${k}">${esc(t)}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn primary" data-x="nbnext">${r.i + 1 < r.queue.length ? 'Câu tiếp' : 'Xong'}</button></div>`
      : '<div class="row"><button class="btn primary">Kiểm tra</button></div>'}</form>`;
  return `<section class="stack"><span class="eyebrow">Sổ lỗi sai · câu ${r.i + 1}/${r.queue.length}</span><h2 lang="en">${esc(g.title)}</h2>
    <p class="hint">${esc(QT[g.qtype]?.vi ?? '')}</p></section><section class="panel stack">${text}</section>${qa}`;
}
