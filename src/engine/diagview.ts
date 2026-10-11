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
// v86 Thám hiểm sương mù: bài chẩn đoán vẽ thành bản đồ 4 × 4. open: các ô đã mở (thứ tự mở); wait: đang chờ chọn đường; kinds: số điểm dò đã đi mỗi đường.
export interface FogState { seed: number; open: number[]; wait: boolean; kinds: { u: number; g: number }; cur: 'u' | 'g' | null }
export interface DiagRun { d: DiagState; node: string; qs: ProbeQ[]; i: number; got: number; total: number; gs?: number; fog?: FogState }   // gs: tổng xác suất đoán trúng của các câu trong phần

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
  // v111 (SPEC "Mô hình học v111" §2): người mới vào thẳng chương mở đầu của truyện; lượt xếp lớp là việc thắp đèn trong sương.
  if (quick) return `<section class="stack"><span class="eyebrow">📖 Mở đầu · Sương Câm</span><h1>Bạn đang ở đâu?</h1>
    ${host.mascot ? `<div class="tisay"><span aria-hidden="true">${host.mascot('happy', 52)}</span><span class="tisay-b">Phố Chữ chìm trong sương, ai cũng mất tiếng. Giúp Tí thắp vài ngọn đèn nhé: mỗi đèn là vài chữ tiếng Anh.</span></div>` : ''}
    <p class="muted">Khoảng 3–5 phút, tối đa 8 ngọn đèn (mỗi đèn 2–4 câu từ vựng hoặc ngữ pháp). Đúng thì đèn sau khó hơn, sai thì dễ hơn: nhờ vậy Tí biết bạn đang ở đâu để không bắt bạn học lại thứ đã biết.</p></section>
    <p class="hint">Không chắc thì chọn "Không biết": đèn vẫn sáng, và Tí đoán đúng hơn.</p>
    <div class="row"><button class="btn primary" data-e="dstart" data-q="1">Bắt đầu thử sức</button></div>`;
  return `<section class="stack"><span class="eyebrow">Mục tiêu · Thử sức</span><h1>Bạn đang ở đâu?</h1>
    <p class="muted">Lượt thử sức khoảng 10–20 phút: app hỏi vài câu ở từng cụm từ vựng và điểm ngữ pháp, bắt đầu ở cấp dễ rồi lên dần. Đúng thì lên cấp, sai thì dò xuống phần nền. Xong là những gì bạn đã biết được bỏ khỏi lộ trình.</p></section>
    <section class="panel stack"><h3>Nghe và Đọc</h3>
      <p class="muted">${has ? `Lấy từ lượt thử Nghe + Đọc bạn đã làm: ${lr.L !== null ? `Nghe ≈ band ${lr.L}` : ''}${lr.L !== null && lr.R !== null ? ', ' : ''}${lr.R !== null ? `Đọc ≈ band ${lr.R}` : ''}. Lượt thử sẽ bắt đầu từ cấp đó.` : 'Chưa có. Thử Nghe + Đọc (≤ 15 phút) trước thì lượt thử bắt đầu đúng cấp hơn; không làm thì bắt đầu từ A1.'}</p>
      ${has ? '' : '<div class="row"><button class="btn small" data-xr="place">Thử Nghe + Đọc trước</button></div>'}</section>
    <p class="hint">Không cần ôn trước, không trừ năng lượng. Không chắc thì chọn "Không biết" để kết quả đúng hơn.</p>
    <div class="row"><button class="btn primary" data-e="dstart">Bắt đầu thử sức</button><button class="btn ghost" data-e="go" data-r="goals">Để sau</button></div>`;
}

// Cảnh của ô theo seed (không theo đúng / sai: mở ô là phần thưởng duy nhất, ai trả lời cũng mở — không có lý do đoán bừa).
const FOG_SCENE = ['🌲', '🌳', '🏔️', '⛰️', '🏕️', '🌾', '🪨', '🌻', '🦌', '🐿️', '🏞️', '🌉', '🗿', '🍄', '🦉', '⛲'];
export const FOG_N = 4, FOG_EVERY = 7;   // bản đồ 4 × 4; xếp lớp lại tối đa mỗi 7 ngày
export function fogMap(c: ECtx, f: FogState): string {
  const cells: string[] = [];
  for (let i = 0; i < FOG_N * FOG_N; i++) {
    const k = f.open.indexOf(i), cur = !f.wait && i === f.open.length;
    cells.push(`<span class="fgcell${k >= 0 ? ' open' : ''}${cur ? ' cur' : ''}">${k >= 0 ? FOG_SCENE[(f.seed + i * 7) % FOG_SCENE.length] : cur ? (f.cur === 'g' ? '⛰️' : '🌲') : '☁️'}</span>`);
  }
  return `<div class="fggrid" role="img" aria-label="Bản đồ: đã mở ${f.open.length} / ${FOG_N * FOG_N} ô">${cells.join('')}</div>`;
}
export function viewFogPick(c: ECtx, run: DiagRun): string {
  const f = run.fog!, max = run.d.max ?? 16, half = Math.ceil(max / 2), lockU = f.kinds.u >= half, lockG = f.kinds.g >= half;
  return `<section class="stack"><span class="eyebrow">🧭 Thám hiểm sương mù · ${f.open.length}/${max} ô</span><h1>Đi đường nào?</h1>
    <p class="hint">Mỗi ô là một điểm dò (vài câu). Trả lời đúng hay sai thì ô đều mở: hãy trả lời thật, không chắc thì chọn “Không biết”. Hết bản đồ, app cho biết cấp của bạn.</p></section>
    ${fogMap(c, f)}
    <div class="row" style="justify-content:center"><button class="btn${lockU ? '' : ' primary'}" data-e="fgpick" data-k="u" ${lockU ? 'disabled' : ''}>🌲 Rừng Từ vựng (${f.kinds.u})</button><button class="btn${lockG ? '' : ' primary'}" data-e="fgpick" data-k="g" ${lockG ? 'disabled' : ''}>⛰️ Núi Ngữ pháp (${f.kinds.g})</button></div>
    ${lockU || lockG ? '<p class="hint">Một đường đã đi đủ nửa bản đồ: đi đường còn lại để bản đồ cân đối (đo cả từ vựng lẫn ngữ pháp).</p>' : ''}
    <div class="row"><button class="btn ghost small" data-e="dstop">Dừng và xem kết quả</button></div>`;
}

export function viewDiagRun(c: ECtx, run: DiagRun): string {
  const { host } = c, esc = host.esc, q = run.qs[run.i]!, n = run.d.probed.length + 1;
  if (run.fog) {   // v86: câu của điểm dò hiện dưới bản đồ thu nhỏ
    const body = q.opts
      ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="dans" data-i="${i}" lang="${q.level === 1 ? 'vi' : 'en'}">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="dans" data-i="-1">Không biết</button></div>`
      : `<form class="stack" data-eform="dtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="dans" data-i="-1">Không biết</button></div></form>`;
    return `<section class="stack"><span class="eyebrow">🧭 Thám hiểm sương mù · ${run.fog.cur === 'g' ? '⛰️ Núi Ngữ pháp' : '🌲 Rừng Từ vựng'} · câu ${run.i + 1}/${run.total}</span></section>
      <div class="fgmini">${fogMap(c, run.fog)}</div><h2 style="font-size:20px">${esc(q.prompt)}</h2>${body}`;
  }
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="dans" data-i="${i}" lang="${q.level === 1 ? 'vi' : 'en'}">${esc(o)}</button>`).join('')}
        <button class="btn ghost" data-e="dans" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="dtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="dans" data-i="-1">Không biết</button></div></form>`;
  return `<section class="stack"><span class="eyebrow">🏮 Sương Câm · ngọn đèn ${n}</span>
    <div class="bar" role="progressbar" aria-label="Tiến độ thử sức" aria-valuemin="0" aria-valuemax="${run.d.max ?? 16}" aria-valuenow="${n - 1}"><i style="width:${Math.min(100, Math.round(((n - 1) / (run.d.max ?? 16)) * 100))}%"></i></div>
    <h2 style="font-size:20px">${esc(q.prompt)}</h2></section>${body}
    <div class="row"><button class="btn ghost small" data-e="dstop">Dừng và xem kết quả</button></div>`;
}

const CEFR_IDS = ['cefr-pre-a1', 'cefr-a1', 'cefr-a2', 'cefr-b1', 'cefr-b2', 'cefr-c1', 'cefr-c2'];
export function viewDiagResult(c: ECtx, lr: { L: number | null; R: number | null }): string {
  const { host, e } = c, esc = host.esc, r = e.diag;
  if (!r) return `<section class="stack"><h1>Chưa có kết quả thử sức</h1></section><div class="row"><button class="btn primary" data-e="go" data-r="diag">Thử sức</button></div>`;
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
  return `<section class="stack"><span class="eyebrow">🏮 Sương Câm · ${r.n} ngọn đèn đã thắp</span><h1>Bạn đang ở đâu</h1></section>
    <section class="panel stack"><div class="me-stats ${lr.L !== null || lr.R !== null ? 'me3' : ''}">
      <div class="stat"><b>${lvl(r.u)}</b><span class="muted">từ vựng</span></div>
      <div class="stat"><b>${lvl(r.g)}</b><span class="muted">ngữ pháp</span></div>
      ${lr.L !== null ? `<div class="stat"><b>${bandToCefr(lr.L)}</b><span class="muted">nghe</span></div>` : ''}${lr.R !== null ? `<div class="stat"><b>${bandToCefr(lr.R)}</b><span class="muted">đọc</span></div>` : ''}</div>
      ${(() => { const sn = [...e.ev.snap].reverse().find(x => x.subj === 'diag' && x.day === r.day), ru = sn?.info?.ru, rg = sn?.info?.rg;
        const part = [typeof ru === 'number' && ru > Math.floor(r.u) ? `từ vựng ${cefrOf(ru)}` : '', typeof rg === 'number' && rg > Math.floor(r.g) ? `ngữ pháp ${cefrOf(rg)}` : ''].filter(Boolean);
        return part.length ? `<p class="hint"><b>Điểm mạnh:</b> bạn nhận ra tốt tới ${part.join(', ')} (tự nhớ ra thì chưa chắc). App không dạy lại phần nhận ra này, chỉ luyện cho bạn tự nhớ ra và dùng được.</p>` : ''; })()}
      <p class="hint">Đây là ước lượng sau ${r.n} phần, có thể lệch khoảng nửa cấp. Phần thấp hơn mức này app tạm coi là bạn đã biết để bạn không phải học lại, nhưng sẽ thử dần trong lúc chơi (lượt 🔭 trinh sát): sai thì phần đó tự quay lại lộ trình.</p></section>
    ${lr.L === null && lr.R === null ? `<section class="panel stack"><h3>🔦 Còn hai ngọn đèn: Nghe và Đọc</h3><p class="muted">Vài mẩu tin ngắn trong sương (khoảng 10 phút, không tính giờ). Thắp thêm thì Tí biết cả cấp nghe, cấp đọc của bạn, lộ trình đúng hơn.</p>
      <div class="row"><button class="btn primary" data-e="lrstart">🔦 Thắp đèn Nghe + Đọc</button></div></section>` : ''}
    ${(() => { const a = [...e.ev.snap].reverse().find(x => (x.dec === 'goal:AUTO' || x.dec === 'goal:STORY') && x.day === r.day), id = a ? String(a.info?.goal) : '', m = id ? GOALS.get(id) : null;
      if (!m) return '';
      const k = CEFR_IDS.indexOf(id), up = k >= 0 && k + 1 < CEFR_IDS.length ? GOALS.get(CEFR_IDS[k + 1]!) : null, chose = a!.dec === 'goal:STORY';
      // v111 (SPEC "Mô hình học v111" §1): đích do người học chọn trong truyện; mặc định là cấp kế tiếp, một chạm là xong.
      return `<section class="panel stack"><h3>Bạn muốn đi xa tới đâu trong Phố Chữ?</h3>
        <p class="muted">Tí gợi ý <b>${esc(m.vi)}</b>: cấp kế tiếp của phần bạn còn yếu nhất. Mỗi cấp là một khu của phố; muốn đi xa hơn thì chọn cấp cao hơn.${chose ? ' (Bạn đã chọn.)' : ''}</p>
        <div class="row"><button class="btn primary" data-e="go" data-r="quest">▶ Giữ đích ${esc(m.vi.replace(/^Tiếng Anh tổng quát /, ''))}, vào Phố Chữ</button>${up ? `<button class="btn" data-e="gpick" data-g="${esc(up.id)}">Xa hơn: ${esc(up.vi.replace(/^Tiếng Anh tổng quát /, ''))}</button>` : ''}<button class="btn ghost" data-e="go" data-r="goals">Tự chọn</button></div></section>`; })()}
    ${goalRows ? `<section class="stack"><h2>Còn thiếu so với mục tiêu</h2><div class="tablewrap" tabindex="0" role="region" aria-label="Còn thiếu so với mục tiêu"><table style="min-width:0"><thead><tr><th>Mục tiêu</th><th>Năng lực chưa đạt</th><th>Học thêm</th></tr></thead><tbody>${goalRows}</tbody></table></div></section>` : ''}
    ${!c.future ? '' : `<section class="stack"><h2>Số giờ học ước tính tới từng kỳ thi</h2>
      <div class="tablewrap" tabindex="0" role="region" aria-label="Giờ học tới từng kỳ thi"><table style="min-width:0"><thead><tr><th>Kỳ thi</th><th>Giờ học có hướng dẫn</th></tr></thead><tbody>${exams.map(([n, b]) => `<tr><td>${esc(n)}</td><td class="num">${b <= band ? 'đã ở mức này' : `≈ ${Math.round(hoursAt(b) - have)} giờ`}</td></tr>`).join('')}</tbody></table></div>
      <p class="hint">Theo số giờ học có hướng dẫn Cambridge công bố cho từng cấp (ước tính thô, mỗi người một khác). Dùng bảng này để chọn kỳ thi đầu tiên vừa sức.</p></section>`}
    <div class="row">${e.goals.length ? '<button class="btn ghost" data-e="go" data-r="quest">Về sảnh chơi</button><button class="btn ghost" data-e="go" data-r="goals">Mục tiêu</button>' : '<button class="btn primary" data-e="go" data-r="goals">Về mục tiêu</button>'}<button class="btn ghost" data-e="go" data-r="diag">Dò lại</button></div>`;
}
