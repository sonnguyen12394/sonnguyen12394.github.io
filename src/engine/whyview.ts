// Màn "Vì sao?" (spec v2.4 §37, HG30, câu 14 của Ultimate Product Test): giải thích một kết luận bằng chính bằng chứng.
//   why/<nút>       : trạng thái từng mức (số quan sát, ngữ cảnh, dạng câu, mastery, cận dưới, ngưỡng, luật), lịch sử quyết định,
//                     vì sao app chọn nút này làm bước tiếp theo (nếu có), các bằng chứng gần nhất (nguồn, câu, trọng số, mới/trợ giúp).
//   why/goal/<id>   : vì sao chưa đạt / đã đạt mục tiêu, lịch sử Readiness.

import type { ECtx } from './views.ts';
import { loaded, GOALS } from './data.ts';
import { stat } from './mastery.ts';
import { DIM_VI, LEVEL_VI, type Level } from './types.ts';
import { missingOf, readinessOf, xferLine } from './readyview.ts';
import { replay, type Snapshot } from './ev/snapshot.ts';
import type { EvEvent } from './ev/types.ts';
import { misconceptions } from './ev/store.ts';
import { gaps, GAP_VI } from './gap.ts';
import { defaultLevel } from './graph.ts';
import { xferStatus, XFER } from './transfer.ts';
import type { NodeState } from './mastery.ts';

const STATE_VI: Record<NodeState, string> = { unknown: 'chưa có gì', inferred: 'suy ra (chưa có bằng chứng thật)', learning: 'đang học', mastered: '✓ Đạt', verify: 'cần xác minh ở câu mới', reopened: 'mở lại: bằng chứng mới mâu thuẫn' };

const SRC_VI: Record<string, string> = {
  vocab: 'luyện từ vựng', gram: 'luyện ngữ pháp', exam: 'câu đọc/nghe', pa: 'bài Pre-A1', diag: 'bài chẩn đoán', testout: 'kiểm tra bỏ qua',
  perf: 'bài làm thật', game: 'thử thách game', micro: 'bí kíp (micro)', transfer: 'thử thách transfer', legacy: 'tiến độ trước v53',
};
const DEC_VI: Record<string, string> = { 'micro:fixed': 'Bí kíp: đúng hết câu kiểm tra', 'micro:partial': 'Bí kíp: đúng một phần', 'micro:not-yet': 'Bí kíp: chưa nắm', 'transfer:ok': 'Đúng hết ở câu mới', 'transfer:partial': 'Đúng một phần ở câu mới', 'transfer:fail': 'Trượt ở câu mới', PASS: 'Đạt', FAIL: 'Chưa đạt / mất Đạt', READY: 'Sẵn sàng', NOT_READY: 'Chưa sẵn sàng', ACHIEVED: 'Đạt mục tiêu', CHOSEN: 'Chọn làm bước tiếp theo' };
const n2 = (x: number): string => String(Math.round(x * 100) / 100).replace('.', ',');
const iso = (d: number): string => new Date(d * 86400000).toISOString().slice(0, 10);

function snapRow(c: ECtx, s: Snapshot): string {
  const esc = c.host.esc, again = replay(s), ok = again === s.dec || s.kind === 'diag' ? '' : ` <span class="pill warn">tái tạo ra ${esc(again)}</span>`;
  const m = s.m ? ` · mastery ${n2(s.m.mean)}, cận dưới ${n2(s.m.lb)} (cần ${n2(s.thr!.m)} / ${n2(s.thr!.lb)}) · ${n2(s.m.n)} lượt có trọng số, ${s.m.ctx} ngữ cảnh, ${s.m.qt} dạng câu, ${s.m.nov} lượt câu mới` : '';
  const info = s.kind === 'readiness' ? ` · ${s.info?.done ?? ''}${s.info?.total ? `/${s.info.total} năng lực` : ''}` : s.kind === 'testout' || s.dec.startsWith('transfer:') || s.dec.startsWith('micro:') ? ` · đúng ${s.info?.got}/${s.info?.of}` : '';
  return `<li>${iso(s.day)} · <b>${esc(DEC_VI[s.dec] ?? s.dec)}</b>${s.lv ? ` (mức ${s.lv})` : ''}${m}${info} · luật <code>${esc(s.rule)}</code> · ${s.evs.length} bằng chứng${ok}</li>`;
}

function evRow(c: ECtx, x: EvEvent): string {
  const esc = c.host.esc;
  const tags = [x.nov ? 'câu mới' : '', x.asst ? 'có trợ giúp' : '', x.tier >= 2 ? (x.why === 'disagree' ? 'mâu thuẫn kết luận cũ' : x.why === 'flip' ? 'làm đổi kết luận' : x.why === 'boundary' ? 'sát ngưỡng' : x.why === 'transfer' ? 'thử ở câu mới' : 'quan trọng') : ''].filter(Boolean);
  return `<li>${iso(x.day)} · ${x.ok ? '✓ đúng' : '✗ sai'} · mức ${x.lv} · ${esc(SRC_VI[x.src] ?? x.src)}${x.qt ? ` (${esc(x.qt)})` : ''} · trọng số ${n2(x.w)}${x.g ? `, đoán mò ${n2(x.g)}` : ''}${tags.length ? ` · ${esc(tags.join(', '))}` : ''}</li>`;
}

function whyNode(c: ECtx, id: string): string {
  const { host, e } = c, esc = host.esc, ix = loaded()!, n = ix.node.get(id);
  if (!n) return `<p class="muted">Không tìm thấy năng lực này.</p>`;
  const cells = ([1, 2, 3, 4, 5] as Level[]).map(l => ({ l, c: e.m[id]?.[l] })).filter(x => x.c);
  const lvRows = cells.map(({ l, c: cell }) => {
    const s = stat(cell);
    return `<tr><td>${l}. ${esc(LEVEL_VI[l])}</td><td class="num">${n2(s.m)}</td><td class="num">${n2(s.lb)}</td><td class="num">${n2(cell!.n)}</td><td class="num">${cell!.c.length}</td><td class="num">${cell!.q.length}</td><td>${esc(STATE_VI[s.state])}</td></tr>`;
  }).join('');
  const snaps = e.ev.snap.filter(s => s.subj === id && s.kind !== 'nba').slice(-8).reverse();
  const nba = [...e.ev.snap].reverse().find(s => s.kind === 'nba' && s.subj === id);
  const nbaHtml = nba ? `<section class="panel stack"><h3>Vì sao app chọn phần này làm bước tiếp theo</h3>
    <p class="muted">App so các việc có thể làm (học phần mới, ôn, kiểm tra nhanh, xác minh) bằng một điểm lợi ích: giá trị học + giá trị thông tin + mức liên quan mục tiêu + tầm quan trọng tiền đề + nguy cơ quên + transfer, trừ nỗ lực và việc ngắt mạch (spec §57). Chỉ xét phần đã đủ tiền đề cứng.</p>
    <p><b>Phần này:</b> ${esc(String(nba.info?.why ?? ''))}${nba.info?.parts ? `<br><span class="hint">${esc(String(nba.info.parts))}</span>` : ''}</p>
    <ol>${(nba.alt ?? []).map(a => `<li>${esc(a.node === 'review' ? 'Ôn phần sắp quên' : ix.node.get(a.node)?.vi ?? a.node)} · lợi ích ${n2(a.score)}${a.node === id ? ' ← đã chọn' : ''}</li>`).join('')}</ol>
    <p class="hint">Luật <code>${esc(nba.rule)}</code></p></section>` : '';
  const evs = e.ev.led.filter(x => x.node === id).slice(-10).reverse();
  const link = (x: string) => `<button class="linkbtn" data-e="go" data-r="why/${esc(x)}">${esc(ix.node.get(x)?.vi ?? x)}</button>`;
  const know = `<section class="panel stack"><h3>Phần này là gì</h3>
    ${n.scope ? `<p>${esc(n.scope)}</p>` : ''}
    ${n.dims?.length ? `<p class="hint">Thuộc năng lực: ${n.dims.map(d => esc(DIM_VI[d])).join(', ')}${n.evReq ? ` · cần bằng chứng ở mức ${n.evReq.lv.join(', ')}` : ''}</p>` : ''}
    ${n.contrast?.length ? `<p><b>Dễ nhầm với:</b> ${n.contrast.map(link).join(', ')}</p>` : ''}
    ${n.mis?.length ? `<p><b>Lỗi người Việt hay gặp:</b></p><ul>${n.mis.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${n.uses?.length ? `<p class="hint">Dùng trong ${n.uses.length} năng lực làm việc thật, ví dụ: ${n.uses.slice(0, 3).map(link).join(', ')}</p>` : ''}</section>`;
  const mis = misconceptions(e.ev, id);
  const misHtml = mis.length ? `<section class="panel stack"><h3>Có thể đang hiểu sai</h3><p class="muted">Bạn đã trả lời giống nhau nhiều lần mà đều sai, nên đây có thể là một cách hiểu sai hơn là quên:</p><ul>${mis.map(x => `<li lang="en"><b>${esc(x.t)}</b> <span class="hint">· ${n2(x.n)} lần</span></li>`).join('')}</ul></section>` : '';
  const dz = ([1, 2, 3, 4, 5] as Level[]).map(l => e.ev.dis[`${id}|${l}`]).find(x => x?.on);
  const needLv = (Math.max(0, ...e.goals.flatMap(sg => ix.goal.get(sg.id)?.req.filter(r => r.node === id).map(r => r.level) ?? [])) || defaultLevel(n)) as Level;
  const gk = gaps({ m: e.m, ev: e.ev, node: id, need: needLv, blocked: (ix.pre.get(id) ?? []).some(x => x.type === 'hard' && !stat(e.m[x.to]?.[defaultLevel(ix.node.get(x.to)!)]).pass), recall: c.host.recall?.(id) ?? null });
  const gapHtml = gk.length ? `<p><b>Loại lỗ hổng:</b> ${gk.map(k => esc(GAP_VI[k])).join(', ')}</p>` : '';
  const hy = e.ev.hyp[id];
  const hyHtml = hy ? `<p class="warnt">Nguyên nhân đã kiểm chứng: bạn hay sai phần này vì phần nền <button class="linkbtn" data-e="go" data-r="why/${esc(hy.cause)}">${esc(ix.node.get(hy.cause)?.vi ?? hy.cause)}</button> còn hổng (trượt câu dò ngày ${iso(hy.day)}). Lộ trình đưa phần nền lên trước.</p>` : '';
  const xs = xferStatus(e.ev, id), imp = n.imp?.tr ?? 0;
  const xfHtml = xs.tried ? `<p><b>Ở câu mới chưa gặp (transfer):</b> đúng ${xs.ok}, sai ${xs.fail}${xs.ok >= XFER.need ? ' · đã chứng minh dùng được ngoài câu đã luyện' : ''}.</p>`
    : imp >= XFER.minImp ? `<p class="hint">Phần này quan trọng cho transfer: sau khi Đạt, app sẽ thử ở câu mới chưa gặp để chắc là dùng được thật.</p>` : '';
  const dzHtml = dz ? `<p class="warnt">Phần này từng Đạt, nhưng bạn đã sai ${dz.bad} lần ở câu mới chưa gặp: app mở lại và cần ${2 - dz.ok} lần đúng nữa ở câu mới để xác nhận lại (spec §69).</p>` : '';
  return `<section class="stack"><span class="eyebrow">Vì sao?</span><h1>${esc(n.vi)}</h1>
      <p class="muted">Đạt một mức khi mastery ≥ 0,80 và cận dưới khoảng tin cậy 80% ≥ 0,60 (phân vị chính xác, spec §45); mức 4–5 cần thêm ít nhất một lần đúng ở câu mới. Bằng chứng ở mức cao tính cho cả mức thấp hơn. Đúng nhờ gợi ý, làm lại, câu lặp trong 24 giờ hay câu dễ đoán được tính nhẹ hơn; khi bạn đổi hướng (sai sau nhiều lần đúng, hoặc ngược lại), bằng chứng cũ nhẹ dần để app theo kịp.</p></section>
    ${cells.length ? `<div class="tablewrap" tabindex="0" role="region" aria-label="Trạng thái từng mức"><table class="tbl"><thead><tr><th>Mức</th><th>Mastery</th><th>Cận dưới</th><th>Lượt</th><th>Ngữ cảnh</th><th>Dạng câu</th><th>Kết luận</th></tr></thead><tbody>${lvRows}</tbody></table></div>` : '<p class="muted">Chưa có bằng chứng nào cho phần này.</p>'}
    ${gapHtml}${hyHtml}${xfHtml}${dzHtml}${misHtml}${know}${nbaHtml}
    ${snaps.length ? `<section class="stack"><h2>Lịch sử kết luận</h2><ul>${snaps.map(s => snapRow(c, s)).join('')}</ul></section>` : ''}
    ${evs.length ? `<section class="stack"><h2>Bằng chứng gần nhất</h2><ul>${evs.map(x => evRow(c, x)).join('')}</ul><p class="hint">Bằng chứng cũ ít giá trị đã được gộp vào thống kê (vẫn tính trong mastery); bằng chứng quan trọng được giữ.</p></section>` : ''}
    <div class="row"><button class="btn ghost" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost" data-e="go" data-r="goals">Mục tiêu của bạn</button></div>`;
}

function whyGoal(c: ECtx, id: string): string {
  const { host, e } = c, esc = host.esc, g = loaded()!.goal.get(id), meta = GOALS.get(id);
  if (!g || !meta) return `<p class="muted">Không tìm thấy mục tiêu này.</p>`;
  const r = readinessOf(host, e, g), miss = missingOf(host, e, g);
  const snaps = e.ev.snap.filter(s => s.kind === 'readiness' && s.subj === id).slice(-8).reverse();
  const head = r.achieved ? `<h1>Đã đạt: ${esc(meta.vi)}</h1>` : `<h1>Vì sao chưa đạt ${esc(meta.vi)}</h1>`;
  return `<section class="stack"><span class="eyebrow">Vì sao?</span>${head}
      <p class="muted">Đạt mục tiêu CEFR không phải điểm trung bình: mọi năng lực mục tiêu cần phải Đạt với độ tin cậy từ Vừa, mọi bài làm thật phải qua, năng lực quan trọng phải đúng ở câu mới chưa gặp, và 14 ngày không quên khi ôn (spec §60).</p></section>
    ${miss.length ? `<section class="stack"><h2>Còn thiếu ${miss.length} năng lực</h2><ul>${miss.slice(0, 30).map(x => `<li><button class="linkbtn" data-e="go" data-r="why/${esc(x.node)}">${esc(x.vi)}</button> <span class="hint">· cần mức ${x.level} · đang ${Math.round(x.pct * 100)}%</span></li>`).join('')}</ul>${miss.length > 30 ? `<p class="hint">và ${miss.length - 30} năng lực khác.</p>` : ''}</section>` : ''}
    ${r.kind === 'mastery' ? xferLine(host, e, g, r) : ''}
    ${snaps.length ? `<section class="stack"><h2>Lịch sử Readiness</h2><ul>${snaps.map(s => snapRow(c, s)).join('')}</ul></section>` : ''}
    <div class="row"><button class="btn ghost" data-e="go" data-r="goal/${esc(id)}">← ${esc(meta.vi)}</button></div>`;
}

export function viewWhy(c: ECtx): string {
  const rest = c.route.slice('why/'.length);
  return rest.startsWith('goal/') ? whyGoal(c, rest.slice('goal/'.length)) : whyNode(c, rest);
}
