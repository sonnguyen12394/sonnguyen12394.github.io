// Màn thi chuyển cấp (v111 "trận cổng", gate.ts). Chỉ trình bày. v140: người sáng lập đặt tên "Thi chuyển cấp" (ngoại lệ duy nhất
// của luật không dùng chữ "thi"), thêm Viết + Nói (gatews.ts, tham khảo) và tự lên cấp khi qua. Trong bài không đáp án, không giờ ép;
// chữa bài sau khi xong.

import type { ECtx } from './views.ts';
import type { Group } from '../exam/content.ts';
import { GATE, GATE_SPEC, GATE_THR, CES_MIN, gateState, type GateResult, type GateSave } from './gate.ts';
import { bandToCefr } from '../exam/scales.ts';
import type { GwTask, WsOut } from './gatews.ts';

export interface GateRun { goal: string; form: string; groups: Group[]; gi: number; given: Record<string, string | undefined>; plays: number; t0: number; skipL: boolean; res: GateResult | null;
  ws?: { tasks: GwTask[]; i: number; out: WsOut[]; key: string; draft: string };   // v140 phần Viết + Nói sau Đọc + Nghe
  up?: string }                                                                         // v140 cấp mới sau khi qua (đã tự lên)

const LV = (goal: string) => goal.replace('cefr-', '').toUpperCase().replace('PRE-A1', 'Pre-A1');
const pc = (x: number) => `${Math.round(x * 100)}%`;

// Một nhóm câu (đọc hoặc nghe) dưới dạng biểu mẫu chọn, dùng chung cho đèn Nghe + Đọc và trận cổng.
export function groupForm(c: ECtx, g: Group, form: string, btn: string, plays: number, skip: string): string {
  const esc = c.host.esc, lis = g.kind === 'listening', opts = (it: Group['items'][number]) => it.opts ?? g.options ?? [];
  const src = lis
    ? `<section class="panel stack"><p class="muted">Đọc câu hỏi trước, rồi nghe <b>một lần</b>.</p>
        <audio id="elaudio" preload="auto" src="${esc(g.audio?.file ?? '')}"></audio>
        <div class="row"><button class="btn${plays < 1 ? ' primary' : ''}" data-e="lrplay"${plays < 1 ? '' : ' disabled'}>${plays < 1 ? '▶ Nghe' : 'Đã nghe'}</button></div>
        ${skip ? `<p class="hint"><button class="linkbtn" data-e="${skip}">Không nghe được lúc này? Bỏ qua phần Nghe</button></p>` : ''}</section>`
    : `<section class="panel stack">${(g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>`;
  return `<h2 lang="en" style="font-size:20px">${esc(g.title)}</h2><p class="muted" lang="en">${esc(g.instr)}</p>${src}
    <form class="panel stack" data-eform="${form}">${g.items.map(it => `<fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b lang="en">${esc(it.q)}</b></legend>
      ${opts(it).map(o => `<label class="chip opt-row"><input type="radio" name="${esc(it.id)}" value="${esc(o.k)}"> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></label>`).join('')}</fieldset>`).join('')}
    <div class="row"><button class="btn primary">${btn}</button></div></form>`;
}

// Cửa vào trận cổng: trạng thái (khoá / mở / đã qua) + vì sao.
export function viewGateHome(c: ECtx, goal: string, vi: string, solid: number, total: number, sv: GateSave | undefined, test = false): string {
  const esc = c.host.esc, st = gateState(goal, solid, total, sv), lv = LV(goal);
  if (!st.has) return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)}</span><h1>Cấp ${esc(lv)} chưa có bài thi chuyển cấp</h1><p class="muted">Thi chuyển cấp hiện có cho A1 và A2. Cấp này dùng bản đồ năng lực để theo dõi; kết luận đạt sẽ có khi có bài.</p></section>${back()}`;
  const last = st.last ? resultBox(c, st.last) : '';
  if (st.passed) return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)}</span><h1>✓ Bạn đã qua ${esc(lv)}</h1></section>${resultBox(c, st.passed)}${back()}`;
  const open = st.open || (test && st.left.length > 0);
  const why = st.left.length === 0 ? 'Bạn đã dùng hết các bài thi chuyển cấp lạ của cấp này. Tí đang soạn thêm bài mới; trong lúc chờ, cứ luyện tiếp để vững hơn.'
    : open ? `Đã mở. Bài gồm 4 phần: <b>Đọc</b> (biển báo, mẩu tin), <b>Nghe</b> (hội thoại ngắn), <b>Viết</b> (tin nhắn, chuyện ngắn) và <b>Nói</b> (trả lời câu hỏi về bạn), toàn câu bạn <b>chưa gặp bao giờ</b>. Mỗi bài làm một lần, không có đồng hồ, không hiện đáp án trong lúc làm. Đọc + Nghe quyết định đậu; Viết + Nói để tham khảo.`
    : `Mở khi bạn đã gần xong mục tiêu: ${pc(GATE.open)} kỹ năng của cấp đã vững thật (bạn đang có ${pc(st.ratio)}). Bài dùng câu lạ, chỉ làm được ${st.left.length} lần, nên chỉ mở khi bạn có khả năng qua.`;
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(lv)} · ${esc(vi)}</span><h1>${open ? 'Đã mở' : 'Chưa mở'}</h1>
    <p class="muted">${why}</p></section>
    ${open ? `<div class="row"><button class="btn primary big" data-e="gtstart">▶ Vào thi chuyển cấp</button></div>` : ''}
    ${last}<p class="hint">Phần Đọc + Nghe ${esc(GATE_SPEC[goal] ?? '')}. Đậu khi khả năng qua ≥ ${pc(GATE.ready)}.</p>${back()}`;
}
const back = () => '<div class="row"><button class="btn ghost" data-e="go" data-r="quest">Về bản đồ</button></div>';

export function viewGateRun(c: ECtx, r: GateRun): string {
  const g = r.groups[r.gi]!, n = r.groups.length;
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${c.host.esc(LV(r.goal))} · ${g.kind === 'listening' ? 'Nghe' : 'Đọc'} · phần ${r.gi + 1}/${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ thi chuyển cấp" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${r.gi}"><i style="width:${Math.round((r.gi / n) * 100)}%"></i></div>
    <p class="hint">Không có đáp án trong lúc chơi. Không chắc thì cứ để trống, đừng đoán bừa.</p></section>
    ${groupForm(c, g, 'gtnext', r.gi + 1 < n ? 'Phần tiếp' : 'Xong Đọc + Nghe', r.plays, g.kind === 'listening' ? 'gtskip' : '')}`;
}

// v140 phần Viết / Nói: một bài mỗi màn. Viết: gõ bài. Nói: bấm 🎙 nói (máy nghe được thì chép lời), không thì nói to rồi gõ lại.
// Sau đó tự đánh dấu ý đã có. Không chấm ngay, không hiện mẫu trong lúc làm.
export function viewGateWs(c: ECtx, r: GateRun, mic: { has: boolean; busy: boolean; heard: string }): string {
  const esc = c.host.esc, ws = r.ws!, t = ws.tasks[ws.i]!, n = ws.tasks.length, sp = t.kind === 's';
  const draft = sp && mic.heard ? mic.heard : ws.draft;
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(LV(r.goal))} · ${sp ? 'Nói' : 'Viết'} · bài ${ws.i + 1}/${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ Viết + Nói" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${ws.i}"><i style="width:${Math.round((ws.i / n) * 100)}%"></i></div></section>
    <section class="panel stack"><h2>${sp ? '🗣️' : '✍️'} ${esc(t.vi)} <span class="hint" lang="en">${esc(t.en)}</span></h2>
      <p lang="en"><b>${esc(t.p)}</b></p><p class="hint">${esc(t.pv)}</p>
      <p class="hint">${sp ? `Nói ít nhất ${t.min} từ.` : `Viết ${t.min}–${t.max} từ.`} Cụm có thể dùng: ${t.u.map(([e]) => `<span lang="en">${esc(e)}</span>`).join(' · ')}</p></section>
    <form class="panel stack" data-eform="gtws">
      ${sp ? `<div class="row">${mic.has ? `<button type="button" class="btn${mic.busy ? '' : ' primary'}" data-e="gtmic"${mic.busy ? ' disabled' : ''}>${mic.busy ? '🎙 Đang nghe…' : '🎙 Nói'}</button>` : ''}</div>
        <p class="hint">${mic.has ? 'Bấm 🎙 rồi nói câu trả lời; máy chép lại lời bạn vào ô dưới (sửa được).' : 'Máy này chưa nghe được giọng nói: hãy nói to câu trả lời, rồi gõ lại vào ô dưới.'}</p>` : ''}
      <label class="stack" style="gap:4px"><b>${sp ? 'Lời bạn đã nói' : 'Bài viết của bạn'}</b><textarea class="field" name="t" rows="${sp ? 5 : 7}" lang="en" spellcheck="false">${esc(draft)}</textarea></label>
      <fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b>Bài của bạn đã có những ý này chưa?</b> (tự đánh dấu)</legend>
        ${t.c.map((x, k) => `<label class="chip opt-row"><input type="checkbox" name="c${k}" value="1"> ${esc(x)}</label>`).join('')}</fieldset>
      <div class="row"><button class="btn primary">${ws.i + 1 < n ? 'Bài tiếp' : 'Nộp bài'}</button></div></form>`;
}

// Phần thấp hơn ngưỡng (đọc / nghe) → gợi ý game luyện đúng kỹ năng đó. Chỉ gợi ý, không tự đổi lộ trình.
const weak = (r: GateResult): string => {
  const thr = GATE_THR[r.goal] ?? 2.75, w = (['R', 'L'] as const).filter(k => r.sk[k] && r.sk[k]!.theta < thr);
  return w.length ? ` Phần còn thấp: ${w.map(k => (k === 'R' ? 'đọc (chơi thêm 🔍 Thám tử)' : 'nghe (chơi thêm 📻 Đài Phố Chữ, ☕ Quán)')).join(', ')}.` : '';
};
// v140 Viết + Nói: % tiêu chí (luật + tự đánh dấu), tham khảo.
const wsBox = (r: GateResult): string => {
  const w = (r.ws ?? []).filter(x => x.kind === 'w'), sp = (r.ws ?? []).filter(x => x.kind === 's');
  if (!w.length && !sp.length) return '';
  const avg = (xs: WsOut[]) => pc(xs.reduce((a, x) => a + x.pct, 0) / xs.length);
  return `<p class="hint">${w.length ? `✍️ Viết: ${avg(w)} tiêu chí (${w.map(x => `${x.words} từ`).join(', ')})` : ''}${w.length && sp.length ? ' · ' : ''}${sp.length ? `🗣️ Nói: ${avg(sp)} tiêu chí (${sp.map(x => `${x.words} từ`).join(', ')})` : ''}. Chấm bằng luật và tự đánh dấu: chỉ để tham khảo, không quyết định đậu.</p>`;
};
function resultBox(c: ECtx, r: GateResult): string {
  const lv = LV(r.goal), sk = (k: 'R' | 'L', vi: string) => { const s = r.sk[k]; return s ? `<div class="stat"><b>${s.ok}/${s.n}</b><span class="muted">${vi} · ≈ ${bandToCefr(s.theta)}</span></div>` : ''; };
  return `<section class="panel stack gres${r.passed ? ' ok' : ''}"><h3>${r.passed ? `✓ Qua ${lv}` : `Chưa qua ${lv}`}</h3>
    <div class="me-stats me3">${sk('R', 'đọc')}${sk('L', 'nghe')}<div class="stat"><b>${pc(r.p)}</b><span class="muted">khả năng qua</span></div></div>
    <p class="hint">Ước tính năng lực ${String(Math.round(r.lo * 10) / 10).replace('.', ',')}–${String(Math.round(r.hi * 10) / 10).replace('.', ',')} trên thang của app (80% tin cậy); ngưỡng ${lv} là ${String(GATE_THR[r.goal]).replace('.', ',')}. Độ khó câu là ước tính của người soạn, chưa hiệu chỉnh bằng dữ liệu nhiều người.</p>
    ${wsBox(r)}
    ${r.passed ? '' : `<p class="muted">Không sao: bài mở lại khi bạn vững hơn, với một bài mới hoàn toàn.${weak(r)}</p>`}</section>`;
}

// Kết quả + chữa bài (sau khi xong trận mới hiện đáp án).
export function viewGateEnd(c: ECtx, r: GateRun): string {
  const esc = c.host.esc, res = r.res!;
  const review = r.groups.map(g => g.items.map(it => {
    const given = r.given[it.id], ok = given === it.ans, o = (it.opts ?? g.options ?? []).find(x => x.k === it.ans);
    return `<li><span class="pill${ok ? ' good' : ''}">${ok ? '✓' : given ? '✕' : '–'}</span> <b lang="en">${esc(it.q)}</b> → <span lang="en">${esc(o?.t ?? String(it.ans))}</span><br><span class="hint">${esc(it.why)} · mã câu ${esc(it.id)}</span></li>`;
  }).join('')).join('');
  return `<section class="stack"><span class="eyebrow">🚪 Thi chuyển cấp ${esc(LV(r.goal))}</span><h1>${res.passed ? (r.up ? `🎉 Lên cấp ${esc(LV(r.up))}!` : `🎉 Qua ${esc(LV(r.goal))}!`) : 'Đã làm xong bài'}</h1>${res.passed && r.up ? `<p class="muted">Bạn đã qua ${esc(LV(r.goal))}. Đích mới của bạn là ${esc(LV(r.up))}: 🎯 Mục tiêu đã chuyển sang cấp mới.</p>` : ''}</section>
    ${resultBox(c, res)}
    ${r.skipL ? '<p class="hint">Bạn bỏ qua phần Nghe: kết luận chỉ dựa vào phần Đọc.</p>' : ''}
    <details class="panel"><summary>Xem chữa bài Đọc + Nghe từng câu</summary><ul class="stack" style="list-style:none;padding:0;margin:8px 0 0;gap:8px">${review}</ul></details>
    <div class="row"><button class="btn primary" data-e="go" data-r="aim">🎯 Xem mục tiêu${r.up ? ` ${esc(LV(r.up))}` : ''}</button><button class="btn ghost" data-e="go" data-r="quest">⚔️ Về sảnh</button></div>`;
}

// Chứng chỉ (tuỳ chọn ở hồ sơ, SPEC "Đề sát hạch", neo ngoài): chỉ người bật mới thấy. Nhập điểm đề mẫu chính thức / thi thật theo
// thang Cambridge; app ghi kèm khả năng qua nó đã dự đoán trước đó, rồi cho xem app đoán đúng hay sai.
export function viewCert(c: ECtx, goal: string, sv: GateSave | undefined): string {
  const esc = c.host.esc, min = CES_MIN[goal], lv = LV(goal);
  if (!sv?.cert) return `<section class="panel stack"><h3>🎓 Chứng chỉ (tuỳ chọn)</h3><p class="muted">Chỉ cần nếu bạn muốn thi lấy chứng chỉ. Bật lên thì có chỗ ghi điểm đề mẫu chính thức hoặc điểm thi thật để đối chiếu với dự đoán của app.</p>
    <div class="row"><button class="btn small" data-e="certon">Tôi muốn thi lấy chứng chỉ</button></div></section>`;
  if (!min) return `<section class="panel stack"><h3>🎓 Chứng chỉ</h3><p class="muted">Cấp ${esc(lv)} chưa có kỳ thi cho người lớn theo thang Cambridge, nên app chưa có điểm ngoài để đối chiếu. Kết luận dựa vào trận cổng của app.</p></section>`;
  const ext = (sv.ext ?? []).filter(x => x.goal === goal);
  const rows = ext.map(x => `<li>${x.src === 'real' ? 'Thi thật' : 'Đề mẫu chính thức'}: <b>${x.score}</b> (${x.pass ? `đạt ${esc(lv)}` : `chưa đạt ${esc(lv)}`}) · app đã đoán khả năng qua ${x.pred === null ? 'chưa có (chưa vào trận cổng)' : pc(x.pred)} → ${x.pred === null ? '' : (x.pred >= GATE.ready) === x.pass ? 'app đoán đúng' : 'app đoán sai'}</li>`).join('');
  return `<section class="panel stack"><h3>🎓 Chứng chỉ ${esc(lv)}</h3>
    <p class="muted">Làm một đề mẫu chính thức ở ngoài app (đúng giờ, không tra cứu), hoặc thi thật, rồi ghi điểm theo thang Cambridge English Scale. Đạt ${esc(lv)} từ ${min} điểm. Đừng đưa đề mẫu vào app để nó luôn là đề lạ với bạn.</p>
    ${rows ? `<ul class="stack" style="gap:4px">${rows}</ul>` : ''}
    <form class="row" data-eform="certscore" data-g="${esc(goal)}" style="gap:6px;flex-wrap:wrap"><label class="stack" style="gap:2px"><span class="hint">Điểm</span><input class="field" name="score" type="number" min="80" max="230" required style="width:7em"></label>
      <label class="stack" style="gap:2px"><span class="hint">Nguồn</span><select class="field" name="src"><option value="sample">Đề mẫu chính thức</option><option value="real">Thi thật</option></select></label>
      <button class="btn small" style="align-self:flex-end">Ghi điểm</button></form></section>`;
}
