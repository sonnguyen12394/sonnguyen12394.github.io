# Kế hoạch Chiến Binh Chữ → A2 (bàn giao 13/10/2026)

Tài liệu cho phiên làm việc tiếp theo (tài khoản khác). Đọc theo thứ tự:
1. `docs/SPEC.md`: **chỉ khối đầu tệp** "13/10/2026 — Đổi hướng: Chiến Binh Chữ", mục 1–22.
2. `docs/SCORECARD-A2.md`: bảng chấm duy nhất (15 tiêu chí; bản v132 được 3,0 / 10).
3. `docs/RA-SOAT-v133.md`: mọi chức năng cũ được giữ / đổi vai / cất / bỏ thế nào.
4. Tệp này: cách tốt nhất để nâng từng tiêu chí, chia thành mốc, có tiêu chí xong.

Nhánh chứa các tài liệu trên: `claude/v133-spec-chien-binh-chu` (chỉ tài liệu, chưa đổi code). Gộp vào `main` trước khi bắt đầu mốc 1, hoặc tạo nhánh mốc 1 từ nhánh này.

## 0. Luật làm việc (không được phá)

- **Quyết định của người sáng lập** (khối đầu `SPEC.md`) không tự đổi; muốn đổi phải hỏi. Điểm kỹ thuật còn mở thì tự quyết theo hướng mới, ghi lý do.
- **Trận đấu không ghi bằng chứng** (P13). Chỉ lượt rèn ở lò mới gọi `ingest`.
- **Lượt rèn là lượt đo** (P14): không đồng hồ ép giờ, chỉ số trận đấu không đổi câu hỏi hay cách tính.
- **Không gỡ mã cũ trước mốc 2**; lối vào mới đặt lên đầu, cũ lùi về sau.
- **Điểm tự chấm chỉ để tham khảo.** Mỗi bản ghi "đã / chưa người thật kiểm". Tiêu chí *(đo)* không lên quá 6 khi chưa có số liệu thật.
- **Mỗi mốc một PR.** Trước khi đẩy: `npm run check`, `npm test`, `npm run content`, `npm run build`, `npm run fresh`; e2e các spec bị ảnh hưởng. Tăng `APP_VERSION` trong `app.js` khi phát hành (`npm run build` đồng bộ `sw.js`, `index.html`).
- **Chữ hiển thị:** tiếng Việt có dấu, câu ngắn. Màn chơi không dùng chữ "thi / đề / kiểm tra".
- **Không thêm** nạp để mạnh, quay thưởng, cường hoá hỏng mất đồ, ưu đãi ép giờ, năng lượng chặn học.

## 1. Kiến trúc đích (một hình)

```
          ┌──────────── Lò rèn (17 game cũ, mở dần) ─────────────┐
 NBA chọn │ luyện phôi · mài đồ cùn · thử quặng lạ · tôi luyện   │──► bằng chứng (ingest) ──► mastery / FSRS
 nội dung └──────────────────────────┬───────────────────────────┘                              │
                                     │ tinh hoa chữ (chỉ từ trả lời đúng)                       ▼
 Thợ rèn gợi ý (director) ──► Rèn món (thô + tinh hoa) ──► Đồ 7 ô  ◄── khoá bậc theo chỉ số thật
                                                             │       độ sắc theo FSRS (cùn / sắc)
                                                             ▼
                                Trận đấu ngắm bắn (game thuần, không ghi bằng chứng)
                                  sát thương ≈ 70% đồ + 30% tay ngắm  ──►  rơi nguyên liệu thô
                                                             │
                     Boss cuối khu cần Bảo vật khu = trận cổng (câu lạ, P(đậu) ≥ 80%)
```

## 2. Cách tốt nhất cho từng tiêu chí

Mỗi dòng: cách làm được chọn, lý do chọn, cách đo để lên điểm cao.

### C1 Trận đấu vui tự thân (trọng số 3, bắt buộc ≥ 7)
- **v134 (15/10/2026):** trận đổi sang kiểu Chaos Orbit (docs/SPEC.md khối 15/10/2026); dải C2 giữ nguyên, bot ngắm thay bằng bot né. Dòng dưới là thiết kế v133 (lịch sử).
- **Cách làm (v133, đã thay):** trận ngắm bắn theo lượt kiểu Gunny trên canvas (theo khuôn lớp phủ `wheelview.ts` / `huntview.ts`: ngoài `#app`, 60 fps, pointer events). Kéo để chọn góc + lực, mũi tên quỹ đạo dự đoán ngắn (chỉ 1/3 đường như Gunny), gió đổi mỗi lượt, địa hình bị khoét khi nổ (mặt nạ alpha trên canvas địa hình). Mỗi lượt ≤ 15 giây, trận 2–4 phút, 1 boss + tối đa 2 lính.
- **Boss có cơ chế riêng** (không chỉ "máu trâu"): khu 1 Tiếng Ồn Rè (chắn gió, đổi hướng gió mỗi 2 lượt), khu 2 Tiếng Ồn Vọng (nhân đôi đạn), khu 3 Tiếng Ồn Câm (giấu thanh lực)… Mỗi boss nhắm vào **một ô yếu** (mục 5 spec) để buộc học đều.
- **Cảm giác:** số sát thương bay, rung màn khi trúng mạnh, chậm thời gian 150 ms khi kết liễu, âm theo đòn (`sfx.ts`), nhân vật mặc đúng đồ đã rèn (`avatar.ts`).
- **Lý do:** C1 nặng nhất và đã từng thất bại (playtest v92 "quá tệ"). Phải làm ít mà sâu: một kiểu trận, một boss làm thật tốt trước khi thêm.
- **Đo:** `play.ts` thêm `fight`: chơi tiếp sau trận ≥ 60%, bỏ giữa trận < 15%, giây tới cú bắn đầu < 8. Nút góp ý nhanh sau trận (C15). Người sáng lập tự mở trận khi không có gợi ý học.

### C2 Đồ quyết định khoảng 70% (trọng số 2)
- **Công thức đề xuất** (tham số cấu hình, chỉnh bằng mô phỏng):
  ```
  power   = Σ_ô  bậc(ô) × độSắc(ô) × trọngSốÔ        // độSắc ∈ [0,6; 1] theo FSRS
  hit     = 1 − khoảng cách tâm nổ / bán kính         // 0..1, tay ngắm
  damage  = base × power^1,0 × (0,55 + 0,45 × hit)    // trúng tâm vs trúng rìa chênh ≤ 1,8 lần
  bossHP  = hp0 × powerCần(khu)^1,0 × số cú trúng mục tiêu (≈ 6)
  ```
  Ý: một bậc đồ ≈ +25–35% sát thương; tay ngắm giỏi bù được khoảng một bậc, không bù được hai bậc.
- **Kiểm bằng mô phỏng** như v98 (`tools/sim/levels.ts`): bot ngắm theo phân phối sai số (giỏi / trung bình / kém) × chênh bậc đồ (−2..+2) → bảng tỉ lệ thắng. **Test khoá dải**: chênh +1 bậc mà ngắm kém vẫn thắng ≥ 55%; chênh −1 bậc ngắm giỏi thắng 30–45%; chênh −2 bậc < 10%; cùng bậc thì ngắm giỏi thắng ngắm kém ≥ 70%.
- **Đo thật:** ghi mỗi trận (bậc đồ so với bậc cần, độ chính xác trung bình, thắng / thua) vào `st.e` telemetry (không vào mastery).

### C3 Vòng học → rèn → thắng khép kín (trọng số 2, bắt buộc ≥ 7)
- **Cách làm:** thua boss → màn kết chỉ thẳng "Giáp của bạn bậc 1, boss cần bậc 2 → Rèn Giáp" (một nút, mở đúng lò). Thắng → rơi thô + mở trận kế. Thợ rèn gợi ý nằm trên sảnh, cạnh nút Đánh boss.
- **Tinh hoa chữ:** chỉ từ câu trả lời đúng ở lò (đúng có trợ giúp = nửa; câu mới / transfer = gấp đôi). Mỗi món bậc N cần tinh hoa của **đúng ô đó** + thô.
- **Bậc món đồ không vượt chỉ số thật**: tinh hoa đủ mà chỉ số chưa đủ thì món ở trạng thái "đã rèn, chưa mặc được", hiện rõ còn thiếu gì.
- **Đo:** tỉ lệ trận thua → rèn ô được chỉ trong 10 phút; số lần "thắng sau khi rèn" trên tổng lần rèn. Người sáng lập kể lại được chuỗi này sau một buổi.

### C4 Một hệ đồ, khoá theo năng lực thật (trọng số 1)
- **Cách làm:** đổi `SLOT` trong `avatar.ts` sang 7 ô: Vũ khí (từ vựng), Giáp (ngữ pháp), Khiên (nghe), Mũ (đọc), Giày (phát âm), Bùa (nói), Nhẫn (viết). Sửa `bag.ts statsOf` thành 7 chỉ số này. Thêm chỉ số **Đọc** (nút đọc hiểu + Thám tử + văn bản đời thường) và **Viết** (Thư, viết câu có kiểm soát, chuyển ý, qua `grader.ts`).
- Trí nhớ → độ sắc (FSRS trung bình của các mục trong ô). Dùng thật → điều kiện tôi luyện bậc 4–5 (cần bằng chứng transfer / `ctx: 'use'`).
- Gỡ 5 món buff game (v128), xưởng "Luyện tay" và tab Lò rèn v129 thành **một** màn Trang bị + Lò rèn.
- **Trần bậc Bùa / Nhẫn:** bậc ≤ 3 khi Confidence Viết / Nói ≤ Vừa (chưa có AI chấm). Không có micro: Bùa rèn bằng gõ câu, trần bậc 2.
- **Luật chống lệch:** không món nào hơn món yếu nhất quá 1 bậc (trừ Bùa / Nhẫn khi bị trần, chúng không chặn món khác).
- **Test:** mọi đường (nạp thô, xu, thời gian, thời trang) không làm bậc mặc vượt chỉ số thật; migrate bản lưu cũ ra đúng bậc.

### C5 Thợ rèn dẫn đúng chỗ thiếu (trọng số 1)
- `director.ts` đổi đầu ra: thay `GameId` bằng `{ slot, forge(lò), why }`. Ưu tiên: ô boss kế tiếp nhắm tới → ô có đồ cùn (ôn đến hạn) → ô thấp nhất so với bậc cần của khu → ô có đèn học tủ (cần tôi luyện). Lò chọn theo loại việc của NBA và luật đổi dạng cũ.
- Lý do bằng lời game: "Boss Rè đánh vào Khiên; Khiên của bạn cùn 3 chỗ."
- Theo gợi ý: +25% tinh hoa (không ép, không chấm đỏ nhấp nháy).
- **Đo:** bot L01–L03 chơi vòng mới (`tools/learners/core.ts` thêm `fight`, `forge`): số nút A2 vững mỗi giờ không thấp hơn bản v132 (đường cũ) quá 10%.

### C6 Đo đúng tiến độ tới A2 (trọng số 2, bắt buộc ≥ 7)
- Giữ lõi L0–L4. Việc thêm: ngữ cảnh `ctx: 'forge'` đã có (v129) dùng cho mọi lò; mỗi lò ghi đúng dạng câu, mức, đoán mò.
- Thêm test: trận đấu không bao giờ gọi `ingest`; thô / thời trang / nạp không đổi mastery.
- Lên 8–9: hiệu chỉnh khi có đề mẫu Cambridge (C7), báo sai lệch dự đoán so với thực tế ở hồ sơ.

### C7 Xác nhận A2 đáng tin (trọng số 2)
- **Soát chéo ngay** (mục 20 spec): `tools/review-export.mjs` xuất a1-1, a1-2, a2-1, a2-2 → **một phiên AI khác** (không có lời giải) tự làm → `tools/review-compare.mjs`. Sửa câu lệch, ghi kết quả vào `content/exam/gate/README.md`. Người sáng lập **không** xem đề.
- **Soạn thêm đề:** mỗi cấp A1, A2 thêm 2 đề (tổng 4), qua phép thử không có bài 3 vòng (ngưỡng 55%), soát chéo như trên.
- **Thêm Viết / Nói vào cổng A2** theo đặc tả công khai A2 Key (Viết: tin nhắn 25+ từ, truyện ngắn theo tranh 35+ từ; Nói: trả lời câu hỏi cá nhân + thảo luận theo tranh). Chấm bằng `grader.ts` (luật + tự chấm), Confidence tối đa Vừa; P(đậu) toàn bài tính Đọc / Nghe bằng IRT, Viết / Nói bằng khoảng điểm luật.
- **Bảo vật khu:** gói `gate.ts` trong vỏ "rèn Bảo vật" (một lần, không gợi ý, chữa sau). Có Bảo vật mới mở boss cuối khu.
- **Đề mẫu Cambridge:** mục "🎓 Chứng chỉ" (v113) bật mặc định cho đích A2: hướng dẫn người sáng lập tải đề mẫu chính thức A2 Key (trang Cambridge English), làm trong điều kiện thi, nhập điểm; app chốt P(đậu) trước khi nhập, đối chiếu sau.

### C8 Đủ nội dung A2 cho 7 ô (trọng số 1)
- Đã có 359 nút A2, 0 nút thiếu câu đo (`content/engine/coverage.md`). Việc thêm: bảng phủ **theo ô** (`tools/engine-gen.ts` xuất thêm cột ô). Ô nào < 80% nút có câu ở mức cần thì soạn bù theo `content/AUTHORING.md` (phép thử đoán mò).
- Ưu tiên Đọc và Viết vì là chỉ số mới.

### C9 Nhớ lâu: đồ cùn và mài (trọng số 1)
- Độ sắc mỗi ô = khả năng nhớ FSRS trung bình của các mục đã Đạt trong ô (`retain.ts`, `exam/fsrs.ts`). < 0,85 thì ô "cùn", lực giảm theo công thức C2.
- "Mài" = lò Sương quay lại / Câu đố ngày với mục đến hạn của đúng ô; mỗi lần ôn đúng là `srsStep` thật.
- Lời nhắc Web Push (`el-remind`) đổi thành "Vũ khí của bạn đang cùn".
- **Đo:** Bảng đo H6 (nhớ sau 7 / 30 ngày) ≥ 80%, cần ≥ 30 ngày số liệu.

### C10 Mở dần, không ngợp (trọng số 1)
- Sảnh: hai nút chính **⚔️ Đánh boss** và **🔨 Thợ rèn gợi ý**, nhân vật ở giữa; mọi thứ khác sau một lần chạm (giữ luật v117: ≤ 3 khối).
- Lò mở theo bảng ở `RA-SOAT-v133.md` §2.2 (khu 1 chỉ 4 lò: Vườn từ, Vòng Chữ, Mỏ Chữ, Bài Câu; + Bắt Âm, Quán chọn khi có ô tương ứng). Lò khoá hiện bóng mờ + "mở khi …".
- Game cất (Xếp Khối, Bàn Cờ, Leo tháp, Robot, Tốc độ, Ghép cặp, Thách đấu) chỉ còn trong Thư viện.
- Sửa `test/e2e/clarity.spec.ts` theo luật màn đầu mới.

### C11 Kinh tế công bằng (trọng số 1)
- Hai loại: **thô** (= xu cũ đổi tên, rơi từ trận và từ việc ngày; mua được ở cửa hàng giả lập) và **tinh hoa** (theo ô, chỉ từ lò). XP gộp vào "hạng chiến binh" hoặc bỏ khỏi giao diện.
- Gỡ năng lượng theo lượt, ô quảng cáo giả; Super giả lập → cửa hàng giả lập (gói thô, chưa thu tiền).
- Người dưới 16 tuổi (kiểm tuổi đã có): ẩn cửa hàng nếu chưa có cha mẹ đồng ý.
- **Test:** không có đường mua tinh hoa; không có hẹn giờ ưu đãi; phép tính ví không âm.

### C12 Hình, tiếng, cảm giác trận (trọng số 1)
- Bộ hình CC0 (Kenney: "Tanks", "Pixel Platformer", "Particle Pack", "Background Elements" hoặc tương đương). Lưu ở `icons/kenney/` hoặc `a/art/`, ghi nguồn + giấy phép vào `docs/ASSETS.md`. Nhân vật chibi giữ SVG `avatar.ts` (đồng bộ màu với bộ hình).
- Giới hạn dung lượng: tổng ảnh trận ≤ 400 KB, tải sau khi vào trận lần đầu; service worker lưu.

### C13 Chơi trước, đăng nhập sau (trọng số 0,5)
- Supabase Auth (Google + email liên kết ma thuật). Khách chơi bình thường; đòi đăng nhập khi: đấu người thật, mở cửa hàng, hoặc sau trận thắng đầu ("giữ đồ của bạn"). Chuyển dữ liệu: gửi bản lưu hiện có (đã có `sanitize.ts`) lên bảng theo user id, RLS chỉ chủ đọc / ghi. Mã ELK là đường chuyển cho máy cũ.
- Viết lại `privacy.html` (Nghị định 13/2023, cha mẹ đồng ý dưới 16 tuổi, xoá tài khoản).

### C14 Đối thủ người thật (trọng số 0,5)
- Đấu bóng ma: mã trận = hạt giống (địa hình, gió) + ảnh chụp đồ của người gửi + chuỗi cú bắn (góc, lực, thời điểm). Người nhận đánh cùng bản đồ; bóng ma bắn lại đúng chuỗi đó. Lưu trên Supabase (bảng `el_ghost`, RLS). Hạng theo Elo tách khỏi XP; giải đấu tuần chuyển sang xếp theo hạng trận.

### C15 Nghiệm thu bằng người thật (trọng số 1)
- Nút **💬 Góp ý** sau mỗi trận và mỗi lần rèn: 1–5 sao + một dòng chữ, lưu ở máy (`st.e.fb`, ≤ 200 mục), xuất được bằng một nút "Gửi cho nhà làm game" (sao chép / chia sẻ).
- Màn "📊 Số liệu chơi" thêm trận đấu (C1, C2).
- `docs/PLAYTEST.md` viết lại cho vòng mới (15 phút, phiếu chấm C1–C3).

## 3. Mốc (mỗi mốc một PR)

### Mốc 1 (v133) — Trận đầu tiên + ô Vũ khí
**Mục đích:** kiểm vòng "học → rèn → thắng" có cuốn không, trước mọi việc khác.
- `src/engine/fight.ts` (thuần hàm: vật lý đạn, gió, địa hình, sát thương C2, AI boss ngắm có sai số, hạt giống cố định) + `fightview.ts` (canvas, lớp phủ ngoài `#app`) + `fightctl.ts`.
- Boss khu 1 "Tiếng Ồn Rè" + 2 trận luyện tay (lính).
- Ô Vũ khí: tinh hoa từ Vườn từ / Vòng Chữ / Mỏ Chữ (lượt có tính); rèn Vũ khí bậc 1–3 (thô + tinh hoa), khoá theo chỉ số Từ vựng. 6 ô khác tạm lấy bậc từ chỉ số hiện có (chưa rèn được).
- Thợ rèn gợi ý (bản đầu, chỉ ô Vũ khí) + màn kết thua chỉ thẳng ô cần rèn.
- Sảnh: thêm ⚔️ Đánh boss + 🔨 Thợ rèn lên đầu (giữ cũ phía dưới).
- Nút 💬 Góp ý; telemetry trận.
- Bộ hình CC0 cho trận + `docs/ASSETS.md`.
- **Test:** đơn vị cho `fight.ts` (quỹ đạo, gió, va chạm, sát thương, hạt giống); mô phỏng khoá dải thắng / thua (C2); trận không gọi `ingest`; e2e: mở trận, bắn, thắng / thua, về lò rèn (Chrome Android + Safari iOS ở 390 px).
- **Xong khi:** CI xanh; người sáng lập chơi 15 phút theo `PLAYTEST.md` mới và chấm C1. **C1 thật < 6 thì sửa trận trước mọi mốc khác.**

### Mốc 2 (v134–v135) — Đủ 7 ô, một hệ đồ, Bảo vật khu
- 7 ô + chỉ số Đọc / Viết; độ sắc FSRS (mài đồ); luật chống lệch; trần Bùa / Nhẫn.
- Gộp Túi chữ / Lò rèn v129 / trang bị v132; bỏ 5 món buff game.
- Lò mở dần theo khu; cất game kiểu câu hỏi xen lượt vào Thư viện.
- Boss khu 2–4 (mỗi boss một cơ chế, nhắm một ô).
- Bảo vật khu = trận cổng A1, A2; **soát chéo đề** + soạn thêm 2 đề / cấp + Viết / Nói cho cổng A2.
- Gỡ năng lượng, quảng cáo giả; Super → cửa hàng giả lập (thô).
- Migrate bản lưu (`st.e` thêm phiên bản): tiến độ cũ → bậc đồ.
- **Xong khi:** C3 ≥ 7, C4 ≥ 8, C7 ≥ 7 (tự chấm), CI xanh, bot L01–L03 không chậm hơn đường cũ quá 10%.

### Mốc 3 (v136) — Danh tính + tên mới
- Supabase Auth, chơi trước đăng nhập sau, chuyển dữ liệu; `privacy.html` mới.
- Đổi tên Chiến Binh Chữ: `manifest.webmanifest`, `index.html`, README, màn "Về", chia sẻ. Tra trùng tên trên Google Play / thương hiệu trước khi đổi.

### Mốc 4 (v137+) — Người thật
- Đấu bóng ma + hạng theo trận; giải đấu tuần theo hạng.
- Cửa hàng thô (vẫn giả lập).

### Mốc 5 — Nghiệm thu A2
- Người sáng lập chơi tới khi rèn được Bảo vật khu A2 + làm đề mẫu A2 Key ngoài app.
- Qua cả hai → cổng lên store mở (thanh toán thật, Google Play).

## 4. Ước tính điểm theo mốc (tự chấm, để định hướng)

| Mốc | C1* | C2* | C3 | C4 | C5 | C6 | C7 | C8 | C9* | C10 | C11 | C12 | C13 | C14 | C15 | Tổng |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| v132 (nay) | 0 | 0 | 2 | 4 | 5 | 7 | 4 | 7 | 4 | 4 | 3 | 4 | 2 | 1 | 2 | 3,0 |
| Sau mốc 1 | 6 | 6 | 6 | 5 | 6 | 7 | 4 | 7 | 4 | 5 | 4 | 6 | 2 | 1 | 6 | ≈ 5,4 |
| Sau mốc 2 | 6 | 6 | 8 | 8 | 8 | 8 | 7 | 8 | 6 | 8 | 8 | 7 | 2 | 1 | 7 | ≈ 6,9 |
| Sau mốc 3–4 | 6 | 6 | 8 | 8 | 8 | 8 | 7 | 8 | 6 | 8 | 8 | 7 | 8 | 6 | 7 | ≈ 7,2 |
| Có người thật chơi ≥ 30 ngày | 8+ | 8+ | 9 | 9 | 9 | 9 | 9 | 9 | 8+ | 9 | 9 | 8 | 8 | 7 | 9 | ≈ 8,6 |

\* tiêu chí *(đo)*: trần 6 cho tới khi có số liệu chơi thật. Lên 9–10 cần người sáng lập chơi đều và đề mẫu Cambridge xác nhận.

## 5. Rủi ro và cách xử lý

| Rủi ro | Dấu hiệu | Xử lý |
|---|---|---|
| Trận đấu không vui | C1 thật < 6 | Dừng mọi mốc, sửa trận (cảm giác bắn, nhịp, boss) trước |
| Ngắm giỏi thắng không cần học | Số liệu: chênh −2 bậc vẫn thắng > 15% | Tăng số mũ `power`, thu hẹp dải `hit` |
| Học thành cày, người chơi né lò | Tỉ lệ thua → rèn < 40% | Lò ngắn hơn (3 câu), tinh hoa rõ hơn, Thợ rèn nói đúng ô |
| Hết đề lạ trước khi tới A2 | Rớt cổng 2 lần | Đã lên kế hoạch 4 đề / cấp ở mốc 2 |
| Bot / test chậm làm CI quá 40 phút | CI e2e huỷ | Chia job theo trình duyệt; đánh dấu e2e cũ của game đã cất là chạy một trình duyệt |
| Dung lượng app tăng do ảnh | Lighthouse < 90 | Ảnh tải sau, nén WebP, ≤ 400 KB |

## 6. Bàn giao sang tài khoản khác

**Người sáng lập làm:**
1. Đăng nhập Claude bằng tài khoản mới → Claude Code (web) → kết nối GitHub (claude.ai → Settings → Connectors / GitHub) cho repo `sonnguyen12394/sonnguyen12394.github.io`.
2. Nếu dùng Supabase MCP: kết nối lại Supabase ở tài khoản mới (cần cho mốc 3–4, chưa cần cho mốc 1–2).
3. (Tuỳ chọn) gộp nhánh `claude/v133-spec-chien-binh-chu` vào `main` trên GitHub. Nếu chưa gộp, phiên mới tự làm từ nhánh này.
4. Mở phiên mới và dán lời nhắn dưới đây.

**Lời nhắn mở đầu cho phiên mới (dán nguyên văn):**

> Tiếp tục dự án Chiến Binh Chữ trong repo `sonnguyen12394/sonnguyen12394.github.io`. Bắt đầu từ nhánh `claude/v133-spec-chien-binh-chu` (nếu đã gộp thì từ `main`). Đọc lần lượt: `CLAUDE.md`, khối đầu `docs/SPEC.md` (mục 1–22), `docs/SCORECARD-A2.md`, `docs/RA-SOAT-v133.md`, `docs/KE-HOACH-A2.md`. Làm **Mốc 1** theo `docs/KE-HOACH-A2.md` §3: tạo nhánh mới, viết kế hoạch chi tiết cho tôi duyệt trước khi code, rồi làm, chạy đủ kiểm tra, mở PR. Phản biện nếu thấy chỗ sai, nhưng không tự đổi quyết định của người sáng lập.

**Phiên mới cần biết thêm:**
- Máy mới chưa có thư viện: chạy `npm ci` trước (`npm run content` cần `ajv`). Playwright dùng Chromium cài sẵn, không chạy `playwright install`.
- `app.js` rất lớn (≈ 3,2 MB): tìm bằng grep, không đọc cả tệp.
- Engine viết bằng TypeScript ở `src/engine/`, nối với `app.js` qua `host.ts`; tệp build nằm ở `x/` và phải commit (`npm run fresh` kiểm khớp).
- Bản Claude Docs "English Ladder — Spec (v115)" chưa đồng bộ khối 13/10/2026; tệp trong repo là nguồn sự thật.
