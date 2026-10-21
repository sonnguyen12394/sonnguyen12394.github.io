// Màn thi chuyển cấp (v111 "trận cổng", gate.ts). Chỉ trình bày. v140: người sáng lập đặt tên "Thi chuyển cấp" (ngoại lệ duy nhất
// của luật không dùng chữ "thi"), thêm Viết + Nói (gatews.ts; v158 vào phán quyết: mỗi bài ≥ GATE.ws) và tự lên cấp khi qua. Trong bài không đáp án, không giờ ép;
// chữa bài sau khi xong.

import type { ECtx } from './views.ts';
import type { Group } from '../exam/content.ts';
import { GATE, GATE_SPEC, GATE_THR, GEN_LV, CES_MIN, gateState, type GateResult, type GateSave, type GateParts } from './gate.ts';
import { bandToCefr } from '../exam/scales.ts';
import type { GwTask, WsOut } from './gatews.ts';

export interface GateRun { goal: string; form: string; groups: Group[]; gi: number; given: Record<string, string | undefined>; plays: number; t0: number; skipL: boolean; res: GateResult | null;
  ws?: { tasks: GwTask[]; i: number; out: WsOut[]; key: string; draft: string; typed?: boolean };   // v140 phần Viết + Nói sau Đọc + Nghe
  up?: string;                                                                          // v140 cấp mới sau khi qua (đã tự lên)
  gen?: { seed: number; ws: GwTask[]; sol: number };                                    // v141 bài sinh theo tiêu chí: hạt, Viết / Nói, số vững lúc làm
  try?: string }   // v141 Thử sức một kỹ năng (voc, gra, pro, lis, spk, rd, wr): cùng màn làm bài, không lưu vào thi chuyển cấp

const LV = (goal: string) => goal.replace('cefr-', '').toUpperCase().replace('PRE-A1', 'Pre-A1');
export const SK_VI: Record<string, string> = { voc: 'Từ vựng', gra: 'Ngữ pháp', pro: 'Phát âm', lis: 'Nghe', spk: 'Nói', rd: 'Đọc', wr: 'Viết' };
// Dòng tiêu đề của bài: Thi chuyển cấp hay Thử sức một kỹ năng.
const head = (r: GateRun): string => (r.try ? `🎲 Thử sức ${SK_VI[r.try] ?? ''} ${LV(r.goal)}` : `🚪 Thi chuyển cấp ${LV(r.goal)}`);
const pc = (x: number) => `${Math.round(x * 100)}%`;

// Một nhóm câu (đọc hoặc nghe) dưới dạng biểu mẫu chọn, dùng chung cho đèn Nghe + Đọc và trận cổng.
export function groupForm(c: ECtx, g: Group, form: string, btn: string, plays: number, skip: string): string {
  const esc = c.host.esc, lis = g.kind === 'listening', opts = (it: Group['items'][number]) => it.opts ?? g.options ?? [];
  const tts = lis && !g.audio?.file && !!g.script;   // v141 nghe sinh từ khuôn: máy đọc lời thoại (hai giọng)
  const src = lis
    ? `<section class="panel stack"><p class="muted">Đọc câu hỏi trước, rồi nghe <b>một lần</b>.${tts ? ' Lời thoại do máy đọc.' : ''}</p>
        ${tts ? (c.host.tts?.() === false ? `<p class="hint">Máy này chưa đọc được tiếng Anh: đọc lời thoại dưới đây thay cho nghe.</p>${(g.script ?? []).filter(l => l.sp !== 'N').map(l => `<p lang="en">${esc(l.sp)}: ${esc(l.t)}</p>`).join('')}` : '') : `<audio id="elaudio" preload="auto" src="${esc(g.audio?.file ?? '')}"></audio>`}
        <div class="row"><button class="btn${plays < 1 ? ' primary' : ''}" data-e="${tts ? 'gttts' : 'lrplay'}"${plays < 1 ? '' : ' disabled'}>${plays < 1 ? '▶ Nghe' : 'Đã nghe'}</button></div>
        ${skip ? `<p class="hint"><button class="linkbtn" data-e="${skip}">Không nghe được lúc này? Bỏ qua phần Nghe</button></p>` : ''}</section>`
    : `<section class="panel stack">${(g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>`;
  return `<h2 lang="en" style="font-size:20px">${esc(g.title)}</h2><p class="muted" lang="en">${esc(g.instr)}</p>${src}
    <form class="panel stack" data-eform="${form}">${g.items.map(it => `<fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b lang="en">${esc(it.q)}</b></legend>
      ${opts(it).map(o => `<label class="chip opt-row"><input type="radio" name="${esc(it.id)}" value="${esc(o.k)}"> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></label>`).join('')}</fieldset>`).join('')}
    <div class="row"><button class="btn primary">${btn}</button></div></form>`;
}

// Cửa vào trận cổng: trạng thái (khoá / mở / đã qua) + vì sao.
export function viewGateHome(c: ECtx, goal: string, vi: string, solid: number, total: number, sv: GateSave | undefined, test = false, today?: number, parts?: GateParts): string {
  const esc = c.host.esc, st = gateState(goal, solid, total, sv, today, parts), lv = LV(goal);
  if (!st.has) return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)}</span><h1>Cấp ${esc(lv)} chưa có bài thi chuyển cấp</h1><p class="muted">Thi chuyển cấp hiện có cho A1 và A2. Cấp này dùng bản đồ năng lực để theo dõi; kết luận đạt sẽ có khi có bài.</p></section>${back()}`;
  const last = st.last ? resultBox(c, st.last) : '';
  if (st.passed) return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)}</span><h1>✓ Bạn đã qua ${esc(lv)}</h1></section>${resultBox(c, st.passed)}${back()}`;
  const open = st.open || (test && st.left.length > 0);
  const why = st.wait ? `Lần trước chưa qua. Mỗi lần là một bài mới hoàn toàn, nhưng cần học thêm rồi mới làm lại: ${waitTxt(st.wait)}.`
    : st.left.length === 0 ? 'Bạn đã dùng hết các bài thi chuyển cấp lạ của cấp này. Tí đang soạn thêm bài mới; trong lúc chờ, cứ luyện tiếp để vững hơn.'
    : open ? `Đã mở. Bài gồm 4 phần: <b>Đọc</b> (biển báo, mẩu tin), <b>Nghe</b> (hội thoại ngắn), <b>Viết</b> (tin nhắn, chuyện ngắn) và <b>Nói</b> (trả lời câu hỏi về bạn), sinh mới mỗi lần hoặc lấy từ kho bài có ghi âm mà bạn chưa làm (phần Đọc, Nghe, Viết, Nói là bài lạ; vài câu từ vựng / ngữ pháp ngắn có thể giống câu bạn từng luyện). Mỗi bài làm một lần, không có đồng hồ, không hiện đáp án trong lúc làm. Đậu khi Đọc + Nghe qua <b>và</b> mỗi bài Viết / Nói đạt ≥ ${pc(GATE.ws)} tiêu chí.`
    : st.parts ? `Mở khi 📘 Học ≥ ${pc(GATE.learn)} (đã qua bài; bạn đang có ${pc(st.learn ?? 0)}) và 🔁 Nhớ ≥ ${pc(GATE.mem)} (nhớ ra sau ≥ ${GATE.memDays} ngày, chưa phai; bạn đang có ${pc(st.mem ?? 0)}).` + (st.gen ? ' Mỗi lần làm, máy sinh một bài mới theo tiêu chí của cấp.' : '') : `Mở khi bạn đã gần xong mục tiêu: ${pc(GATE.open)} kỹ năng của cấp đã vững thật (bạn đang có ${pc(st.ratio)}). ${st.gen ? 'Mỗi lần làm, máy sinh một bài mới theo tiêu chí của cấp, nên không học tủ được.' : `Bài dùng câu lạ, chỉ làm được ${st.left.length} lần, nên chỉ mở khi bạn có khả năng qua.`}`;
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)} · ${esc(vi)}</span><h1>${open ? 'Đã mở' : 'Chưa mở'}</h1>
    <p class="muted">${why}</p></section>
    ${open ? `<div class="row"><button class="btn primary big" data-e="gtstart">▶ Vào thi chuyển cấp</button></div>` : ''}
    ${open && st.mem !== undefined && st.mem < GATE.memTry ? `<p class="fb neutral" role="note"><span>🔁 Nhớ của bạn còn ${pc(st.mem)} (dưới ${pc(GATE.memTry)}): nên <b>🎲 Thử sức</b> từng kỹ năng ở 🎯 Mục tiêu trước, để biết mình đang ở đâu và không tiêu câu chưa gặp.</span></p>` : ''}
    ${last}<p class="hint">Phần Đọc + Nghe ${esc(GATE_SPEC[goal] ?? '')}. Đậu khi Đọc + Nghe có khả năng qua ≥ ${pc(GATE.ready)} <b>và</b> mỗi bài Viết / Nói đạt ≥ ${pc(GATE.ws)} tiêu chí.</p>${back()}`;
}
// v141 làm lại sau khi rớt: còn bao nhiêu ngày, cần vững thêm bao nhiêu phần.
export const waitTxt = (w: { days: number; more: number }): string => [w.days ? `còn ${w.days} ngày` : '', w.more ? `vững thêm ${w.more} phần nữa` : ''].filter(Boolean).join(' và ');
const back = () => '<div class="row"><button class="btn ghost" data-e="go" data-r="quest">Về bản đồ</button></div>';

export function viewGateRun(c: ECtx, r: GateRun): string {
  const g = r.groups[r.gi]!, n = r.groups.length;
  return `<section class="stack"><div class="row"><button class="btn ghost back" data-e="gtpause">✕ Tạm dừng</button></div><span class="eyebrow">${c.host.esc(head(r))} · ${g.kind === 'listening' ? 'Nghe' : 'Đọc'} · phần ${r.gi + 1}/${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ thi chuyển cấp" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${r.gi}"><i style="width:${Math.round((r.gi / n) * 100)}%"></i></div>
    <p class="hint">Không có đáp án trong lúc chơi. Không chắc thì cứ để trống, đừng đoán bừa.</p></section>
    ${groupForm(c, g, 'gtnext', r.gi + 1 < n ? 'Phần tiếp' : r.try ? 'Xong' : 'Xong Đọc + Nghe', r.plays, g.kind === 'listening' ? 'gtskip' : '')}`;
}

// v140 phần Viết / Nói: một bài mỗi màn. Viết: gõ bài. Nói: bấm 🎙 nói, máy chép lời suốt lúc nói tới khi bấm ⏹ Dừng.
// v161 không còn tự đánh dấu ý: máy tìm ý bằng từ khoá (gatews.ts ideaHits). Máy nghe được thì ô lời nói chỉ để xem (chấm theo lời máy chép);
// máy không nghe được thì gõ lại lời đã nói, kết quả ghi "gõ lại". Không chấm ngay, không hiện mẫu trong lúc làm.
export function viewGateWs(c: ECtx, r: GateRun, mic: { has: boolean; busy: boolean; heard: string }): string {
  const esc = c.host.esc, ws = r.ws!, t = ws.tasks[ws.i]!, n = ws.tasks.length, sp = t.kind === 's', lock = sp && mic.has && !ws.typed;
  const draft = sp && mic.heard && !ws.typed ? mic.heard : ws.draft;
  return `<section class="stack"><div class="row"><button class="btn ghost back" data-e="gtpause">✕ Tạm dừng</button></div><span class="eyebrow">${esc(head(r))} · ${sp ? 'Nói' : 'Viết'} · bài ${ws.i + 1}/${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ Viết + Nói" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${ws.i}"><i style="width:${Math.round((ws.i / n) * 100)}%"></i></div></section>
    <section class="panel stack"><h2>${sp ? '🗣️' : '✍️'} ${esc(t.vi)} <span class="hint" lang="en">${esc(t.en)}</span></h2>
      <p lang="en"><b>${esc(t.p)}</b></p><p class="hint">${esc(t.pv)}</p>
      <p class="hint">${sp ? `Nói ít nhất ${t.min} từ.` : `Viết ${t.min}–${t.max} từ.`} Cụm có thể dùng: ${t.u.map(([e]) => `<span lang="en">${esc(e)}</span>`).join(' · ')}</p>
      <p class="hint">Bài cần có đủ các ý: ${t.c.map(x => esc(x)).join(' · ')}. Máy tìm ý trong bài của bạn.</p></section>
    <form class="panel stack" data-eform="gtws">
      ${lock ? `<div class="row">${mic.busy ? '<button type="button" class="btn primary" data-e="gtstop">⏹ Dừng</button>' : `<button type="button" class="btn primary" data-e="gtmic">🎙 ${mic.heard ? 'Nói lại' : 'Nói'}</button>`}</div>
        <p class="hint">Bấm 🎙 rồi trả lời liền mạch; máy chép lời bạn tới khi bấm ⏹ Dừng. Bài chấm theo lời máy chép.</p>
        ${mic.busy ? `<p class="asrlive" id="asrlive" lang="en" aria-live="polite">${esc(mic.heard) || '…'}</p>` : ''}
        <button type="button" class="btn ghost small" data-e="gttype">Máy không nghe được? Gõ lại lời đã nói</button>`
      : sp ? `<p class="hint">${mic.has ? 'Bạn chọn gõ lại: hãy nói to câu trả lời, rồi gõ lại vào ô dưới. Kết quả ghi "gõ lại".' : 'Máy này chưa nghe được giọng nói: hãy nói to câu trả lời, rồi gõ lại vào ô dưới. Kết quả ghi "gõ lại".'}</p>` : ''}
      <label class="stack" style="gap:4px"><b>${sp ? 'Lời bạn đã nói' : 'Bài viết của bạn'}</b><textarea class="field" name="t" rows="${sp ? 5 : 7}" lang="en" spellcheck="false"${lock ? ' readonly' : ''}>${esc(draft)}</textarea></label>
      <div class="row"><button class="btn primary"${lock && mic.busy ? ' disabled' : ''}>${ws.i + 1 < n ? 'Bài tiếp' : 'Nộp bài'}</button></div></form>`;
}

// Phần thấp hơn ngưỡng (đọc / nghe) → gợi ý game luyện đúng kỹ năng đó. Chỉ gợi ý, không tự đổi lộ trình.
const weak = (r: GateResult): string => {
  const thr = GATE_THR[r.goal] ?? 2.75, w = (['R', 'L'] as const).filter(k => r.sk[k] && r.sk[k]!.theta < thr);
  return w.length ? ` Phần còn thấp: ${w.map(k => (k === 'R' ? 'đọc (chơi thêm 🔍 Thám tử)' : 'nghe (chơi thêm 📻 Đài Phố Chữ, ☕ Quán)')).join(', ')}.` : '';
};
// v140 Viết + Nói: % tiêu chí; v158 mỗi bài ≥ GATE.ws mới đậu; v161 ý do máy tìm (✓ / ✗ từng ý).
const wsBox = (r: GateResult): string => {
  const ws = r.ws ?? [], esc = (x: string) => x.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
  if (!ws.length) return '';
  return `<ul class="stack" style="list-style:none;padding:0;margin:0;gap:4px">${ws.map(x => `<li>${x.pct >= GATE.ws ? '✓' : '✗'} ${x.kind === 'w' ? '✍️ Viết' : '🗣️ Nói'}${x.typed ? ' (gõ lại, chưa máy nghe)' : ''}: ${pc(x.pct)} tiêu chí, ${x.words} từ (cần ≥ ${pc(GATE.ws)})${x.ideas ? `<br><span class="hint">Ý: ${x.ideas.map(([vi, ok]) => `${ok ? '✓' : '✗'} ${esc(vi)}`).join(' · ')}</span>` : ''}</li>`).join('')}</ul>
    <p class="hint">Máy chấm theo từ khoá của ý, chưa người thật kiểm.</p>`;
};
// v182 (học thử: kết quả nhiều số kỹ thuật) cách chấm Viết / Nói nằm trong mục "Cách chấm (chi tiết)".
const WS_HOW = '<p class="hint">Viết = một nửa ý máy tìm thấy + một nửa luật (độ dài, từ nối, cụm của bài…). Nói = ý máy tìm thấy trong lời chép + đủ số từ.</p>';
function resultBox(c: ECtx, r: GateResult): string {
  const lv = LV(r.goal), sk = (k: 'R' | 'L', vi: string) => { const s = r.sk[k]; return s ? `<div class="stat"><b>${s.ok}/${s.n}</b><span class="muted">${vi} · ≈ ${bandToCefr(s.theta)}</span></div>` : ''; };
  return `<section class="panel stack gres${r.passed ? ' ok' : ''}"><h3>${r.passed ? `✓ Qua ${lv}` : `Chưa qua ${lv}`}</h3>
    <div class="me-stats me3">${sk('R', 'đọc')}${sk('L', 'nghe')}<div class="stat"><b>${pc(r.p)}</b><span class="muted">khả năng qua</span></div></div>
    ${r.ws?.length ? `<p>${(r.rl ?? r.passed) ? '✓' : '✗'} 📖🎧 Đọc + Nghe: ${(r.rl ?? r.passed) ? 'qua' : 'chưa qua'} (cần khả năng qua ≥ ${pc(GATE.ready)})</p>` : ''}
    <details class="hint"><summary>Cách chấm (chi tiết)</summary><p class="hint">Ước tính năng lực ${String(Math.round(r.lo * 10) / 10).replace('.', ',')}–${String(Math.round(r.hi * 10) / 10).replace('.', ',')} trên thang của app (80% tin cậy); ngưỡng ${lv} là ${String(GATE_THR[r.goal]).replace('.', ',')}. Độ khó câu là ước tính của người soạn, chưa hiệu chỉnh bằng dữ liệu nhiều người.</p>${r.ws?.length ? WS_HOW : ''}</details>
    ${wsBox(r)}
    ${r.passed ? '' : `<p class="muted">Không sao: bài mở lại khi bạn vững hơn, với một bài mới hoàn toàn.${weak(r)}</p>`}</section>`;
}

// Kết quả + chữa bài (sau khi xong trận mới hiện đáp án).
export function viewGateEnd(c: ECtx, r: GateRun): string {
  const esc = c.host.esc, res = r.res!;
  if (r.try) return viewTryEnd(c, r);
  const review = r.groups.map(g => g.items.map(it => {
    const given = r.given[it.id], ok = given === it.ans, o = (it.opts ?? g.options ?? []).find(x => x.k === it.ans);
    return `<li><span class="pill${ok ? ' good' : ''}">${ok ? '✓' : given ? '✕' : '–'}</span> <b lang="en">${esc(it.q)}</b> → <span lang="en">${esc(o?.t ?? String(it.ans))}</span><br><span class="hint">${esc(it.why)} · mã câu ${esc(it.id)}</span></li>`;
  }).join('')).join('');
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(LV(r.goal))}</span><h1>${res.passed ? (r.up ? `🎉 Lên cấp ${esc(LV(r.up))}!` : `🎉 Qua ${esc(LV(r.goal))}!`) : 'Đã làm xong bài'}</h1>${res.passed && r.up ? `<p class="muted">Bạn đã qua ${esc(LV(r.goal))}. Đích mới của bạn là ${esc(LV(r.up))}: 🎯 Mục tiêu đã chuyển sang cấp mới.</p>` : ''}</section>
    ${resultBox(c, res)}
    ${r.skipL ? '<p class="fb neutral" role="note"><span>Bạn bỏ qua phần Nghe nên <b>chưa kết luận</b> (không tính là rớt, không phải chờ). Thi chuyển cấp cần đủ Đọc, Nghe, Viết, Nói: lần sau vào lại khi nghe được (sẽ là bài mới).</span></p>' : ''}
    <details class="panel"><summary>Xem chữa bài Đọc + Nghe từng câu</summary><ul class="stack" style="list-style:none;padding:0;margin:8px 0 0;gap:8px">${review}</ul></details>
    <div class="row"><button class="btn primary" data-e="go" data-r="aim">🎯 Xem mục tiêu${r.up ? ` ${esc(LV(r.up))}` : ''}</button><button class="btn ghost" data-e="go" data-r="quest">⚔️ Về sảnh</button></div>`;
}

// v141 kết quả Thử sức: đúng x/y (hoặc % tiêu chí Viết / Nói), không phải kết luận; làm lại là bài mới; học tiếp ở app.
function viewTryEnd(c: ECtx, r: GateRun): string {
  const esc = c.host.esc, res = r.res!, sk = r.try!, pct = res.n ? Math.round((res.ok / res.n) * 100) : 0;
  const ws = res.ws?.length ? `<p>${res.ws.map(w => `${w.kind === 'w' ? '✍️ Viết' : '🗣️ Nói'}: ${pc(w.pct)} tiêu chí, ${w.words} từ`).join(' · ')} <span class="hint">(chấm bằng luật + ý máy tìm, tham khảo)</span></p>` : '';
  const review = r.groups.map(g => g.items.map(it => {
    const given = r.given[it.id], ok = given === it.ans, o = (it.opts ?? g.options ?? []).find(x => x.k === it.ans);
    return `<li><span class="pill${ok ? ' good' : ''}">${ok ? '✓' : given ? '✕' : '–'}</span> <b lang="en">${esc(it.q)}</b> → <span lang="en">${esc(o?.t ?? String(it.ans))}</span><br><span class="hint">${esc(it.why)}</span></li>`;
  }).join('')).join('');
  return `<section class="stack"><span class="eyebrow">${esc(head(r))}</span><h1>${res.n ? `Đúng ${res.ok}/${res.n} (${pct}%)` : 'Đã làm xong'}</h1>
    <p class="muted">Thử sức chỉ cho bạn biết đang ở đâu, không tính vào mức thuộc. Làm lại là một bài mới.</p></section>
    ${ws}${review ? `<details class="panel"><summary>Xem chữa bài từng câu</summary><ul class="stack" style="list-style:none;padding:0;margin:8px 0 0;gap:8px">${review}</ul></details>` : ''}
    <div class="row"><button class="btn primary" data-e="trystart" data-sk="${esc(sk)}" data-lv="${esc(LV(r.goal))}">🎲 Thử bài mới</button><button class="btn" data-act="skgo" data-sk="${esc(sk)}">📘 Học ${esc(SK_VI[sk] ?? '')} ở app</button><button class="btn ghost" data-e="go" data-r="aim">🎯 Về mục tiêu</button></div>`;
}

// Chứng chỉ (tuỳ chọn ở hồ sơ, SPEC "Đề sát hạch", neo ngoài): chỉ người bật mới thấy. Nhập điểm đề mẫu chính thức / thi thật theo
// thang Cambridge; app ghi kèm khả năng qua nó đã dự đoán trước đó, rồi cho xem app đoán đúng hay sai.
const rvBtn = (esc: (s: unknown) => string, goal: string): string => (GEN_LV[goal] ? `<div class="row"><button class="btn small ghost" data-e="gtrev" data-g="${esc(goal)}">🔍 Soát câu Thi chuyển cấp (người soát)</button></div>` : '');
export function viewCert(c: ECtx, goal: string, sv: GateSave | undefined): string {
  const esc = c.host.esc, min = CES_MIN[goal], lv = LV(goal);
  // v158 luôn hiện (trước phải bật "thi lấy chứng chỉ"): đây là cách duy nhất để biết app đo đúng cấp hay không.
  if (!min) return `<section class="panel stack"><h3>🎓 So với bài mẫu Cambridge</h3><p class="muted">Cấp ${esc(lv)} chưa có bài Cambridge cho người lớn, nên chưa có điểm ngoài để đối chiếu. Kết luận dựa vào Thi chuyển cấp của app.</p>${rvBtn(esc, goal)}</section>`;
  const ext = (sv?.ext ?? []).filter(x => x.goal === goal);
  // Tỉ lệ đúng gần nhất trong app theo kỹ năng: Thi chuyển cấp (sk R / L), không có thì Thử sức (rd / lis) cùng cấp.
  const done = Object.values(sv?.done ?? {}).filter(r => r.goal === goal).sort((a, b) => a.day - b.day).at(-1);
  const tries = (sv?.tries ?? []).filter(t => t.lv === lv);
  const app = (k: 'R' | 'L'): { ok: number; n: number; src: string } | null => {
    const s = done?.sk[k]; if (s && s.n) return { ok: s.ok, n: s.n, src: 'Thi chuyển cấp' };
    const t = tries.filter(x => x.sk === (k === 'R' ? 'rd' : 'lis') && x.n).at(-1); return t ? { ok: t.ok, n: t.n, src: 'Thử sức' } : null;
  };
  const cmp = (vi: string, raw: number | undefined, of: number, a: ReturnType<typeof app>) => {
    if (raw === undefined) return '';
    const p = raw / of, d = a ? Math.round((a.ok / a.n - p) * 100) : null;
    return `<br>${vi}: bài mẫu <b>${raw}/${of}</b> (${pc(p)})${a ? ` · app ${a.ok}/${a.n} (${pc(a.ok / a.n)}, ${a.src}) · lệch ${d! > 0 ? '+' : ''}${d} điểm %` : ' · app chưa có số để so (làm 🎲 Thử sức hoặc Thi chuyển cấp)'}`;
  };
  const rows = ext.map(x => `<li><b>${x.src === 'real' ? 'Thi thật' : 'Bài mẫu chính thức'}</b>${x.score ? `: ${x.score} điểm thang Cambridge (${x.pass ? `đạt ${esc(lv)}` : `chưa đạt ${esc(lv)}`}) · app đã đoán khả năng qua ${x.pred === null ? 'chưa có' : pc(x.pred)}${x.pred === null ? '' : (x.pred >= GATE.ready) === x.pass ? ' → app đoán đúng' : ' → app đoán sai'}` : ''}${cmp('📖 Đọc', x.rr, 30, app('R'))}${cmp('🎧 Nghe', x.lr, 25, app('L'))}</li>`).join('');
  const num = (name: string, label: string, max: number) => `<label class="stack" style="gap:2px"><span class="hint">${label}</span><input class="field" name="${name}" type="number" inputmode="numeric" min="0" max="${max}" style="width:6em"></label>`;
  return `<section class="panel stack" aria-label="So với bài mẫu Cambridge"><h3>🎓 So với bài mẫu Cambridge ${esc(lv)}</h3>
    <p class="muted">Cách duy nhất để biết app đo đúng cấp: tự làm một bài mẫu chính thức của Cambridge A2 Key ở ngoài app (đúng giờ, không tra cứu; tải ở trang <a href="https://www.cambridgeenglish.org/exams-and-tests/qualifications/key/" target="_blank" rel="noopener">cambridgeenglish.org</a>), tự chấm theo đáp án kèm theo, rồi ghi số câu đúng vào đây. App so với kết quả Đọc / Nghe của bạn trong app.</p>
    ${rows ? `<ul class="stack" style="gap:6px">${rows}</ul>` : ''}
    <form class="row" data-eform="certscore" data-g="${esc(goal)}" style="gap:6px;flex-wrap:wrap">${num('rr', 'Đọc đúng / 30', 30)}${num('lr', 'Nghe đúng / 25', 25)}
      <label class="stack" style="gap:2px"><span class="hint">Điểm thang Cambridge (nếu có)</span><input class="field" name="score" type="number" inputmode="numeric" min="80" max="230" style="width:7em"></label>
      <label class="stack" style="gap:2px"><span class="hint">Nguồn</span><select class="field" name="src"><option value="sample">Bài mẫu chính thức</option><option value="real">Thi thật</option></select></label>
      <button class="btn small" style="align-self:flex-end">Ghi</button></form>
    <p class="hint">Đạt ${esc(lv)} từ ${min} điểm thang Cambridge. Đừng mở bài mẫu ở trong app, để nó luôn là bài lạ với bạn.</p>
    ${rvBtn(esc, goal)}</section>`;
}

// v158 Soát câu Thi chuyển cấp (người soát, người sáng lập 17/10/2026). Mỗi lần mở là một bài mẫu sinh như bài thật (cùng khuôn, cùng
// ngân hàng): thấy bài đọc / lời thoại, câu hỏi, đáp án, lời giải; đánh dấu ✓ ổn / ✗ có lỗi kèm ghi chú. Câu có sẵn bị đánh dấu lỗi
// không bao giờ ra nữa (revBad); câu từ khuôn được ghi lại kèm bản chụp để người soạn sửa khuôn.
export interface GateRevRun { goal: string; seed: number; groups: Group[]; ws: GwTask[]; bank: ReadonlySet<string> }
export function viewGateRev(c: ECtx, r: GateRevRun, sv: GateSave | undefined): string {
  const esc = c.host.esc, rev = sv?.rev ?? {}, all = Object.values(rev), bad = all.filter(x => !x.ok).length;
  const mark = (id: string) => { const x = rev[id]; return `<div class="row" style="gap:6px;align-items:flex-end">${x ? `<span class="pill${x.ok ? ' good' : ''}">${x.ok ? '✓ Ổn' : '✗ Có lỗi'}</span>` : ''}
      <label class="stack" style="gap:2px;flex:1 1 160px"><span class="hint">Ghi chú (nếu có lỗi)</span><input class="field" id="rvn-${esc(id)}" value="${esc(x?.note ?? '')}" maxlength="300"></label>
      <button class="btn small" data-e="gtrevmark" data-id="${esc(id)}" data-v="ok">✓ Ổn</button><button class="btn small" data-e="gtrevmark" data-id="${esc(id)}" data-v="bad">✗ Có lỗi</button></div>`; };
  const groups = r.groups.map(g => {
    const src = g.kind === 'listening' ? (g.script ?? []).filter(l => l.sp !== 'N').map(l => `<p lang="en">${esc(l.sp)}: ${esc(l.t)}</p>`).join('') || '<p class="hint">(giọng thu sẵn, không có lời thoại)</p>'
      : (g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('');
    const items = g.items.map(it => { const o = it.opts ?? g.options ?? [];
      return `<li class="stack" style="gap:6px"><b lang="en">${esc(it.q)}</b><ul style="margin:0">${o.map(x => `<li lang="en">${x.k === it.ans ? '<b>✓ ' : ''}${esc(x.k)}. ${esc(x.t)}${x.k === it.ans ? '</b>' : ''}</li>`).join('')}</ul>
        <span class="hint">${esc(it.why ?? '')} · ${r.bank.has(it.id) ? 'câu có sẵn' : 'câu từ khuôn'} · mã ${esc(it.id)}</span>${mark(it.id)}</li>`; }).join('');
    return `<section class="panel stack"><h3>${g.kind === 'listening' ? '🎧 Nghe' : '📖 Đọc'} · <span lang="en">${esc(g.title)}</span></h3><p class="hint" lang="en">${esc(g.instr)}</p>${src}<ol class="stack" style="gap:12px;padding-left:18px">${items}</ol></section>`;
  }).join('');
  const ws = r.ws.map(t => `<section class="panel stack"><h3>${t.kind === 's' ? '🗣️ Nói' : '✍️ Viết'} · ${esc(t.vi)}</h3><p lang="en">${esc(t.p)}</p><p class="hint">${esc(t.pv)} · Ý phải có: ${t.c.map(esc).join(' · ')} · ${t.kind === 's' ? `nói ≥ ${t.min} từ` : `${t.min}–${t.max} từ`} · mã ${esc(t.id)}</p>${mark(t.id)}</section>`).join('');
  return `<section class="stack"><span class="eyebrow">🔍 Soát câu Thi chuyển cấp ${esc(LV(r.goal))}</span><h1>Soát câu</h1>
    <p class="muted">Đây là một bài mẫu sinh giống hệt bài thật (có hiện đáp án). Xem từng câu: đáp án có đúng không, có hai đáp án đúng không, câu có quá dễ đoán không, tiếng Anh có tự nhiên không. Câu có sẵn bị đánh dấu lỗi sẽ không ra nữa; câu từ khuôn được ghi lại để sửa khuôn. Người soát không nên làm Thi chuyển cấp của cấp này sau đó (đã thấy đáp án).</p>
    <p><b>Đã soát ${all.length} câu</b>, ${bad} câu có lỗi.</p>
    <div class="row" style="gap:6px"><button class="btn" data-e="gtrevnew">🎲 Bài mẫu khác</button>${bad ? '<button class="btn" data-e="gtrevcopy">📋 Sao chép danh sách lỗi</button>' : ''}<button class="btn ghost" data-e="go" data-r="aim">🎯 Về mục tiêu</button></div></section>
    ${groups}${ws}`;
}
