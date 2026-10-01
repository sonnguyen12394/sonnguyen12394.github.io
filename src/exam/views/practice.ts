// Luyện theo dạng câu hỏi (yêu cầu 6.2, 7.1): danh sách dạng theo kỳ thi → bài học + mẹo + bẫy → bộ câu luyện có giải thích.
// Bài nghe khi luyện: nghe lại được, có bản tốc độ thi, bản chậm và bản có tiếng ồn nền (6.6); lời thoại hiện sau khi chấm.

import type { Ctx } from '../main.ts';
import type { Group } from '../content.ts';
import { QTYPES, QT } from '../content.ts';
import { IDX } from '../packs.ts';
import type { Given, Mark } from '../score.ts';
import { itemInput, feedback } from './items.ts';
import { back, figure, SKILL_VI } from './ui.ts';
import { FLAG_REASONS } from './place.ts';

export interface TypeLesson { id: string; lesson: string[]; steps: string[]; tips: string[]; traps: string[]; time?: string }

export interface PracticeRun { qid: string; g: Group; given: Record<string, Given>; marks: Record<string, Mark> | null; t0: number; ver: 'file' | 'slow' | 'noise' }

// Số câu có sẵn cho một dạng (theo bảng tham số trong index, không cần tải gói).
export function typeCount(qid: string): { groups: number; items: number } {
  const p = IDX.packs['p-' + qid];
  return { groups: p?.groups ?? 0, items: p?.items ?? 0 };
}

// Bộ luyện của một dạng có id bắt đầu bằng id dạng (ví dụ r-tfng-03), kiểm ở tools/content-check.ts.
export function typeStats(c: Ctx, qid: string): { done: number; acc: number | null } {
  const all = c.x.attempts.filter(a => a.kind === 'set' && a.id.startsWith(qid + '-'));
  const ok = all.reduce((s, a) => s + a.correct, 0), t = all.reduce((s, a) => s + a.total, 0);
  return { done: new Set(all.map(a => a.id)).size, acc: t ? ok / t : null };
}

export function viewPracticeList(c: Ctx): string {
  const { x, host } = c, esc = host.esc, exam = x.exam || 'ielts-ac';
  const types = QTYPES.filter(q => q.exams.includes(exam) && !q.id.startsWith('pl-'));
  const row = (q: typeof types[number]): string => {
    const n = typeCount(q.id), st = typeStats(c, q.id);
    if (!n.items) return `<li class="spread" style="gap:8px"><span>${esc(q.vi)} <span class="hint" lang="en">(${esc(q.en)})</span></span><span class="hint">đang soạn</span></li>`;
    return `<li class="spread" style="gap:8px"><span><b>${esc(q.vi)}</b> <span class="hint" lang="en">(${esc(q.en)})</span><br><span class="hint">${n.items} câu · ${st.done} bộ đã làm${st.acc !== null ? ` · đúng ${Math.round(st.acc * 100)}%` : ''}</span></span>
      <button class="btn small" data-x="route" data-r="type/${esc(q.id)}">Học & luyện</button></li>`;
  };
  const ready = types.filter(q => typeCount(q.id).items).length;
  return `<section class="stack"><span class="eyebrow">Ôn thi · Luyện theo dạng câu</span><h1>Luyện từng dạng câu hỏi</h1>
    <p class="muted">Mỗi dạng có bài học, các bước làm, mẹo và bẫy hay gặp, rồi bộ câu luyện có giải thích từng phương án. Đã có ${ready}/${types.length} dạng; các dạng còn lại đang soạn.</p></section>
  ${(['R', 'L'] as const).map(k => `<section class="panel stack"><h3>${SKILL_VI[k]}</h3><ul class="sklist">${types.filter(q => q.skill === k).map(row).join('')}</ul></section>`).join('')}
  ${back()}`;
}

export function viewType(c: Ctx, qid: string, lesson: TypeLesson | undefined, loading: boolean, err: string): string {
  const esc = c.host.esc, q = QT[qid];
  if (!q) return `<section class="stack"><h1>Không có dạng câu này</h1></section>${back()}`;
  const n = typeCount(qid), st = typeStats(c, qid);
  const list = (t: string, xs: string[]): string => `<h3>${t}</h3><ul class="sklist">${xs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
  return `<section class="stack"><span class="eyebrow">Luyện theo dạng · ${SKILL_VI[q.skill]}</span><h1>${esc(q.vi)}</h1><p class="muted" lang="en">${esc(q.en)}</p></section>
  ${lesson ? `<section class="panel stack">${lesson.lesson.map(p => `<p>${esc(p)}</p>`).join('')}${lesson.time ? `<p class="hint">Thời gian gợi ý: ${esc(lesson.time)}</p>` : ''}</section>
    <section class="panel stack">${list('Các bước làm', lesson.steps)}${list('Mẹo', lesson.tips)}${list('Bẫy người Việt hay mắc', lesson.traps)}</section>`
    : loading ? '<p class="muted" role="status">Đang tải bài học…</p>' : ''}
  ${err ? `<p class="warnt" role="alert">${esc(err)}</p>` : ''}
  <section class="panel stack"><p>${n.items} câu luyện trong ${n.groups} bộ · bạn đã làm ${st.done} bộ${st.acc !== null ? `, đúng ${Math.round(st.acc * 100)}%` : ''}.</p>
    <div class="row">${n.items ? `<button class="btn primary" data-x="setstart" data-q="${esc(qid)}">${st.done ? 'Làm bộ tiếp theo' : 'Làm bộ đầu tiên'}</button>` : '<span class="hint">Câu luyện cho dạng này đang soạn.</span>'}</div></section>
  ${back('Các dạng câu khác', 'practice')}`;
}

export function viewSet(c: Ctx, r: PracticeRun): string {
  const esc = c.host.esc, g = r.g, done = !!r.marks;
  const got = done ? Object.values(r.marks!).reduce((s, m) => s + m.got, 0) : 0, of = done ? Object.values(r.marks!).reduce((s, m) => s + m.of, 0) : 0;
  let text: string;
  if (g.kind === 'reading') {
    text = `${(g.paras ?? []).map((p, i) => `<p lang="en" class="reading">${esc(p)}</p>${done && g.vi?.[i] ? `<p class="hint" lang="vi">${esc(g.vi[i])}</p>` : ''}`).join('')}`;
  } else {
    const a = g.audio, src = r.ver === 'slow' ? a?.slow : r.ver === 'noise' ? a?.noise : a?.file;
    text = `<audio id="xsetaudio" controls preload="metadata" src="${esc(src ?? a?.file ?? '')}"></audio>
      <div class="row" role="radiogroup" aria-label="Phiên bản bài nghe" style="gap:6px">${([['file', 'Tốc độ thi'], ['slow', 'Chậm'], ['noise', 'Có tiếng ồn']] as const).filter(([k]) => k === 'file' || a?.[k]).map(([k, l]) => `<button class="btn small${r.ver === k ? ' primary' : ''}" data-x="setver" data-v="${k}" aria-pressed="${r.ver === k}">${l}</button>`).join('')}</div>
      <p class="hint">Khi luyện, bạn được nghe lại. Thi thật chỉ nghe một lần.</p>
      ${done ? `<details open><summary>Lời thoại và bản dịch</summary>${(g.script ?? []).map((l, i) => `<p lang="en"><b>${esc(l.sp)}:</b> ${esc(l.t)}${g.vi?.[i] ? `<br><span class="hint" lang="vi">${esc(g.vi[i])}</span>` : ''}</p>`).join('')}</details>` : ''}`;
  }
  const opts = g.options && !g.items.some(it => it.opts) ? `<div class="panel stack"><p class="hint">Danh sách phương án:</p><ul class="sklist">${g.options.map(o => `<li><b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></li>`).join('')}</ul></div>` : '';
  return `<section class="stack"><span class="eyebrow">Luyện · ${esc(QT[g.qtype]?.vi ?? '')}</span><h2 lang="en">${esc(g.title)}</h2><p class="muted" lang="en">${esc(g.instr)}</p></section>
  <section class="panel stack">${figure(g)}${text}</section>${opts}
  <form class="panel stack" data-xform="setcheck">
    ${g.items.map(it => `<div class="stack" style="gap:6px">${itemInput(it, g, r.given[it.id], esc, done)}${done ? feedback(it, g, r.given[it.id], r.marks![it.id]!.got, r.marks![it.id]!.of, esc) + `<div class="row" style="gap:6px"><span class="hint">Báo lỗi:</span>${FLAG_REASONS.map((t, k) => `<button type="button" class="btn small ghost" data-x="setflag" data-i="${esc(it.id)}" data-r="${k}">${esc(t)}</button>`).join('')}</div>` : ''}</div>`).join('')}
    ${done ? `<p role="status"><b>Kết quả: ${got}/${of}</b>. Câu sai đã vào sổ lỗi sai.</p><div class="row"><button type="button" class="btn primary" data-x="setstart" data-q="${esc(r.qid)}">Bộ tiếp theo</button><button type="button" class="btn" data-x="route" data-r="type/${esc(r.qid)}">Về bài học</button></div>`
      : '<div class="row"><button class="btn primary">Chấm bài</button></div>'}
  </form>`;
}
