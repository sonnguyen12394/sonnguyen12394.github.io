// Độ chính xác của ước tính so với điểm thi thật (yêu cầu 5.11): chỉ công bố khi đủ ≥ 100 cặp mỗi kỹ năng.

import type { Ctx } from '../main.ts';
import { pairStats, netAge } from '../net.ts';
import { back, SKILL_VI } from './ui.ts';

export const PUBLISH_N = 100;
const GOAL: Record<'L' | 'R' | 'W' | 'S', [number, string]> = { L: [0.5, '±0,5'], R: [0.5, '±0,5'], W: [1, '±1'], S: [1, '±1'] };
const pct = (v: number): string => `${Math.round(v * 100)}%`;

export function viewAccuracy(c: Ctx): string {
  const { x } = c, ps = pairStats().filter(p => p.exam === x.exam), age = netAge();
  const row = (k: 'L' | 'R' | 'W' | 'S'): string => {
    const p = ps.find(q => q.skill === k), n = p?.n ?? 0, [tol, tl] = GOAL[k];
    if (!p || n < PUBLISH_N) return `<tr><td>${SKILL_VI[k]}</td><td class="num">${n}/${PUBLISH_N}</td><td colspan="2">Chưa đủ cặp để công bố</td></tr>`;
    const within = tol === 0.5 ? p.within_half : p.within_one;
    return `<tr><td>${SKILL_VI[k]}</td><td class="num">${n}</td><td class="num">${pct(within)} lệch ≤ ${tl}</td><td>${within >= 0.8 ? 'Đạt mục tiêu 80%' : '<span class="warnt">Chưa đạt 80%</span>'}</td></tr>`;
  };
  return `<section class="stack"><span class="eyebrow">Ôn thi · Minh bạch</span><h1>Ước tính của app chính xác tới đâu?</h1>
    <p class="muted">So ước tính của app với điểm thi thật mà người học tự ghi và đồng ý chia sẻ. Mục tiêu: ≥ 80% ước tính Nghe, Đọc lệch ≤ 0,5 band; Viết, Nói lệch ≤ 1 band. Chỉ công bố khi mỗi kỹ năng có ít nhất ${PUBLISH_N} cặp.</p></section>
  <section class="panel stack"><div class="tablewrap" tabindex="0" role="region" aria-label="Độ chính xác theo kỹ năng"><table class="tbl"><thead><tr><th>Kỹ năng</th><th>Số cặp</th><th>Kết quả</th><th>Mục tiêu</th></tr></thead><tbody>
    ${(['L', 'R', 'W', 'S'] as const).map(row).join('')}</tbody></table></div>
    <p class="hint">${age === null ? 'Chưa tải được số liệu (cần mạng một lần).' : `Số liệu cập nhật ${Math.round(age / 3600e3)} giờ trước.`} Bạn giúp được bằng cách ghi điểm thi thật sau khi thi.</p>
    <div class="row"><button class="btn" data-x="route" data-r="real">Ghi điểm thi thật</button><button class="btn ghost" data-x="netrefresh">Tải số liệu mới</button></div></section>
  ${back()}`;
}
