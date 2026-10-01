// Ước tính năng lực bằng mô hình đáp ứng câu hỏi 3 tham số (3PL), thang đo là band IELTS.
//   P(đúng | θ) = c + (1 − c) / (1 + e^(−a·(θ − b)))
//   θ: năng lực người học (band), b: độ khó câu (band), a: độ phân biệt (mỗi band), c: xác suất đoán mò.
// Ước tính kiểu EAP: lấy trung bình hậu nghiệm trên lưới θ từ 0 tới 9; sai số chuẩn = độ lệch chuẩn hậu nghiệm.
// Không có AI: chỉ là công thức thống kê, ghi trong màn “Cách tính” của app (yêu cầu 2.1, 3.4).

export interface IrtItem {
  b: number;     // độ khó (band)
  a?: number;    // độ phân biệt, mặc định A_DEFAULT
  c?: number;    // đoán mò, mặc định 0 (câu điền)
}

export interface Response {
  item: IrtItem;
  correct: boolean;
}

export const A_DEFAULT = 1.2;
export const GRID_MIN = 0;
export const GRID_MAX = 9;
export const GRID_STEP = 0.05;

export interface Prior {
  mean: number;
  sd: number;
}

export const PRIOR_DEFAULT: Prior = { mean: 5.5, sd: 1.75 };

export function pCorrect(theta: number, it: IrtItem): number {
  const a = it.a ?? A_DEFAULT, c = it.c ?? 0;
  return c + (1 - c) / (1 + Math.exp(-a * (theta - it.b)));
}

// Lượng thông tin Fisher của câu tại θ: câu càng sát năng lực thì càng nhiều thông tin.
export function information(theta: number, it: IrtItem): number {
  const a = it.a ?? A_DEFAULT, c = it.c ?? 0, p = pCorrect(theta, it);
  if (p <= 0 || p >= 1) return 0;
  return (a * a * (p - c) ** 2 * (1 - p)) / ((1 - c) ** 2 * p);
}

const grid: number[] = [];
for (let t = GRID_MIN; t <= GRID_MAX + 1e-9; t += GRID_STEP) grid.push(Math.round(t * 100) / 100);

export interface Estimate {
  theta: number;   // band ước tính (chưa làm tròn)
  se: number;      // sai số chuẩn (band)
  n: number;       // số câu đã trả lời
}

export function estimate(responses: Response[], prior: Prior = PRIOR_DEFAULT): Estimate {
  // Làm việc trên log để không tràn số khi nhiều câu.
  const logPost = grid.map(t => {
    let lp = -0.5 * ((t - prior.mean) / prior.sd) ** 2;
    for (const r of responses) {
      const p = Math.min(1 - 1e-9, Math.max(1e-9, pCorrect(t, r.item)));
      lp += r.correct ? Math.log(p) : Math.log(1 - p);
    }
    return lp;
  });
  const mx = Math.max(...logPost);
  const w = logPost.map(l => Math.exp(l - mx));
  const sw = w.reduce((s, x) => s + x, 0);
  let mean = 0;
  for (let i = 0; i < grid.length; i++) mean += grid[i]! * w[i]!;
  mean /= sw;
  let v = 0;
  for (let i = 0; i < grid.length; i++) v += (grid[i]! - mean) ** 2 * w[i]!;
  v /= sw;
  return { theta: mean, se: Math.sqrt(v), n: responses.length };
}

// Khoảng sai số hiển thị cho người học: ±1,28·SE (khoảng tin cậy 80%), làm tròn lên tới 0,5, tối thiểu 0,5.
export const Z80 = 1.2816;
export function margin(se: number): number {
  return Math.max(0.5, Math.ceil(Z80 * se * 2 - 1e-9) / 2);
}

export function bandOf(theta: number): number {
  return Math.max(0, Math.min(9, Math.floor(theta * 2 + 0.5 + 1e-9) / 2));
}

// Chọn câu tiếp theo cho bài kiểm tra thích ứng: lấy ngẫu nhiên 1 trong `top` câu nhiều thông tin nhất
// (giảm việc mọi người cùng gặp một câu). `rand` truyền vào để test lặp lại được.
export function pickNext<T>(theta: number, pool: T[], info: (t: number, x: T) => number, top = 3, rand: () => number = Math.random): T | undefined {
  if (!pool.length) return undefined;
  const ranked = pool.map(x => ({ x, i: info(theta, x) })).sort((p, q) => q.i - p.i).slice(0, Math.max(1, top));
  return ranked[Math.min(ranked.length - 1, Math.floor(rand() * ranked.length))]!.x;
}
