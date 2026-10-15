# Đường A2: test app theo một đường duy nhất (v135, 15/10/2026)

Người sáng lập thấy app quá nhiều mục, không biết test từ đâu. Mục tiêu **đã là A2** (SPEC mục 12); thứ cần thu nhỏ là **bề mặt app**, không phải mục tiêu. Tệp này là bản đồ một trang: bấm gì, thấy gì, chấm gì. Tự soạn, **chưa người thật kiểm**.

## Vì sao ngợp (gốc rễ)
1. Mốc 1 cố ý "chưa gỡ gì cũ" (`RA-SOAT-v133.md` §4) nên sảnh có cả phần mới (⚔️, 🔨) lẫn phần cũ (bản đồ, truyện, đèn lồng, Túi chữ, kho báu): khoảng 20 thứ bấm được.
2. Ba hệ đồ cùng hiện: "Lực chữ" với ô Mũ / Kính / Bút / Áo (v132), đồ buff game (v128), Vũ khí của trận (mới). Chỉ Vũ khí là đồ của vòng A2.
3. Trùng tên: "Luyện tay" vừa là xưởng cũ trong Túi chữ, vừa là trận Luyện tay 1/2.
4. Kịch bản test cũ tả trận Gunny, trận thật đã là chạy né (v134).

## Đã làm ở v135
- **Sảnh A2 (mặc định bật):** sảnh chỉ còn ⚔️ Vào trận, 🔨 Thợ rèn gợi ý, 🗡️ Chiến Binh, 🪙, nhạc, thẻ 🎯 mục tiêu. Phần cũ ẩn bằng CSS (`html.a2`), **không xoá mã**, không mất tiến độ. Bật lại: nút 🧭 cuối khối sảnh hoặc Tôi → Cài đặt → Tính năng. Mã: `A2LOBBY()` trong `app.js`, nút `.a2tog` trong `worldview.ts`, CSS trong `index.html`. Test: `test/e2e/a2lobby.spec.ts`.
- `docs/PLAYTEST.md` Phần 0 viết lại cho trận chạy né + sảnh A2.

## Ba câu hỏi cần trả lời (theo thứ tự)

| # | Câu hỏi | Tiêu chí | Cách trả lời | Trạng thái |
|---|---|---|---|---|
| 1 | Trận có vui tự thân không? | C1 | 15 phút theo `PLAYTEST.md` Phần 0, chấm C1 | Chờ bạn chơi |
| 2 | Thua → rèn → thắng có tự nhiên không? | C3, C2 | Cùng buổi trên, chấm C2, C3 | Chờ bạn chơi |
| 3 | App đo tiến tới A2 có đúng không? | C6, C7 | Chơi lò đều nhiều ngày; khi app báo gần A2 thì rèn Bảo vật khu (trận cổng) rồi làm đề mẫu Cambridge A2 Key ngoài app, nhập điểm ở 🎓 Chứng chỉ | Chưa sẵn sàng (xem dưới) |

Câu 1 và 2 làm được ngay. Câu 3 cần nhiều tuần học thật, và có việc phải làm trước.

## Đường bấm (15 phút đầu)
1. Sảnh → **⚔️ Vào trận** (Luyện tay 1 → Luyện tay 2 → boss Tiếng Ồn Rè).
2. Thua boss → màn kết → **🔨 Rèn Vũ khí: vào lò …**
3. Trả lời câu ở lò → có ✨ tinh hoa (chỉ từ câu đúng).
4. Về sảnh → **🔨 Rèn Vũ khí bậc …** (mặc được khi chỉ số Từ vựng thật đủ).
5. **⚔️** đánh lại boss.

Bỏ qua mọi thứ khác. Nếu lỡ bấm 🧭 Hiện đủ mục: bấm 🎯 Về sảnh A2 gọn.

## Chưa làm được (đừng tìm trong app)
- **Bảo vật khu A2** chưa gắn vào trận (mốc 2). Trận cổng A2 hiện chỉ có 2 đề Đọc + Nghe, chưa soát chéo, chưa có Viết / Nói. Rớt 2 lần là hết đề lạ, nên **chưa mở cổng A2** cho tới khi soát chéo + thêm đề (mốc 2).
- Mới có **một ô đồ rèn được (Vũ khí)**; 6 ô khác chưa rèn.
- Đồ cùn / mài theo trí nhớ (C9) chưa có.
- Thanh đầu trang vẫn ghi "English Ladder", "hôm nay x/20 câu" (đổi tên ở mốc 3).

## Sau buổi chơi
- C1 thật < 6: sửa trận trước mọi việc khác.
- C1 ≥ 6: làm mốc 2 theo `KE-HOACH-A2.md` §3, ưu tiên soát chéo + thêm đề cổng A2 (rủi ro lớn nhất cho đích A2 nằm ở C7).
