# App làm được gì khi không dùng AI lúc chạy (15/10/2026, v134)

Đây là bảng chấm theo yêu cầu của người sáng lập: app học tiếng Anh làm tốt tới đâu nếu **không gọi AI lúc người học chơi**. AI vẫn được dùng ở khâu soạn nội dung (soạn câu, tạo âm thanh Kokoro, soát độc lập), vì người học không cần mạng hay khoá API cho khâu đó.

Bảng này **không thay** `docs/SCORECARD-A2.md` (bảng chấm chính của hướng Chiến Binh Chữ). Nó chỉ nhìn phần học, đo, chấm.

**Tự chấm khi đọc mã và chạy công cụ kiểm, chưa có người thật kiểm.** Điểm đo mức app làm được việc đó, chưa đo hiệu quả học trên người.

## 1. Đính chính so với lần chấm đầu (trong cuộc trò chuyện 15/10)

Lần chấm đầu chỉ dựa trên đọc lướt. Đọc kỹ mã thì thấy ba việc tưởng "cần làm" **đã có sẵn**, nên không làm lại:

- **Ngữ pháp, viết câu có kiểm soát:** mỗi điểm ngữ pháp đã có câu gõ (`ty`), câu sửa lỗi (`fx`), xếp câu (`or`), và câu tự đặt được kiểm bằng biểu thức `key` (`app.js`, "Có dùng cấu trúc của bài").
- **Phát âm âm cuối:** 26 bài cặp âm đã có back–bag, ten–tent, bet–bed, light–night, late–let.
- **Sổ hiểu nhầm và quyền riêng tư của mic:** `misconceptions()` đã hiện ở `whyview.ts`, `micro.ts`. Trước khi bật nhận giọng, app đã hỏi ý và nói rõ trình duyệt có thể gửi âm thanh đi (`asrStart`).

Lần đầu tôi cho "Riêng tư" 9 điểm và đề xuất thêm thông báo mic. Thực ra thông báo đó đã có, nên điểm đúng là **10**.

## 2. Bảng chấm cấp A2 (đích hiện tại)

| # | Tiêu chí | Trước v134 | Sau v134 | Trần không AI | Đã làm ở v134 / còn thiếu |
|---|---|---|---|---|---|
| 1 | Từ vựng | 8 | 8 | 10 | Không đổi. Lên 10 cần số đo nhớ sau 30 ngày trên người thật |
| 2 | Ngữ pháp | 7 | 7 | 9 | Không đổi (phần viết câu có kiểm soát đã có sẵn) |
| 3 | Đọc theo dạng A2 Key | 6 | **8** | 10 | **155 câu luyện** đúng 5 phần Đọc A2 Key. Phần 1 vẫn dễ đoán khi không có bài (72%, xem mục 4) |
| 4 | Nghe | 6 | **8** | 9 | **150 câu luyện** đúng 5 phần Nghe, Kokoro nhiều giọng, có bản chậm, nghe lại được |
| 5 | Viết: luyện | 6 | **7** | 7 | Máy dò "đủ ý cần có" cho 18 đề A1 / A2; bài mẫu 3 mức cho 10 đề A2; 2 đề đúng dạng A2 Key |
| 6 | Viết: đo | 3 | 3 | 5 | Chưa làm: chưa có cặp điểm thật, Viết chưa vào trận cổng |
| 7 | Nói: luyện | 5 | 5 | 6 | Thêm 2 đề dạng A2 Key (Phần 1, Phần 2); chưa đủ để lên điểm |
| 8 | Nói: đo | 2 | 2 | 3 | Không đổi |
| 9 | Kết luận đạt cấp (Đọc + Nghe) | 5 | **6** | 9 | Thêm 2 trận cổng mỗi cấp A1, A2 (4 trận / cấp). Cả 8 trận đã được soát chéo bởi phiên độc lập. Độ khó câu vẫn là ước đoán, chưa hiệu chỉnh |
| 10 | Cá nhân hoá | 7 | 7 | 9 | Sân tập gợi ý phần yếu nhất theo lần làm đầu |
| 11 | Phản hồi, giải thích lỗi | 6 | **7** | 7 | Mọi câu mới có lời giải thích tiếng Việt cho từng phương án sai |
| 12 | Chạy không mạng, chi phí, riêng tư | 9 → **10** (đính chính) | 10 | 10 | Đã có từ trước |

**Trung bình 9 tiêu chí kỹ năng:** 5,3 → **6,0**. Trần không AI của A2 là **7,6**.

## 3. Theo cấp

| Cấp | Trước | Sau v134 | Đổi gì |
|---|---|---|---|
| Pre-A1 | 4,6 | 4,6 | Chưa làm (đợt 2) |
| A1 | 5,3 | **5,6** | 4 trận cổng, máy dò đủ ý cho 8 đề Viết |
| A2 | 5,3 | **6,0** | Như bảng trên |
| B1 | 5,7 | 5,7 | Người nhắm B1 cũng vào được Sân tập A2 Key; cổng B1 chưa thêm |
| B2 | 4,3 | 4,3 | Ghi "🚧 chưa hoàn thiện" ở màn chọn mục tiêu |
| C1 | 3,7 | 3,7 | Như trên |
| C2 | 3,0 | 3,0 | Như trên |

## 4. Soát nội dung mới: kết quả thật

Quy trình theo `content/AUTHORING.md`. Mọi phiên soát là phiên AI độc lập, chỉ được đọc đúng tệp xuất ra, không đọc kho.

**Phép thử không có bài** đo việc người đoán chỉ thấy câu hỏi và phương án mà vẫn trả lời đúng. Ngưỡng với 3 phương án là ≤ 55% (ngẫu nhiên 33%). Phần 2 Đọc và phần 5 Nghe dùng danh sách chung, nên công cụ không xuất.

| Phần | Vòng 1 | Vòng 2 | Vòng 3 | Vòng 4 | Vòng 5 |
|---|---|---|---|---|---|
| Đọc 1 (biển báo) | 78% | 68% | 65% | 82% | **72% (chưa đạt)** |
| Đọc 3 (bài dài) | 88% | 63% | 47% | 43% | — |
| Đọc 4 (chọn từ) | 50% | 53% | 45% | — | — |
| Nghe 1 | 50% | 53% | — | — | — |
| Nghe 3 | 63% | 52% | — | — | — |
| Nghe 4 | 70% | 50% | — | — | — |

**Soát có bài:** ở mọi vòng, phiên soát làm lại toàn bộ câu và khớp 100% đáp án (298/298 ở vòng 1 và 2). Các câu có hai đáp án bảo vệ được, chỗ trống nhận nhiều từ, tiếng Anh gượng đều đã sửa theo ghi chú của phiên soát.

**Gốc rễ tìm ra qua các vòng** (nên ghi vào cách soạn cho lần sau):
1. Đáp án là phương án "đáng kể chuyện" hoặc **diễn đạt khái quát** ("Someone she knew needed help"), còn phương án nhiễu cụ thể. Sửa bằng cách viết ba phương án cùng một kiểu câu.
2. Đáp án là phương án **"ở giữa"**, chung một chi tiết với mỗi phương án nhiễu. Đây là lỗi "hội tụ" đã có trong `AUTHORING.md`; viết phương án song song mà không để ý thì lại tạo ra lỗi này.
3. Câu "Biển báo nói gì?" buộc phương án phải là các bản **bóp méo** của cùng một câu (phủ định, nói quá, tráo vai), nên dễ nhận ra. Hỏi **một giá trị cụ thể** (giờ, nơi, giá) mà cả ba giá trị đều có trong bài thì khó đoán hơn.
4. Với biển báo, **hiểu biết đời thường** vẫn đoán được nhiều câu (taxi ra sân bay, để thuốc tránh nắng). Đọc phần 1 vẫn 72% sau 5 vòng. Đây là phần luyện, không dùng để kết luận, nên tôi dừng ở đây và ghi rõ.
5. Bài luyện đầu tiên **trùng khung tình huống** với trận cổng (bể bơi đóng cửa làm vệ sinh, một năm không điện thoại, "My first job" muốn làm A nhưng phải làm B). Khi soạn tự do, người soạn (kể cả AI) quay về cùng những tình huống A2 quen thuộc. Đã thay 6 bài. Lần sau phải đối chiếu đề tài với mọi trận cổng **trước khi** soạn.

Kết quả phép thử cho 4 trận cổng mới: xem `content/exam/gate/README.md`.

## 5. Còn lại

Tôi làm được:
- Đọc phần 1: thêm một vòng sửa, hoặc chấp nhận vì đây là phần luyện.
- Pre-A1 và B1 (đợt 2): cổng tranh Pre-A1, chuyển câu B1 sang dạng B1 Preliminary, thêm 2 cổng B1.
- Đưa Viết vào trận cổng A2 (chấm bằng luật + tự chấm, trần tin cậy Vừa).

Cần người sáng lập:
1. Chơi Sân tập và trận cổng thật, để có số liệu hiệu chỉnh độ khó (IRT).
2. Làm một đề mẫu A2 Key chính thức ngoài app, rồi ghi điểm ở mục 🎓 Chứng chỉ.
3. Nhờ một người chấm thật bài Viết A2 một lần, để có cặp điểm thật cho `grader.ts`.
