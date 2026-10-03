# English Ladder

Ôn VSTEP và IELTS miễn phí 100% cho người Việt tự học: band ước tính từng kỹ năng kèm sai số, kế hoạch tới ngày thi, giải thích bằng tiếng Việt. Nền tảng tiếng Anh A1 → C2 đi kèm. Không cần tài khoản, không quảng cáo của bên thứ ba. Bản thử trên web có cơ chế kiểu Duolingo ở dạng giả lập, chưa thu tiền: năng lượng theo lượt (bài mới/luyện tập tốn 1 lượt, hồi theo giờ; ôn đến hạn, chẩn đoán, bài làm thật, đề thi thử không tốn), gói Super là công tắc trong Cài đặt, ô quảng cáo giả lập ở màn kết quả.

👉 **https://sonnguyen12394.github.io/**

## Có gì

- **Kế hoạch và sổ lỗi sai (v38):** lịch từng ngày tới ngày thi (`src/exam/plan.ts`), cảnh báo không kịp kèm đề xuất; sổ lỗi sai ôn theo FSRS-5 (`src/exam/notebook.ts`).
- **Kiểm tra đầu vào (v37):** Đọc + Nghe thích ứng ≤ 15 phút (mô hình 3PL, ≤ 12 câu mỗi kỹ năng), kho 96 câu band 3–8,5 có giải thích tiếng Việt từng phương án; âm thanh tạo sẵn (`tools/audio.cjs`, Kokoro giọng Anh/Mỹ) trong `a/`. Soát độc lập: `tools/review-export.mjs` → phiên AI khác tự làm → `tools/review-compare.mjs`.
- **Band ước tính (v36):** Nghe, Đọc, Viết, Nói kèm khoảng sai số (độ tin cậy 80%), cấp CEFR, quy đổi IELTS ↔ VSTEP; ghi điểm thi thật; trang độ chính xác (công bố khi đủ 100 cặp mỗi kỹ năng); chia sẻ thống kê ẩn danh tự chọn, có kiểm tuổi.
- **Ôn thi (v35):** chọn IELTS Academic, IELTS General Training hoặc VSTEP; trang “Cách tính điểm và nguồn” với bảng đổi số câu đúng → band (nguồn IDP/ielts.org), thang VSTEP theo Quyết định 729/QĐ-BGDĐT, CEFR ↔ IELTS ↔ VSTEP, mô hình ước tính và giới hạn của app.

- Từ vựng A1 → C2 và danh sách từ học thuật (AWL), ôn cách quãng để nhớ lâu.
- Ngữ pháp, chức năng giao tiếp, hội thoại, đọc, viết, phát âm theo khung CEFR, kèm các câu "can-do": biết mình làm được gì ở từng cấp.
- Đạt cấp CEFR theo 6 nhóm năng lực (từ vựng, ngữ pháp, phát âm, chức năng, kỹ năng, dùng thực tế): ≥ 5/6 nhóm đạt 80% và không nhóm nào dưới 50%.
- Lộ trình cân bằng: nút chính xen kẽ từ vựng với ngữ pháp và kỹ năng; tự tạm dừng từ mới khi lượng ôn vượt 60% thời gian mỗi ngày (tránh “nợ ôn”); tim chỉ tính trong bài kiểm tra.
- Khởi động Pre-A1 cho người mới tinh: chữ cái, đánh vần, số, giá tiền, giờ, ngày tháng, câu dùng trong lớp.
- Chuyển ý Việt → Anh (mediation, CEFR 2020): 36 đề viết lại tin nhắn, thông báo, tin tức; giải thích phong tục, khái niệm; tổng hợp nhiều nguồn cho người nước ngoài; máy dò đủ ý chính.
- Phản xạ hội thoại có đếm giờ; nối âm, dạng yếu, ngữ điệu, trọng âm câu; sổ cụm động từ và thành ngữ theo cấp (hơn 400 cụm).
- Đọc và nghe dài từ B1 đến C2: bài báo, truyện ngắn, tiểu luận; phỏng vấn, bài giảng, podcast, tranh luận hai giọng.
- Luyện nghe: chép chính tả cả câu, nghe chọn nghĩa, nghe rồi chọn câu đáp, nghe cả đoạn hai giọng (ý chính, văn phong, chi tiết; chỉnh tốc độ), từ 525 câu thoại.
- Luyện nói với máy nghe giọng của trình duyệt (tự chọn bật), nói nhại (shadowing) có tô màu từ máy nghe ra.
- Đóng vai bằng câu của chính mình: máy so các ý chính với câu mẫu (không dùng AI).
- Bài viết có hồ sơ từ vựng CEFR (tỉ lệ từ mỗi cấp A1–C2, độ đa dạng từ).
- Thi thử VSTEP: Nghe + Đọc có tính giờ, và Viết (thư + bài luận) + Nói (3 phần) với đề tự soạn; máy chép lời, đếm tốc độ nói, dò lỗi; ước tính đủ 4 kỹ năng.
- Nói đáp lời từ ý tiếng Việt, kiểm tra phát âm 26 cặp âm (hồ sơ âm đang lẫn), luyện nghe nhiều giọng và có tiếng ồn nền.
- Giải đấu tuần ẩn danh: nhóm 30 người, 5 hạng từ Đồng tới Kim cương.
- Đồng bộ nhiều máy bằng mã, không cần tài khoản (tự chọn bật).
- Nhắc học hằng ngày bằng thông báo (Web Push, kể cả iPhone đã cài app), chạy khi mất mạng.
- Công cụ lớp học cho giáo viên: gộp tiến độ cả lớp từ file dữ liệu ẩn danh, không cần máy chủ.
- Dễ dùng như trò chơi: màn chào một nút, thẻ từ gọn trong một màn hình (chi tiết trong “Xem thêm”), học thẻ và luyện tập chung một khung với nút chính luôn ở đáy, bảng đúng/sai có Tí phản ứng, tự đọc từ mới, phím tắt khi học trên máy tính.
- Đọc văn bản đời thường A1–A2 (biển báo, thực đơn, lịch giờ, tin nhắn, email, thông báo, quảng cáo, nhãn thuốc…); bài kiểm tra cấp 32 câu; kho viết câu 16–20 câu mỗi cấp, chấm riêng từng kỹ năng.
- Bản đồ CEFR theo 4 kỹ năng (Nghe, Nói, Đọc, Viết) cộng nền tảng (từ vựng, ngữ pháp, phát âm); mỗi kỹ năng có cấp ước tính riêng và bằng chứng xác nhận riêng.
- Ước tính cấp CEFR của bài viết, bài nói từ 5 đặc trưng hiệu chỉnh trên bài mẫu; đề nói có máy chép lời và phân tích tự động; kiểm tra bám đề.
- Xác nhận cấp CEFR bằng bài làm: đủ nhóm “Tôi có thể…”, bài kiểm tra cấp độ (nghe, đọc, từ vựng, ngữ pháp), một bài viết và một bài nói ở đúng cấp; ghi điểm thi thật để đối chiếu.
- Hội thoại mở (24 tình huống A1–C2): người kia rẽ nhánh theo câu trả lời nói hoặc gõ của bạn, hỏi lại khi chưa hiểu; đo phản xạ nói (thời gian bắt đầu nói sau câu hỏi).
- Nhắc lại câu (elicited imitation): nghe rồi nói lại, máy so từng từ — bằng chứng nói khách quan cho cấp CEFR.
- Viết câu có kiểm soát: nối câu và viết lại câu với từ khoá, chấm đúng/sai bằng máy, không cần AI hay người chấm.
- Bắt đầu học bằng một chạm; hướng dẫn cài app cho iPhone, Android, máy tính; thẻ chia sẻ tiến độ; trang “Về English Ladder” (cam kết, nội dung, mã nguồn).

## Cài như ứng dụng

- **Android (Chrome/Edge):** mở link → menu ⋮ → *Cài đặt ứng dụng* / *Thêm vào Màn hình chính*.
- **iPhone/iPad (Safari):** mở link → nút Chia sẻ → *Thêm vào MH chính*.
- **Máy tính (Chrome/Edge):** biểu tượng cài đặt ở thanh địa chỉ.

Sau lần mở đầu có mạng, app dùng được khi mất mạng.

## Quyền riêng tư

Không tài khoản, không theo dõi. Tiến độ lưu trên máy bạn. Xem [chính sách quyền riêng tư](https://sonnguyen12394.github.io/privacy.html).

## Góp ý, giáo viên và trường học

Mở một mục tại [Issues](https://github.com/sonnguyen12394/sonnguyen12394.github.io/issues).

## Đưa lên Google Play (ghi chú cho chủ app)

App là PWA đủ điều kiện đóng gói Trusted Web Activity:

1. Vào https://www.pwabuilder.com, nhập `https://sonnguyen12394.github.io/`, chọn *Package for stores → Android*.
2. Tải gói về, giữ kỹ file khoá ký (keystore).
3. Đặt `.well-known/assetlinks.json` (PWABuilder tạo sẵn, chứa SHA-256 của khoá ký) lên repo này để bỏ thanh địa chỉ trong app.
4. Tạo tài khoản Google Play Console, tải file `.aab` lên, dùng link chính sách quyền riêng tư ở trên.

## Cấu trúc tệp

- `index.html`: khung trang (CSS, biểu tượng SVG, màn chào vẽ sẵn để mở nhanh).
- `app.js`: app hiện có (học nền tảng A1–C2, ôn tập, kỹ năng, thi thử VSTEP rút gọn), khung bài học mọi cấp và chi tiết A1.
- `src/exam/`: **phần ôn thi IELTS/VSTEP viết mới bằng TypeScript**, chia mô-đun: `scales.ts` (bảng quy đổi có nguồn), `irt.ts` (ước tính band thích ứng), `stats.ts` (phân tích câu hỏi), `fsrs.ts` (lịch ôn FSRS-5), `score.ts` (máy chấm), `state.ts` (tiến độ có phiên bản), `views/` (màn hình). Build ra `x/exam.<băm>.js`, `app.js` nạp động qua `XHOST`.
- `src/engine/`: **engine học theo mục tiêu** (docs/SPEC.md): `graph.ts` (đồ thị năng lực: tô-pô, phát hiện vòng lặp, đóng tiền đề, gộp mục tiêu), `state.ts` (tiến độ `st.e` có phiên bản), `mastery.ts` (Beta theo nút × mức 1–5, đoán mò/nhầm tay, confidence), `core.ts` (lõi dùng chung nạp trước app.js: FSRS-5 cho mọi lịch ôn + ghi bằng chứng ngay khi trả lời), `diag.ts` (chẩn đoán dò đồ thị: hai cầu thang từ vựng/ngữ pháp, tiên nghiệm sau chẩn đoán), `path.ts` (tập thiếu → lộ trình: chỉ mở nút đủ tiền đề, ưu tiên = năng lực phụ thuộc ÷ phút, trọng số theo ngày thi; buổi học hằng ngày), `today.ts` (Lộ trình hôm nay, Bước tiếp theo cho trang Học, kiểm tra để bỏ qua), `grader.ts` (người chấm Viết/Nói chung: luật, tự chấm, sau này AI; trừ độ lệch tự chấm so với điểm thật; tin cậy tối đa Vừa khi chưa có AI/điểm thật), `readiness.ts` + `readyview.ts` (Goal Readiness: mô phỏng 4 kỹ năng theo cách tính điểm của kỳ thi → khả năng đạt; Goal Achieved bằng điểm thật, CEFR/giao tiếp theo năng lực + 14 ngày không quên), màn chọn mục tiêu, chẩn đoán và kết quả. Build ra `x/engine.<băm>.js`; đồ thị ra `data/engine/graph.<băm>.json` (tải khi cần).
- `content/ws/`: đề Viết/Nói IELTS (Task 1 Academic có biểu đồ SVG ở `content/fig/chart-*.svg`, Task 1 General, Task 2, Speaking Part 1–3) và bài mẫu chú thích band (IELTS Viết/Nói Part 2, VSTEP Viết), lược đồ `content/schema/ws.schema.json`; build thành `data/exam/ws.<băm>.json`, app.js tải khi mở thi thử Viết/Nói.
- `content/engine/`: đồ thị năng lực và Target Model (nodes, edges, goals/*.json, bảng phủ `coverage.md`), sinh bằng `npm run engine` (đọc CANDO/UNITS/GPOINTS từ app đang chạy rồi dựng đồ thị); chỉnh tay ở `overrides.json`. Kiểm bằng `npm run content`.
- `src/content/`: kiểm nội dung tự động (lược đồ, đáp án, giải thích tiếng Việt, câu trích, máy chấm, cấp từ vựng).
- `content/exam/`: nội dung ôn thi (JSON, theo `content/schema/group.schema.json`); `content/wordlist.json`: từ → cấp CEFR (tạo từ app.js).
- `data/lv-<cấp>.<băm>.json`: chi tiết bài học A1–C2, tải theo cấp.
- `sw.js`: chạy offline. `tools/`: build, máy chủ test, Lighthouse, kiểm nội dung, tách/ghép nội dung (`content-split.cjs`).
- `test/unit`: test đơn vị (node:test). `test/e2e`: test giao diện Playwright (Chrome Android, Safari iOS, máy tính, offline, trợ năng WCAG AA).

## Phát triển

```
npm ci
npm run build     # build mô-đun ôn thi, đồng bộ số bản sang sw.js và index.html
npm run check     # kiểm kiểu TypeScript
npm test          # test đơn vị
npm run content   # kiểm nội dung (8.3, 8.4)
npm run e2e       # test giao diện (cần trình duyệt Playwright)
npm run lh        # Lighthouse, cần ≥ 90 cả 4 mục
```

Tăng `APP_VERSION` trong `app.js` khi phát hành; `npm run build` tự cập nhật `sw.js` và `index.html`. CI (`.github/workflows/ci.yml`) chạy mọi bước trên trên mỗi PR, kể cả kiểm tệp build đã commit khớp mã nguồn (`npm run fresh`).

Đo Lighthouse (điện thoại giả lập, 4G chậm, bản v35): Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 0,8 s, LCP 1,6 s, CLS 0.

## Máy chủ (Supabase)

Thư mục `supabase/` chứa migration của bản v19–v20 và v36 (`el_resp`, `el_item_stat`, `el_pair`: lượt trả lời ẩn danh, thống kê câu tính sẵn mỗi giờ, cặp ước tính – điểm thật; chỉ nhận khi người học đồng ý), (bảng + hàm RPC cho giải đấu tuần, thông báo nhắc học và gom câu báo lỗi; xem báo lỗi bằng `select * from el_admin.flags;`) và Edge Function `el-remind` gửi lời nhắc (pg_cron 15 phút/lần). Khoá VAPID và bí mật cron nằm trong Supabase Vault, không nằm trong repo.

## Bản quyền

Xem LICENSE (giữ mọi quyền đối với mã và nội dung).
