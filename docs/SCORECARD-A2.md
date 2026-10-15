# Bảng tiêu chí Chiến Binh Chữ → A2

Bảng chấm duy nhất từ 13/10/2026 (`docs/SPEC.md`, khối đầu tệp, mục 21). Các thang cũ (Conformance 200, Scorecard 400, Scorecard v111, trục M / H / S / G / P) đóng băng làm lịch sử.

**Câu hỏi bảng này trả lời:** app hiện tại đưa được người sáng lập từ A1 tới **A2 đã xác nhận** bằng con đường "học → rèn đồ → thắng trận" tới đâu?

**Cách chấm:**
- **Mốc 10:** trạng thái đích của hướng mới, không phải "tốt hơn bản trước".
- **Mốc 0:** chưa có gì.
- Mỗi tiêu chí ghi **bằng chứng** (tệp, test, số liệu) và **cách đo khi có người chơi**.
- Điểm dưới đây là **tự chấm khi đọc mã ở bản v132, chưa có người thật kiểm** (mục 14). Tiêu chí có chữ *đo* chỉ được lên trên 6 khi có số liệu thật.

**Tiêu chí bắt buộc:** C1, C3, C6 phải ≥ 7 thì app mới được coi là đạt hướng mới, dù điểm chung cao.

## Bảng chấm (bản v132, 13/10/2026)

| # | Tiêu chí | Trọng số | Mốc 10 | Hiện có (v132) | Điểm |
|---|---|---|---|---|---|
| **A. Vòng chơi** | | | | | |
| C1 | **Trận đấu vui tự thân** *(đo)* | 3 | Trận ngắm góc / lực / gió 2–4 phút, boss có cơ chế riêng, trúng / trượt do tay mình. Người sáng lập tự mở trận khi không cần học. Chơi tiếp sau trận ≥ 60% | Chưa có trận đấu. Sân khấu, hạt nổ, âm WebAudio, nhân vật chibi dùng lại được | **0** |
| C2 | **Đồ quyết định khoảng 70%** *(đo)* | 2 | Số liệu trận: chênh 1 bậc đồ thì người ngắm giỏi thắng 30–45%; chênh ≥ 2 bậc thì < 10%. Cùng bậc thì tay ngắm quyết định. Mô phỏng khoá dải tỉ lệ này bằng test | Đồ chưa có tác dụng vào đâu | **0** |
| C3 | **Vòng học → rèn → thắng khép kín** | 2 | Mọi lần học ở lò cho tinh hoa. Mọi món cần tinh hoa. Món mạnh hơn làm thắng boss mà trước đó thua. Người chơi thấy rõ chuỗi này trong một buổi | Có Lò rèn 5 bậc theo mức đạt thật (v129) và trang bị theo chỉ số thật (v132). Nhưng đồ không dùng vào đâu, nên vòng hở ở khâu "thắng" | **2** |
| C4 | **Một hệ đồ, khoá theo năng lực thật** | 1 | Một hệ 7 ô (Vũ khí … Nhẫn), bậc N chỉ mặc được khi chỉ số thật đạt N. Không đường nào (nạp, xu, thời gian) vượt được khoá. Trí nhớ = độ sắc; Dùng thật = điều kiện tôi luyện | Bậc trang bị v132 = Lv chỉ số thật (đúng tinh thần). Nhưng có 3 hệ đồ song song, ô lệch (thiếu Đọc, Viết), chưa có độ sắc | **4** |
| **B. Học thật tới A2** | | | | | |
| C5 | **Thợ rèn dẫn đúng chỗ thiếu** | 1 | Gợi ý một món "đáng rèn nhất", nội dung lần rèn do NBA chọn (luyện phôi / mài / thử quặng / tôi luyện), lý do bằng lời game. Người chơi tự chọn vẫn không học lệch được (luật "không hơn món yếu nhất quá 1 bậc") | `nba.ts`, `path.ts`, `director.ts` mạnh, bot L01–L03 kiểm. Nhưng bộ não đang chọn *game*, chưa chọn *món đồ*; chưa có luật chống lệch | **5** |
| C6 | **Đo đúng tiến độ tới A2** | 2 | Bằng chứng L0–L4, mastery có đoán mò / nhầm tay, transfer bắt buộc ở mức cao, đèn học tủ. Trận đấu không ghi bằng chứng. Dự đoán của app khớp đề mẫu Cambridge (sai lệch nhỏ, đo trên người thật) | Lõi bằng chứng v53–v71, `rote.ts`, test đơn vị và mô phỏng 20 Meta-Test. Chưa hiệu chỉnh trên người thật (một người dùng) | **7** |
| C7 | **Xác nhận A2 đáng tin** | 2 | Bảo vật khu = trận cổng câu lạ đủ Đọc / Nghe / Viết / Nói. Câu đã soát chéo bởi phiên AI độc lập. Đủ đề song song cho nhiều lần thử. Đề mẫu Cambridge A2 Key làm ngoài app, có đối chiếu với dự đoán | `gate.ts`, đề a2-1 / a2-2 (Đọc + Nghe, phép thử không có bài). Chưa soát chéo. Chỉ 2 đề: rớt 2 lần là hết đề lạ. Chưa có Viết / Nói trong cổng. Có ô ghi điểm ngoài "🎓 Chứng chỉ" | **4** |
| C8 | **Đủ nội dung A2 cho 7 ô** | 1 | Mọi nút của A2 (359 sau đóng tiền đề) có câu đo ở mức cần, chia đủ cho 7 lò; câu qua phép thử đoán mò; âm thanh thu sẵn | `coverage.md`: A2 có 0 nút thiếu câu đo. 5.753 tệp âm Pre-A1–B1. Phần Viết / Nói chỉ chấm bằng luật (Confidence tối đa Vừa) | **7** |
| C9 | **Nhớ lâu: đồ cùn và mài** *(đo)* | 1 | Phần đồ gắn mục sắp quên bị giảm lực; mài = ôn FSRS đến hạn. Đo được nhớ sau 7 / 30 ngày ≥ 80% trên người thật | FSRS-5, Sương quay lại, Bảng đo H6. Chưa gắn với đồ. Chưa có số liệu 30 ngày | **4** |
| **C. Trải nghiệm và công bằng** | | | | | |
| C10 | **Mở dần, không ngợp** | 1 | Người mới: một việc chính mỗi màn. Lò mở theo bậc đồ và khu; khu 1 chỉ 3–4 lò. Không có màn nào bắt chọn giữa > 4 thứ | Luật màn đầu v117, chấm đỏ có luật (v131). Nhưng hơn 17 game, 3 hệ đồ, sảnh nhiều lối. Mở theo khu chỉ ở bản đồ, chưa theo bậc đồ | **4** |
| C11 | **Kinh tế công bằng** | 1 | Hai loại: thô (từ trận, mua được) và tinh hoa (chỉ từ học). Nạp chỉ rút ngắn thô. Không năng lượng, không quảng cáo, không quay thưởng, không ưu đãi ép giờ; người dưới 16 tuổi phải có cha mẹ đồng ý | Có xu, nguyên liệu Túi chữ, XP, năng lượng theo lượt, Super và quảng cáo giả. Không có quay thưởng, không bán sức mạnh (đúng) | **3** |
| C12 | **Hình, tiếng, cảm giác trận** | 1 | Bộ hình CC0 đồng bộ (địa hình, đạn, boss), nhân vật mặc đúng đồ đã rèn, số sát thương bay, rung, âm theo đòn; ghi nguồn giấy phép | SVG tự vẽ (sảnh, nhân vật, bản đồ), hiệu ứng sân khấu / hạt / âm tổng hợp. Chưa có hình trận đấu, chưa dùng bộ hình mở | **4** |
| **D. Nền tảng và nghiệm thu** | | | | | |
| C13 | **Danh tính: chơi trước, đăng nhập sau** | 0,5 | Chương mở đầu + vài trận PvE không cần tài khoản; Supabase Auth khi đấu người thật / nạp / giữ đồ; dữ liệu khách chuyển sang; quyền riêng tư theo Nghị định 13/2023 | Không tài khoản (theo hướng cũ). Có mã đồng bộ ELK, Supabase sẵn | **2** |
| C14 | **Đối thủ người thật** | 0,5 | Đấu bóng ma cùng hạt giống, xếp hạng theo trận (tách XP); sau đó realtime | Thách đấu mã 10 câu (so điểm), giải đấu tuần theo XP | **1** |
| C15 | **Nghiệm thu bằng người thật** | 1 | Nút góp ý nhanh trong trận; số liệu trận (thắng / thua theo chênh bậc, rèn trước trận, chơi tiếp); nhật ký playtest có ngày; mỗi bản ghi "đã / chưa người thật kiểm" | `play.ts` đo bỏ dở / chơi tiếp / giây tới thao tác đầu. Chưa có góp ý nhanh. Một playtest thật có ghi (v92), kết quả xấu | **2** |

## Tổng

| | Điểm |
|---|---|
| Tổng có trọng số | (0×3 + 0×2 + 2×2 + 4 + 5 + 7×2 + 4×2 + 7 + 4 + 4 + 3 + 4 + 2×0,5 + 1×0,5 + 2) ÷ 20 = 60,5 ÷ 20 ≈ **3,0 / 10** |
| Bắt buộc | C1 = 0, C3 = 2 **chưa đạt**; C6 = 7 đạt |
| Nhóm A: vòng chơi | 1,0 |
| Nhóm B: học thật tới A2 | ≈ 5,4 |
| Nhóm C: trải nghiệm, công bằng | ≈ 3,7 |
| Nhóm D: nền tảng, nghiệm thu | ≈ 1,8 |

## Đọc điểm, nói thẳng

- **3,0 không có nghĩa app tệ.** Phần học (nhóm B ≈ 5,4) là phần mạnh nhất và tốn công nhất, và nó giữ nguyên giá trị. Điểm thấp vì đích đã đổi: lõi của hướng mới là trận đấu, mà trận đấu chưa tồn tại.
- **Một việc kéo được nhiều điểm nhất là mốc 1.** Trận PvE + ô Vũ khí + Thợ rèn gợi ý + góp ý nhanh chạm C1, C2, C3, C4, C5, C12, C15. Ước tính sau mốc 1, tự chấm lên khoảng **5,4**. C1 và C2 vẫn bị giới hạn ở 6 cho tới khi bạn chơi thật.
- **Rủi ro lớn nhất cho đích A2 nằm ở C7, không ở game.** Chỉ có 2 đề cổng A2 (Đọc + Nghe), chưa soát chéo, chưa có Viết / Nói. Rớt hai lần là hết đề lạ. Việc này phải xong trước khi bạn chạm tới A2. Thứ tự hợp lý: soát chéo + soạn thêm đề ở mốc 2.
- **Không thể đạt 10 khi chỉ một mình tôi làm:** C1, C2, C9, C15 cần bạn chơi và cần thời gian (30 ngày cho số đo nhớ lâu).

## Chấm lại sau mốc 1 (v133, 13/10/2026): tự chấm, CHƯA người thật kiểm

| # | v132 | v133 | Bằng chứng / vì sao chưa cao hơn |
|---|---|---|---|
| C1 *(đo)* | 0 | **5** | Có trận ngắm góc / lực / gió (`fight.ts`, `fightview.ts`): kéo ná, quỹ đạo 1/3, dấu ✕ phát trước, boss Rè có cơ chế (gió đảo chiều, Sóng rè), số sát thương, rung, chậm thời gian khi kết liễu. Chưa ai chơi thật; hình tự vẽ |
| C2 *(đo)* | 0 | **5** | Công thức đồ × tay ngắm; mô phỏng khoá dải ở `engine-fight.test.ts` (chênh −1 ngắm giỏi 42%, −2: 2%, +1 ngắm kém 59%, đúng bậc giỏi 85% / kém 30%). Bot ≠ người; chưa có số liệu trận thật |
| C3 | 2 | **6** | Thua vì thiếu bậc → màn kết nói đúng ô, một nút mở đúng lò; tinh hoa chỉ từ câu đúng ở lò; rèn → mặc khi Từ vựng đủ. Mới một ô (Vũ khí) |
| C4 | 4 | **4** | Vũ khí khoá đúng luật (bậc mặc = min(đã rèn, Từ vựng Lv), test xu / tinh hoa vô hạn không vượt). Nhưng tạm thời có thêm một hệ đồ nữa cho tới khi gộp ở mốc 2 |
| C5 | 5 | **6** | Thợ rèn gợi ý (bản đầu, chỉ ô Vũ khí), lý do bằng lời game, +25% tinh hoa khi theo |
| C6 | 7 | **7** | Thêm test: mô-đun trận không gọi `ingest`; e2e: sổ bằng chứng không đổi sau trận |
| C7 | 4 | 4 | Chưa làm (mốc 2) |
| C8 | 7 | 7 | — |
| C9 *(đo)* | 4 | 4 | Chưa gắn độ sắc (mốc 2) |
| C10 | 4 | **4** | Sảnh có một nút chính ⚔️; nhưng còn thêm khối, phần cũ chưa gỡ (luật mốc 2) |
| C11 | 3 | **4** | Tinh hoa không mua được; thô = xu. Năng lượng, quảng cáo giả còn (gỡ ở mốc 2) |
| C12 | 4 | **5** | Hình trận tự vẽ, nhân vật cầm Vũ khí đúng bậc, số sát thương, rung, âm theo đòn. Chưa có bộ hình CC0 (mạng chặn, `docs/ASSETS.md`) |
| C13 | 2 | 2 | — |
| C14 | 1 | 1 | — |
| C15 | 2 | **5** | 💬 trong trận và ở màn Chiến Binh, xuất văn bản; số liệu trận theo chênh bậc; `PLAYTEST.md` Phần 0. Chưa có buổi chơi thật |

**Tổng ≈ 99,5 ÷ 20 ≈ 5,0 / 10** (ước tính cũ 5,4). Thấp hơn vì: không có bộ hình CC0, C4 chưa gộp, và giữ trần thấp cho mọi thứ chưa người thật chơi. Bắt buộc: C1 = 5, C3 = 6 **chưa đạt**; C6 = 7 đạt. Bước tiếp theo là **người sáng lập chơi 15 phút theo `PLAYTEST.md` Phần 0 và chấm C1**.

## Chấm lại sau v134 (15/10/2026): tự chấm, CHƯA người thật kiểm

Chỉ hai tiêu chí đổi; phần trò chơi của mốc 2 chưa làm.

| # | v133 | v134 | Bằng chứng / vì sao chưa cao hơn |
|---|---|---|---|
| C7 | 4 | **6** | 4 trận cổng / cấp A1, A2 (rớt 3 lần vẫn còn đề lạ); cả 8 trận đã soát chéo độc lập, đáp án khớp 100%; phép thử không có bài cho 4 trận mới (`content/exam/gate/README.md`). Chưa có Viết / Nói trong cổng; độ khó câu chưa hiệu chỉnh trên người thật |
| C8 | 7 | **8** | Sân tập: khoảng 300 câu đúng 10 phần Đọc / Nghe A2 Key, 30 bài nghe có âm thanh Kokoro + bản chậm; máy dò "đủ ý" cho Viết. Viết / Nói vẫn chỉ chấm bằng luật |

**Tổng ≈ (99,5 + 2×2 + 1) ÷ 20 ≈ 5,2 / 10** (v133: 5,0). Chi tiết theo kỹ năng và theo cấp: `docs/DANH-GIA-KHONG-AI.md`.

## Lịch chấm

Chấm lại sau mỗi mốc; ghi điểm mới cạnh điểm cũ, kèm "đã / chưa người thật kiểm". Không đổi mốc 10 để điểm đẹp hơn; muốn đổi mốc hoặc trọng số phải hỏi người sáng lập.
