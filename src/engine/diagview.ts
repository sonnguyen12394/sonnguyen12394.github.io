// Màn chẩn đoán (M3): giới thiệu, làm bài (từng câu), kết quả (cấp ước tính, khoảng thiếu theo mục tiêu, số giờ tới từng kỳ thi).

import type { ECtx } from './views.ts';
import { nodeStat } from './views.ts';
import { GOALS, loaded } from './data.ts';
import { closure, defaultLevel } from './graph.ts';
import { cefrOf, BAND_OF, type DiagState } from './diag.ts';
import { hoursAt } from '../exam/plan.ts';
import { bandToCefr } from '../exam/scales.ts';
import type { Cefr } from './types.ts';
import { CEFRS } from './types.ts';

export interface ProbeQ { id: string; level: 1 | 2 | 3; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[]; en?: string }
export interface DiagRun { d: DiagState; node: string; qs: ProbeQ[]; i: number; got: number; total: number; gs?: number }   // gs: tổng xác suất đoán trúng của các câu trong phần

// Band Nghe/Đọc gần nhất từ bài kiểm tra đầu vào của phần Ôn thi (st.x.attempts, kind 'place').
export function lrBand(root: Record<string, unknown>): { L: number | null; R: number | null } {
  const at = ((root.x as { attempts?: Array<{ kind: string; skill: string; band: number; day: number }> } | undefined)?.attempts ?? [])
    .filter(a => a.kind === 'place').sort((a, b) => b.day - a.day);
  const pick = (k: string) => at.find(a => a.skill === k)?.band ?? null;
  return { L: pick('L'), R: pick('R') };
}

export function viewLoading(c: ECtx, err: string): string {
  const esc = c.host.esc;
  return err ? `<p class="warnt" role="alert">${esc(err)}</p><div class="row"><button class="btn primary" data-e="retry">Thử lại</button><button class="btn ghost" data-go="path">📚 Học bài (không cần mạng)</button></div>` : '<p class="muted" role="status" style="padding:40px 0;text-align:center">Đang tải bản đồ năng lực…</p>';
}

export function viewDiagIntro(c: ECtx, lr: { L: number | null; R: number | null }, quick = false): string {
  const { host } = c, has = lr.L !== null || lr.R !== null;
  if (quick) return `<section class="stack"><span class="eyebrow">Bắt đầu</span><h1>Bạn đang ở đâu?</h1>
    <p class="muted">Khoảng 3–5 phút, tối đa 8 phần (mỗi phần 2–4 câu): app hỏi vài câu từ vựng và ngữ pháp, đúng thì lên cấp, sai thì xuống. Xong, app tự đặt mục tiêu là cấp CEFR kế tiếp của bạn (đổi được bất cứ lúc nào) và bỏ khỏi lộ trình những gì bạn đã biết.</p></section>
    <p class="hint">Không chắc thì chọn "Không biết" để kết quả đúng hơn.</p>
    <div class="row"><button class="btn primary" data-e="dstart" data-q="1">Bắt đầu dò</button></div>`;
  return `<section class="stack"><span class="eyebrow">Mục tiêu · Chẩn đoán</span><h1>Bạn đang ở đâu?</h1>
    <p class="muted">Bài dò khoảng 10–20 phút: app hỏi vài câu ở từng cụm từ vựng và điểm ngữ pháp, bắt đầu ở cấp dễ rồi lên dần. Đúng thì lên cấp, sai thì dò xuống phần nền. Xong là những gì bạn đã biết được bỏ khỏi lộ trình.</p></section>
    <section class="panel stack"><h3>Nghe và Đọc</h3>
      <p class="muted">${has ? `Lấy từ bài kiểm tra đầu vào bạn đã làm: ${lr.L !== null ? `Nghe ≈ band ${lr.L}` : ''}${lr.L !== null && lr.R !== null ? ', ' : ''}${lr.R !== null ? `Đọc ≈ band ${lr.R}` : ''}. Bài dò sẽ bắt đầu từ cấp đó.` : 'Chưa có. Làm bài kiểm tra đầu vào Nghe + Đọc (≤ 15 phút) trước thì bài dò bắt đầu đúng cấp hơn; không làm thì bắt đầu từ A1.'}</p>
      ${has ? '' : '<div class="row"><button class="btn small" data-xr="place">Làm kiểm tra Nghe + Đọc trước</button></div>'}</section>
    <p class="hint">Không cần ôn trước, không trừ năng lượng. Không chắc thì chọn "Không biết" để kết quả đúng hơn.</p>
    <div class="row"><button class="btn primary" data-e="dstart">Bắt đầu dò</button><button class="btn ghost" data-e="go" data-r="goals">Để sau</button></div>`;
}

export function viewDiagRun(c: ECtx, run: DiagRun): string {
  const { host } = c, esc = host.esc, q = run.qs[run.i]!, n = run.d.probed.length + 1;
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="dans" data-i="${i}" lang="${q.level === 1 ? 'vi' : 'en'}">${esc(o)}</button>`).join('')}
        <button class="btn ghost" data-e="dans" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="dtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="dans" data-i="-1">Không biết</button></div></form>`;
  return `<section class="stack"><span class="eyebrow">Chẩn đoán · phần ${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ bài dò" aria-valuemin="0" aria-valuemax="${run.d.max ?? 16}" aria-valuenow="${n - 1}"><i style="width:${Math.min(100, Math.round(((n - 1) / (run.d.max ?? 16)) * 100))}%"></i></div>
    <h2 style="font-size:20px">${esc(q.prompt)}</h2></section>${body}
    <div class="row"><button class="btn ghost small" data-e="dstop">Dừng và xem kết quả</button></div>`;
}

export function viewDiagResult(c: ECtx, lr: { L: number | null; R: number | null }): string {
  const { host, e } = c, esc = host.esc, r = e.diag;
  if (!r) return `<section class="stack"><h1>Chưa có kết quả chẩn đoán</h1></section><div class="row"><button class="btn primary" data-e="go" data-r="diag">Làm bài dò</button></div>`;
  const ix = loaded();
  const cefrs: Cefr[] = [cefrOf(Math.floor(r.u)), cefrOf(Math.floor(r.g))];
  if (lr.L !== null) cefrs.push(bandToCefr(lr.L));
  if (lr.R !== null) cefrs.push(bandToCefr(lr.R));
  const low = cefrs.reduce((a, b) => (CEFRS.indexOf(a) <= CEFRS.indexOf(b) ? a : b));
  const band = Math.min(BAND_OF[low], ...[lr.L, lr.R].filter((x): x is number => x !== null)), have = hoursAt(band);
  const exams: Array<[string, number]> = [['VSTEP Bậc 3 (B1)', 4], ['VSTEP Bậc 4 (B2)', 5.5], ['VSTEP Bậc 5 (C1)', 7], ['IELTS 5.5', 5.5], ['IELTS 6.5', 6.5], ['IELTS 7.0', 7]];
  const goalRows = ix ? e.goals.map(s => {
    const g = ix.goal.get(s.id), m = GOALS.get(s.id);
    if (!g || !m) return '';
    const all = closure(ix, g.req, defaultLevel), miss = all.filter(q => !nodeStat(host, e, q.node, q.level).pass);
    const min = miss.reduce((t, q) => t + (ix.node.get(q.node)?.minutes ?? 0), 0);
    return `<tr><td>${esc(m.vi)}</td><td class="num">${miss.length}/${all.length}</td><td class="num">≈ ${Math.max(1, Math.round(min / 60))} giờ</td></tr>`;
  }).join('') : '';
  const lvl = (x: number) => `${cefrOf(Math.floor(x))}${x % 1 ? '–' + cefrOf(Math.ceil(x)) : ''}`;
  return `<section class="stack"><span class="eyebrow">Chẩn đoán · ${r.n} phần đã dò</span><h1>Bạn đang ở đâu</h1></section>
    <section class="panel stack"><div class="me-stats ${lr.L !== null || lr.R !== null ? 'me3' : ''}">
      <div class="stat"><b>${lvl(r.u)}</b><span class="muted">từ vựng</span></div>
      <div class="stat"><b>${lvl(r.g)}</b><span class="muted">ngữ pháp</span></div>
      ${lr.L !== null || lr.R !== null ? `<div class="stat"><b>${lr.L ?? '–'} / ${lr.R ?? '–'}</b><span class="muted">Nghe / Đọc (band)</span></div>` : ''}</div>
      <p class="hint">Đây là ước lượng sau ${r.n} phần, có thể lệch khoảng nửa cấp. Phần thấp hơn mức này app tạm coi là bạn đã biết để bạn không phải học lại, nhưng sẽ kiểm tra dần trong lúc chơi (lượt 🔭 trinh sát): sai thì phần đó tự quay lại lộ trình.</p></section>
    ${(() => { const a = [...e.ev.snap].reverse().find(x => x.dec === 'goal:AUTO' && x.day === r.day), m = a ? GOALS.get(String(a.info?.goal)) : null;
      return m ? `<section class="panel stack"><h3>App đã đặt mục tiêu: ${esc(m.vi)}</h3><p class="muted">Cấp kế tiếp của phần bạn còn yếu nhất. Đổi hoặc thêm mục tiêu ở Mục tiêu bất cứ lúc nào.</p></section>` : ''; })()}
    ${goalRows ? `<section class="stack"><h2>Còn thiếu so với mục tiêu</h2><div class="tablewrap"><table style="min-width:0"><thead><tr><th>Mục tiêu</th><th>Năng lực chưa đạt</th><th>Học thêm</th></tr></thead><tbody>${goalRows}</tbody></table></div></section>` : ''}
    ${!c.future ? '' : `<section class="stack"><h2>Số giờ học ước tính tới từng kỳ thi</h2>
      <div class="tablewrap"><table style="min-width:0"><thead><tr><th>Kỳ thi</th><th>Giờ học có hướng dẫn</th></tr></thead><tbody>${exams.map(([n, b]) => `<tr><td>${esc(n)}</td><td class="num">${b <= band ? 'đã ở mức này' : `≈ ${Math.round(hoursAt(b) - have)} giờ`}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint">Theo số giờ học có hướng dẫn Cambridge công bố cho từng cấp (ước tính thô, mỗi người một khác). Dùng bảng này để chọn kỳ thi đầu tiên vừa sức.</p></section>`}
    <div class="row">${e.goals.length ? '<button class="btn primary" data-e="go" data-r="quest">🏰 Bắt đầu leo tháp</button><button class="btn ghost" data-e="go" data-r="goals">Mục tiêu</button>' : '<button class="btn primary" data-e="go" data-r="goals">Về mục tiêu</button>'}<button class="btn ghost" data-e="go" data-r="diag">Dò lại</button></div>`;
}
