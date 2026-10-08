// Kiểm toán model trên chính dữ liệu người học (v66; C257, C379, C264, C265). Thuần hàm, chỉ báo cáo, không tự đổi luật.
//   drift()    — trôi model: ở các ô đang Đạt, tỉ lệ đúng 14 ngày gần đây thấp rõ so với mastery dự đoán (z < −2,5, ≥ 20 lượt)
//                → model đang quá lạc quan (người học quên / nội dung đổi / luật sai). Ghi snapshot và hiện trong Dữ liệu nghiên cứu.
//   estimate() — ước lượng slip (tỉ lệ sai ở ô Đạt chắc, câu không trợ giúp) và guess (tỉ lệ đúng câu trắc nghiệm ở ô gần như chưa
//                biết, so với 1/số phương án) từ sổ bằng chứng. Cần ≥ 30 lượt mỗi loại; chưa đủ thì null.

import { stat, type MasteryStore } from '../mastery.ts';
import type { EvStore } from './types.ts';

export interface Drift { n: number; obs: number; exp: number; z: number; flag: boolean }
export function drift(ev: EvStore, m: MasteryStore, today: number, days = 14): Drift {
  let n = 0, ok = 0, exp = 0;
  for (const x of ev.led) {
    if (today - x.day > days || x.asst) continue;
    const s = stat(m[x.node]?.[x.lv]);
    if (s.state !== 'mastered') continue;
    n++; ok += x.ok; exp += s.m;
  }
  if (n < 20) return { n, obs: n ? ok / n : 0, exp: n ? exp / n : 0, z: 0, flag: false };
  const p = exp / n, o = ok / n, z = (o - p) / Math.sqrt(Math.max(1e-6, (p * (1 - p)) / n));
  const r = (v: number) => Math.round(v * 100) / 100;
  return { n, obs: r(o), exp: r(p), z: r(z), flag: z < -2.5 };
}

export interface Estimate { slip: number | null; slipN: number; guess: number | null; guessN: number; guessTheory: number | null }
export function estimate(ev: EvStore, m: MasteryStore): Estimate {
  let sn = 0, sb = 0, gn = 0, gk = 0, gt = 0;
  for (const x of ev.led) {
    if (x.asst) continue;
    const s = stat(m[x.node]?.[x.lv]);
    if (s.state === 'mastered' && s.conf !== 'low') { sn++; if (!x.ok) sb++; }
    else if (x.g > 0 && s.n >= 3 && s.m < 0.3) { gn++; gk += x.ok; gt += x.g; }
  }
  const r = (v: number) => Math.round(v * 1000) / 1000;
  return { slip: sn >= 30 ? r(sb / sn) : null, slipN: sn, guess: gn >= 30 ? r(gk / gn) : null, guessN: gn, guessTheory: gn ? r(gt / gn) : null };
}
