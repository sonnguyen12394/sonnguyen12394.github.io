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
  dayInfo(): { reviewItems: number; reviewMins: number; mins: number; perfDue: boolean };   // ôn đến hạn, phút học mỗi ngày, đã có bài làm thật trong 7 ngày chưa
  probe(node: string): Array<{ id: string; level: 1 | 2 | 3; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[]; en?: string }>;   // câu dò cho chẩn đoán (app.js eProbe)
}
