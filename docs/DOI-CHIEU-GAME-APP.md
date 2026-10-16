# Đối chiếu game và app học cũ (16/10/2026, v135 / APP_VERSION 72)

Trả lời ba câu của người sáng lập:
1. Học tiếng Anh khó ở đâu?
2. Tách game và app học cũ thành hai phần để đối chiếu.
3. Game hiện tại giải được bao nhiêu khó khăn, trên thang 10?

**Tự chấm khi đọc mã ở bản v134. Chưa người thật kiểm.** Điểm chỉ để tham khảo (SPEC mục 14).

## 1. Khó khăn khi học tiếng Anh (người Việt, A1 → A2)

Mỗi khó khăn ghi **gốc rễ**, vì cách chữa phải nhắm vào gốc, không vào triệu chứng.

| # | Khó khăn | Gốc rễ |
|---|---|---|
| K1 | Chán, bỏ giữa chừng | Tiến bộ ngôn ngữ chậm và vô hình; phần thưởng đến muộn hơn công sức. Học một mình không ai đợi |
| K2 | Học trước quên sau | Đường cong quên: không ôn đúng lúc thì sau một tuần mất phần lớn. Học dồn một buổi tạo cảm giác "đã thuộc" giả |
| K3 | Ngợp, không biết bắt đầu từ đâu | Quá nhiều tài liệu, ứng dụng, lời khuyên. Mỗi lần ngồi học lại phải tự chọn |
| K4 | Học không đúng chỗ thiếu | Học theo giáo trình cố định: lặp lại cái đã biết, bỏ sót cái đích cần. Không ai đo khoảng thiếu |
| K5 | Phát âm | Tiếng Việt đơn âm tiết, có thanh, gần như không có phụ âm cuối kép. Khó: âm cuối (-s, -ed, -t, -k), cụm phụ âm, trọng âm, /θ ð ʃ ʒ/, nguyên âm dài / ngắn |
| K6 | Nghe không ra từ đã biết | Học từ qua mắt, không qua tai. Nối âm, nuốt âm, tốc độ thật. Phát âm sai thì nghe cũng sai |
| K7 | Ngữ pháp khác tiếng Việt | Tiếng Việt không chia động từ, không số nhiều, không mạo từ. Lỗi lặp: quên -s, sai thì, thiếu a / the, trật tự tính từ |
| K8 | Không dám / không có chỗ nói, viết | Sợ sai, không có người nghe, không có ai sửa. Học thụ động (đọc, chọn đáp án) không tạo ra khả năng nói |
| K9 | Thuộc mà không dùng được | Học tủ: nhớ câu cũ, gặp câu lạ thì không làm được. Dịch trong đầu từ tiếng Việt |
| K10 | Không biết mình đang ở đâu | Không có thước đo khách quan giữa hai kỳ thi; tự đánh giá thường sai |
| K11 | Ít thời gian, học rời rạc | Người đi làm chỉ có vài phút rời. Bài dài thì bỏ |
| K12 | Không ai dẫn liền mạch tới đích | Có tài liệu nhưng không có lộ trình nối từ hôm nay tới cấp đích, và không ai báo "đủ rồi, sang chặng sau" |

## 2. Tách hai lối, một não (đã làm ở bản này)

Quyết định của người sáng lập (16/10/2026, trả lời câu hỏi):
- **Một não, hai lối.** Tiến độ, bằng chứng, FSRS, bản đồ A2 dùng chung. Không tách hồ sơ, vì bạn là một người học: tách hồ sơ thì phải học lại hai lần, mà đầu bạn vẫn là một.
- **Đối chiếu bằng nguồn của từng câu đúng**, không bằng hai bộ não. Đây là đối chiếu "nguồn luyện", không phải thí nghiệm tách biệt.
- **Màn đối chiếu theo nhóm A2.**
- **Làm tách + đối chiếu trước**, mốc 2 sau.

Đã có trong app:
- **Đổi lối:** nút cuối thanh điều hướng (và ở màn Tôi).
  - ⚔️ **Lối Chiến Binh** (mặc định): Hôm nay (sảnh, trận, lò rèn) + Tôi.
  - 📘 **Lối Học**: Hôm nay, Ôn tập, Thư viện, Tôi như app cũ; khối Chiến Binh ẩn khỏi sảnh.
  - Cài đặt `st.set.door`. Đổi lối không mất gì.
- **Ghi nguồn:** mỗi câu đúng đã vào sổ bằng chứng được đếm thêm vào `st.e.src[nút] = { g, a }` theo lối đang dùng. Ghi ở cả hai đường: bài học cũ (`core.ts ev`) và game (lớp bọc `ingest` trong `main.ts`). Bộ đếm chỉ đọc kết quả; không đổi bằng chứng, không đổi mastery. Gộp hai máy lấy số lớn hơn.
- **Màn ⚖️ Đối chiếu game và app** (Tôi → Đối chiếu; route `cmp`, `compare.ts`, `compareview.ts`): 359 nút A2 chia 5 nhóm. Mỗi nhóm có:
  - số đã vững, chia theo nguồn: nhờ game / nhờ app / cả hai / có từ trước khi tách lối;
  - số câu đúng ở mỗi lối;
  - game có lò cho nhóm này hay chưa.

Từ v136, màn đối chiếu chia theo **7 kỹ năng = 7 ô đồ** (trường `area` của nút; xem §5).

| Kỹ năng A2 | Ô đồ | Số phần | Game có lý do học? |
|---|---|---|---|
| 📚 Từ vựng | Vũ khí | 188 | Có, nhưng chỉ tới 6 kỹ năng vững |
| 🧩 Ngữ pháp | Giáp | 70 | Chưa |
| 🔊 Phát âm | Giày | 29 | Chưa |
| 🎧 Nghe | Khiên | 10 | Chưa |
| 🗣️ Nói (gồm 18 chức năng giao tiếp) | Bùa | 44 | Chưa |
| 📖 Đọc | Mũ | 8 | Chưa |
| ✍️ Viết | Nhẫn | 10 | Chưa |

**Cách đọc màn đối chiếu:**
- Phần "có từ trước khi tách lối" là tiến độ cũ, không gán được cho lối nào.
- Sau 2–4 tuần chơi, cột ⚔️ nói thật game đang dẫn bạn tới đâu.
- Nhóm nào cột ⚔️ mãi bằng 0 là chỗ game cần lò mới.

## 3. Chấm game hiện tại (v134) theo 12 khó khăn

Câu hỏi của bảng này: **nếu chỉ chơi game (lối Chiến Binh), các khó khăn trên được giải tới đâu?** App cũ chấm cạnh bên để đối chiếu.

| # | Khó khăn | Trọng số | Game v134 | App cũ | Bằng chứng (đọc mã) |
|---|---|---|---|---|---|
| K1 | Chán, bỏ giữa chừng | 2 | 5 | 4 | Game: trận Chaos Orbit 70–90 giây, học có lý do (rèn đồ để thắng). Nhưng chỉ 3 trận; thắng boss khu 1 là hết. App cũ: chuỗi ngày, XP, giải đấu; playtest v92 "quá tệ" |
| K2 | Học trước quên sau | 2 | 4 | 7 | FSRS chạy chung bên dưới; Thợ rèn ưu tiên tưới cây đến hạn ở Vườn từ. Chưa có "đồ cùn" nên game chưa cho lý do ôn. App cũ: tab Ôn tập, Sương quay lại |
| K3 | Ngợp | 1 | 6 | 4 | Game: một nút chính ⚔️ + một gợi ý của Thợ rèn. App cũ: hơn 17 game, nhiều tab |
| K4 | Học không đúng chỗ thiếu | 2 | 2 | 7 | Thợ rèn chỉ chọn giữa 3 lò từ vựng (`cb.ts tipOf`), không theo khoảng thiếu A2. App cũ: `path.ts`, `nba.ts`, `director.ts` theo đích |
| K5 | Phát âm | 1 | 1 | 6 | Giày (Phát âm) có tác dụng trong trận, nhưng bậc lấy từ chỉ số do app cũ tạo; game không có lò phát âm, không cho tinh hoa |
| K6 | Nghe | 1 | 1 | 6 | Khiên (Nghe) như trên: có tác dụng, không có lò trong vòng game |
| K7 | Ngữ pháp | 1 | 1 | 7 | Giáp (Ngữ pháp) như trên. App cũ: bài ngữ pháp, Bài Câu, Xưởng sửa câu, bảng lỗi đối chiếu Việt–Anh |
| K8 | Nói, viết | 1 | 0 | 5 | Game: không có. App cũ: hội thoại, đóng vai, viết theo đề, chuyển ý; chấm bằng luật (Confidence tối đa Vừa) |
| K9 | Thuộc mà không dùng được | 1 | 3 | 7 | Game: câu mới gặp cho tinh hoa ×2. Đèn học tủ, câu transfer không nằm trong vòng game |
| K10 | Không biết mình ở đâu | 2 | 4 | 6 | Bậc đồ khoá theo chỉ số thật (đúng tinh thần), trận không ghi bằng chứng. Trận cổng A2 chưa nằm trong vòng game; cổng chỉ 2 bộ, chưa soát chéo |
| K11 | Ít thời gian | 1 | 7 | 6 | Trận 70–90 giây, lò ngắn |
| K12 | Dẫn liền mạch tới đích | 2 | 1 | 6 | Boss cần Vũ khí bậc 2 = 3 kỹ năng từ vựng vững; trần bậc 3 = 6 kỹ năng (`bag.ts LV_AT`). Game kéo khoảng **6 / 359 ≈ 2%** đích A2 |
| | **Tổng có trọng số (÷ 17)** | | **51 ÷ 17 = 3,0** | **101 ÷ 17 ≈ 5,9** | |

### Đọc điểm, nói thẳng

- **Game giải tốt đúng ba khó khăn "mềm":** chán (K1), ngợp (K3), ít thời gian (K11). Đó là phần app cũ yếu nhất, nên hướng game không sai.
- **Game chưa thay được app ở phần học thật** (K4–K9, K12). Gốc rễ: vòng "học → rèn → thắng" mới nối một ô (Vũ khí = từ vựng), và chỉ tới 6 kỹ năng. Sau đó game không còn lý do để học.
- **Chỗ đáng lo nhất:** Giáp / Khiên / Giày / Bùa có tác dụng trong trận, nhưng bậc của chúng lên nhờ học ở **app cũ**. Nếu bỏ app cũ, bốn ô này đứng yên. Vì vậy chưa được bỏ lối Học trước khi mỗi ô có lò riêng.
- **Bảng này khác `SCORECARD-A2.md` (5,0):** bảng đó chấm tiến độ xây hướng mới; bảng này chấm "chỉ chơi game thì giải được bao nhiêu khó khăn". Hai con số không mâu thuẫn.

### Việc nâng điểm (trỏ về `KE-HOACH-A2.md` mốc 2)

| Việc | Nâng | Ước tính sau khi làm |
|---|---|---|
| Đủ 7 ô có lò + tinh hoa riêng (Giáp ← Bài Câu / Xưởng sửa câu; Khiên ← Đài, Quán; Giày ← Bắt Âm, Bến Cảng; Mũ ← Thám tử; Bùa ← Quán giọng; Nhẫn ← Thư) | K5–K8, K12 | mỗi khó khăn +3–4 |
| Boss khu 2–4 nhắm ô yếu + luật "không món nào hơn món yếu nhất quá 1 bậc" | K4, K12 | +3 |
| Đồ cùn theo FSRS, mài = ôn đến hạn | K2 | +3 |
| Thợ rèn chọn theo khoảng thiếu A2 (`nba.ts`), không chỉ 3 lò từ vựng | K4 | +3 |
| Tôi luyện bậc 4–5 bắt buộc câu transfer | K9 | +3 |
| Bảo vật khu = trận cổng A2 (soát chéo, thêm bộ, có Viết / Nói) | K10, K12 | +2–3 |

Ước tính game sau mốc 2: khoảng **6,5 / 10** trên bảng này. Lối Học vẫn giữ cho tới khi màn đối chiếu cho thấy cột ⚔️ phủ được mọi nhóm.

## 4. Cần người thật

- Chơi 2–4 tuần ở lối Chiến Binh. Học bù ở lối Học khi cần.
- Mở ⚖️ Đối chiếu mỗi tuần, ghi vào `docs/PLAYTEST.md`.
- K1 và K2 chỉ lên trên 6 khi có số liệu thật: chơi tiếp sau trận ≥ 60%, nhớ sau 7 / 30 ngày ≥ 80%.

## 5. Lối Học theo 7 kỹ năng (v136, APP_VERSION 73)

Người sáng lập đề xuất tách lối Học thành 6 phần: Từ vựng, Ngữ pháp, Nghe, Nói, Đọc, Viết. Sau góp ý, đã chốt:
- **Thêm Phát âm thành 7.** Đây là khó khăn lớn nhất của người Việt (K5), có 29 phần A2. Nó cũng khớp 1–1 với 7 ô đồ của game.
- **Tách để theo dõi, không tách bài.** Bài theo chủ đề dạy từ và ngữ pháp trong cùng ngữ cảnh, tách ra là mất ngữ cảnh. Tab học riêng theo kỹ năng thì dễ học lệch theo sở thích. Tab Hôm nay vẫn chọn sẵn chỗ thiếu nhất.

Đã có trong app:
- Thư viện mở bằng **bảng 7 kỹ năng**. Mỗi kỹ năng có thanh "x/y vững" của đích. Kỹ năng % thấp nhất có nhãn "thiếu nhất". Nói và Viết ghi "tin cậy vừa".
- Chạm một kỹ năng là mở màn có sẵn của nó:
  - Từ vựng → Bài học theo chủ đề;
  - Ngữ pháp → Ngữ pháp;
  - Phát âm → Phát âm;
  - Nghe / Nói / Đọc / Viết → đúng tab của màn Kỹ năng.
- Hội thoại và chức năng giao tiếp tính vào Nói; chuyển ý Việt → Anh tính vào Viết.

Hai góp ý ghi lại (chưa đổi ở bản này):
1. **Bản đồ A2 lệch về Từ vựng + Ngữ pháp** (258 / 359 = 72%). Đọc, Nghe, Viết mỗi kỹ năng chỉ 8–10 phần. Một phần vững làm thanh nhảy 10–12%. Trong khi đó A2 Key chấm Đọc + Viết 50%, Nghe 25%, Nói 25%. Việc nội dung sau (C8): chia nhỏ năng lực Đọc / Nghe / Viết thành nhiều phần đo được.
2. **Nói, Viết chấm bằng luật**, độ tin cậy tối đa "Vừa". Thanh của hai kỹ năng này chỉ để tham khảo cho tới khi có cách chấm tốt hơn.
