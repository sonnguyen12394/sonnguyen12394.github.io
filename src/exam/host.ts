// Giao diện giữa phần ôn thi (mô-đun mới) và khung app hiện có (app.js).
// Mô-đun không đụng trực tiếp biến toàn cục của app: mọi thứ đi qua Host để test được và tách bạch.

export interface Host {
  state(): { x?: unknown; [k: string]: unknown };   // bản lưu chung; phần ôn thi ở state().x
  save(): void;
  render(): void;
  go(route: string): void;                          // mở màn ôn thi (route kiểu 'hub', 'scales', 'set/r-tfng')
  today(): number;                                  // số ngày từ 1/1/1970 (theo giờ của app)
  toast(msg: string): void;
  esc(s: unknown): string;
  ico(name: string): string;
  say(text: string, slow?: boolean): void;          // đọc bằng giọng của máy (chỉ dùng cho từ vựng, không dùng cho bài nghe thi)
  flag(rec: FlagRec): void;                         // ghi "Báo lỗi" vào danh sách chung của app
  rpc(fn: string, body: unknown): Promise<unknown>; // gọi hàm Supabase (chỉ khi người học đã đồng ý)
  learnerCefr(): Record<'L' | 'S' | 'R' | 'W', string | null>;   // cấp CEFR theo kỹ năng từ phần học nền tảng
  online(): boolean;
  minutes(): Record<string, number>;                // phút học thật theo ngày (chung cho cả app)
  addMinutes(m: number): void;                      // cộng phút học của phần ôn thi vào hôm nay
  markActive(): void;                               // tính hôm nay là ngày có học (chuỗi ngày)
}

export interface FlagRec {
  kind: string;
  ref: string;
  item: string;
  prompt: string;
  answer: string;
  given: string;
  reason: string;
}
