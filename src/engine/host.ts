// Giao diện giữa engine (mô-đun mới) và khung app (app.js), cùng khuôn với src/exam/host.ts:
// engine không đụng biến toàn cục của app; mọi thứ đi qua Host để test được và tách bạch.

export interface EHost {
  state(): { e?: unknown; [k: string]: unknown };   // bản lưu chung; phần engine ở state().e
  save(): void;
  render(): void;
  go(route: string): void;                          // mở màn engine (route kiểu 'goals', 'goal/ielts-ac-6.5')
  today(): number;                                  // số ngày từ 1/1/1970 (theo giờ của app)
  toast(msg: string): void;
  esc(s: unknown): string;
  ico(name: string): string;
  fetchJson(url: string): Promise<unknown>;
  cando(id: string): { p: number; m: number; lb: number; k: number; need: number } | null;   // tiến độ Can-Do tính từ bằng chứng (app.js cdProg)
  dayInfo(): { reviewItems: number; reviewMins: number; mins: number; perfDue: boolean; lost?: number | null };   // lost: Σ(1 − R) FSRS trên thẻ đến hạn   // ôn đến hạn, phút học mỗi ngày, đã có bài làm thật trong 7 ngày chưa
  probe(node: string): Array<{ id: string; level: 1 | 2 | 3; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[]; en?: string; say?: string; pair?: [string, string]; tip?: string }>;   // say: câu nghe (đọc bằng giọng máy)   // câu dò cho chẩn đoán (app.js eProbe)
  order?(node: string): OrderItem[];                 // v74 Bài Câu: câu để xếp lá (app.js eOrder)
  fn?(node: string): FnItem[];                       // v75 Quán Cà Phê: câu chức năng giao tiếp (app.js eFn)
  say?(text: string): void;                          // đọc to bằng giọng máy (nếu có)
  group?(node: string): GroupInfo | null;
  texts?(mode: 'read' | 'listen', lv: string): ReadText[];   // v78 / v79: bài đọc / nghe có câu hỏi ở một cấp (app.js eTexts)
  readSave?(id: string, src: 'lr' | 'unit', mode: 'read' | 'listen', score: number): void;   // lưu điểm như tab Đọc / Nghe (Can-Do)
  sayLines?(lines: Array<{ s: string; t: string }>, slow?: boolean): void;   // đọc cả bài (hai giọng A / B)
  tts?(): boolean;
  gloss?(paras: string[]): Record<string, { vi: string; learned: boolean }>;
  fixes?(node: string): FixItem[];                    // v82 Xưởng sửa câu: câu sai của một điểm ngữ pháp
  wtasks?(lv: string): WTask[];                      // v83 Thư: đề viết ở một cấp
  wcheck?(id: string, text: string): { n: number; checks: Array<[boolean, string]>; hints: Array<{ m: string; why: string; snip: string }> } | null;
  wsave?(id: string, text: string, self?: number[]): void;   // lưu như màn Viết theo đề (Can-Do viết)
  wrub?(): { crit: Array<[string, string]>; levels: string[]; ok: number };
  hasAsr?(): boolean;                                // v80–v81: trình duyệt nghe được giọng nói
  asr?(key: string, target: string, other?: string, label?: string): string;   // nút "🎙 Nói" + kết quả (HTML của app, asrBox)
  asrRes?(key: string): { p: number; k: string } | null;   // tỉ lệ từ máy nghe ra (câu) hoặc 1 / 0 (một từ của cặp âm)
  asrOff?(): void;
  asrHear?(key: string): void;                       // v84 Robot: nghe tự do một lệnh
  asrHeard?(key: string): { heard: string; alts: string[] } | null;
  asrBusy?(key: string): boolean | string;           // đang nghe (true) / lỗi (chuỗi) / không (false)
  dialogs?(lv: string): Dialog[];                    // v81 Karaoke: hội thoại ở một cấp
  rpSave?(id: string, k: 'easy' | 'ok' | 'hard'): void;   // lưu như màn Đóng vai (Can-Do nói)   // v78: nghĩa các từ của bài có trong kho từ                                   // máy có giọng đọc tiếng Anh            // v77 Câu đố ngày: chủ đề + các từ của một cụm từ (app.js eGroup)
  transfer?(node: string): ReturnType<EHost['probe']>;   // câu ở ngữ cảnh mới cho transfer (app.js eXfer): engine lọc câu đã gặp (§59)
  micro?(node: string): { card: MicroCard; qs: ReturnType<EHost['probe']> } | null;   // bí kíp 60 giây + câu kiểm tra (app.js eMicroCard)
  back?(): void;
  research?(): boolean;                              // người học đã đồng ý chia sẻ dữ liệu nghiên cứu (nhãn A/B chỉ gán khi có)                                      // quay lại bài đang làm dở (sau bí kíp)
  grades(): Array<{ by: 'rule' | 'self' | 'ai'; skill: 'W' | 'S'; day: number; v: number; scale: 'band' | 'vstep' | 'cefr'; src?: string }>;   // các lần chấm Viết/Nói (grader.ts)
  exam(): { resp: import('../exam/state.ts').Resp[]; real: import('../exam/state.ts').RealScore[] };   // câu Nghe/Đọc đã làm + điểm thi thật (phần ôn thi)
  lapse(): number | null;
  future?(): boolean;
  recall?(node: string): number | null;              // khả năng nhớ trung bình (FSRS) của các thẻ đã học thuộc nút; null nếu chưa có thẻ (§58)                               // bật mục tiêu tương lai (IELTS, VSTEP, giao tiếp); mặc định tắt                           // ngày gần nhất quên một thẻ khi đến hạn ôn
}

// Nội dung bí kíp (§52): một khái niệm, một đối chiếu (lỗi hay gặp / cách hiểu sai), 2–3 ví dụ. Đọc trong ≤ 60 giây.
export interface MicroCard { title: string; en?: string; concept: string[]; contrast?: string; mis?: string; examples: Array<[string, string]> }

// v74: câu để xếp lá (Bài Câu): tokens = đáp án theo thứ tự; distract = lá nhiễu (đáp án sai hay gặp của chính điểm ngữ pháp).
export interface OrderItem { id: string; level: 1 | 2 | 3; g: number; prompt: string; tokens: string[]; distract: string[]; why?: string }
// v75: câu chức năng giao tiếp: hear = nghe khách nói → chọn nghĩa (mức 2); reply = tình huống + văn phong → chọn câu đáp (mức 3).
// v77: từ của cụm (u:) cho Câu đố ngày. learned: đã học thẻ; due: đến hạn ôn.
export interface GroupInfo { node: string; topic: string; vi: string; words: Array<{ id: string; en: string; vi: string; pos?: string; pic?: string; learned?: boolean; due?: boolean }> }
// v78 / v79: một bài đọc / nghe. best: điểm cao nhất đã có (0–1, null = chưa làm); mine: bài của unit người học đã / đang học.
export interface ReadQ { k: string; q: string; a: string; w: string[]; why: string }
export interface ReadText { id: string; src: 'lr' | 'unit'; lv: string; title: string; tvi: string; kind: string; mine: boolean; best: number | null; paras: string[]; lines: Array<{ s: string; t: string }> | null; qs: ReadQ[] }
export interface WTask { id: string; lv: string; genre: string; en: string; vi: string; p: string; pv: string; min: number; max: number; par: number; c: string[]; u: Array<[string, string]>; m: string[]; text: string; done: boolean }
export interface FixItem { id: string; level: 4; g: 0; prompt: string; bad: string; good: string; accept: string[]; why: string; vi: string }
export interface Dialog { id: string; lv: string; title: string; vi: string; place: string; fn: string[]; names: { A: string; B: string }; lines: Array<{ s: string; t: string; vi: string }>; rp: string | null }
export interface FnItem { id: string; level: 1 | 2 | 3; g: number; kind: 'hear' | 'reply'; prompt: string; say?: string; en: string; vi: string; opts: string[]; ans: number; why?: string }
