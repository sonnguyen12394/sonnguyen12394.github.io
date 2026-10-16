# Chiến Binh Chữ (repo English Ladder)

Game nhập vai cho người Việt học tiếng Anh: trận đấu kiểu Chaos Orbit (chạy né, vũ khí quỹ đạo, lên cấp chọn 1/3; thay trận ngắm bắn Gunny từ v134) là game thuần; học tiếng Anh ở lò rèn để rèn đồ; đồ quyết định khoảng 70% thắng thua và bị khoá theo năng lực tiếng Anh thật. Đích hiện tại: người sáng lập đạt **A2** (trận cổng + đề mẫu Cambridge).

## Đọc trước khi làm
1. `docs/SPEC.md`: các khối đầu tệp "16/10/2026 — Một não, hai lối", "15/10/2026 — Trận đổi sang kiểu Chaos Orbit" và "13/10/2026 — Đổi hướng: Chiến Binh Chữ" (mục 1–22) đứng trên mọi phần khác.
2. `docs/SCORECARD-A2.md`: bảng chấm duy nhất. Các thang cũ (Conformance 200, Scorecard 400 / v111, trục M / H / S / G / P) đã đóng băng.
3. `docs/KE-HOACH-A2.md`: kế hoạch theo mốc, cách nâng từng tiêu chí. Mốc 1 (v133) xong phần mã: `docs/MOC1-KE-HOACH.md`; trận ở `src/engine/fight*.ts` (nhân vật / thành tích: `fightmeta.ts`), ô Vũ khí ở `cb.ts`.
4. `docs/RA-SOAT-v133.md`: số phận từng chức năng cũ.
5. `docs/DUONG-A2.md`: đường test duy nhất tới A2; sảnh A2 (v135) mặc định ẩn phần cũ bằng CSS `html.a2`, test e2e cũ chạy với `el-full` (fixture `full`).
6. `docs/DOI-CHIEU-GAME-APP.md`: hai lối (⚔️ game / 📘 Học, một não) + đánh giá game theo 12 khó khăn học tiếng Anh; màn ⚖️ Đối chiếu ở `compare.ts`, `compareview.ts`.

## Luật
- Không tự đổi quyết định của người sáng lập; hỏi lại. Điểm kỹ thuật thì tự quyết, ghi lý do.
- Trận đấu không ghi bằng chứng; lượt rèn là lượt đo (không ép giờ).
- Không nạp để mạnh, không quay thưởng, không cường hoá hỏng mất đồ, không ưu đãi ép giờ.
- Điểm tự chấm chỉ tham khảo; ghi "đã / chưa người thật kiểm".
- Viết tiếng Việt có dấu, câu ngắn; màn chơi không dùng chữ "thi / đề / kiểm tra".

## Lệnh
`npm ci` · `npm run check` · `npm test` · `npm run content` · `npm run build` · `npm run fresh` · `npm run e2e` · `npm run sim` · `npm run fightsim` (bảng tỉ lệ thắng trận theo tay né × chênh bậc; thêm `-- 40 nv` cho bảng nhân vật). Tăng `APP_VERSION` trong `app.js` khi phát hành. `app.js` ≈ 3,2 MB: dùng grep, không đọc cả tệp. Tệp build trong `x/` phải commit.
