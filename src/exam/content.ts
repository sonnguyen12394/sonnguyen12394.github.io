// Kiểu dữ liệu của nội dung ôn thi (tệp JSON trong content/exam, kiểm bằng content/schema/group.schema.json).
// Một "nhóm" (group) là một bài đọc hoặc một đoạn nghe kèm các câu hỏi của nó.

import type { ExamId, Cefr } from './scales.ts';

export type AnswerKind = 'choice' | 'multi' | 'text';

export interface QTypeInfo {
  id: string;
  vi: string;            // tên tiếng Việt
  en: string;            // tên trong đề
  skill: 'L' | 'R';
  exams: ExamId[];
  kind: AnswerKind;
  guess: number;         // xác suất đoán mò (tham số c của IRT)
}

const I = ['ielts-ac', 'ielts-gt'] as ExamId[];
const V = ['vstep'] as ExamId[];

// Danh mục dạng câu hỏi theo định dạng công khai của IELTS (British Council, IDP, Cambridge) và VSTEP (Quyết định 729).
export const QTYPES: QTypeInfo[] = [
  { id: 'r-mcq', vi: 'Trắc nghiệm một đáp án', en: 'Multiple choice', skill: 'R', exams: I, kind: 'choice', guess: 0.25 },
  { id: 'r-mcq2', vi: 'Trắc nghiệm chọn nhiều đáp án', en: 'Multiple choice (choose TWO/THREE)', skill: 'R', exams: I, kind: 'multi', guess: 0.1 },
  { id: 'r-tfng', vi: 'Đúng / Sai / Không có thông tin', en: 'True / False / Not Given', skill: 'R', exams: I, kind: 'choice', guess: 0.33 },
  { id: 'r-ynng', vi: 'Có / Không / Không có thông tin (quan điểm tác giả)', en: 'Yes / No / Not Given', skill: 'R', exams: I, kind: 'choice', guess: 0.33 },
  { id: 'r-headings', vi: 'Chọn tiêu đề cho đoạn', en: 'Matching headings', skill: 'R', exams: I, kind: 'choice', guess: 0.12 },
  { id: 'r-info', vi: 'Tìm đoạn chứa thông tin', en: 'Matching information', skill: 'R', exams: I, kind: 'choice', guess: 0.15 },
  { id: 'r-features', vi: 'Nối đặc điểm (người, mốc thời gian…)', en: 'Matching features', skill: 'R', exams: I, kind: 'choice', guess: 0.2 },
  { id: 'r-endings', vi: 'Nối nửa câu', en: 'Matching sentence endings', skill: 'R', exams: I, kind: 'choice', guess: 0.15 },
  { id: 'r-sentence', vi: 'Hoàn thành câu', en: 'Sentence completion', skill: 'R', exams: I, kind: 'text', guess: 0 },
  { id: 'r-summary', vi: 'Hoàn thành tóm tắt (lấy từ bài)', en: 'Summary completion', skill: 'R', exams: I, kind: 'text', guess: 0 },
  { id: 'r-summary-box', vi: 'Hoàn thành tóm tắt (chọn từ khung)', en: 'Summary completion (from a list)', skill: 'R', exams: I, kind: 'choice', guess: 0.12 },
  { id: 'r-notes', vi: 'Hoàn thành ghi chú / bảng / sơ đồ quy trình', en: 'Note / table / flow-chart completion', skill: 'R', exams: I, kind: 'text', guess: 0 },
  { id: 'r-diagram', vi: 'Điền nhãn sơ đồ', en: 'Diagram label completion', skill: 'R', exams: I, kind: 'text', guess: 0 },
  { id: 'r-short', vi: 'Trả lời ngắn', en: 'Short-answer questions', skill: 'R', exams: I, kind: 'text', guess: 0 },
  { id: 'l-form', vi: 'Điền mẫu đơn / ghi chú / bảng', en: 'Form / note / table completion', skill: 'L', exams: I, kind: 'text', guess: 0 },
  { id: 'l-sentence', vi: 'Hoàn thành câu / tóm tắt', en: 'Sentence / summary completion', skill: 'L', exams: I, kind: 'text', guess: 0 },
  { id: 'l-flow', vi: 'Sơ đồ quy trình', en: 'Flow-chart completion', skill: 'L', exams: I, kind: 'text', guess: 0 },
  { id: 'l-short', vi: 'Trả lời ngắn', en: 'Short-answer questions', skill: 'L', exams: I, kind: 'text', guess: 0 },
  { id: 'l-mcq', vi: 'Trắc nghiệm một đáp án', en: 'Multiple choice', skill: 'L', exams: I, kind: 'choice', guess: 0.33 },
  { id: 'l-mcq2', vi: 'Trắc nghiệm chọn hai đáp án', en: 'Multiple choice (choose TWO)', skill: 'L', exams: I, kind: 'multi', guess: 0.1 },
  { id: 'l-matching', vi: 'Nối thông tin', en: 'Matching', skill: 'L', exams: I, kind: 'choice', guess: 0.15 },
  { id: 'l-map', vi: 'Điền nhãn bản đồ / sơ đồ', en: 'Plan / map / diagram labelling', skill: 'L', exams: I, kind: 'choice', guess: 0.12 },
  { id: 'v-l1', vi: 'VSTEP Nghe phần 1: thông báo, hướng dẫn ngắn', en: 'Part 1: announcements & instructions', skill: 'L', exams: V, kind: 'choice', guess: 0.25 },
  { id: 'v-l2', vi: 'VSTEP Nghe phần 2: hội thoại', en: 'Part 2: conversations', skill: 'L', exams: V, kind: 'choice', guess: 0.25 },
  { id: 'v-l3', vi: 'VSTEP Nghe phần 3: bài nói, bài giảng', en: 'Part 3: talks & lectures', skill: 'L', exams: V, kind: 'choice', guess: 0.25 },
  { id: 'v-r', vi: 'VSTEP Đọc: trắc nghiệm theo bài đọc', en: 'Reading passages', skill: 'R', exams: V, kind: 'choice', guess: 0.25 },
];

export const QT: Record<string, QTypeInfo> = Object.fromEntries(QTYPES.map(q => [q.id, q]));

export interface Option {
  k: string;    // chữ cái hoặc từ khoá (TRUE/FALSE/NOT GIVEN, i/ii/iii…)
  t: string;
}

export interface TextAnswer {
  accept: string[];       // mọi cách viết được chấp nhận (khác nhau về chữ số/chữ, gạch nối, Anh/Mỹ…)
}

export type Answer = string | string[] | TextAnswer;

export interface Evidence {
  p: number;              // chỉ số đoạn (bài đọc) hoặc dòng (lời thoại), tính từ 0
  s: string;              // trích nguyên văn câu chứa đáp án (phải nằm trong đoạn/dòng đó)
}

export interface Item {
  id: string;
  q: string;              // câu hỏi / mệnh đề / câu có chỗ trống (chỗ trống ghi ___)
  opts?: Option[];        // phương án riêng của câu (trắc nghiệm)
  ans: Answer;
  limit?: number;         // số từ tối đa (câu điền), ví dụ NO MORE THAN TWO WORDS → 2
  num?: boolean;          // "AND/OR A NUMBER": được thêm một số ngoài giới hạn từ
  b: number;              // độ khó dự kiến lúc soạn (band IELTS)
  ev: Evidence;
  why: string;            // vì sao đáp án đúng (tiếng Việt)
  wrong?: Record<string, string>;   // vì sao từng phương án sai (khoá = k của phương án) hoặc lỗi hay gặp với câu điền
  trap?: string;          // bẫy hay gặp (tiếng Việt)
  tag?: string;           // nhóm kỹ năng con (paraphrase, số, chính tả…)
}

export interface ScriptLine {
  sp: string;             // người nói (tên hoặc A/B)
  t: string;
}

export interface Audio {
  file: string;           // đường dẫn tệp âm thanh tốc độ thi
  slow?: string;          // bản chậm
  noise?: string;         // bản có tiếng ồn nền
  dur: number;            // giây
  voices: string[];       // giọng đọc dùng (ghi để minh bạch nguồn âm thanh)
}

export interface Group {
  id: string;
  kind: 'reading' | 'listening';
  exams: ExamId[];
  qtype: string;          // dạng câu hỏi chính của nhóm
  level: Cefr;
  band: number;           // độ khó văn bản dự kiến
  mode: 'place' | 'practice' | 'mock';   // dùng cho kiểm tra đầu vào / luyện theo dạng / đề thi thử
  title: string;
  instr: string;          // lời dẫn như trong đề (tiếng Anh)
  paras?: string[];       // bài đọc: các đoạn (có thể bắt đầu bằng nhãn "A ")
  script?: ScriptLine[];  // bài nghe: lời thoại
  audio?: Audio;
  vi?: string[];          // bản dịch tiếng Việt, khớp số đoạn/dòng
  options?: Option[];     // phương án dùng chung (danh sách tiêu đề, khung từ, nhãn bản đồ…)
  figure?: string;        // id hình (bản đồ, sơ đồ) vẽ bằng SVG từ dữ liệu
  voices?: Record<string, string>;   // người nói → giọng Kokoro dùng khi tạo âm thanh
  allow?: string[];       // từ vượt cấp được phép (thuật ngữ của chủ đề), người soạn phải liệt kê rõ
  items: Item[];
  tips?: string[];        // mẹo riêng cho bài này (tiếng Việt)
}

export function answerKind(it: Item, g: Group): AnswerKind {
  if (typeof it.ans === 'string') return 'choice';
  if (Array.isArray(it.ans)) return 'multi';
  void g;
  return 'text';
}

export function itemOptions(it: Item, g: Group): Option[] {
  return it.opts ?? g.options ?? [];
}

export function sourceText(g: Group): string[] {
  return g.kind === 'reading' ? (g.paras ?? []) : (g.script ?? []).map(l => l.t);
}
