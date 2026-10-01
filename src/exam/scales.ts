// Bảng quy đổi điểm: số câu đúng → band IELTS, điểm VSTEP, CEFR ↔ IELTS ↔ VSTEP.
// Mỗi bảng ghi nguồn và ngày truy cập; dòng nào nguồn chính thức không có thì `official: false` và có cách tính (yêu cầu 5.2).

export type ExamId = 'ielts-ac' | 'ielts-gt' | 'vstep';
export type Skill = 'L' | 'R' | 'W' | 'S';
export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Source {
  id: string;
  title: string;
  url: string;
  accessed: string;   // YYYY-MM-DD
  note?: string;
}

export const SOURCES: Record<string, Source> = {
  ieltsL: {
    id: 'ieltsL',
    title: 'IELTS Listening band score (IDP IELTS Australia)',
    url: 'https://ielts.com.au/australia/results/ielts-band-scores/listening-band-score',
    accessed: '2026-10-01',
    note: 'Bảng công bố từ 11 câu đúng (band 4) trở lên; nguồn ghi điểm thật có thể lệch nhẹ giữa các đề.',
  },
  ieltsR: {
    id: 'ieltsR',
    title: 'IELTS Reading band scores explained (IDP IELTS)',
    url: 'https://ielts.idp.com/bangladesh/results/scores/reading',
    accessed: '2026-10-01',
    note: 'Bảng riêng cho Academic và General Training; công bố tới band 4.',
  },
  ieltsOverall: {
    id: 'ieltsOverall',
    title: 'IELTS band score calculation (IDP IELTS)',
    url: 'https://ielts.idp.com/canada/results/band-score-calculation',
    accessed: '2026-10-01',
    note: 'Điểm tổng là trung bình 4 kỹ năng, làm tròn tới nửa band gần nhất (.25 lên .5, .75 lên band nguyên).',
  },
  ieltsCefr: {
    id: 'ieltsCefr',
    title: 'IELTS and the CEFR (ielts.org)',
    url: 'https://ielts.org/about-ielts/ielts-in-cefr-scale',
    accessed: '2026-10-01',
  },
  vstep729: {
    id: 'vstep729',
    title: 'Quyết định 729/QĐ-BGDĐT ngày 11/3/2015: định dạng đề thi đánh giá năng lực sử dụng tiếng Anh bậc 3–5',
    url: 'https://sdh.hcmute.edu.vn/Resources/Docs/SubDomain/sdh/2016/5a-QD%20729%20DD%20bac%203-5%20(11.3.2015).pdf',
    accessed: '2026-10-01',
    note: 'Mỗi kỹ năng thang 10; trung bình 4,0–5,5 đạt bậc 3 (B1), 6,0–8,0 bậc 4 (B2), 8,5–10 bậc 5 (C1).',
  },
  tt01: {
    id: 'tt01',
    title: 'Thông tư 01/2014/TT-BGDĐT: Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam',
    url: 'https://www.moj.gov.vn/vbpq/Lists/Vn%20bn%20php%20lut/Attachments/29454/VanBanGoc_01.2014.TT.BGD%C4%90T.pdf',
    accessed: '2026-10-01',
    note: 'Bậc 1–6 tương thích CEFR A1–C2.',
  },
  app: {
    id: 'app',
    title: 'Ước tính của app',
    url: '',
    accessed: '2026-10-01',
    note: 'Chỗ nguồn chính thức không công bố: app tính theo công thức ghi ngay cạnh, sẽ hiệu chỉnh khi có cặp “ước tính – điểm thật”.',
  },
};

export interface BandRow {
  min: number;        // số câu đúng thấp nhất cho band này
  band: number;
  official: boolean;
}

export interface RawTable {
  id: string;
  exam: ExamId;
  skill: 'L' | 'R';
  total: number;
  rows: BandRow[];    // sắp giảm dần theo min
  source: string;
  estimateNote: string;
}

const off = (pairs: Array<[number, number]>): BandRow[] => pairs.map(([min, band]) => ({ min, band, official: true }));
const est = (pairs: Array<[number, number]>): BandRow[] => pairs.map(([min, band]) => ({ min, band, official: false }));

// Dưới mốc thấp nhất được công bố: kéo dài đều xuống (mỗi 2–3 câu một nửa band), tối thiểu band 1 khi có ít nhất 1 câu đúng.
const LOW_NOTE = 'Dưới mốc nguồn công bố, app kéo dài bảng xuống đều: khoảng 2–3 câu đúng cho mỗi nửa band; 0 câu đúng = band 0.';

export const IELTS_LISTENING: RawTable = {
  id: 'ielts-L', exam: 'ielts-ac', skill: 'L', total: 40, source: 'ieltsL', estimateNote: LOW_NOTE,
  rows: [
    ...off([[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4]]),
    ...est([[8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0]]),
  ],
};

export const IELTS_READING_AC: RawTable = {
  id: 'ielts-ac-R', exam: 'ielts-ac', skill: 'R', total: 40, source: 'ieltsR', estimateNote: LOW_NOTE,
  rows: [
    ...off([[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4]]),
    ...est([[8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1], [0, 0]]),
  ],
};

export const IELTS_READING_GT: RawTable = {
  id: 'ielts-gt-R', exam: 'ielts-gt', skill: 'R', total: 40, source: 'ieltsR', estimateNote: LOW_NOTE,
  rows: [
    ...off([[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4]]),
    ...est([[12, 3.5], [9, 3], [6, 2.5], [4, 2], [2, 1.5], [1, 1], [0, 0]]),
  ],
};

export function rawTable(exam: ExamId, skill: 'L' | 'R'): RawTable {
  if (skill === 'L') return IELTS_LISTENING;   // Nghe IELTS dùng chung một bảng cho Academic và General Training
  return exam === 'ielts-gt' ? IELTS_READING_GT : IELTS_READING_AC;
}

export interface BandResult {
  band: number;
  official: boolean;      // dòng bảng là của nguồn chính thức
  scaled: boolean;        // bài không đủ 40 câu: đã quy về thang 40
  raw40: number;
}

// Số câu đúng → band IELTS. Bài ngắn hơn 40 câu (luyện theo dạng) quy tỉ lệ về 40 trước (ước tính của app).
export function ieltsBand(exam: ExamId, skill: 'L' | 'R', correct: number, total = 40): BandResult {
  if (!(total > 0)) throw new RangeError('total phải > 0');
  const c = Math.max(0, Math.min(total, Math.round(correct)));
  const scaled = total !== 40;
  const raw40 = scaled ? Math.round((c / total) * 40) : c;
  const t = rawTable(exam, skill);
  const row = t.rows.find(r => raw40 >= r.min) ?? t.rows[t.rows.length - 1]!;
  return { band: row.band, official: row.official && !scaled, scaled, raw40 };
}

// Điểm tổng IELTS: trung bình 4 kỹ năng, làm tròn tới nửa band gần nhất; .25 và .75 làm tròn lên (nguồn ieltsOverall).
export function ieltsOverall(bands: number[]): number {
  if (bands.length !== 4) throw new RangeError('cần đủ 4 kỹ năng');
  const mean = bands.reduce((s, b) => s + b, 0) / 4;
  return Math.floor(mean * 2 + 0.5 + 1e-9) / 2;
}

// ---------- VSTEP (Quyết định 729) ----------
export const VSTEP_FORMAT = {
  L: { questions: 35, minutes: 40, parts: [8, 12, 15] },
  R: { questions: 40, minutes: 60, parts: [10, 10, 10, 10] },
  W: { minutes: 60, tasks: [{ words: 120, minutes: 20 }, { words: 250, minutes: 40 }] },
  S: { minutes: 12, parts: 3 },
} as const;

export const roundHalf = (x: number): number => Math.floor(x * 2 + 0.5 + 1e-9) / 2;

// Số câu đúng → điểm thang 10 của một kỹ năng VSTEP. Đề chính thức không công bố bảng quy đổi theo số câu,
// nên đây là ước tính của app: tỉ lệ đúng × 10, làm tròn tới 0,5.
export function vstepSkillScore(correct: number, total: number): number {
  if (!(total > 0)) throw new RangeError('total phải > 0');
  const c = Math.max(0, Math.min(total, correct));
  return roundHalf((c / total) * 10);
}

export type VstepLevel = 'Bậc 3 (B1)' | 'Bậc 4 (B2)' | 'Bậc 5 (C1)' | 'Chưa đạt bậc 3';

// Điểm trung bình 4 kỹ năng (làm tròn 0,5) → bậc, theo Quyết định 729.
export function vstepLevel(scores: number[]): { mean: number; level: VstepLevel; cefr: Cefr | null } {
  if (scores.length !== 4) throw new RangeError('cần đủ 4 kỹ năng');
  const mean = roundHalf(scores.reduce((s, x) => s + x, 0) / 4);
  if (mean >= 8.5) return { mean, level: 'Bậc 5 (C1)', cefr: 'C1' };
  if (mean >= 6) return { mean, level: 'Bậc 4 (B2)', cefr: 'B2' };
  if (mean >= 4) return { mean, level: 'Bậc 3 (B1)', cefr: 'B1' };
  return { mean, level: 'Chưa đạt bậc 3', cefr: null };
}

// ---------- CEFR ↔ IELTS ↔ VSTEP ----------
export interface CefrRow {
  cefr: Cefr;
  bac: number;                         // bậc theo Thông tư 01/2014
  ielts: [number, number] | null;      // khoảng band
  ieltsOfficial: boolean;
  vstep: [number, number] | null;      // khoảng điểm trung bình VSTEP 3–5
}

export const CEFR_TABLE: CefrRow[] = [
  { cefr: 'A1', bac: 1, ielts: [1, 2.5], ieltsOfficial: false, vstep: null },
  { cefr: 'A2', bac: 2, ielts: [3, 3.5], ieltsOfficial: false, vstep: null },
  { cefr: 'B1', bac: 3, ielts: [4, 5], ieltsOfficial: true, vstep: [4, 5.5] },
  { cefr: 'B2', bac: 4, ielts: [5.5, 6.5], ieltsOfficial: true, vstep: [6, 8] },
  { cefr: 'C1', bac: 5, ielts: [7, 8], ieltsOfficial: true, vstep: [8.5, 10] },
  { cefr: 'C2', bac: 6, ielts: [8.5, 9], ieltsOfficial: true, vstep: null },
];

export function bandToCefr(band: number): Cefr {
  const b = roundHalf(band);
  for (let i = CEFR_TABLE.length - 1; i >= 0; i--) {
    const r = CEFR_TABLE[i]!;
    if (r.ielts && b >= r.ielts[0]) return r.cefr;
  }
  return 'A1';
}

// Band IELTS → điểm kỹ năng VSTEP tương ứng (suy ra qua CEFR, nội suy tuyến tính trong mỗi khoảng). Ước tính của app.
export function bandToVstep(band: number): number {
  const pts: Array<[number, number]> = [[0, 0], [3.5, 3.5], [4, 4], [5, 5.5], [5.5, 6], [6.5, 8], [7, 8.5], [8, 10], [9, 10]];
  const b = Math.max(0, Math.min(9, band));
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!, [x0, y0] = pts[i - 1]!;
    if (b <= x1) return roundHalf(y0 + ((b - x0) / (x1 - x0 || 1)) * (y1 - y0));
  }
  return 10;
}

// Ngược lại: điểm VSTEP → band IELTS (cùng các mốc). Ước tính của app.
export function vstepToBand(score: number): number {
  const pts: Array<[number, number]> = [[0, 0], [3.5, 3.5], [4, 4], [5.5, 5], [6, 5.5], [8, 6.5], [8.5, 7], [10, 8]];
  const s = Math.max(0, Math.min(10, score));
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!, [x0, y0] = pts[i - 1]!;
    if (s <= x1) return roundHalf(y0 + ((s - x0) / (x1 - x0 || 1)) * (y1 - y0));
  }
  return 8;
}
