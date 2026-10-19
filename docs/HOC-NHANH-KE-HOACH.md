# ⚡ Học nhanh: kế hoạch (chờ người sáng lập duyệt)

Soạn 19/10/2026. **Chưa sửa mã.** Tự soạn, chưa người thật kiểm.

## 1. Quyết định đã chốt (người sáng lập, 19/10/2026)

- **Học và ôn là một vòng**, không phải hai phần. 📘 Học bài = đường thường: học mới → luyện → ôn giãn cách → dạng bài Thi chuyển cấp.
- **⚡ Học nhanh thay 🔁 Ôn luyện.** Dành cho người đã có nền: làm bài trước, đúng thì qua, sai chỗ nào chỉ vá đúng chỗ đó. Không học lại cả lý thuyết của unit.
- **▶ Hôm nay là não duy nhất** cho cả hai đường. Học bài và Học nhanh không có não riêng.
- (a) Qua nhanh: tính ngay vào thanh 📘 Học; 🔁 Nhớ chỉ lên khi đúng lại sau ≥ 3 ngày.
- (b) Đo nền khoảng 15 phút → máy gợi ý đường; người học đổi đường bất cứ lúc nào.
- (c) Đóng vai, viết theo tình huống, Nói theo đề, phát âm: giữ, thành loại bài chung của ▶ Hôm nay.

**Vì sao đổi:** "Ôn luyện" đang làm ba việc (ôn, vượt nhanh, dạng bài thi), trong đó ôn và dạng bài thi trùng với Học bài. Chỉ có vượt nhanh là khác. Tên "ôn" cũng sai với người có nền nhưng chưa từng học trong app.

## 2. Hai đường, một não

| | 📘 Học bài (đường thường) | ⚡ Học nhanh |
|---|---|---|
| Cho ai | Người mới | Người có nền |
| Thứ tự | Dạy → luyện → làm bài | **Làm bài trước** → vá chỗ sai |
| Khi đúng | Qua bài cuối unit | Qua unit ngay (tạm vững) |
| Khi sai | Học lại theo bài | **Vá đúng từ / điểm ngữ pháp sai**, 2–3 phút |
| Sai quá nửa | — | Gợi ý học unit đó ở Học bài |
| Ôn | Chạy nền (▶ Hôm nay, ôn lồng) | Chạy nền, giống bên trái |
| Thanh Học / Nhớ | Chung | Chung |

## 3. Đường ⚡ Học nhanh

**B1. Đo nền (một lần mỗi cấp, khoảng 15 phút).**
- Dùng lại `placementItems` (`app.js`, 30 câu rải các unit) + khối xử lý `s.kind==='place'` (đã đánh dấu unit đúng hết là `passed`, `skipped`).
- Đổi: chạy cả khi chưa "đạt cấp"; ghi `st.path`:
  - ≥ 40% → gợi ý `fast`;
  - dưới 40% → gợi ý `normal`.
- Unit có câu sai → vào hàng vá (B3), không vào Học bài cả unit.
- Tên trên màn: "🧭 Đo nền" (luật chữ: không dùng "thi / kiểm tra").

**B2. Vượt unit.**
- Dùng lại `ndRead` / `ndReadDone`: đọc / nghe nguyên bài + câu hiểu + câu nghĩa từ + 1–2 câu ngữ pháp.
- Đạt ≥ 80%, không xem nghĩa → **qua ngay** (bỏ `ND_DAYS = 2`).
- Từ và điểm ngữ pháp của unit vào lịch ôn sau 3 ngày.
- Thêm **1–2 câu tự gõ** mỗi unit, chặn đúng nhờ đoán mò ở trắc nghiệm.

**B3. Vá lỗ.**
- Câu sai ở B1 / B2 → mỗi từ / điểm sai thành một mục vá: thẻ nghĩa + câu ví dụ lấy từ chính bài đọc của unit + 3 câu luyện (có 1 câu tự gõ).
- Vá xong mục cuối của unit → unit qua (tạm vững).
- Dưới 50% ở B2 → gợi ý "📘 Học bài unit này" (giữ ý `ndNeed`). Bỏ luật "gần được 2 lần" (`ND_MID`): chỗ sai đã được vá theo từng mục.

**B4. Xác nhận sau.**
- Cơ chế có sẵn: 🔁 Nhớ (`partsOf` trong `src/engine/main.ts`) chỉ tính khi đúng lại sau ≥ `GATE.memDays` ngày.
- Việc cần làm: ▶ Hôm nay đưa các câu đến hạn này lên đầu.
- Sai khi xác nhận → mục đó vào hàng vá lại (B3).

**B5. Dạng bài Thi chuyển cấp sớm.** Viết, Nói (`WRG`, `STK`, `RPG`) xen từ unit thứ 3. Người có nền thường lủng ở phần làm ra chữ.

## 4. Trạng thái mỗi unit (thay T1–T9)

| Trạng thái | Nghĩa | Bước kế (▶ Hôm nay) |
|---|---|---|
| Chưa đo | Chưa làm gì | Học nhanh: vượt (B2) · Học bài: học mới |
| Đang vá | Có mục sai chưa vá | Vá (B3) |
| Tạm vững | Qua, chưa xác nhận | Chờ tới hạn |
| Vững | Đã đúng lại sau ≥ 3 ngày | Ôn theo lịch |
| Chưa biết | Dưới 50% khi vượt | Học bài unit đó |

**Thứ tự của ▶ Hôm nay (cả hai đường):**
1. Đến hạn / xác nhận.
2. Vá lỗ đang mở.
3. Unit kế: vượt (`fast`) hoặc học mới (`normal`).
4. Một dạng bài Thi chuyển cấp.

Giữ luật "không lặp một loại quá 2 lần liền".

## 5. Dùng lại / bỏ / thêm

- **Dùng lại:** `placementItems`, khối `place`, `ndRead`, `ndReadDone`, `ndGPlan`, `partsOf` (thanh Học / Nhớ), `dueWords`, `mixDue`, `WRG` / `STK` / `RPG`, `actsOf` (thu gọn).
- **Bỏ:** `ND_DAYS`, `ND_MID` / `ndMid`, `ndBase` (thay bằng `st.path`), bảng T1–T9, đoạn chữ ba đường trong `dayHtml`, tab tên "🔁 Ôn luyện".
- **Thêm:** `st.path`, hàng vá `st.gap` (mục: từ / điểm ngữ pháp, unit, ngày), màn vá, câu tự gõ trong `ndRead`.
- **Dữ liệu cũ:** unit đã qua, `ndNeed` giữ nguyên. Đổi tab chỉ là đổi tên + nội dung, không mất tiến độ.

## 6. Các bước làm (mỗi bước một PR nhỏ)

| Bước | Việc | Xong khi |
|---|---|---|
| P1 | Đổi tên tab → ⚡ Học nhanh; `st.path`; bỏ `ND_DAYS`, `ND_MID` | Test cũ của Ôn luyện sửa xong và xanh; qua unit trong 1 ngày |
| P2 | 🧭 Đo nền → gợi ý đường + đưa câu sai vào hàng vá | Test e2e: đo nền → unit đúng hết qua, unit sai có mục vá |
| P3 | Màn vá lỗ + câu tự gõ trong vượt unit | Test: vá hết mục → unit qua; câu tự gõ sai → không qua |
| P4 | ▶ Hôm nay theo thứ tự §4; thu gọn `actsOf`; xoá T1–T9 | Test đơn vị: 5 trạng thái → đúng bước kế |
| P5 | `npm run sim`: bot "có nền" và bot "người mới" đi tới lúc mở Thi chuyển cấp | Bot có nền, đường nhanh: số lượt ≤ 60% đường thường |

Mỗi PR chạy đủ `check`, `test`, `content`, `build`, `fresh` + e2e bị ảnh hưởng (theo `KE-HOACH-A2.md`).

## 7. Đo trên người thật (người sáng lập đi đường nhanh trước)

- **Nhanh thật:** số ngày từ đo nền tới lúc mở Thi chuyển cấp A2. Ghi vào `PLAYTEST.md`.
- **Qua nhầm:** % unit tạm vững rớt ở bước xác nhận. Mục tiêu dưới 20%.
- **Đúng cấp:** sau khi mở Thi chuyển cấp, làm đề mẫu A2 Key ngoài app, so với dự đoán của app.

**Mốc dừng / đổi hướng:**
- Qua nhầm ≥ 30% sau 2 tuần → siết B2 (thêm câu tự gõ, nâng ngưỡng).
- Đường nhanh không nhanh hơn đường thường → xem lại B3: vá quá vụn, hoặc đo nền sai.
- Sau 1 tuần dùng thật, chưa thêm tính năng mới cho tới khi có số liệu §7.

## 8. Còn mở (người sáng lập chọn khi duyệt)

1. Ngưỡng gợi ý đường nhanh: 40% (đề xuất) hay khác?
2. Tên tab: "⚡ Học nhanh" (đề xuất)?
3. Có giữ "📖 Đọc / nghe lại" cho unit đã quên trong Học nhanh không? Đề xuất: không, gộp vào ôn đến hạn.
