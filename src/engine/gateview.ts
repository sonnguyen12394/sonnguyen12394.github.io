// Màn trận cổng cuối khu (v111, gate.ts). Chỉ trình bày. Lời của truyện: cổng khu, không dùng chữ thi / đề / kiểm tra (luật 1 của
// "Game hoá mọi chức năng"); trong trận không đáp án, không giờ ép (luật 2); chữa bài sau khi xong.

import type { ECtx } from './views.ts';
import type { Group } from '../exam/content.ts';
import { GATE, GATE_SPEC, GATE_THR, CES_MIN, gateState, type GateResult, type GateSave } from './gate.ts';
import { bandToCefr } from '../exam/scales.ts';

export interface GateRun { goal: string; form: string; groups: Group[]; gi: number; given: Record<string, string | undefined>; plays: number; t0: number; skipL: boolean; res: GateResult | null }

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
  if (!st.has) return `<section class="stack"><span class="eyebrow">🚪 Cổng khu ${esc(lv)}</span><h1>Cổng khu ${esc(lv)} chưa xây</h1><p class="muted">Trận cổng hiện có cho khu A1 và A2. Khu này dùng bản đồ năng lực để theo dõi; kết luận đạt sẽ có khi cổng được xây.</p></section>${back()}`;
  const last = st.last ? resultBox(c, st.last) : '';
  if (st.passed) return `<section class="stack"><span class="eyebrow">🚪 Cổng khu ${esc(lv)}</span><h1>✓ Bạn đã qua cổng khu ${esc(lv)}</h1></section>${resultBox(c, st.passed)}${back()}`;
  const open = st.open || (test && st.left.length > 0);
  const why = st.left.length === 0 ? 'Bạn đã dùng hết các trận cổng lạ của khu này. Tí đang xây thêm trận mới; trong lúc chờ, cứ luyện tiếp để vững hơn.'
    : open ? `Cổng đã mở. Trận gồm vài biển báo, mẩu tin để đọc và vài đoạn hội thoại để nghe, toàn câu bạn <b>chưa gặp bao giờ</b>. Mỗi trận chỉ chơi một lần, không có đồng hồ, không hiện đáp án trong lúc chơi.`
    : `Cổng mở khi bản đồ báo bạn đã gần đủ: ${pc(GATE.open)} kỹ năng của khu đã vững thật (bạn đang có ${pc(st.ratio)}). Trận cổng dùng câu lạ, chỉ chơi được ${st.left.length} lần, nên Tí chỉ mở khi bạn có khả năng qua.`;
  return `<section class="stack"><span class="eyebrow">🚪 Cổng khu ${esc(lv)} · ${esc(vi)}</span><h1>${open ? 'Cổng đã mở' : 'Cổng còn khoá'}</h1>
    <p class="muted">${why}</p></section>
    ${open ? `<div class="row"><button class="btn primary big" data-e="gtstart">▶ Vào trận cổng</button></div>` : ''}
    ${last}<p class="hint">Trận ${esc(GATE_SPEC[goal] ?? '')}. Đậu khi khả năng qua ≥ ${pc(GATE.ready)}.</p>${back()}`;
}
const back = () => '<div class="row"><button class="btn ghost" data-e="go" data-r="quest">Về sảnh chơi</button></div>';

export function viewGateRun(c: ECtx, r: GateRun): string {
  const g = r.groups[r.gi]!, n = r.groups.length;
  return `<section class="stack"><span class="eyebrow">🚪 Trận cổng khu ${c.host.esc(LV(r.goal))} · chặng ${r.gi + 1}/${n}</span>
    <div class="bar" role="progressbar" aria-label="Trận cổng" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${r.gi}"><i style="width:${Math.round((r.gi / n) * 100)}%"></i></div>
    <p class="hint">Không có đáp án trong lúc chơi. Không chắc thì cứ để trống, đừng đoán bừa.</p></section>
    ${groupForm(c, g, 'gtnext', r.gi + 1 < n ? 'Chặng tiếp' : 'Xong trận', r.plays, g.kind === 'listening' ? 'gtskip' : '')}`;
}

// Phần thấp hơn ngưỡng (đọc / nghe) → gợi ý game luyện đúng kỹ năng đó. Chỉ gợi ý, không tự đổi lộ trình.
const weak = (r: GateResult): string => {
  const thr = GATE_THR[r.goal] ?? 2.75, w = (['R', 'L'] as const).filter(k => r.sk[k] && r.sk[k]!.theta < thr);
  return w.length ? ` Phần còn thấp: ${w.map(k => (k === 'R' ? 'đọc (chơi thêm 🔍 Thám tử)' : 'nghe (chơi thêm 📻 Đài phát thanh, ☕ Quán)')).join(', ')}.` : '';
};
function resultBox(c: ECtx, r: GateResult): string {
  const lv = LV(r.goal), sk = (k: 'R' | 'L', vi: string) => { const s = r.sk[k]; return s ? `<div class="stat"><b>${s.ok}/${s.n}</b><span class="muted">${vi} · ≈ ${bandToCefr(s.theta)}</span></div>` : ''; };
  return `<section class="panel stack gres${r.passed ? ' ok' : ''}"><h3>${r.passed ? `✓ Qua cổng khu ${lv}` : `Chưa qua cổng khu ${lv}`}</h3>
    <div class="me-stats me3">${sk('R', 'đọc')}${sk('L', 'nghe')}<div class="stat"><b>${pc(r.p)}</b><span class="muted">khả năng qua</span></div></div>
    <p class="hint">Ước tính năng lực ${String(Math.round(r.lo * 10) / 10).replace('.', ',')}–${String(Math.round(r.hi * 10) / 10).replace('.', ',')} trên thang của app (80% tin cậy); ngưỡng khu ${lv} là ${String(GATE_THR[r.goal]).replace('.', ',')}. Độ khó câu là ước tính của người soạn, chưa hiệu chỉnh bằng dữ liệu nhiều người.</p>
    ${r.passed ? '' : `<p class="muted">Không sao: cổng mở lại khi bạn vững hơn, với một trận mới hoàn toàn.${weak(r)}</p>`}</section>`;
}

// Kết quả + chữa bài (sau khi xong trận mới hiện đáp án).
export function viewGateEnd(c: ECtx, r: GateRun): string {
  const esc = c.host.esc, res = r.res!;
  const review = r.groups.map(g => g.items.map(it => {
    const given = r.given[it.id], ok = given === it.ans, o = (it.opts ?? g.options ?? []).find(x => x.k === it.ans);
    return `<li><span class="pill${ok ? ' good' : ''}">${ok ? '✓' : given ? '✕' : '–'}</span> <b lang="en">${esc(it.q)}</b> → <span lang="en">${esc(o?.t ?? String(it.ans))}</span><br><span class="hint">${esc(it.why)}</span></li>`;
  }).join('')).join('');
  return `<section class="stack"><span class="eyebrow">🚪 Trận cổng khu ${esc(LV(r.goal))}</span><h1>${res.passed ? '🎉 Cổng đã mở!' : 'Trận cổng xong'}</h1></section>
    ${resultBox(c, res)}
    ${r.skipL ? '<p class="hint">Bạn bỏ qua phần Nghe: kết luận chỉ dựa vào phần Đọc.</p>' : ''}
    <details class="panel"><summary>Xem chữa bài từng câu</summary><ul class="stack" style="list-style:none;padding:0;margin:8px 0 0;gap:8px">${review}</ul></details>
    <div class="row"><button class="btn primary" data-e="go" data-r="quest">Về sảnh chơi</button><button class="btn ghost" data-e="go" data-r="goal/${esc(r.goal)}">Xem mục tiêu</button></div>`;
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
