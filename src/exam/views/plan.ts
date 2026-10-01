// Màn "Kế hoạch học": cảnh báo + đề xuất điều chỉnh, số giờ cần/có (ước tính, ghi nguồn), việc hôm nay và lịch 14 ngày.

import type { Ctx } from '../main.ts';
import { makePlan, GLH_SOURCE, SKILL_NAME, type Plan, type Task } from '../plan.ts';
import { profile } from '../estimate.ts';
import { hiddenItems } from '../net.ts';
import { itemParams } from '../packs.ts';
import { dueList } from '../notebook.ts';
import { vstepToBand } from '../scales.ts';
import { dayVi, back, fmt } from './ui.ts';

export function planFor(c: Ctx): Plan {
  const { x, host } = c, today = host.today();
  const p = profile(x, today, hiddenItems(), itemParams);
  const mins = host.minutes(), recent = Array.from({ length: 7 }, (_, k) => Math.round(Number(mins[String(today - 7 + k)] || 0)));
  const target = x.target === null ? null : x.exam === 'vstep' ? vstepToBand(x.target) : x.target;
  return makePlan({
    today, examDay: x.date, target, mins: x.mins, due: dueList(x, today, hiddenItems()).length,
    est: { L: p.L.band, R: p.R.band, W: p.W.band, S: p.S.band }, hasPlacement: x.attempts.some(a => a.kind === 'place'),
    recentMins: x.attempts.length ? recent : undefined,
  });
}

// Nút bắt đầu cho từng việc. Phần chưa có trong bản này thì dùng phần học sẵn có của app và nói rõ.
export function taskButton(t: Task, isV: boolean, primary = false): string {
  const cls = `btn small${primary ? ' primary' : ''}`;
  switch (t.kind) {
    case 'place': return `<button class="${cls}" data-x="route" data-r="place">Làm</button>`;
    case 'review': return `<button class="${cls}" data-x="route" data-r="nb">Ôn</button>`;
    case 'write': return `<button class="${cls}" data-act="vxnew" data-m="w">Viết</button>`;
    case 'speak': return `<button class="${cls}" data-act="vxnew" data-m="s">Nói</button>`;
    case 'mock': return isV ? `<button class="${cls}" data-act="exgo">Thi thử</button>` : `<button class="${cls}" data-x="route" data-r="practice">Luyện</button>`;
    default: return `<button class="${cls}" data-x="route" data-r="practice">Luyện</button>`;
  }
}

export function todayPanel(c: Ctx, plan: Plan): string {
  const esc = c.host.esc, d = plan.days[0], isV = c.x.exam === 'vstep';
  if (!d) return '';
  const done = Math.round(Number(c.host.minutes()[String(c.host.today())] || 0));
  return `<section class="panel stack" aria-labelledby="xtoday"><div class="spread"><h3 id="xtoday">Hôm nay · ${d.mins} phút</h3><span class="num muted">đã học ${done} phút</span></div>
    ${plan.warnings.filter(w => w.code === 'too-little-time' || w.code === 'behind').map(w => `<p class="warnt">${esc(w.msg)} <button class="linkbtn" data-x="route" data-r="plan">Xem đề xuất</button></p>`).join('')}
    <ul class="sklist">${d.tasks.map((t, i) => `<li class="spread" style="gap:8px"><span>${esc(t.label)} · ${t.mins} phút</span>${taskButton(t, isV, i === 0)}</li>`).join('')}</ul>
    <div class="row"><button class="btn ghost small" data-x="route" data-r="plan">Cả kế hoạch</button></div></section>`;
}

export function viewPlan(c: Ctx): string {
  const { x, host } = c, esc = host.esc, plan = planFor(c), isV = x.exam === 'vstep';
  const tw = plan.weights;
  return `<section class="stack"><span class="eyebrow">Ôn thi · Kế hoạch</span><h1>Kế hoạch tới ngày thi</h1>
    <p class="muted">${x.date === null ? 'Chưa có ngày thi.' : `Thi ngày ${dayVi(x.date)} · còn ${Math.max(0, x.date - host.today())} ngày`} · ${x.mins} phút mỗi ngày <button class="linkbtn" data-x="route" data-r="settings" aria-label="Đổi ngày thi, mục tiêu, thời gian">Đổi</button></p></section>
  ${plan.warnings.map(w => `<section class="panel stack" role="status"><p class="${w.code === 'too-little-time' || w.code === 'behind' ? 'warnt' : ''}">${esc(w.msg)}</p>
    ${w.fix.length ? `<ul class="sklist">${w.fix.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}</section>`).join('')}
  <section class="panel stack"><h3>Chia thời gian theo kỹ năng</h3>
    <p>${(['L', 'R', 'W', 'S'] as const).map(k => `${SKILL_NAME[k]} <b>${Math.round(tw[k] * 100)}%</b>`).join(' · ')}</p>
    <p class="hint">Kỹ năng càng xa mục tiêu càng được nhiều thời gian; kỹ năng đã đạt vẫn được giữ ít nhất một phần để không tụt.${plan.needHours !== null ? ` Ước tính cần khoảng ${plan.needHours} giờ để đạt mục tiêu${plan.haveHours !== null ? `, bạn có khoảng ${plan.haveHours} giờ tới ngày thi` : ''}.` : ''}
    Số giờ là ước tính của app, dựa trên <a href="${GLH_SOURCE.url}" target="_blank" rel="noopener">${esc(GLH_SOURCE.title)}</a> (truy cập ${GLH_SOURCE.accessed}): giờ học có hướng dẫn cộng dồn của từng cấp CEFR, nội suy theo band; người tự học có thể cần nhiều hoặc ít hơn.</p></section>
  <section class="panel stack"><h3>14 ngày tới</h3>
    ${plan.days.map((d, i) => `<details${i === 0 ? ' open' : ''}><summary><b>${i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : esc(dayVi(d.day))}</b> · ${d.mins} phút</summary>
      <ul class="sklist" style="margin-top:6px">${d.tasks.map(t => `<li class="spread" style="gap:8px"><span>${esc(t.label)} · ${t.mins} phút</span>${i === 0 ? taskButton(t, isV) : ''}</li>`).join('')}</ul></details>`).join('')}
    <p class="hint">Lịch được tính lại mỗi khi bạn mở app, theo kết quả mới nhất${x.target !== null ? ` (mục tiêu ${isV ? 'trung bình ' : 'band '}${fmt(x.target)})` : ''}.</p></section>
  ${back()}`;
}
