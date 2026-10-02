// Màn đề thi thử (yêu cầu 6.3): danh sách đề → trang đầu đề → làm bài có giờ (Nghe phát một lần, Đọc 60 phút) →
// kết quả từng kỹ năng, phân tích dạng câu hay sai, xem lại từng câu (vì sao đúng, vì sao từng phương án sai, câu chứa đáp án).

import type { Ctx } from '../main.ts';
import type { Group } from '../content.ts';
import { QT } from '../content.ts';
import { IDX, type MockEntry } from '../packs.ts';
import { MOCK_FORMAT, numLabel, type MSkill, type MockScore } from '../mock.ts';
import type { MockRun } from '../state.ts';
import type { Given } from '../score.ts';
import { bandToVstep, vstepToBand } from '../scales.ts';
import { itemInput, feedback } from './items.ts';
import { back, fmt, figure, SKILL_VI, dayVi } from './ui.ts';
import { FLAG_REASONS } from './place.ts';
import { typeCount } from './practice.ts';
import { EXAM_NAME } from './hub.ts';

// Chỉ tiêu số đề theo yêu cầu 6.3, để nói thật tiến độ khi chưa đủ.
export const MOCK_TARGET: Record<string, number> = { 'ielts-ac': 6, 'ielts-gt': 3, vstep: 6 };

export interface MockView {
  t: MockEntry;
  parts: Record<MSkill, Group[][]>;
  num: Record<MSkill, Map<string, [number, number]>>;
}

export const mmss = (ms: number): string => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
// Nghe: thời lượng âm thanh thật + thời gian soát; Đọc: thời gian của đề.
const minutesOf = (t: MockEntry, sk: MSkill): number => sk === 'L' && t.dur ? Math.round((t.dur + (MOCK_FORMAT[t.exam].L.checkSecs ?? 0)) / 60) : MOCK_FORMAT[t.exam][sk].minutes;

export function mocksFor(exam: string): MockEntry[] {
  return (IDX.mocks ?? []).filter(m => m.exam === exam);
}

function lastScore(c: Ctx, id: string, sk: MSkill): { band: number; correct: number; total: number; day: number } | undefined {
  const a = c.x.attempts.filter(q => q.kind === 'mock' && q.id === 'mock-' + id && q.skill === sk).slice(-1)[0];
  return a && { band: a.band, correct: a.correct, total: a.total, day: a.day };
}

const scoreText = (exam: string, band: number): string => exam === 'vstep' ? `${fmt(bandToVstep(band))}/10` : `band ${fmt(band)}`;

export function viewMocks(c: Ctx): string {
  const { x, host } = c, esc = host.esc, exam = x.exam || 'ielts-ac', list = mocksFor(exam), target = MOCK_TARGET[exam] ?? 6;
  const run = x.mockRun, runT = run && (IDX.mocks ?? []).find(m => m.id === run.t);
  const row = (t: MockEntry): string => {
    const l = lastScore(c, t.id, 'L'), r = lastScore(c, t.id, 'R');
    const done = [l && `Nghe ${scoreText(exam, l.band)}`, r && `Đọc ${scoreText(exam, r.band)}`].filter(Boolean).join(' · ');
    return `<li class="spread" style="gap:8px"><span><b>${esc(t.title)}</b><br><span class="hint">Nghe ${t.n.L} câu (~${minutesOf(t, 'L')} phút) · Đọc ${t.n.R} câu (${minutesOf(t, 'R')} phút)${done ? ` · lần gần nhất: ${esc(done)}` : ' · chưa làm'}</span></span>
      <button class="btn small${done ? '' : ' primary'}" data-x="route" data-r="mock/${esc(t.id)}">${done ? 'Xem / làm lại' : 'Vào đề'}</button></li>`;
  };
  return `<section class="stack"><span class="eyebrow">Ôn thi · ${esc(EXAM_NAME[exam])}</span><h1>Đề thi thử đầy đủ</h1>
    <p class="muted">Đúng định dạng đề thật, có tính giờ, chấm theo bảng quy đổi chính thức. Sau mỗi đề: điểm từng kỹ năng, dạng câu bạn hay sai, và giải thích từng câu.</p></section>
  ${runT ? `<section class="panel stack"><p><b>Bạn đang làm dở:</b> ${esc(runT.title)} · ${SKILL_VI[run!.sk]}</p><div class="row"><button class="btn primary" data-x="mockresume">Làm tiếp</button><button class="btn ghost" data-x="mockquit">Bỏ bài đang dở</button></div></section>` : ''}
  <section class="panel stack">${list.length ? `<ul class="sklist">${list.map(row).join('')}</ul>` : '<p class="muted">Đề cho kỳ thi này đang soạn.</p>'}
    <p class="hint">Đã có ${list.length}/${target} đề ${esc(EXAM_NAME[exam])}${list.length < target ? '; các đề còn lại đang soạn và soát' : ''}. Mỗi đề có phần Nghe và Đọc; Viết và Nói của đề thi thử sẽ có ở bản sau (kèm bài mẫu từng band).</p></section>
  ${exam === 'vstep' ? `<section class="panel stack"><h3>Viết và Nói VSTEP</h3><p class="muted">Đề Viết, Nói riêng, tự chấm theo tiêu chí.</p><div class="row"><button class="btn" data-act="vxnew" data-m="w">Thi thử Viết</button><button class="btn" data-act="vxnew" data-m="s">Thi thử Nói</button></div></section>` : ''}
  ${back()}`;
}

export function viewMockIntro(c: Ctx, t: MockEntry | undefined, loading: string, err: string): string {
  const { x, host } = c, esc = host.esc;
  if (!t) return `<section class="stack"><h1>Không có đề này</h1></section>${back('Danh sách đề', 'mocks')}`;
  const f = MOCK_FORMAT[t.exam], other = x.mockRun && x.mockRun.t !== t.id ? x.mockRun : null;
  const isV = t.exam === 'vstep';
  const res = (['L', 'R'] as const).map(sk => { const s = lastScore(c, t.id, sk); return s && x.mockLog[`${t.id}-${sk}`] ? `<li class="spread"><span>${SKILL_VI[sk]}: <b>${scoreText(t.exam, s.band)}</b> (${s.correct}/${s.total} câu, ${dayVi(s.day)})</span><button class="btn small" data-x="route" data-r="mock-res/${esc(t.id)}/${sk}">Xem lại bài</button></li>` : ''; }).join('');
  const busy = !!loading;
  return `<section class="stack"><span class="eyebrow">Đề thi thử · ${esc(EXAM_NAME[t.exam])}</span><h1>${esc(t.title)}</h1></section>
  <section class="panel stack"><ul class="sklist">
    <li><b>Nghe</b>: ${t.n.L} câu, ${isV ? '3 phần (thông báo ngắn, hội thoại, bài nói)' : '4 phần'}, khoảng ${minutesOf(t, 'L')} phút. Âm thanh <b>phát một lần</b>, không tạm dừng, có thời gian đọc câu hỏi như đề thật; nghe xong có ${Math.round((f.L.checkSecs ?? 0) / 60)} phút soát lại.</li>
    <li><b>Đọc</b>: ${t.n.R} câu, ${f.R.minutes} phút. Hết giờ app tự nộp bài.</li>
    <li>Đeo tai nghe, ngồi chỗ yên tĩnh. Bị gián đoạn (tắt máy, đóng app) thì mở lại làm tiếp được.</li>
    <li>Bài đọc, bài nghe do app soạn mới theo định dạng công khai của đề, không lấy từ đề thật. Người, địa danh, nghiên cứu và số liệu trong bài là hư cấu để luyện tập, đừng dùng làm nguồn kiến thức.</li>
    <li>Điểm là <b>ước tính</b> theo bảng quy đổi ${isV ? 'của app (tỉ lệ đúng × 10, Quyết định 729 không công bố bảng theo số câu)' : 'chính thức của IELTS'}, không phải điểm thi thật.</li></ul>
    ${other ? `<p class="warnt" role="alert">Bạn đang làm dở một đề khác. Bắt đầu đề này sẽ bỏ bài đang dở.</p>` : ''}
    ${err ? `<p class="warnt" role="alert">${esc(err)}</p>` : ''}
    ${loading ? `<p class="muted" role="status">${esc(loading)}</p>` : ''}
    <div class="row"><button class="btn primary" data-x="mockstart" data-t="${esc(t.id)}" data-m="both"${busy ? ' disabled' : ''}>Làm cả đề (Nghe rồi Đọc)</button>
      <button class="btn" data-x="mockstart" data-t="${esc(t.id)}" data-m="L"${busy ? ' disabled' : ''}>Chỉ Nghe</button>
      <button class="btn" data-x="mockstart" data-t="${esc(t.id)}" data-m="R"${busy ? ' disabled' : ''}>Chỉ Đọc</button></div>
    <p class="hint">Lần đầu cần mạng để tải đề và âm thanh (khoảng ${Math.max(1, Math.round((t.dur || f.L.minutes * 60) * 4 / 1024))} MB); sau đó làm được khi mất mạng. Không nghe được? Chọn "Chỉ Đọc".</p></section>
  ${res ? `<section class="panel stack"><h3>Bài đã làm</h3><ul class="sklist">${res}</ul></section>` : ''}
  ${back('Danh sách đề', 'mocks')}`;
}

// Một câu trong lúc làm bài: số câu như đề thật, nút đánh dấu để xem lại.
function qHtml(it: Group['items'][number], g: Group, n: string, given: Given, marked: boolean, esc: (s: unknown) => string): string {
  return `<div class="stack" id="q-${esc(it.id)}" style="gap:6px;scroll-margin-top:120px"><div class="spread" style="gap:6px"><span class="pill${marked ? ' warn' : ''}">Câu ${n}</span>
    <button type="button" class="btn small ghost" data-x="mockmark" data-i="${esc(it.id)}" aria-pressed="${marked}">${marked ? '★ Đã đánh dấu' : '☆ Đánh dấu xem lại'}</button></div>${itemInput(it, g, given, esc)}</div>`;
}

function setHead(g: Group, num: Map<string, [number, number]>, esc: (s: unknown) => string): string {
  const first = num.get(g.items[0]!.id), last = num.get(g.items[g.items.length - 1]!.id);
  const opts = g.options && !g.items.some(it => it.opts) ? `<ul class="sklist">${g.options.map(o => `<li><b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></li>`).join('')}</ul>` : '';
  return `<h3>Questions ${first?.[0]}–${last?.[1]}</h3><p class="muted" lang="en">${esc(g.instr)}</p>${figure(g)}${opts}`;
}

// Lưới số câu: đã trả lời / chưa / đánh dấu; bấm để tới câu.
function navGrid(v: MockView, run: MockRun, sk: MSkill, esc: (s: unknown) => string): string {
  const cells = v.parts[sk].flatMap((gs, pi) => gs.flatMap(g => g.items.map(it => {
    const a = run.given[it.id], done = Array.isArray(a) ? a.length > 0 : !!a, mk = run.marked.includes(it.id);
    return `<button type="button" class="btn small${done ? ' primary' : ''}" style="min-width:44px${mk ? ';outline:2px solid var(--warn)' : ''}" data-x="mockgo" data-p="${pi}" data-i="${esc(it.id)}" aria-label="Câu ${numLabel(v.num[sk].get(it.id))}${done ? ', đã trả lời' : ', chưa trả lời'}${mk ? ', đã đánh dấu' : ''}">${numLabel(v.num[sk].get(it.id))}</button>`;
  })));
  return `<details class="panel"><summary>Danh sách câu (${Object.keys(run.given).length} đã trả lời · ${run.marked.length} đánh dấu)</summary><div class="row" style="gap:6px;margin-top:8px">${cells.join('')}</div></details>`;
}

export interface RunUi { view: number; playing: boolean; loadMsg: string; audioErr: string; deadline: number }

export function viewMockRun(c: Ctx, v: MockView, run: MockRun, ui: RunUi): string {
  const esc = c.host.esc, sk = run.sk, parts = v.parts[sk], pi = Math.min(ui.view, parts.length - 1), gs = parts[pi] ?? [];
  const f = MOCK_FORMAT[v.t.exam][sk];
  const tabs = `<div class="row" role="tablist" aria-label="Các phần" style="gap:6px">${parts.map((_, i) => `<button type="button" role="tab" class="btn small${i === pi ? ' primary' : ''}" aria-selected="${i === pi}" data-x="mockview" data-p="${i}">${sk === 'L' ? 'Phần' : v.t.exam === 'vstep' ? 'Bài' : 'Phần'} ${i + 1}${sk === 'L' && i === run.part && run.phase === 'run' ? ' ♪' : ''}</button>`).join('')}</div>`;
  let status: string;
  if (sk === 'L' && run.phase === 'run') {
    status = ui.audioErr ? `<p class="warnt" role="alert">${esc(ui.audioErr)}</p><div class="row"><button class="btn primary" data-x="mockplay">Thử phát lại</button></div>`
      : ui.loadMsg ? `<p class="muted" role="status">${esc(ui.loadMsg)}</p>`
      : ui.playing ? `<p role="status" aria-live="polite">Đang phát <b>Phần ${run.part + 1}/${parts.length}</b>. Âm thanh chạy liền như đề thật; hãy trả lời trong lúc nghe.</p>`
      : `<p>${run.part === 0 && run.pos === 0 ? 'Sẵn sàng. Âm thanh phát <b>một lần</b>, không tạm dừng được.' : `Bạn dừng ở Phần ${run.part + 1}. Bấm để nghe tiếp từ chỗ đã dừng.`}</p><div class="row"><button class="btn primary" data-x="mockplay">▶ ${run.part === 0 && run.pos === 0 ? 'Bắt đầu nghe' : 'Nghe tiếp'}</button></div>`;
  } else status = '';
  const timer = sk === 'R' || run.phase === 'check'
    ? `<span class="pill accent num" role="timer" aria-live="off" aria-label="Thời gian còn lại"><span id="xmtimer">${mmss(ui.deadline - Date.now())}</span></span>` : '';
  const text = gs[0] && gs[0].kind === 'reading'
    ? `<section class="panel stack"><h2 lang="en">${esc(gs[0].title)}</h2>${(gs[0].paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>` : '';
  const form = `<form class="panel stack" data-xform="mocksubmit">${gs.map(g => `<div class="stack">${setHead(g, v.num[sk], esc)}${g.items.map(it => qHtml(it, g, numLabel(v.num[sk].get(it.id)), run.given[it.id], run.marked.includes(it.id), esc)).join('')}</div>`).join('')}
    <div class="row">${pi < parts.length - 1 ? `<button type="button" class="btn" data-x="mockview" data-p="${pi + 1}">Phần tiếp →</button>` : ''}
      ${sk === 'R' || run.phase === 'check' ? `<button class="btn primary">Nộp bài ${SKILL_VI[sk]}</button>` : ''}</div></form>`;
  return `<section class="stack" style="position:sticky;top:var(--toph,0px);z-index:4;background:var(--bg);padding:6px 0"><div class="spread" style="flex-wrap:nowrap;gap:8px"><span class="eyebrow">${esc(v.t.title)} · ${SKILL_VI[sk]}${run.phase === 'check' ? ' · soát lại' : ''}</span>${timer}</div>${tabs}</section>
  ${run.phase === 'check' ? `<p class="muted" role="status">Đã nghe xong. Bạn có ${Math.round((f.checkSecs ?? 0) / 60)} phút soát lại rồi nộp; hết giờ app tự nộp.</p>` : ''}
  ${status}${text}${form}${navGrid(v, run, sk, esc)}
  <div class="row"><button class="btn ghost" data-x="route" data-r="mocks">Tạm rời (giữ bài)</button></div>`;
}

// Kết quả + xem lại. log = câu trả lời đã nộp; s = điểm đã tính lại từ log (đề có thể vừa được sửa).
export function viewMockResult(c: Ctx, v: MockView, sk: MSkill, given: Record<string, Given>, s: MockScore, day: number, rate: number): string {
  const esc = c.host.esc, t = v.t, isV = t.exam === 'vstep';
  const other: MSkill = sk === 'L' ? 'R' : 'L', o = lastScore(c, t.id, other);
  const band = isV ? vstepToBand(s.score) : s.score;
  let combo = '';
  if (o) {
    if (isV) { const mean = (s.score + bandToVstep(o.band)) / 2; combo = `Nghe + Đọc trung bình <b>${fmt(Math.round(mean * 2) / 2)}/10</b>. Bậc VSTEP cần đủ 4 kỹ năng, nên đây chỉ là ước tính 2/4 kỹ năng.`; }
    else combo = `Đề này: Nghe <b>${fmt(sk === 'L' ? band : o.band)}</b>, Đọc <b>${fmt(sk === 'R' ? band : o.band)}</b>. Band tổng IELTS cần đủ 4 kỹ năng (Viết, Nói có ở bản sau).`;
  }
  const typeRows = s.byType.map(r => {
    const q = QT[r.qtype], pct = Math.round((100 * r.got) / r.of), can = typeCount(r.qtype).items > 0;
    return `<tr><td>${esc(q?.vi ?? r.qtype)}</td><td class="num">${r.got}/${r.of}</td><td class="num">${pct}%</td><td>${pct < 100 && can ? `<button class="btn small" data-x="route" data-r="type/${esc(r.qtype)}">Luyện dạng này</button>` : ''}</td></tr>`;
  }).join('');
  const review = v.parts[sk].map((gs, pi) => {
    const g0 = gs[0]!, got = gs.reduce((a, g) => a + g.items.reduce((k, it) => k + (s.marks[it.id]?.got ?? 0), 0), 0), of = gs.reduce((a, g) => a + g.items.reduce((k, it) => k + (s.marks[it.id]?.of ?? 0), 0), 0);
    const src = g0.kind === 'listening'
      ? `<div class="stack">${g0.audio?.file ? `<audio controls preload="none" src="${esc(g0.audio.file)}" data-rate="${rate}"></audio><div class="row" style="gap:6px"><span class="hint">Tốc độ khi nghe lại:</span>${[1, 0.8].map(r => `<button class="btn small${rate === r ? ' primary' : ''}" data-x="mockrate" data-v="${r}" aria-pressed="${rate === r}">${r === 1 ? 'Tốc độ thi' : 'Chậm'}</button>`).join('')}</div>` : ''}
          <p class="hint">Lời thoại và bản dịch (hiện sau khi làm xong):</p>${(g0.script ?? []).map((l, i) => `<p lang="en">${l.sp === 'N' ? `<i>${esc(l.t)}</i>` : `<b>${esc(l.sp)}:</b> ${esc(l.t)}`}${g0.vi?.[i] ? `<br><span class="hint" lang="vi">${esc(g0.vi[i])}</span>` : ''}</p>`).join('')}</div>`
      : `<div class="stack">${(g0.paras ?? []).map((p, i) => `<p lang="en" class="reading">${esc(p)}</p>${g0.vi?.[i] ? `<p class="hint" lang="vi">${esc(g0.vi[i])}</p>` : ''}`).join('')}</div>`;
    return `<details class="panel stack"${pi === 0 ? ' open' : ''}><summary><b>Phần ${pi + 1}</b> · <span lang="en">${esc(g0.title)}</span> · ${got}/${of} đúng</summary>${src}
      ${gs.map(g => `<div class="stack">${setHead(g, v.num[sk], esc)}${g.items.map(it => { const m = s.marks[it.id]!; return `<div class="stack" style="gap:6px"><span class="pill">Câu ${numLabel(v.num[sk].get(it.id))}</span>${itemInput(it, g, given[it.id], esc, true)}${feedback(it, g, given[it.id], m.got, m.of, esc)}
        <div class="row" style="gap:6px"><span class="hint">Báo lỗi:</span>${FLAG_REASONS.map((r, k) => `<button type="button" class="btn small ghost" data-x="mockflag" data-i="${esc(it.id)}" data-r="${k}">${esc(r)}</button>`).join('')}</div></div>`; }).join('')}</div>`).join('')}</details>`;
  }).join('');
  return `<section class="stack"><span class="eyebrow">Kết quả đề thi thử · ${esc(t.title)} · ${dayVi(day)}</span>
    <h1>${SKILL_VI[sk]}: ${isV ? `${fmt(s.score)}/10` : `band ${fmt(s.score)}`}</h1>
    <p class="muted">${s.got}/${s.of} câu đúng${s.adj ? ` (đề này được điều chỉnh ${s.adj > 0 ? '+' : ''}${s.adj} câu theo độ khó thực tế)` : ''}. ${isV ? `Tương đương band IELTS ≈ ${fmt(band)}. Thang 10 = tỉ lệ đúng × 10 (ước tính của app).` : `Theo bảng quy đổi ${s.official ? 'chính thức' : 'của app (ngoài khoảng nguồn công bố)'}; VSTEP ≈ ${fmt(bandToVstep(s.score))}/10.`} Đây là ước tính, không phải điểm thi thật.</p>
    ${combo ? `<p>${combo}</p>` : ''}</section>
  ${sk === 'L' && !lastScore(c, t.id, 'R') ? `<section class="panel stack"><p>Tiếp theo: phần Đọc của đề này (${MOCK_FORMAT[t.exam].R.minutes} phút).</p><div class="row"><button class="btn primary" data-x="mockstart" data-t="${esc(t.id)}" data-m="R">Bắt đầu phần Đọc</button></div></section>` : ''}
  <section class="panel stack"><h3>Dạng câu bạn hay sai</h3><p class="hint">Xếp từ tỉ lệ đúng thấp nhất. Câu sai đã vào sổ lỗi sai để ôn lại đúng lúc.</p>
    <div class="tablewrap"><table style="min-width:0"><thead><tr><th>Dạng câu</th><th>Đúng</th><th>Tỉ lệ</th><th></th></tr></thead><tbody>${typeRows}</tbody></table></div></section>
  <h2>Xem lại từng câu</h2>${review}
  <div class="row"><button class="btn" data-x="route" data-r="mock/${esc(t.id)}">Về đề này</button><button class="btn" data-x="route" data-r="mocks">Danh sách đề</button></div>`;
}
