// Kiểu dữ liệu của engine học theo mục tiêu (docs/SPEC.md, "Quyết định kỹ thuật" §1).
// Nội dung engine là dữ liệu trong content/engine/ (nodes.json, edges.json, goals/*.json), sinh bởi tools/engine-gen.ts.

// Mức mastery 1–5: nhận ra, hiểu, nhớ ra, dùng có kiểm soát, dùng tự do (spec mục 8).
export type Level = 1 | 2 | 3 | 4 | 5;
export const LEVEL_VI: Record<Level, string> = { 1: 'Nhận ra', 2: 'Hiểu', 3: 'Nhớ ra', 4: 'Dùng có kiểm soát', 5: 'Dùng tự do' };

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export const CEFRS: Cefr[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Mảng của nút: nền tảng (từ vựng, ngữ pháp, phát âm), bốn kỹ năng, dạng bài thi.
export type Area = 'voc' | 'gra' | 'pro' | 'lis' | 'rd' | 'wr' | 'spk' | 'task';
export type Skill = 'L' | 'R' | 'W' | 'S';
export type Ctx = 'daily' | 'work' | 'travel' | 'study' | 'exam';
export type NodeKind = 'cando' | 'vocab' | 'grammar' | 'task';

// Hoạt động học sẵn có trong app mà nút dẫn tới: `at` là thuộc tính HTML mở đúng màn (data-unit="…", data-gp="…", data-dlg="…").
export interface Act { at: string; t: string }

export interface Node {
  id: string;            // cd:<CANDO id> | u:<unit id> | g:<grammar point id> | pa:<bài Pre-A1> | x:<dạng câu thi> | xw:/xs:<bài Viết/Nói thi>
  kind: NodeKind;
  area: Area;
  skill: Skill | null;
  cefr: Cefr | null;     // cấp tham chiếu (dạng bài thi: null)
  vi: string;
  en?: string;
  ctx: Ctx[];
  acts: Act[];
  minutes: number;       // phút ước tính để đạt nút từ đầu (dùng xếp ưu tiên lộ trình)
}

export type EdgeType = 'hard' | 'soft';
// from → to: muốn đạt `from` thì `to` là tiền đề (cứng: phải đạt trước; mềm: giúp học nhanh hơn).
export interface Edge { from: string; to: string; type: EdgeType; w: number }

export type ReqType = 'foundation' | 'skill' | 'performance';
export interface Req { node: string; level: Level; type: ReqType }

export type GoalKind = 'cefr' | 'ielts-ac' | 'ielts-gt' | 'vstep' | 'comm';
// Spec v2.4 §7: MVP chỉ triển khai CEFR (Pre-A1 → C2). Các Target Model khác giữ dữ liệu ở trạng thái "future"
// (ẩn khỏi người học, không vào lộ trình) cho tới mốc M10 — kiểm chứng engine mở rộng được.
export type GoalStatus = 'active' | 'future';
export interface Goal {
  id: string;            // ví dụ ielts-ac-6.5
  version: string;       // Target Model có phiên bản (spec mục 5): "1.0"
  kind: GoalKind;
  vi: string;
  target: string;        // "Pre-A1", "B1", "6.5", "daily"…
  status: GoalStatus;
  cefr: Cefr | null;     // cấp tham chiếu của mục tiêu
  req: Req[];
}

export interface Graph { nodes: Node[]; edges: Edge[]; goals: Goal[] }
