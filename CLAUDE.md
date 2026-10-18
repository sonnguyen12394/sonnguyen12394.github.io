# Chiến Binh Chữ (repo English Ladder)

Game nhập vai cho người Việt học tiếng Anh: trận đấu kiểu Chaos Orbit (chạy né, vũ khí quỹ đạo, lên cấp chọn 1/3; thay trận ngắm bắn Gunny từ v134) là game thuần; học tiếng Anh ở lò rèn để rèn đồ; đồ quyết định khoảng 70% thắng thua và bị khoá theo năng lực tiếng Anh thật. Đích hiện tại: người sáng lập đạt **A2** (trận cổng + đề mẫu Cambridge).

## Đọc trước khi làm
1. `docs/SPEC.md`: các khối đầu tệp "17/10/2026 — 📘 Học bài · 🔁 Ôn luyện · 🎯 Mục tiêu", "16/10/2026 — Ba phần: Chơi · Học · Mục tiêu", "15/10/2026 — Trận đổi sang kiểu Chaos Orbit" và "13/10/2026 — Đổi hướng: Chiến Binh Chữ" (mục 1–22) đứng trên mọi phần khác.
2. `docs/SCORECARD-A2.md`: bảng chấm duy nhất. Các thang cũ (Conformance 200, Scorecard 400 / v111, trục M / H / S / G / P) đã đóng băng.
3. `docs/KE-HOACH-A2.md`: kế hoạch theo mốc, cách nâng từng tiêu chí. Mốc 1 (v133) xong phần mã: `docs/MOC1-KE-HOACH.md`; trận ở `src/engine/fight*.ts` (nhân vật / thành tích: `fightmeta.ts`), ô Vũ khí ở `cb.ts`.
4. `docs/RA-SOAT-v133.md`: số phận từng chức năng cũ.
5. `docs/DUONG-A2.md`: đường test duy nhất tới A2; sảnh A2 (v135) mặc định ẩn phần cũ bằng CSS `html.a2`, test e2e cũ chạy với `el-full` (fixture `full`).
6. `docs/DOI-CHIEU-GAME-APP.md`: ba phần ⚔️ Chơi · 📘 Học · 🎯 Mục tiêu (một não; §6) + phần 🔁 Ôn luyện (tên cũ "Nói & Đọc"; v153 đổi tên: Học → Học bài, Nói & Đọc → Ôn luyện; v149, §7; `viewND` / `viewNdx` trong `app.js`; từ v151 "làm rồi ôn lại" tính vào Mục tiêu qua cửa `nd` của `compare.ts`; v152: Học cho người mới, Nói & Đọc cho người đã học ôn nhanh, `EM.health` + nút về đúng bài; v157: Ôn luyện = đọc / nghe nguyên bài + câu hỏi hiểu, `ndNext` / `ndRead` / `ndReadDone`, hai thanh `partsHtml` ở cả Học bài; v158: câu nghĩa từ `ndVQ`, qua unit 2 ngày `ND_DAYS`, Nhớ của unit theo từng từ `GATE.memWord`; Thi chuyển cấp: Nhớ ≥ 50%, Viết / Nói vào phán quyết `gatePassAll`, soát câu `viewGateRev`, so với bài mẫu `viewCert`; v159: 🎭 đóng vai tình huống `RPG` / `viewRpg`, bộ nói dùng chung `spkGo` / `spkOk`, nói theo đề chấm theo lời chép `stScore`; v160: ▶ Ôn tiếp chọn loại bài `ndPlan`, ✍️ viết theo tình huống `WRG` / `wrgScore`, bậc tự động `gpAutoTier` / `phTierAdapt`; v161: một nút ▶ Hôm nay `dayPlan` / `dayHtml` ở cả Học bài + Ôn luyện, ôn dưới 50% → `ndNeed` về Học bài, `ndBase` đoán có nền; ý Viết / Nói của Thi chuyển cấp do máy tìm bằng từ khoá `ideaHits`; v162: mỗi phần tự tới được Thi chuyển cấp: Học bài ôn lồng `mixDue`, Ôn luyện chia ngữ pháp `ndGPlan` + Nói theo đề `ndStk` + viết chuyện `WRG.story`; v163: một não `actsOf` cho ba cách nhìn `dayPlan` / `mainAction({learn})` / `ndPlan`, trạng thái T1–T9, "gần được" 2 lần `ND_MID` → Học bài; v164: kho 5 bài đọc / unit `u.reads` soát bằng `tools/reads-check.ts`, não chọn bài theo chỗ thiếu `ndTargets` / `ndPickText`, ✍️ viết theo chỗ thiếu `WRG.gap` mức 4) + đánh giá game theo 12 khó khăn học tiếng Anh; màn Mục tiêu ở `aimview.ts`, nguồn câu đúng ở `compare.ts`. Test e2e cũ mở vào Chơi qua fixture `home` (`el-home`).

## Luật
- Không tự đổi quyết định của người sáng lập; hỏi lại. Điểm kỹ thuật thì tự quyết, ghi lý do.
- Trận đấu không ghi bằng chứng; lượt rèn là lượt đo (không ép giờ).
- Không nạp để mạnh, không quay thưởng, không cường hoá hỏng mất đồ, không ưu đãi ép giờ.
- Điểm tự chấm chỉ tham khảo; ghi "đã / chưa người thật kiểm".
- Viết tiếng Việt có dấu, câu ngắn; màn chơi không dùng chữ "thi / đề / kiểm tra" (ngoại lệ duy nhất: "Thi chuyển cấp", người sáng lập đặt 16/10/2026; test `engine-wording` bỏ qua cụm này).

## Lệnh
`npm ci` · `npm run check` · `npm test` · `npm run content` · `npm run build` · `npm run fresh` · `npm run e2e` · `npm run sim` · `npm run fightsim` (bảng tỉ lệ thắng trận theo tay né × chênh bậc; thêm `-- 40 nv` cho bảng nhân vật) · `npm run testgen` (in bài thi chuyển cấp sinh theo tiêu chí; `-- --blind` / `-- --score` cho phép thử "không có bài"). Tăng `APP_VERSION` trong `app.js` khi phát hành. `app.js` ≈ 3,2 MB: dùng grep, không đọc cả tệp. Tệp build trong `x/` phải commit.

Trình duyệt test (16/10/2026, người sáng lập dùng Cốc Cốc trên iPhone, tức lõi WebKit): CI tạm chỉ chạy e2e dự án `ios-safari` (`--project=ios-safari`). Máy soạn không có WebKit thì chạy Chrome Android + máy tính (`PW_NO_WEBKIT=1`) để kiểm trước; lỗi chỉ có ở WebKit do CI bắt. Cách chạy lại đủ ba trình duyệt ghi trong `.github/workflows/ci.yml`.
