// Thư gửi cư dân phố (v83, F9 viết đoạn): cư dân nhờ viết thư (đề viết của app đúng cấp đang học); gửi thư → máy kiểm bài viết của app
// (độ dài, đoạn, từ nối, cụm của đề, lặp từ, câu, viết hoa / dấu câu) → cư dân hồi âm: đủ thì cảm ơn + quà cho phố, thiếu thì hỏi lại đúng
// chỗ thiếu; sửa và gửi lại không mất gì (G9). Cuối cùng tự chấm 4 tiêu chí như màn Viết theo đề; bài lưu ở đó (Can-Do viết).
// Không vào mức thuộc của nút (đánh giá viết đi qua người chấm Viết của engine). Quà / thư là telemetry. Tên, nhân vật của app.

import { rand } from './blocks.ts';
import type { ECtx } from './views.ts';
import type { WTask } from './host.ts';

// Cư dân (emoji một ký tự, tên của app).
export const FOLKS: Array<[string, string]> = [['👵', 'Bà Lan'], ['👴', 'Ông Ba'], ['👩', 'Cô Mai'], ['🧔', 'Chú Tùng'], ['👦', 'Bé Bin'], ['👧', 'Bé Na'], ['🧑', 'Anh Khoa'], ['👱', 'Chị Thảo']];
export const GIFTS = ['🌷', '🪴', '🏮', '🪑', '🎐', '🧺', '🌻', '🕯️'];
export const folk = (seed: number): [string, string] => FOLKS[Math.floor(rand(seed)() * FOLKS.length)]!;
export const gift = (n: number): string => GIFTS[n % GIFTS.length]!;

// Chọn đề: chưa viết trước, rồi đã viết nhưng chưa đạt, cuối cùng đã đạt; không lặp đề vừa viết.
export function pickTask(ts: WTask[], seed: number, last = ''): WTask | null {
  const r = rand(seed), tie = new Map(ts.map(t => [t.id, r()]));
  const rank = (t: WTask) => (!t.text ? 0 : !t.done ? 1 : 2) + (t.id === last ? 10 : 0);
  return [...ts].sort((a, b) => rank(a) - rank(b) || tie.get(a.id)! - tie.get(b.id)!)[0] ?? null;
}
// Hồi âm: đạt khi độ dài + số đoạn đạt (2 mục đầu), các mục máy kiểm khác thiếu tối đa 1, và đã đủ các ý của đề (người viết tự tick) —
// cùng điều kiện với màn Viết theo đề (wtMissing), để "cư dân hài lòng" khớp với Can-Do viết.
export function verdict(checks: Array<[boolean, string]>, ideas: boolean[]): { ok: boolean; fix: string[] } {
  const must = checks.slice(0, 2).filter(c => !c[0]).map(c => c[1]), rest = checks.slice(2).filter(c => !c[0]).map(c => c[1]);
  const miss = ideas.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
  const fix = [...must, ...(rest.length > 1 ? rest : []), ...(miss.length ? [`Còn ${miss.length} ý của thư chưa có (tick khi đã viết)`] : [])];
  return { ok: !must.length && rest.length <= 1 && !miss.length, fix };
}

export interface LetterSave { runs: number; sent: number; gifts: number; day: number }
export const freshLetterSave = (): LetterSave => ({ runs: 0, sent: 0, gifts: 0, day: 0 });
export function sanitizeLetter(raw: unknown): LetterSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), sent: n(x.sent, 1e8), gifts: n(x.gifts, 1e7), day: n(x.day, 1e6) };
}
export function mergeLetter(a?: LetterSave, b?: LetterSave): LetterSave | undefined {
  if (!a) return b; if (!b) return a;
  return { runs: Math.max(a.runs, b.runs), sent: Math.max(a.sent, b.sent), gifts: Math.max(a.gifts, b.gifts), day: Math.max(a.day, b.day) };
}

export interface LetterRun {
  floor: number; seed: number; t: WTask; who: [string, string]; text: string; ideas: boolean[]; sends: number;
  phase: 'write' | 'reply' | 'rate' | 'done';
  res: { ok: boolean; fix: string[]; n: number; checks: Array<[boolean, string]>; hints: Array<{ m: string; why: string; snip: string }> } | null;
  self: number[]; gift: string | null;
}

export function viewLetter(c: ECtx, r: LetterRun, rub: { crit: Array<[string, string]>; levels: string[]; ok: number } | null, gifts: number): string {
  const esc = c.host.esc, t = r.t, [ico, name] = r.who;
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">✉️ Thư gửi cư dân phố · ${esc(t.genre)}</span><span>${GIFTS.slice(0, Math.min(gifts, 8)).join('') || '🏘️'}</span></div></section>`;
  const letter = `<div class="ltcard"><p class="ltfrom">${ico} <b>${esc(name)}</b> nhờ bạn:</p><p>${esc(t.pv)}</p><p class="hint" lang="en">${esc(t.p)}</p><p class="hint">${t.min}–${t.max} từ${t.par > 1 ? ` · ≥ ${t.par} đoạn (cách đoạn bằng một dòng trống)` : ''}</p></div>`;
  if (r.phase === 'write') {
    const ideas = t.c.map((x, i) => `<label class="ltidea"><input type="checkbox" name="c${i}" ${r.ideas[i] ? 'checked' : ''}> ${esc(x)}</label>`).join('');
    const phr = t.u.map(([e, v]) => `<span class="pill" title="${esc(v)}"><span lang="en">${esc(e)}</span> · ${esc(v)}</span>`).join(' ');
    return `${head}${letter}
      <form class="stack" data-eform="ltsend"><textarea class="field" name="t" rows="8" lang="en" spellcheck="false" aria-label="Thư của bạn" placeholder="Viết thư bằng tiếng Anh…">${esc(r.text)}</textarea>
      <p class="hint ltphr">Cụm gợi ý: ${phr}</p>
      <fieldset class="stack" style="gap:4px;border:0;padding:0"><legend class="hint">Thư cần có (tick khi đã viết):</legend>${ideas}</fieldset>
      <div class="row"><button class="btn primary">✉️ Gửi thư</button></div></form>`;
  }
  const res = r.res!;
  const checks = `<ul class="ltchk">${res.checks.map(([ok, l]) => `<li class="${ok ? 'ok' : 'no'}">${ok ? '✓' : '✗'} ${esc(l)}</li>`).join('')}</ul>${res.hints.length ? `<div class="stack" style="gap:4px"><p class="hint">Lỗi hay gặp máy dò được:</p>${res.hints.map(h => `<p class="hint">• <span lang="en">${esc(h.snip)}</span> — ${esc(h.why)}</p>`).join('')}</div>` : ''}`;
  if (r.phase === 'reply') {
    const body = res.ok
      ? `<div class="fb good ltreply" role="status"><strong>💌 ${ico} ${esc(name)} hồi âm: “Cảm ơn bạn nhiều! Thư rất rõ ràng.”</strong><span>Quà cho phố: ${r.gift ?? ''}</span></div>`
      : `<div class="fb neutral ltreply" role="status"><strong>💌 ${ico} ${esc(name)} hồi âm: “Mình chưa hiểu hết, bạn viết thêm giúp nhé:”</strong>${res.fix.map(f => `<span>• ${esc(f)}</span>`).join('')}<span class="hint">Sửa rồi gửi lại, không mất gì.</span></div>`;
    return `${head}${body}<details ${res.ok ? '' : 'open'}><summary>Máy kiểm thư (${res.n} từ)</summary>${checks}</details>
      <div class="row">${res.ok ? '<button class="btn primary" data-e="ltrate">Tự chấm & cất thư ▸</button>' : '<button class="btn primary" data-e="ltedit">✏️ Sửa thư</button>'}</div>`;
  }
  if (r.phase === 'rate' && rub) {
    const rows = rub.crit.map(([k, d], i) => `<div class="stack" style="gap:4px"><b>${esc(k)}</b><span class="hint">${esc(d)}</span><div class="row" style="gap:6px">${rub.levels.map((l, j) => `<button class="btn small ${r.self[i] === j + 1 ? 'primary' : ''}" data-e="ltrub" data-i="${i}" data-v="${j + 1}" aria-pressed="${r.self[i] === j + 1}">${esc(l)}</button>`).join('')}</div></div>`).join('');
    const all = rub.crit.every((_, i) => r.self[i]);
    return `${head}<section class="stack"><h2>Tự chấm thư của bạn</h2><p class="hint">Như màn Viết theo đề: mỗi tiêu chí ≥ ${rub.ok} là đạt. Đọc lại thư, so với bài mẫu bên dưới rồi chấm thật lòng.</p>${rows}
      ${t.m[0] ? `<details><summary>Bài mẫu</summary><p lang="en" style="white-space:pre-wrap">${esc(t.m[0])}</p></details>` : ''}</section>
      <div class="row"><button class="btn primary" data-e="ltdone" ${all ? '' : 'disabled'}>📮 Cất thư</button></div>`;
  }
  return '';
}

export function viewLetterEnd(c: ECtx, r: LetterRun, gifts: number): string {
  const esc = c.host.esc, [ico, name] = r.who;
  return `<section class="stack"><span class="eyebrow">✉️ Thư gửi cư dân phố</span><h1>📮 Đã cất thư!</h1>
    <p style="font-size:20px">${ico} ${esc(name)} đã nhận thư · gửi ${r.sends} lần · quà ${r.gift ?? ''}</p>
    <p>Phố của bạn: ${GIFTS.slice(0, Math.min(gifts, 8)).join(' ') || '🏘️'} (${gifts} món quà)</p>
    <p class="hint">Thư được lưu như màn Viết theo đề (tính vào Can-Do viết; giáo viên có thể chấm ở mục Bài viết). Quà chỉ để vui.</p></section>
    <div class="row"><button class="btn primary" data-e="ltstart">✉️ Thư mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
