# Mốc 1 (v133): trận đầu tiên + ô Vũ khí. Kế hoạch chi tiết

Viết 13/10/2026, trước khi code, theo `docs/KE-HOACH-A2.md` §3. Người sáng lập dặn "làm tiếp cho đến khi xong, không hỏi lại", nên kế hoạch này được ghi lại để soát sau thay vì chờ duyệt. Mọi điểm dưới đây là **quyết định kỹ thuật** (Claude tự quyết theo uỷ quyền), không đổi quyết định nào của người sáng lập.

## 1. Phản biện trước khi làm (gốc rễ, chỗ kế hoạch cũ chưa chuẩn)

1. **Khoá theo chỉ số thật làm chậm vòng "thua → rèn → thắng" trong một buổi.** Chỉ số Từ vựng Lv N cần 1 / 3 / 6 / 10 kỹ năng vững (`bag.ts LV_AT`). Người mới không thể lên 2 bậc trong 15 phút. Cách xử lý: trận luyện tay thắng được ở bậc 0; boss khu 1 cần **bậc 2** (3 kỹ năng từ vựng vững). Người sáng lập đã học nhiều nên chỉ số đủ sẵn, chỗ nghẽn thật của họ là **tinh hoa** (phải trả lời đúng ngay hôm đó). Hai cổng tách bạch: tinh hoa (học hôm nay) + chỉ số thật (năng lực đã chứng minh).
2. **"Thô" không nên thêm một đồng tiền thứ tư ở mốc 1.** Kế hoạch C11 nói thô = xu cũ đổi tên. Mốc 1 dùng luôn **xu** làm thô (trận thắng rơi xu, rèn tiêu xu qua `spent` như tủ thời trang). Đổi tên ở mốc 2.
3. **Bộ hình CC0 không tải được từ máy làm việc** (kenney.nl, opengameart.org bị chặn mạng). Hình trận vẽ bằng canvas trong mã (tự làm, không bản quyền bên ngoài), ghi ở `docs/ASSETS.md`. C12 vì vậy không lên tới 6 như ước tính cũ; thay bộ hình là việc của mốc sau khi có mạng.
4. **Điểm ngắm "giỏi / kém" của bot không phải người thật.** Mô phỏng khoá dải tỉ lệ thắng với bot có sai số cố định; số thật phải lấy từ telemetry trận (C2 vẫn trần 6).
5. **Sáu ô còn lại chưa rèn được.** Chỉ Giáp (ngữ pháp, giảm sát thương nhận) và Khiên (nghe, giảm sát thương "Sóng rè" của boss) có tác dụng nhỏ, lấy bậc từ chỉ số hiện có. Mũ, Giày, Bùa, Nhẫn chưa có tác dụng trong trận (mốc 2), ghi rõ trên màn.
6. **Luật màn đầu v117 ("một nút chính: Chơi tiếp")** trái với hướng mới. Nút chính duy nhất ở sảnh thành **⚔️ Đánh boss**; "Thợ rèn gợi ý" là nút phụ cạnh nó; "▶ Chơi tiếp" cũ giữ nguyên bên dưới, không còn là nút chính (sửa `clarity.spec.ts`).

## 2. Thiết kế

### 2.1 Trận (`src/engine/fight.ts`, thuần hàm)
- Thế giới 1000 × 600, địa hình bản đồ độ cao 250 cột, sinh theo hạt giống; nổ khoét hố tròn (không khoét quá đá nền).
- Đạn: góc 0–90° (theo hướng mặt), lực 0–100, trọng lực, gió −6..+6 cộng gia tốc ngang. Bước cố định 1/60 s nên **cùng hạt giống + cùng cú bắn = cùng kết quả**.
- Sát thương (C2): `dmg = BASE × 1,32^bậcVũKhí × (0,56 + 0,44 × hit) × 0,97^bậcGiáp(đích)`; `hit = 1 − khoảng cách / bán kính nổ` (trúng thẳng = 1). Trúng tâm so với trúng rìa chênh ≤ 1,8 lần.
- Lượt: người chơi → từng đối thủ. Gió đổi mỗi lượt. Trận tối đa 12 vòng (hết vòng = thua, để trận 2–4 phút).
- Đối thủ máy ngắm bằng cách giải góc / lực rồi cộng sai số; sai số giảm dần qua các lượt (như người chỉnh tay).
- Đi lại: nút ◀ ▶, thể lực mỗi lượt (Giày sau này tăng thể lực).
- **Ba trận khu 1:** Luyện tay 1 (một lính đứng yên, không gió), Luyện tay 2 (lính, có gió), **Boss Tiếng Ồn Rè** (cần Vũ khí bậc 2, + 1 lính). Cơ chế Rè: gió mạnh hơn và đảo chiều mỗi 2 lượt (đọc được trên màn), mỗi lượt thứ 3 bắn **Sóng rè** 3 viên toả; Khiên (Nghe) giảm sát thương Sóng rè.

### 2.2 Vũ khí, tinh hoa, rèn (`src/engine/cb.ts`, thuần hàm)
- **Tinh hoa Vũ khí** chỉ từ câu trả lời **đúng** ở nút từ vựng (`u:`) trong 🌱 Vườn từ, 🎡 Vòng Chữ, ⛏️ Mỏ Chữ, 🔥 Lò rèn: 1 mỗi câu, câu mới gặp ×2, có gợi ý ×0,5, theo Thợ rèn gợi ý ×1,25; trần 60 / ngày. Móc ở **một chỗ**: lớp bọc `ingest` trong `main.ts` (đọc kết quả, không đổi bằng chứng).
- **Rèn bậc N** (N = 1..3 ở mốc 1): tinh hoa 8 / 20 / 40 + xu 20 / 60 / 120. **Mặc được** khi Từ vựng Lv ≥ N; rèn rồi mà chỉ số chưa đủ thì "đã rèn, chưa mặc được", nói rõ còn thiếu bao nhiêu kỹ năng vững.
- Không đường nào khác lên bậc (không mua tinh hoa, xu không thay được chỉ số).

### 2.3 Thợ rèn gợi ý (bản đầu, chỉ ô Vũ khí)
- Chọn một lò trong Vườn từ / Vòng Chữ / Mỏ Chữ: cây đến ngày tưới → Vườn từ; chỉ số Từ vựng còn thiếu cho bậc kế → Vườn từ (học từ mới thành kỹ năng vững); còn lại Vòng Chữ / Mỏ Chữ thay nhau.
- Lý do bằng lời game: "Boss Rè cần Vũ khí bậc 2. Còn thiếu 12 tinh hoa: tìm từ ở 🎡 Vòng Chữ."

### 2.4 Màn và lối vào
- Sảnh: khối Chiến Binh trên đầu: **⚔️ Đánh boss** (nút chính duy nhất, vào thẳng trận kế tiếp) + **🔨 Thợ rèn gợi ý** (nút phụ, mở thẳng lò). Cũ giữ bên dưới.
- Route `cb` (Chiến Binh): Vũ khí (bậc, tinh hoa, nút Rèn), các trận khu 1, số liệu trận, góp ý.
- Lớp phủ trận `fightview.ts`: canvas ngoài `#app`, 60 fps, kéo để ngắm (kéo ngược như ná), mũi tên quỹ đạo 1/3 đường, dấu ✕ phát trước, cờ gió, đồng hồ 15 giây / lượt, số sát thương bay, rung màn, chậm thời gian khi kết liễu, âm tổng hợp. Nhân vật là chibi SVG v132 cầm Vũ khí đúng bậc đang mặc.
- Màn kết thua: nếu thiếu bậc thì chỉ thẳng "Vũ khí bậc 1, Rè cần bậc 2 → 🔨 Rèn Vũ khí" (một nút: chưa đủ tinh hoa → mở lò; đủ → rèn ngay). Đủ bậc mà thua → mẹo ngắm + Đánh lại.
- **💬 Góp ý** ở màn kết trận và màn Chiến Binh: 1–5 sao + một dòng, lưu máy (≤ 200), nút "📤 Gửi cho nhà làm game".
- Telemetry trận (`st.e.cb.log`, ≤ 60): ngày, trận, bậc đang mặc / bậc cần, thắng / thua / bỏ, số phát, độ chính xác, giây tới phát đầu, giây trận, chơi tiếp hay không.

### 2.5 Luật không phá
- Trận không gọi `ingest` (test tĩnh + e2e kiểm sổ bằng chứng không đổi sau trận).
- Lượt rèn không đổi: các lò cũ chấm như cũ; tinh hoa chỉ đọc kết quả.
- Không gỡ mã cũ.

## 3. Kiểm thử
- Đơn vị `engine-fight.test.ts`: tất định theo hạt giống, gió đẩy đúng chiều, hố làm thấp địa hình, công thức sát thương (tâm / rìa ≤ 1,8), AI không sai số trúng đích, **dải tỉ lệ thắng C2** (mô phỏng có hạt giống cố định).
- Đơn vị `engine-cb.test.ts`: luật tinh hoa, giá rèn, bậc mặc ≤ chỉ số thật, xu / thời gian không vượt khoá, lọc / gộp bản lưu, gợi ý, lời khuyên khi thua.
- e2e `fight.spec.ts` (390 px, Chrome Android + Safari iOS + máy tính): sảnh có ⚔️ Đánh boss, vào trận, bắn, thắng, thua → Rèn Vũ khí, sổ bằng chứng không đổi, không cuộn ngang.
- `tools/sim/fight.ts` (`npm run fightsim`): in bảng tỉ lệ thắng theo tay ngắm × chênh bậc.

## 4. Xong khi
CI xanh; người sáng lập chơi 15 phút theo `docs/PLAYTEST.md` (phần Chiến Binh Chữ) và chấm C1. **C1 thật < 6 thì sửa trận trước mọi mốc khác.**
