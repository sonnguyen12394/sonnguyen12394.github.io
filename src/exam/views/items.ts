// Hiển thị câu hỏi và đọc câu trả lời cho mọi dạng câu (trắc nghiệm một/nhiều đáp án, điền từ),
// dùng chung cho luyện theo dạng, sổ lỗi sai và đề thi thử. Phản hồi: vì sao đúng, vì sao phương án đã chọn sai, câu chứa đáp án.

import type { Group, Item, TextAnswer } from '../content.ts';
import { answerKind, itemOptions, sourceText } from '../content.ts';
import type { Given } from '../score.ts';

type Esc = (s: unknown) => string;

export function limitHint(it: Item): string {
  if (it.limit === undefined) return '';
  const w = it.limit === 1 ? 'ONE WORD' : it.limit === 2 ? 'TWO WORDS' : it.limit === 3 ? 'THREE WORDS' : `${it.limit} WORDS`;
  return `NO MORE THAN ${w}${it.num ? ' AND/OR A NUMBER' : ''}`;
}

// Ô nhập / phương án của một câu. `given` để giữ lựa chọn khi vẽ lại; `lock` sau khi đã chấm.
export function itemInput(it: Item, g: Group, given: Given, esc: Esc, lock = false): string {
  const kind = answerKind(it, g), dis = lock ? ' disabled' : '';
  const q = `<b lang="en">${esc(it.q.replace(/___/g, '______'))}</b>`;
  if (kind === 'text') {
    const v = typeof given === 'string' ? given : '';
    return `<label class="stack" style="gap:4px">${q}<span class="hint" lang="en">${esc(limitHint(it))}</span>
      <input class="field" name="${esc(it.id)}" value="${esc(v)}" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en"${dis}></label>`;
  }
  const opts = itemOptions(it, g), multi = kind === 'multi', picked = Array.isArray(given) ? given : given ? [given] : [];
  const n = multi ? (it.ans as string[]).length : 1;
  return `<fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend>${q}${multi ? ` <span class="hint">(chọn ${n})</span>` : ''}</legend>
    ${opts.map(o => `<label class="chip"><input type="${multi ? 'checkbox' : 'radio'}" name="${esc(it.id)}" value="${esc(o.k)}"${picked.includes(o.k) ? ' checked' : ''}${dis}> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></label>`).join('')}</fieldset>`;
}

// Đọc câu trả lời từ form theo id câu.
export function readGiven(f: HTMLFormElement, items: Item[], g: Group): Record<string, Given> {
  const d = new FormData(f), out: Record<string, Given> = {};
  for (const it of items) {
    const k = answerKind(it, g), vs = d.getAll(it.id).map(String);
    out[it.id] = k === 'multi' ? (vs.length ? vs : undefined) : vs[0] && vs[0].trim() ? vs[0] : undefined;
  }
  return out;
}

export function answerText(it: Item): string {
  if (typeof it.ans === 'string') return it.ans;
  if (Array.isArray(it.ans)) return it.ans.join(', ');
  return (it.ans as TextAnswer).accept[0] ?? '';
}

export function givenText(g: Given): string {
  return g === undefined ? '' : Array.isArray(g) ? g.join(', ') : g;
}

// Phản hồi sau khi chấm một câu.
export function feedback(it: Item, g: Group, given: Given, got: number, of: number, esc: Esc): string {
  const ok = got === of, src = sourceText(g), line = src[it.ev.p] ?? '';
  const hl = esc(line).replace(esc(it.ev.s), `<mark>${esc(it.ev.s)}</mark>`);
  const opts = itemOptions(it, g), picked = Array.isArray(given) ? given : given ? [given] : [];
  const wrongPicked = picked.filter(k => !(Array.isArray(it.ans) ? it.ans.includes(k) : it.ans === k));
  const acc = typeof it.ans === 'object' && !Array.isArray(it.ans) ? (it.ans as TextAnswer).accept : null;
  return `<div class="stack" style="gap:6px;border-left:3px solid ${ok ? 'var(--good)' : 'var(--bad)'};padding-left:10px">
    <p><b>${ok ? '✓ Đúng' : got > 0 ? `◐ Đúng ${got}/${of}` : '✕ Sai'}.</b> Đáp án: <b lang="en">${esc(acc ? acc.join(' / ') : answerText(it))}</b>${given !== undefined && !ok ? ` · bạn trả lời: <span lang="en">${esc(givenText(given))}</span>` : given === undefined ? ' · bạn bỏ trống' : ''}</p>
    <p>${esc(it.why)}</p>
    ${wrongPicked.map(k => it.wrong?.[k] ? `<p><b>Vì sao ${esc(k)} sai:</b> ${esc(it.wrong[k])}</p>` : '').join('')}
    ${acc && !ok && given !== undefined && it.wrong ? Object.entries(it.wrong).map(([k, v]) => `<p class="hint"><b lang="en">${esc(k)}</b>: ${esc(v)}</p>`).join('') : ''}
    ${it.trap ? `<p class="hint"><b>Bẫy hay gặp:</b> ${esc(it.trap)}</p>` : ''}
    ${opts.length > picked.length ? `<details><summary>Giải thích các phương án còn lại</summary>${opts.filter(o => !picked.includes(o.k) && it.wrong?.[o.k]).map(o => `<p><b>${esc(o.k)}:</b> ${esc(it.wrong![o.k])}</p>`).join('')}</details>` : ''}
    <p class="hint">Câu chứa đáp án:</p><p lang="en" class="reading">${hl}</p></div>`;
}
