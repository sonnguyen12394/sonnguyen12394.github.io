// Đề thi thử đầy đủ (yêu cầu 6.3, 5.5): định dạng từng kỳ thi, mở rộng "phần" của đề thành nhóm câu thường, đánh số câu,
// chấm theo bảng quy đổi chính thức và điều chỉnh bảng của từng đề khi có dữ liệu thật.
//
// Nguồn đề: content/exam/mock/<đề>/{L,R}.json là danh sách PHẦN (một bài đọc hoặc một đoạn nghe). Một phần có thể có nhiều
// bộ câu (sets) khác dạng, như đề thật (câu 1–6 điền đơn, câu 7–10 trắc nghiệm trên cùng một đoạn nghe). expandPart biến mỗi
// bộ thành một Group thường dùng chung ngữ liệu, nên máy chấm, phản hồi, sổ lỗi sai và IRT dùng lại nguyên vẹn.
// Hàm ở đây thuần (không DOM), dùng chung cho build (tools/build.mjs), kiểm nội dung (src/content/check.ts) và app.

import type { Group, Item, Option, ScriptLine, Audio } from './content.ts';
import type { ExamId, Cefr } from './scales.ts';
import { ieltsBand, vstepSkillScore } from './scales.ts';
import { markItem, marksOf, type Given, type Mark } from './score.ts';

export type MSkill = 'L' | 'R';

export interface MockSet {
  qtype: string;
  instr: string;
  options?: Option[];
  figure?: string;
  items: Item[];
}

export interface MockPart {
  id: string;               // m-<đề>-<l|r><số>, ví dụ m-a1-l1
  kind: 'reading' | 'listening';
  exams: ExamId[];
  level: Cefr;
  band: number;
  title: string;
  paras?: string[];
  script?: ScriptLine[];
  audio?: Audio;
  vi?: string[];
  voices?: Record<string, string>;
  allow?: string[];
  tips?: string[];
  sets: MockSet[];
}

export interface MockTest {
  id: string;               // a1…a6 (IELTS Academic), g1…g3 (General Training), v1…v6 (VSTEP)
  exam: ExamId;
  title: string;
  L: string[];              // id các phần Nghe theo thứ tự (đề GT dùng phần Nghe của đề Academic cùng số, như đề thật)
  R: string[];
  adj?: Partial<Record<MSkill, number>>;   // điều chỉnh số câu đúng của đề (mặc định 0), xem mockAdj
}

// Định dạng theo nguồn công khai: IELTS (British Council, IDP, Cambridge), VSTEP (Quyết định 729/QĐ-BGDĐT).
// parts: số điểm của từng phần theo thứ tự (null = chỉ kiểm tổng). checkSecs: thời gian soát sau khi nghe xong.
export interface SkillFormat { marks: number; minutes: number; parts: number[] | null; checkSecs?: number }
export const MOCK_FORMAT: Record<ExamId, Record<MSkill, SkillFormat>> = {
  'ielts-ac': {
    L: { marks: 40, minutes: 30, parts: [10, 10, 10, 10], checkSecs: 120 },
    R: { marks: 40, minutes: 60, parts: null },     // 3 bài, 13–14 câu mỗi bài (kiểm riêng ở checkMock)
  },
  'ielts-gt': {
    L: { marks: 40, minutes: 30, parts: [10, 10, 10, 10], checkSecs: 120 },
    R: { marks: 40, minutes: 60, parts: null },     // 3 phần: văn bản ngắn, nơi làm việc, bài dài
  },
  vstep: {
    L: { marks: 35, minutes: 40, parts: [1, 1, 1, 1, 1, 1, 1, 1, 4, 4, 4, 5, 5, 5], checkSecs: 120 },
    R: { marks: 40, minutes: 60, parts: [10, 10, 10, 10] },
  },
};

const LETTERS = 'abcdefgh';

export function setGroupId(p: MockPart, i: number): string {
  return p.sets.length > 1 ? `${p.id}-${LETTERS[i]}` : p.id;
}

// Một phần → các nhóm câu thường (mode 'mock'), giữ thứ tự bộ câu.
export function expandPart(p: MockPart): Group[] {
  return p.sets.map((s, i) => {
    const g: Group = {
      id: setGroupId(p, i), kind: p.kind, exams: p.exams, qtype: s.qtype, level: p.level, band: p.band, mode: 'mock',
      title: p.title, instr: s.instr, items: s.items, part: p.id,
    };
    if (p.paras) g.paras = p.paras;
    if (p.script) g.script = p.script;
    if (p.audio) g.audio = p.audio;
    if (p.vi) g.vi = p.vi;
    if (p.voices) g.voices = p.voices;
    if (p.allow) g.allow = p.allow;
    if (p.tips) g.tips = p.tips;
    if (s.options) g.options = s.options;
    if (s.figure) g.figure = s.figure;
    return g;
  });
}

export const isMockPart = (x: unknown): x is MockPart => !!x && typeof x === 'object' && Array.isArray((x as MockPart).sets);

// Các nhóm của một kỹ năng trong đề, đúng thứ tự đề. Thiếu nhóm nào thì trả mảng rỗng ở vị trí đó (bên gọi báo lỗi).
export function testGroups(t: MockTest, sk: MSkill, groups: Group[]): Group[][] {
  return t[sk].map(pid => groups.filter(g => g.part === pid));
}

// Đánh số câu như đề thật: 1…40 liên tục qua các phần; câu "chọn TWO" chiếm hai số.
export function numbering(parts: Group[][]): Map<string, [number, number]> {
  const out = new Map<string, [number, number]>();
  let n = 1;
  for (const gs of parts) for (const g of gs) for (const it of g.items) { const k = marksOf(it); out.set(it.id, [n, n + k - 1]); n += k; }
  return out;
}

export const numLabel = (r: [number, number] | undefined): string => (r ? (r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`) : '');

// Gói nội dung cần tải để làm một kỹ năng của đề (đề GT dùng phần Nghe của đề Academic: gói m-a1).
export function packsFor(t: MockTest, sk: MSkill): string[] {
  return [...new Set(t[sk].map(pid => 'm-' + ((/^m-([a-z0-9]+)-/.exec(pid) ?? [])[1] ?? t.id)))];
}

export interface MockScore {
  got: number;              // số câu đúng (điểm thô)
  of: number;
  adj: number;              // điều chỉnh của đề (số câu)
  score: number;            // IELTS: band; VSTEP: điểm thang 10
  official: boolean;        // IELTS: dòng bảng là của nguồn chính thức và không điều chỉnh
  marks: Record<string, Mark>;
  byType: Array<{ qtype: string; got: number; of: number }>;   // xếp tỉ lệ đúng thấp lên đầu
}

export function scoreMock(t: MockTest, sk: MSkill, parts: Group[][], given: Record<string, Given>, adj = t.adj?.[sk] ?? 0): MockScore {
  const marks: Record<string, Mark> = {}, types = new Map<string, { got: number; of: number }>();
  let got = 0, of = 0;
  for (const gs of parts) for (const g of gs) for (const it of g.items) {
    const m = markItem(it, g, given[it.id]);
    marks[it.id] = m; got += m.got; of += m.of;
    const r = types.get(g.qtype) ?? { got: 0, of: 0 };
    r.got += m.got; r.of += m.of; types.set(g.qtype, r);
  }
  const raw = Math.max(0, Math.min(of, got + adj));
  let score: number, official = false;
  if (t.exam === 'vstep') score = vstepSkillScore(raw, of || 1);
  else { const b = ieltsBand(t.exam, sk, raw, of || 40); score = b.band; official = b.official && adj === 0; }
  const byType = [...types].map(([qtype, r]) => ({ qtype, ...r })).sort((a, b) => a.got / a.of - b.got / b.of || b.of - a.of);
  return { got, of, adj, score, official, marks, byType };
}

// Điều chỉnh bảng quy đổi theo dữ liệu (5.5): khi mọi câu của các đề cùng kỳ thi và kỹ năng đều có ≥ minN lượt trả lời
// ẩn danh, số câu đúng kỳ vọng của một đề = tổng tỉ lệ đúng thực tế; đề khó hơn trung bình được cộng phần chênh (làm tròn).
// Chưa đủ dữ liệu thì giữ adj soạn sẵn (0): độ khó dự kiến giữa các đề đã được kiểm lệch ≤ 0,5 band lúc soạn (checkMock).
export function mockAdj(tests: Array<{ id: string; items: string[] }>, p: (id: string) => { n: number; p: number } | undefined, minN = 50): Record<string, number> | null {
  if (tests.length < 2) return null;
  const exp: number[] = [];
  for (const t of tests) {
    let s = 0;
    for (const id of t.items) { const st = p(id); if (!st || st.n < minN) return null; s += st.p; }
    exp.push(s);
  }
  const mean = exp.reduce((a, b) => a + b, 0) / exp.length;
  return Object.fromEntries(tests.map((t, i) => [t.id, Math.round(mean - exp[i]!)]));
}

// Độ khó dự kiến trung bình (band) của một kỹ năng trong đề, theo điểm: dùng cho luật cân bằng giữa các đề.
export function meanB(parts: Group[][]): number {
  let s = 0, n = 0;
  for (const gs of parts) for (const g of gs) for (const it of g.items) { const k = marksOf(it); s += it.b * k; n += k; }
  return n ? s / n : 0;
}
