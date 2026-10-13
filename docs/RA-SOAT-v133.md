# Rà soát chức năng v132 theo hướng Chiến Binh Chữ (13/10/2026)

Đối chiếu từng chức năng đang có với khối "Đổi hướng: Chiến Binh Chữ" ở đầu `docs/SPEC.md`. Rà bằng cách đọc mã (đầu mỗi mô-đun `src/engine`, `src/exam`, các nhóm chức năng trong `app.js`), chưa chạy app. Mỗi chức năng xếp vào một trong sáu loại:

| Loại | Nghĩa |
| --- | --- |
| **Lõi giữ** | Giữ nguyên, nằm bên dưới game; người chơi không thấy trực tiếp |
| **Đổi vai** | Giữ mã, đổi vai trò trong vòng "học → rèn → đánh" |
| **Lò rèn** | Game cũ thành lò rèn / phó bản, mở dần |
| **Gộp** | Trùng việc với phần khác; gộp vào một chỗ |
| **Cất** | Ẩn khỏi đường chính (Thư viện / Cài đặt), chỉ sửa lỗi, không đầu tư |
| **Bỏ** | Trái quyết định mới; gỡ khỏi bản phát hành |

## 1. Phát hiện gốc rễ

1. **Thiếu đúng một thứ: trận đấu.** Gần như mọi mảnh của hướng mới đã có: nhân vật chibi + 7 ô trang bị theo chỉ số thật (v132 `avatar.ts`), Lò rèn 5 bậc gắn mức đạt thật (v129 `forge.ts`), chỉ số thật Lv 1–10 (v128 `bag.ts`), bản đồ 5 khu (v130), trận cổng (v113–v116), bộ não. Nhưng đồ hiện **không dùng vào việc gì**: không có trận để đồ quyết định thắng thua. Đây là lý do mọi đợt nâng sảnh / đồ (v128–v132) đều kẹt ở ~7,5 tự chấm: phần thưởng không dẫn tới đâu. Trận đấu là mốc 1, đúng chỗ.
2. **Hai hệ "đồ" song song, phải gộp làm một.**
   - `avatar.ts` (v132): 7 ô Bút / Mũ / Kính / Tai nghe / Áo / Khăn / Cánh, bậc = Lv chỉ số thật.
   - `bag.ts` (v128): 5 món "trang bị" (Cuốc Bạc, Ấm Trà…) chế từ nguyên liệu, mỗi món buff một game.
   - `forge.ts` (v129): mỗi *kỹ năng* là một món 5 bậc.
   
   Ba khái niệm "đồ" khác nhau cho cùng một người chơi. Hướng mới cần **một** hệ: 7 ô chiến đấu, bậc khoá theo chỉ số thật, rèn bằng thô + tinh hoa.
3. **7 chỉ số hiện có không khớp 7 ô đã chốt.** Chỉ số thật đang là Từ vựng, Ngữ pháp, Phát âm, Nói, Nghe, **Trí nhớ**, **Dùng thật**; spec mới chốt ô theo Từ vựng, Ngữ pháp, Nghe, **Đọc**, Phát âm, Nói, **Viết**. Thiếu Đọc và Viết; thừa Trí nhớ và Dùng thật. Xem câu hỏi Q21 cuối tệp.
4. **Kinh tế đang có ba đồng tiền + năng lượng kiểu Duolingo.** Xu (từ mọi game), nguyên liệu Túi chữ (v128), XP, năng lượng theo lượt, Super giả lập, ô quảng cáo giả. Hướng mới chỉ cần hai loại: **nguyên liệu thô** (từ trận, mua được) và **tinh hoa chữ** (từ lò rèn, không mua được). Năng lượng + quảng cáo trái quyết định mục 10.
5. **Đường chính hiện là "▶ Chơi tiếp → game kỹ năng"**, do `director.ts` chọn. Hướng mới: sảnh → **Thợ rèn gợi ý** / **Đánh boss**. Mọi thứ khác lùi về sau một lần chạm.
6. **Lời hứa cũ còn rải ở nhiều chỗ:** "không tài khoản", "không quảng cáo của bên thứ ba", "English Ladder", "chữ là quân cờ" trong README, `privacy.html`, `manifest.webmanifest`, `index.html`, màn "Về English Ladder", test `clarity.spec.ts`.

## 2. Bảng rà soát

### 2.1 Bộ não và bằng chứng (lõi bên dưới)

| Chức năng | Tệp | Loại | Việc cần làm |
| --- | --- | --- | --- |
| Đồ thị năng lực, Target Model CEFR | `graph.ts`, `data.ts`, `content/engine/` | Lõi giữ | Thêm: món đồ / ô ↔ tập nút của mỗi khu (cây công thức) |
| Bằng chứng L0–L4, Evaluator, snapshot, "Vì sao?" | `ev/*`, `whyview.ts` | Lõi giữ | Thêm ngữ cảnh `ctx` cho lượt rèn mới; trận đấu **không** gọi `ingest` (P13) |
| Mastery Beta, Confidence, đoán mò / nhầm tay | `mastery.ts` | Lõi giữ | — |
| FSRS-5, khả năng nhớ | `exam/fsrs.ts`, `retain.ts`, `core.ts` | Đổi vai | Nguồn của "đồ cùn": phần đồ gắn mục sắp quên giảm lực |
| Đường đi tối thiểu | `path.ts` | Đổi vai | Cây công thức đồ + thứ tự mở lò |
| NBA, gap, remedy, micro, transfer, probe | `nba.ts`, `gap.ts`, `remedy.ts`, `micro.ts`, `transfer.ts`, `probe.ts` | Đổi vai | Nội dung một lần rèn: luyện phôi / mài / thử quặng / tôi luyện |
| Bộ não chọn game | `director.ts` | Đổi vai | Chọn lò + "Thợ rèn gợi ý" (một món, lý do bằng lời game, thưởng tinh hoa); bỏ khái niệm "lộ trình 3 chặng chọn game" |
| Lộ trình hôm nay (3 đèn lồng) | `today.ts`, `gameview.ts` | Gộp | Vào Thợ rèn gợi ý; đèn lồng có thể thành "3 việc của thợ rèn hôm nay" |
| Đèn báo học tủ | `rote.ts` | Lõi giữ | Đưa vào lý do gợi ý ("đồ chưa tôi luyện") |
| Chẩn đoán dò đồ thị, chương mở đầu Sương Câm, Nghe / Đọc thích ứng | `diag.ts`, `lrview.ts`, `exam/placement.ts`, `exam/irt.ts` | Lõi giữ | Kết quả đặt bậc đồ khởi điểm (Claim → đồ "chưa thử"); vẫn chơi được khi chưa đăng nhập |
| Thám hiểm sương mù (xếp lớp lại) | `fog` trong app | Cất | Giữ làm xếp lớp lại, không lên sảnh |
| Trận cổng A1 / A2 / B1 | `gate.ts`, `gateview.ts`, `content/exam/gate/` | Đổi vai | Thành **rèn Bảo vật khu**; có Bảo vật mới mở boss cuối khu. Câu cổng A1/A2 **cần người sáng lập soát** trước khi dùng làm đích A2 |
| Readiness, Goal Achieved | `readiness.ts`, `readyview.ts` | Lõi giữ | Hiện ở hồ sơ; thêm ô ghi điểm đề mẫu Cambridge + đối chiếu dự đoán (đã có "🎓 Chứng chỉ" v113, mở mặc định cho đích A2) |
| Kho báu ẩn (đo hiệu quả 12 câu giữ riêng) | `measure.ts`, `treasureview.ts` | Lõi giữ | Thành rương ở bản đồ / sau trận; không hiện đúng sai như cũ |
| Bảng đo H | `hmeter.ts` | Lõi giữ | Nguồn chỉ số Nói / Nghe; màn riêng cất vào hồ sơ |
| Người chấm Viết / Nói | `grader.ts` | Lõi giữ | Trần bậc Bùa / Nhẫn khi Confidence ≤ Vừa |
| Mô phỏng learner, bot L01–L03 | `sim/`, `tools/learners/` | Lõi giữ | Bot phải học chơi vòng mới (rèn → đánh) để đo được tỉ lệ 70/30 |
| Telemetry chơi (bỏ dở, chơi tiếp, giây tới thao tác đầu) | `play.ts` | Lõi giữ | Thêm số đo trận: thắng / thua theo chênh bậc đồ (kiểm 70/30), số lần rèn trước trận |

### 2.2 Game hiện có → lò rèn / phó bản (mở dần)

Đề xuất thứ tự mở theo khu (A1 trước). Ô = ô đồ mà lò đó rèn (theo bảng ô của spec mới).

| Game | Kỹ năng | Ô rèn | Mở ở | Ghi chú |
| --- | --- | --- | --- | --- |
| 🌱 Vườn từ | Từ mới | Vũ khí (luyện phôi) | Khu 1, ngay đầu | Lò dạy từ mới, có thẻ dạy trước |
| 🎡 Vòng Chữ | Từ vựng | Vũ khí | Khu 1 | Lò của mốc 1 |
| ⛏️ Mỏ Chữ | Từ vựng | Vũ khí | Khu 1 | Lò của mốc 1 |
| 🌫️ Sương quay lại | Ôn từ sắp quên | Mài đồ (mọi ô) | Khi có đồ cùn đầu tiên | Đúng vai "mài đồ" |
| 🃏 Bài Câu | Ngữ pháp | Giáp | Khu 1, sau Vũ khí bậc 1 | |
| 🛠️ Xưởng sửa câu | Ngữ pháp mức 4 | Giáp (tôi luyện) | Khu 2 | |
| 🎯 Bắt Âm | Phát âm (nghe phân biệt) | Giày | Khu 1 | |
| ⚓ Bến Cảng lệnh giọng | Phát âm (nói) | Giày | Khu 2 | Cần micro; không có thì Bắt Âm thay |
| 📻 Đài Phố Chữ | Nghe đoạn | Khiên | Khu 2 | |
| ☕ Quán Cà Phê (chọn) | Nghe + chức năng | Khiên | Khu 1 | |
| 🔍 Thám tử | Đọc | Mũ | Khu 2 | |
| 🗣️ Quán Phố Chữ (giọng) | Nói | Bùa | Khu 2 | Có trần bậc |
| 🔎 Hỏi chuyện nhân chứng | Nói / hỏi | Bùa | Khu 3 | |
| 🎤 Karaoke hội thoại | Nói theo | Bùa | Khu 3 | Gộp được với Quán giọng |
| ✉️ Thư gửi cư dân | Viết đoạn | Nhẫn | Khu 3 | Có trần bậc |
| 🤖 Ra lệnh cho robot | Nói / gõ tên từ | — | — | **Cất**: trùng Bến Cảng + Vòng Chữ |
| 🧱 Xếp Khối Chữ, 🎲 Bàn Cờ Phố, 🏰 Leo tháp | Câu hỏi xen lượt chơi | — | — | **Cất**: kiểu "câu hỏi gác cổng giữa lượt game"; vai trò game vui nay là trận đấu |
| 📅 Câu đố ngày | Ôn cụm từ | Mài đồ | Khu 1 | Giữ làm việc ngày nhẹ |
| ⚡ Tốc độ 60 giây, Ghép cặp, Thách đấu 10 câu | Ôn nhanh | — | — | **Cất** |
| 🌍 Phố thật (nhiệm vụ ngoài đời) | Dùng thật | — | Khu 2 | Thưởng thô / danh hiệu, không vào bậc đồ (tự báo cáo) |
| 🔥 Lò rèn năng lực (v129) | Mọi kỹ năng | Mọi ô | Ngay đầu | **Đổi vai**: thành khung chung "Lò rèn" bao các lò trên; giữ luật 5 lượt / kỹ năng / ngày, vượt bậc |
| 🗺️ Bản đồ phủ cấp | Tổng quan | — | — | Gộp vào màn Trang bị ("ô nào còn thiếu gì") |

Ba điểm cần cân khi đổi game thành lò:
- **Phần thưởng của game cũ** (xu, sao, ★ Phố, kỷ lục) phải đổi sang tinh hoa + thô. Nếu không, người chơi có hai vòng thưởng song song.
- **Luật 5 lượt có tính / kỹ năng / ngày** (forge.ts) giới hạn tốc độ rèn. Đây là phanh đúng (giãn cách giúp nhớ) nhưng sẽ là chỗ người chơi muốn "nạp để nhanh". Nạp chỉ rút ngắn **thô**, không vượt được phanh này.
- **Phát hiện lặp:** nhiều game cũ cùng rèn một ô (ví dụ 4 lò cho Vũ khí). Mở dần giải quyết chuyện ngợp, nhưng phải giữ luật đổi dạng của `director.ts` để không cày một lò.

### 2.3 Thế giới, truyện, nhân vật, sảnh

| Chức năng | Tệp | Loại | Việc cần làm |
| --- | --- | --- | --- |
| Nhân vật chibi + 7 ô trang bị + thời trang | `avatar.ts`, `heroctl.ts`, `heroview.ts` | Đổi vai | **Nền của Chiến Binh Chữ.** Đổi ô sang Vũ khí / Giáp / Khiên / Mũ / Giày / Bùa / Nhẫn; thêm lực chiến; thêm "cùn"; nhân vật này vào trận |
| Túi chữ: nguyên liệu, ngọc từ, album, kỷ vật | `bag.ts`, `bagview.ts`, `bagctl.ts` | Gộp | Nguyên liệu → tinh hoa chữ; ngọc từ (độ hiếm = độ nhớ) giữ làm sưu tập |
| Túi chữ: 5 trang bị buff game (Cuốc Bạc…) | `bag.ts` | Bỏ | Thay bằng hệ đồ chiến đấu duy nhất |
| Xưởng của Tí / Luyện tay | `bag.ts` | Cất | Không tính bằng chứng; trùng lò rèn |
| Chỉ số thật Lv 1–10 | `bag.ts statsOf` | Đổi vai | Thành điều kiện mặc đồ; sửa cho khớp 7 ô (Q21) |
| Bản đồ Phố Chữ 5 khu, kéo / thu phóng | `worldmap.ts`, `worldview.ts`, `mappan.ts` | Đổi vai | Thành bản đồ chiến dịch: mỗi khu một boss + lò của khu; công trình = lò |
| Cốt truyện Phố Chữ mất tiếng (4 khu, Mờ, cú lật, 3 lựa chọn) | `story.ts`, `storyfx.ts` | Đổi vai | Giữ thế giới; boss mỗi khu là nhân vật truyện. Sửa truyện cho hợp "chiến binh" (Mờ là trùm?) |
| Phố chung, công trình ★, trang trí bằng xu | `town.ts`, `townview.ts` | Gộp | Công trình = lò trên bản đồ; trang trí → thời trang / chỗ tiêu thô |
| Sảnh kiểu Gunny, thanh tài nguyên, chấm đỏ, dòng tin, nhạc nền | `lobbyscene.ts`, `dots.ts`, `bgm.ts` | Đổi vai | Sảnh có 2 nút chính: **Đánh boss** và **Thợ rèn gợi ý**; luật màn đầu v117 sửa cho phù hợp (vẫn ≤ 3 khối) |
| Thẻ Mục tiêu (goalbar), dòng 🎯 ở màn kết | `goalbar.ts` | Đổi vai | Mục tiêu nói bằng đồ ("còn 2 ô dưới bậc A2"), chi tiết CEFR ở hồ sơ |
| Sự kiện tuần, chuỗi ngày, Sổ nhiệm vụ | `weekly.ts`, app | Đổi vai | Nhiệm vụ ngày kiểu Gunny (đánh 1 trận, rèn 1 lần, mài 1 món); không "sợ mất" |
| Âm thanh, âm cảnh, sân khấu, cảnh sống, hạt nổ | `sfx.ts`, `ambience.ts`, `stagefx.ts`, `scenefx.ts`, `bubblefx.ts`, `cardsfx.ts` | Lõi giữ | Dùng lại cho trận đấu |
| Tí (linh vật dẫn đường) | app, `gameview.ts` | Đổi vai | Thành Thợ rèn hoặc bạn đồng hành |

### 2.4 Phần học kiểu cũ trong `app.js` (tab Thư viện / Ôn tập)

| Chức năng | Loại | Ghi chú |
| --- | --- | --- |
| Bài học nền A1–C2, Pre-A1, phonics, thẻ từ, ôn SRS | Lõi giữ (nguồn nội dung) + Cất (màn) | Là kho câu cho mọi lò; màn học kiểu cũ ở Thư viện cho ai thích |
| Hội thoại mở (24), nhắc lại câu, đóng vai, shadowing | Lõi giữ + Cất | Nguồn cho lò Bùa |
| Chuyển ý Việt → Anh (36 đề), viết câu có kiểm soát, viết theo đề | Lõi giữ + Cất | Nguồn cho lò Nhẫn |
| Đọc / nghe dài B1–C2, văn bản đời thường | Lõi giữ + Cất | Nguồn cho lò Mũ, Khiên |
| Bài kiểm tra cấp 32 câu, Can-Do | Gộp | Trùng trận cổng; giữ dữ liệu, bỏ lối vào riêng |
| Sổ cụm động từ / thành ngữ | Cất | |
| 5.753 tệp âm Kokoro | Lõi giữ | |

### 2.5 Ôn thi IELTS / VSTEP (`src/exam`)

| Chức năng | Loại | Ghi chú |
| --- | --- | --- |
| IRT 3PL, xếp lớp thích ứng, FSRS, máy chấm, quy đổi | Lõi giữ | Đang dùng cho chương mở đầu và trận cổng |
| Tab Ôn thi, đề thi thử, kế hoạch tới ngày thi, sổ lỗi sai, ước tính band | Cất (đang ẩn từ v52) | Giữ ẩn. Không đầu tư cho tới khi có đích sau A2 |
| Chia sẻ thống kê ẩn danh, trang độ chính xác | Cất | Xem lại khi có tài khoản (đồng ý mới) |

### 2.6 Kiếm tiền, tài khoản, xã hội, vận hành

| Chức năng | Loại | Việc cần làm |
| --- | --- | --- |
| Năng lượng theo lượt | **Bỏ** | Trái mục 10. Phanh tốc độ đã có ở luật 5 lượt / kỹ năng / ngày của lò |
| Ô quảng cáo giả lập | **Bỏ** | Trái mục 10 |
| Gói Super giả lập | Đổi vai | Thành cửa hàng giả lập (gói thô) trong giai đoạn demo, chưa thu tiền |
| XP theo hoạt động | Gộp | Thành lực chiến / hạng nhân vật hoặc bỏ; không để ba thước đo song song |
| Xu | Gộp | Thành nguyên liệu thô (rơi từ trận, mua được) |
| Giải đấu tuần (nhóm 30, theo XP) | Đổi vai | Sau bóng ma: xếp hạng theo trận (Elo), tách khỏi XP |
| Thách đấu bạn bè (mã 10 câu) | Đổi vai | Nền cho đấu bóng ma (cùng hạt giống) |
| Đồng bộ mã ELK, sao lưu | Đổi vai | Cầu chuyển sang tài khoản Supabase Auth; sau đó cất |
| Nhắc học Web Push (`el-remind`) | Lõi giữ | Đổi lời nhắc sang ngôn ngữ game ("đồ của bạn sắp cùn") |
| Công cụ lớp học cho giáo viên | Cất | Không thuộc hướng mới |
| Báo lỗi câu, Supabase `el_*` | Lõi giữ | |
| Quyền riêng tư, kiểm tuổi | Đổi vai | Viết lại cho tài khoản + Nghị định 13/2023 + cha mẹ đồng ý dưới 16 |
| Tên, manifest, README, màn "Về" | Đổi vai | Chiến Binh Chữ |

## 3. Chưa có, phải xây mới

| Thứ | Mốc |
| --- | --- |
| **Trận đấu ngắm bắn** (góc, lực, gió, địa hình), boss khu A1, công thức sát thương 70 / 30 | Mốc 1 |
| Một hệ đồ duy nhất 7 ô, lực chiến, bậc khoá theo chỉ số thật, "cùn" theo FSRS | Mốc 1 (Vũ khí), mốc 2 (đủ 7 ô) |
| Tinh hoa chữ + nguyên liệu thô; công thức rèn | Mốc 1 |
| Thợ rèn gợi ý (director mới) | Mốc 1 |
| Nút góp ý nhanh trong trận | Mốc 1 |
| Bảo vật khu = trận cổng | Mốc 2 |
| Bộ hình CC0 (Kenney…) + ghi nguồn | Mốc 1 |
| Supabase Auth, chơi trước đăng nhập sau, chuyển dữ liệu | Mốc 3 |
| Đấu bóng ma, xếp hạng theo trận | Mốc 4 |
| Cửa hàng thô (giả lập), sau là thanh toán thật | Mốc 4–5 |
| Đổi tên Chiến Binh Chữ (tra trùng) | Mốc 3 |

## 4. Thứ tự đề xuất

1. **Mốc 1 (kiểm vòng lõi):** trận PvE boss A1 + hệ đồ mới (chỉ ô Vũ khí) + lò Vòng Chữ / Mỏ Chữ / Vườn từ trả tinh hoa + Thợ rèn gợi ý + góp ý nhanh. Chưa gỡ gì cũ; lối vào mới đặt lên đầu sảnh.
2. **Mốc 2 (đủ bộ):** 7 ô, mở lò dần theo khu, đồ cùn / mài, Bảo vật khu = trận cổng A1, A2. Gộp Túi chữ / Lò rèn v129 / trang bị v132 thành một hệ. Bỏ năng lượng + quảng cáo giả.
3. **Mốc 3 (danh tính):** Supabase Auth, chuyển mã ELK, đổi tên, viết lại quyền riêng tư.
4. **Mốc 4 (người thật):** đấu bóng ma, xếp hạng theo trận, cửa hàng thô giả lập.
5. Sau đó: realtime khi đủ người; thanh toán thật khi qua cổng store (người sáng lập đạt A2 bằng trận cổng + đề mẫu Cambridge).

Không gỡ mã cũ trước mốc 2: nếu mốc 1 cho thấy trận đấu không cuốn, còn đường lui.

## 5. Đã quyết (13/10/2026)

Ghi ở `docs/SPEC.md`, khối đầu tệp, mục 17–22:
- **Q21:** theo 7 ô đã chốt. Trí nhớ thành độ sắc của đồ; Dùng thật thành điều kiện tôi luyện bậc 4–5. Ba hệ đồ gộp làm một.
- **Q22:** cất vào Thư viện, không rơi nguyên liệu.
- **Q23:** boss là Tiếng Ồn do Sương tạo ra; Mờ giữ vai được hoà giải.
- **Soát cổng:** AI soát chéo, người sáng lập không xem đề; đề mẫu Cambridge A2 Key là trọng tài.
- **Bộ tiêu chí:** đóng băng các thang cũ; một bảng duy nhất "Chiến Binh Chữ → A2".
