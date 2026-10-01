// Phân tích câu hỏi kiểu cổ điển (yêu cầu 5.4) từ lượt trả lời ẩn danh:
//   độ khó thực tế p = tỉ lệ trả lời đúng;
//   độ phân biệt = tương quan điểm-nhị phân giữa câu và tổng điểm phần còn lại (đã bỏ chính câu đó).
// Câu có ≥ MIN_N lượt và độ phân biệt ≤ HIDE_RPB (âm hoặc gần 0) thì tạm ẩn chờ sửa.

export const MIN_N = 50;
export const HIDE_RPB = 0.05;

export interface ItemStat {
  n: number;
  p: number;          // tỉ lệ đúng
  rpb: number | null; // độ phân biệt; null khi chưa tính được (mọi người cùng đúng/cùng sai)
}

// rows: mỗi lượt làm một bài gồm điểm từng câu (1 đúng, 0 sai) theo id câu.
export function itemStats(rows: Array<Record<string, 0 | 1>>): Record<string, ItemStat> {
  const ids = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) ids.add(k);
  const out: Record<string, ItemStat> = {};
  for (const id of ids) {
    const xs: number[] = [], ys: number[] = [];
    for (const r of rows) {
      const v = r[id];
      if (v === undefined) continue;
      let rest = 0;
      for (const [k, s] of Object.entries(r)) if (k !== id) rest += s;
      xs.push(v); ys.push(rest);
    }
    out[id] = { n: xs.length, p: mean(xs), rpb: corr(xs, ys) };
  }
  return out;
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

export function corr(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx, dy = ys[i]! - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

export function shouldHide(s: ItemStat | undefined): boolean {
  return !!s && s.n >= MIN_N && s.rpb !== null && s.rpb <= HIDE_RPB;
}

// Độ khó thực tế → band (để so với độ khó dự kiến lúc soạn). Dùng logit của tỉ lệ sai, gắn với band trung bình của nhóm làm bài.
export function empiricalB(p: number, groupMeanBand: number, a = 1.2, c = 0): number {
  const q = Math.min(0.99, Math.max(0.01, (p - c) / (1 - c)));
  return groupMeanBand - Math.log(q / (1 - q)) / a;
}
