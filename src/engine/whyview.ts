// Màn "Vì sao?" (spec v2.4 §37, HG30, câu 14 của Ultimate Product Test): giải thích một kết luận bằng chính bằng chứng.
//   why/<nút>       : trạng thái từng mức (số quan sát, ngữ cảnh, dạng câu, mastery, cận dưới, ngưỡng, luật), lịch sử quyết định,
//                     vì sao app chọn nút này làm bước tiếp theo (nếu có), các bằng chứng gần nhất (nguồn, câu, trọng số, mới/trợ giúp).
//   why/goal/<id>   : vì sao chưa đạt / đã đạt mục tiêu, lịch sử Readiness.

import type { ECtx } from './views.ts';
import { loaded, GOALS } from './data.ts';
import { stat } from './mastery.ts';
import { LEVEL_VI, type Level } from './types.ts';
import { missingOf, readinessOf } from './readyview.ts';
import { replay, type Snapshot } from './ev/snapshot.ts';
import type { EvEvent } from './ev/types.ts';
import { misconceptions } from './ev/store.ts';
import type { NodeState } from './mastery.ts';

const STATE_VI: Record<NodeState, string> = { unknown: 'chưa có gì', inferred: 'suy ra (chưa có bằng chứng thật)', learning: 'đang học', mastered: '✓ Đạt', verify: 'cần xác minh ở câu mới', reopened: 'mở lại: bằng chứng mới mâu thuẫn' };

const SRC_VI: Record<string, string> = {
  vocab: 'luyện từ vựng', gram: 'luyện ngữ pháp', exam: 'câu đọc/nghe', pa: 'bài Pre-A1', diag: 'bài chẩn đoán', testout: 'kiểm tra bỏ qua',
  perf: 'bài làm thật', game: 'thử thách game', micro: 'bí kíp (micro)', transfer: 'thử thách transfer', legacy: 'tiến độ trước v53',
};
const DEC_VI: Record<string, string> = { PASS: 'Đạt', FAIL: 'Chưa đạt / mất Đạt', READY: 'Sẵn sàng', NOT_READY: 'Chưa sẵn sàng', ACHIEVED: 'Đạt mục tiêu', CHOSEN: 'Chọn làm bước tiếp theo' };
const n2 = (x: number): string => String(Math.round(x * 100) / 100).replace('.', ',');
const iso = (d: number): string => new Date(d * 86400000).toISOString().slice(0, 10);

function snapRow(c: ECtx, s: Snapshot): string {
  const esc = c.host.esc, again = replay(s), ok = again === s.dec || s.kind === 'diag' ? '' : ` <span class="pill warn">tái tạo ra ${esc(again)}</span>`;
  const m = s.m ? ` · mastery ${n2(s.m.mean)}, cận dưới ${n2(s.m.lb)} (cần ${n2(s.thr!.m)} / ${n2(s.thr!.lb)}) · ${n2(s.m.n)} lượt có trọng số, ${s.m.ctx} ngữ cảnh, ${s.m.qt} dạng câu, ${s.m.nov} lượt câu mới` : '';
  const info = s.kind === 'readiness' ? ` · ${s.info?.done ?? ''}${s.info?.total ? `/${s.info.total} năng lực` : ''}` : s.kind === 'testout' ? ` · đúng ${s.info?.got}/${s.info?.of}` : '';
  return `<li>${iso(s.day)} · <b>${esc(DEC_VI[s.dec] ?? s.dec)}</b>${s.lv ? ` (mức ${s.lv})` : ''}${m}${info} · luật <code>${esc(s.rule)}</code> · ${s.evs.length} bằng chứng${ok}</li>`;
}

function evRow(c: ECtx, x: EvEvent): string {
  const esc = c.host.esc;
  const tags = [x.nov ? 'câu mới' : '', x.asst ? 'có trợ giúp' : '', x.tier >= 2 ? (x.why === 'disagree' ? 'mâu thuẫn kết luận cũ' : x.why === 'flip' ? 'làm đổi kết luận' : x.why === 'boundary' ? 'sát ngưỡng' : 'quan trọng') : ''].filter(Boolean);
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
    <p class="muted">Ưu tiên = số năng lực mục tiêu phụ thuộc vào phần này (theo độ mạnh tiền đề, độ gần ngày thi) ÷ phút học ước tính. Chỉ xét phần đã đủ tiền đề cứng.</p>
    <ol>${(nba.alt ?? []).map(a => `<li>${esc(ix.node.get(a.node)?.vi ?? a.node)} · ưu tiên ${n2(a.score)} = ${n2(a.dep)} ÷ ${a.min} phút${a.node === id ? ' ← đã chọn' : ''}</li>`).join('')}</ol>
    <p class="hint">Còn ${nba.info?.unmet}/${nba.info?.total} năng lực chưa đạt · luật <code>${esc(nba.rule)}</code></p></section>` : '';
  const evs = e.ev.led.filter(x => x.node === id).slice(-10).reverse();
  const mis = misconceptions(e.ev, id);
  const misHtml = mis.length ? `<section class="panel stack"><h3>Có thể đang hiểu sai</h3><p class="muted">Bạn đã trả lời giống nhau nhiều lần mà đều sai, nên đây có thể là một cách hiểu sai hơn là quên:</p><ul>${mis.map(x => `<li lang="en"><b>${esc(x.t)}</b> <span class="hint">· ${n2(x.n)} lần</span></li>`).join('')}</ul></section>` : '';
  const dz = ([1, 2, 3, 4, 5] as Level[]).map(l => e.ev.dis[`${id}|${l}`]).find(x => x?.on);
  const dzHtml = dz ? `<p class="warnt">Phần này từng Đạt, nhưng bạn đã sai ${dz.bad} lần ở câu mới chưa gặp: app mở lại và cần ${2 - dz.ok} lần đúng nữa ở câu mới để xác nhận lại (spec §69).</p>` : '';
  return `<section class="stack"><span class="eyebrow">Vì sao?</span><h1>${esc(n.vi)}</h1>
      <p class="muted">Đạt một mức khi mastery ≥ 0,80 và cận dưới khoảng tin cậy 80% ≥ 0,60 (phân vị chính xác, spec §45); mức 4–5 cần thêm ít nhất một lần đúng ở câu mới. Bằng chứng ở mức cao tính cho cả mức thấp hơn. Đúng nhờ gợi ý, làm lại, câu lặp trong 24 giờ hay câu dễ đoán được tính nhẹ hơn; khi bạn đổi hướng (sai sau nhiều lần đúng, hoặc ngược lại), bằng chứng cũ nhẹ dần để app theo kịp.</p></section>
    ${cells.length ? `<div class="tablewrap" tabindex="0" role="region" aria-label="Trạng thái từng mức"><table class="tbl"><thead><tr><th>Mức</th><th>Mastery</th><th>Cận dưới</th><th>Lượt</th><th>Ngữ cảnh</th><th>Dạng câu</th><th>Kết luận</th></tr></thead><tbody>${lvRows}</tbody></table></div>` : '<p class="muted">Chưa có bằng chứng nào cho phần này.</p>'}
    ${dzHtml}${misHtml}${nbaHtml}
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
      <p class="muted">Đạt mục tiêu CEFR không phải điểm trung bình: mọi năng lực mục tiêu cần phải Đạt với độ tin cậy từ Vừa, mọi bài làm thật phải qua, và 14 ngày không quên khi ôn (spec §60).</p></section>
    ${miss.length ? `<section class="stack"><h2>Còn thiếu ${miss.length} năng lực</h2><ul>${miss.slice(0, 30).map(x => `<li><button class="linkbtn" data-e="go" data-r="why/${esc(x.node)}">${esc(x.vi)}</button> <span class="hint">· cần mức ${x.level} · đang ${Math.round(x.pct * 100)}%</span></li>`).join('')}</ul>${miss.length > 30 ? `<p class="hint">và ${miss.length - 30} năng lực khác.</p>` : ''}</section>` : ''}
    ${snaps.length ? `<section class="stack"><h2>Lịch sử Readiness</h2><ul>${snaps.map(s => snapRow(c, s)).join('')}</ul></section>` : ''}
    <div class="row"><button class="btn ghost" data-e="go" data-r="goal/${esc(id)}">← ${esc(meta.vi)}</button></div>`;
}

export function viewWhy(c: ECtx): string {
  const rest = c.route.slice('why/'.length);
  return rest.startsWith('goal/') ? whyGoal(c, rest.slice('goal/'.length)) : whyNode(c, rest);
}
