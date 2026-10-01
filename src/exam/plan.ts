// Kế hoạch học tới ngày thi (yêu cầu 9.2): chia bài theo ngày, ưu tiên kỹ năng xa mục tiêu nhất, ôn sổ lỗi sai trước,
// đề thi thử mỗi tuần trong 6 tuần cuối; cảnh báo và đề xuất điều chỉnh khi không kịp.
// Số giờ cần học: ước tính của app dựa trên số giờ học có hướng dẫn Cambridge công bố cho từng cấp CEFR (cộng dồn từ đầu):
// A2 180–200, B1 350–400, B2 500–600, C1 700–800, C2 1000–1200 giờ (lấy điểm giữa), nội suy theo band.

export const GLH_SOURCE = { title: 'Cambridge English – Guided learning hours', url: 'https://support.cambridgeenglish.org/hc/en-gb/articles/202838506-Guided-learning-hours', accessed: '2026-10-01' };

const GLH: Array<[number, number]> = [[0, 0], [3.5, 190], [5, 375], [6.5, 550], [8, 750], [9, 1100]];

export function hoursAt(band: number): number {
  const b = Math.max(0, Math.min(9, band));
  for (let i = 1; i < GLH.length; i++) {
    const [x1, y1] = GLH[i]!, [x0, y0] = GLH[i - 1]!;
    if (b <= x1) return y0 + ((b - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 1100;
}

export type PSkill4 = 'L' | 'R' | 'W' | 'S';

export interface PlanInput {
  today: number;
  examDay: number | null;
  target: number | null;              // band IELTS (VSTEP đã quy ra band)
  mins: number;                       // phút mỗi ngày
  est: Record<PSkill4, number | null>; // band ước tính từng kỹ năng
  due: number;                        // số câu đến hạn trong sổ lỗi sai
  hasPlacement: boolean;
  recentMins?: number[];              // phút đã học 7 ngày gần nhất (mới nhất cuối)
}

export type TaskKind = 'place' | 'review' | 'practice' | 'mock' | 'write' | 'speak';
export interface Task { kind: TaskKind; skill?: PSkill4; mins: number; label: string }
export interface Day { day: number; tasks: Task[]; mins: number }

export interface Warning { code: 'no-date' | 'no-target' | 'too-little-time' | 'behind' | 'past'; msg: string; fix: string[] }

export interface Plan {
  days: Day[];                        // tối đa 14 ngày tới (đủ để hiện; mỗi ngày tính lại khi mở app)
  weights: Record<PSkill4, number>;
  needHours: number | null;
  haveHours: number | null;
  warnings: Warning[];
}

export const SKILL_NAME: Record<PSkill4, string> = { L: 'Nghe', R: 'Đọc', W: 'Viết', S: 'Nói' };
const UNIT: Record<PSkill4, { kind: TaskKind; mins: number; label: string }> = {
  L: { kind: 'practice', mins: 15, label: 'Luyện Nghe theo dạng câu' },
  R: { kind: 'practice', mins: 20, label: 'Luyện Đọc theo dạng câu' },
  W: { kind: 'write', mins: 25, label: 'Luyện Viết (một đề, tự chấm theo bài mẫu)' },
  S: { kind: 'speak', mins: 12, label: 'Luyện Nói (ghi âm, máy chép lời)' },
};

// Trọng số kỹ năng: khoảng cách tới mục tiêu (tối thiểu 0,5 để không bỏ hẳn kỹ năng đã đạt); chưa có ước tính coi như cách 1,5 band.
export function weights(est: Record<PSkill4, number | null>, target: number | null): Record<PSkill4, number> {
  const t = target ?? 6.5;
  const w = {} as Record<PSkill4, number>;
  for (const k of ['L', 'R', 'W', 'S'] as const) { const e = est[k]; w[k] = Math.max(0.5, e === null ? 1.5 : t - e) + 0.25; }
  const s = Object.values(w).reduce((a, b) => a + b, 0);
  for (const k of ['L', 'R', 'W', 'S'] as const) w[k] = w[k] / s;
  return w;
}

export function makePlan(p: PlanInput): Plan {
  const warnings: Warning[] = [];
  const w = weights(p.est, p.target);
  const daysLeft = p.examDay === null ? null : p.examDay - p.today;
  if (p.examDay === null) warnings.push({ code: 'no-date', msg: 'Chưa có ngày thi nên app xếp lịch 2 tuần tới với thời gian bạn chọn.', fix: ['Đặt ngày thi trong Cài đặt ôn thi'] });
  else if (daysLeft! < 0) warnings.push({ code: 'past', msg: 'Ngày thi đã qua.', fix: ['Ghi điểm thi thật', 'Đặt ngày thi mới'] });
  if (p.target === null) warnings.push({ code: 'no-target', msg: 'Chưa có mục tiêu nên app chia đều các kỹ năng.', fix: ['Chọn band mục tiêu'] });

  // Số giờ cần và số giờ còn có
  let needHours: number | null = null, haveHours: number | null = null;
  const known = (['L', 'R', 'W', 'S'] as const).map(k => p.est[k]).filter((x): x is number => x !== null);
  if (p.target !== null && known.length) {
    const cur = known.reduce((a, b) => a + b, 0) / known.length;
    needHours = Math.max(0, Math.round(hoursAt(p.target) - hoursAt(cur)));
  }
  if (daysLeft !== null && daysLeft > 0) haveHours = Math.round((daysLeft * p.mins) / 60);
  if (needHours !== null && haveHours !== null && needHours > haveHours) {
    const needMins = Math.ceil((needHours * 60) / Math.max(1, daysLeft!));
    const fix = [`Tăng lên khoảng ${Math.min(600, needMins)} phút mỗi ngày`, `Hoặc lùi ngày thi thêm khoảng ${Math.ceil(((needHours - haveHours) * 60) / Math.max(5, p.mins))} ngày`];
    const reach = known.length ? reachable(known.reduce((a, b) => a + b, 0) / known.length, haveHours) : null;
    if (reach !== null) fix.push(`Hoặc đặt mục tiêu vừa sức hơn: khoảng band ${reach.toString().replace('.', ',')}`);
    warnings.push({ code: 'too-little-time', msg: `Theo ước tính, cần khoảng ${needHours} giờ để đạt mục tiêu nhưng tới ngày thi bạn có khoảng ${haveHours} giờ.`, fix });
  }
  // Đang chậm tiến độ: 7 ngày qua học < 60% thời gian đặt ra
  if (p.recentMins && p.recentMins.length >= 7) {
    const done = p.recentMins.slice(-7).reduce((a, b) => a + b, 0), planned = 7 * p.mins;
    if (done < 0.6 * planned) warnings.push({ code: 'behind', msg: `7 ngày qua bạn học ${done} phút, khoảng ${Math.round((100 * done) / planned)}% kế hoạch.`, fix: [`Giảm còn ${Math.max(10, Math.round(done / 7 / 5) * 5)} phút mỗi ngày cho vừa sức, lịch sẽ tính lại`, 'Hoặc giữ nguyên và học bù dần'] });
  }

  // Lịch 14 ngày tới (hoặc tới ngày thi)
  const horizon = Math.max(1, Math.min(14, daysLeft === null ? 14 : Math.max(1, daysLeft)));
  const days: Day[] = [];
  const credit: Record<PSkill4, number> = { L: 0, R: 0, W: 0, S: 0 };
  let due = p.due;
  for (let d = 0; d < horizon; d++) {
    const day = p.today + d, tasks: Task[] = [];
    let left = p.mins;
    if (d === 0 && !p.hasPlacement) { tasks.push({ kind: 'place', mins: 15, label: 'Kiểm tra đầu vào Đọc + Nghe' }); left -= 15; }
    const toExam = daysLeft === null ? null : daysLeft - d;
    // Đề thi thử: mỗi 7 ngày trong 6 tuần cuối (ngày thứ 7 tính ngược từ ngày thi), cần ≥ 60 phút; ít thời gian thì làm từng phần
    if (toExam !== null && toExam > 0 && toExam <= 42 && toExam % 7 === 0) {
      tasks.push({ kind: 'mock', mins: Math.min(left, 170), label: left >= 160 ? 'Đề thi thử đầy đủ có tính giờ' : 'Một phần đề thi thử có tính giờ' });
      left -= Math.min(left, 170);
    }
    // Ôn sổ lỗi sai trước (khoảng 1,5 phút/câu, tối đa 30% thời gian)
    if (due > 0 && left > 0) { const m = Math.min(Math.ceil(due * 1.5), Math.ceil(0.3 * p.mins), left); const n = Math.min(due, Math.floor(m / 1.5) || 1); tasks.push({ kind: 'review', mins: m, label: `Ôn ${n} câu trong sổ lỗi sai` }); left -= m; due -= n; }
    // Phần còn lại chia cho kỹ năng theo trọng số: kỹ năng nào "nợ" thời gian nhiều nhất thì làm trước
    let guard = 0;
    while (left >= 8 && guard++ < 10) {
      for (const k of ['L', 'R', 'W', 'S'] as const) credit[k] += w[k] * p.mins;
      const k = (['L', 'R', 'W', 'S'] as const).slice().sort((a, b) => credit[b] - credit[a])[0]!;
      const u = UNIT[k], m = Math.min(u.mins, left);
      tasks.push({ kind: u.kind, skill: k, mins: m, label: u.label });
      credit[k] -= m; left -= m;
    }
    days.push({ day, tasks, mins: tasks.reduce((s, t) => s + t.mins, 0) });
  }
  return { days, weights: w, needHours, haveHours, warnings };
}

// Band cao nhất đạt được với số giờ còn có (ước tính).
export function reachable(cur: number, have: number): number {
  const goal = hoursAt(cur) + have;
  let b = cur;
  while (b < 9 && hoursAt(b + 0.5) <= goal) b += 0.5;
  return Math.floor(b * 2) / 2;
}
