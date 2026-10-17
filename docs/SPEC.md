# English Ladder — Master Spec v2

> **17/10/2026 — 📘 Học bài · 🔁 Ôn luyện · 🎯 Mục tiêu (v153, bản 91; đứng trên khối 16/10).** Người sáng lập: mỗi mục tiêu có nhiều điểm kiến thức, điểm nào cũng có thời gian quên; đạt mục tiêu rồi vẫn phải ôn. Đổi tên: **Học bài** (app học, trước là "Học"), **Ôn luyện** (trước là "Nói & Đọc"), **Mục tiêu**. Chốt: phần chưa học trong bài Ôn luyện vẫn hỏi (đúng là đi tắt); **cân ngày tuỳ người học**: vào phần nào thì não điều phối theo phần đó; Ôn tập (thẻ đến hạn) chuyển sang Ôn luyện.
> - **Não ở 📘 Học bài (học tới vững):** lượt dở → phần đang học chưa vững → bài mới theo tiền đề (giữ giới hạn từ mới / ngày). Không đẩy ôn lên đầu (`mainAction({learn:true})`, `EM.next({learn:true})` bỏ bước ôn); có mục đến hạn thì chỉ nhắc một dòng sang Ôn luyện.
> - **Não ở 🔁 Ôn luyện (giữ khỏi quên):** thẻ đến hạn (FSRS) → đã quên (từng vững, nay không) → đang phai (nhớ < 0,9) → bài đọc / nói chứa những chỗ đó (chưa học vẫn hỏi, đúng là đi tắt). Sai → lịch ôn + nút "📘 Học lại bài này" về đúng bài.
> - **🎯 Mục tiêu:** thước đo chung, một luật "vững" cho mọi nguồn (nhờ game / nhờ Học bài / nhờ Ôn luyện). Đạt rồi vẫn thấy phần đang phai / đã quên ở bảng Sức khoẻ (Ôn luyện).
> - Mã nội bộ giữ (`lib`, `nd`, `ctx:'nd'`) để không đổi dữ liệu đã lưu. Chưa người thật kiểm.
> - **(v154, bản 92) Mục tiêu hai thanh** (người sáng lập 17/10/2026): trên các nút `u:` / `g:` / `ph:` / `fn:` của mục tiêu (như trước), **📘 Học** = đã qua bài cuối của bài học chứa nút (unit: thử thách cuối unit `U().passed`; ngữ pháp `G().passed`; cặp âm / chức năng: đạt ≥ 80% một lượt; `EHOST.lessonDone`); **🔁 Nhớ** = có câu đúng tự lực cách lần gặp đầu ≥ 3 ngày và khả năng nhớ hiện ≥ 0,9 (chưa phai). **Thi chuyển cấp mở khi Học ≥ 80% VÀ Nhớ ≥ 70%** (Học quan trọng hơn; Nhớ không bù cho Học). `GATE.learn / mem / memDays`, `gateState(…, parts)`, `partsOf` (main.ts). Luật "vững ≥ 80%" cũ chỉ còn khi không có hai thanh. Đi tắt ở Ôn luyện cộng vào Nhớ (khi đủ cách ngày), không cộng vào Học. Chưa người thật kiểm.
> - **(v155, bản 93) Vượt bài đã biết** (người sáng lập 17/10/2026: người học lâu năm đã biết nhiều thứ mà Học bài chưa đánh dấu; Ôn luyện vừa ôn vừa đo trình độ để đánh dấu vào bài học): khối "⚡ Vượt bài đã biết" ở Ôn luyện dùng đúng bài cuối có sẵn của Học bài (cùng chuẩn): thử thách cuối unit (`test`), bài cuối điểm ngữ pháp (`gtest`), vượt cả từ vựng / ngữ pháp của cấp (`place`, `gplace`). Qua là bài đánh dấu xong, thanh 📘 Học tăng. Não gợi ý unit có ≥ 50% số từ đã đúng ở mức gõ ra (sổ bằng chứng, mọi nơi) và điểm ngữ pháp đã đúng ở mức ≥ 3. Chưa người thật kiểm.
> - **(v156, bản 94) Người chỉ dùng Ôn luyện** (người sáng lập hỏi: không dùng Học bài thì đạt Học 80% + Nhớ 70% thế nào). Thanh 📘 Học từ Ôn luyện: unit / ngữ pháp qua ⚡ Vượt (bài cuối có sẵn), cặp âm qua bộ Âm và cặp âm (≥ 80%), chức năng giao tiếp qua thẻ "Câu giao tiếp theo chức năng" (mở tab Hội thoại của cấp). Thanh 🔁 Nhớ: mọi việc ở Ôn luyện ghi bằng chứng; qua bài cuối / vượt thì từ / ngữ pháp vào lịch ôn sau 3 ngày (`ndPassMark`), nên có đường chắc tới bằng chứng nhớ. **Vượt cả cấp** (`place`, `gplace`; người sáng lập chốt): chỉ đánh dấu unit / điểm **được hỏi và đúng hết**; phần chưa được hỏi giữ nguyên, có danh sách "Tất cả unit / bài chưa qua" để vượt riêng. Đầu Ôn luyện hiện hai thanh (`EM.parts`) + việc nên làm. Mục tiêu A2: 174 cụm từ vựng, 58 điểm ngữ pháp, 16 cặp âm, 18 chức năng (266); A1: 87 / 28 / 7 / 8 (130).

> **17/10/2026 — Phần thứ ba: 🗣 Nói & Đọc (v149, bản 87).** Người sáng lập: tách mọi chức năng luyện nói / đọc to / phát âm thành một phần riêng để tập trung phát triển, coi là con đường thứ ba song song ⚔️ Chơi và 📘 Học, dùng để đi tới mục tiêu.
> 1. **Thanh điều hướng:** Chơi · Học · **Nói & Đọc** · Mục tiêu · Tôi. Gồm: Nói nhại, 📖 Đọc to (bài đọc unit A1 / A2), 📝 Bài luyện theo cấp (nói và đọc), 📋 Dán bài, Âm và cặp âm (cả trọng âm từ, bài phát âm), Nối âm – ngữ điệu, Dò phát âm 26 cặp, 🧪 Chấm từng âm. **Chuyển hẳn:** tab Nói / Đọc của 📘 Học và màn Tôi bỏ các mục này, chỉ còn lời chỉ sang. Phản xạ, Nói đáp lời, Nói theo đề, bài đọc có câu hỏi, truyện: ở lại 📘 Học.
> 2. **Chưa tính, chỉ theo dõi riêng** (người sáng lập chọn "thôi tính tất cả", kể cả bài cũ): không bằng chứng (bộ cặp âm thôi ghi `ph:`), không Can-Do, không mục tiêu ngày / chuỗi ngày / XP / nhiệm vụ của phần Học. Bảng riêng `st.nd.d[ngày]`: số câu, số đạt, tỉ lệ máy nghe ra; số ngày luyện liền; điểm chấm từng âm gần nhất.
> 3. **Quyết định kỹ thuật (lý do: không làm mất tiến độ đã có, không chặn mục tiêu):** kết quả phát âm đã đạt trước bản này được chụp một lần (`st.ndfz`); Can-Do phát âm (`snd`, `p`, `ws`, `cs`) chỉ đọc bản chụp. Câu Can-Do "nối âm, ngữ điệu" thôi đếm vào kỹ năng Nghe (ở lại nền tảng Phát âm), để Nghe A1 / A2 không phụ thuộc phần không tính. Nhiệm vụ ngày "Luyện 1 bộ phát âm" thôi được chọn. Bắt Âm và Bến Cảng là game ở ⚔️ Chơi: vẫn ghi bằng chứng `ph:` như cũ, nên kỹ năng Phát âm ở 🎯 Mục tiêu vẫn lên được. Nút của dòng Phát âm ở Mục tiêu đổi thành "🗣 Nói & Đọc".
> 4. Chưa người thật kiểm.
> 5. **(v150, bản 88)** Chấm từng âm: câu ngẫu nhiên theo cấp A1 / A2 × bậc (lấy từ `textgen`, ưu tiên câu đúng bậc), "Câu tiếp theo"; sau khi chấm có khối "Sửa thế nào" (tối đa 3 âm kém nhất → bộ cặp âm qua `gop.fixOf`, lời dạy khẩu hình `SOUNDS.tip`, nghe từ mẫu, luyện cặp).
> 6. **(v151, bản 89) Đổi quyết định mục 2: Nói & Đọc ĐƯỢC tính** (người sáng lập 17/10/2026: "lối đi tắt cho người đã học lý thuyết; app Học là học rồi làm, phần này là làm rồi ôn lại"; chọn "đúng là đi tắt, sai thì ôn ở Học", "tính cả nói", "ưu tiên chỗ còn thiếu"):
>    - **Não chọn bài:** `gpNew` sinh 12 bài + bài có sẵn đúng bậc, chấm theo số nút `u:` / `g:` của mục tiêu cấp đó còn chưa vững (`EM.gaps`), lấy bài cao nhất; màn Đọc to báo "Bài này nhắm x từ, y điểm ngữ pháp".
>    - **Bài làm từ chính bài** (`ndTag` → `ndxStart`, màn `ndx`): tối đa 5 từ (điền vào câu của bài, gõ, mức 4, mã câu theo câu nên mỗi bài là câu mới) + 3 điểm ngữ pháp (`grammarOf` → `g:` qua `ndGids`; câu "sửa lỗi" của ngân hàng, mức 4). Bằng chứng `ctx:'nd'`; đúng ngay = đi tắt (vào lịch ôn như đã học), sai = `due` ngày mai ở 📘 Ôn tập. Luật vững không đổi (≥ 2 câu khác nhau, có cách ngày).
>    - **Phát âm:** nghe cặp âm lại ghi `ph:` (`ctx:'nd-pair'`); chấm từng âm ghi `ph:<bộ âm>` mức 2 (`ctx:'nd-phon'`, âm ≥ 80 đúng, bị nuốt / nghe thành âm khác < 60 sai). Can-Do phát âm / nối âm đọc lại kết quả thật; nối âm về lại Nghe; `st.ndfz` không còn dùng.
>    - **Nói:** thêm Can-Do `a1-ndsay`, `a2-ndsay` (nhóm Nói): đọc to / nói nhại có máy nghe ra trung bình ≥ 80% ở ≥ 2 ngày. Tổng phần cần đạt: A1 185 → 186, A2 359 → 361 (sinh lại bằng `npm run engine`).
>    - **Nguồn thứ ba ở 🎯 Mục tiêu:** cửa `nd` trong `compare.ts` (ngữ cảnh `nd` / `nd-…`), đoạn tím "nhờ Nói & Đọc"; phần vững từ ≥ 2 nguồn vào "từ hai nguồn".
>    - Vẫn không cộng mục tiêu ngày / chuỗi ngày / XP của Học. Điểm máy chấm, ngưỡng 80%: chưa người thật kiểm.
> 7. **(v152, bản 90) Vai trò hai phần** (người sáng lập 17/10/2026): **📘 Học** cho người mới, học và rèn từ đầu tới cuối, đạt mục tiêu, thi qua cấp. **🗣 Nói & Đọc** cho người đã học: ôn nhanh kiến thức và mục tiêu đã qua, lộ chỗ quên / lủng và quay ngay về 📘 Học đúng chỗ đó. Chốt thêm: phần chưa học trong bài vẫn hỏi (đúng là đi tắt); chỗ quên có nút đi thẳng tới đúng bài; có bảng sức khoẻ kiến thức.
>    - `EM.health(gid)`: nút `u:` / `g:` / `ph:` của mục tiêu chia vững (nhớ ≥ 0,9) · đang phai (vững, nhớ < 0,9) · đã quên (sổ từng có PASS, nay không vững) · chưa học.
>    - Não chọn bài: 3 × (đã quên / đang phai / đến hạn ôn ở app) + 1 × chưa học. Bài làm hỏi theo thứ tự đã quên → đang phai → đến hạn → chưa học, có nhãn "Ôn lại" / "Mới".
>    - Kết quả "Chỗ bị quên": nút "📘 Ôn ở Học" (`data-unit` / `data-gp`), vẫn vào Ôn tập ngày mai. Bảng "Sức khoẻ kiến thức" A1 / A2 ở đầu tab, nút "⚡ Ôn nhanh", danh sách tối đa 10 chỗ đã quên / đang phai.

> **16/10/2026 — Ba phần: ⚔️ Chơi · 📘 Học · 🎯 Mục tiêu (v138; thay "hai lối" v136).** Người sáng lập chốt: tách game và app học cũ để đối chiếu, và thêm phần thứ ba là mục tiêu từng cấp; chơi hay học đều phục vụ mục tiêu.
> 1. **Thanh điều hướng:** Chơi · Học · Mục tiêu · Tôi. ⚔️ Chơi: sảnh, trận, lò rèn. 📘 Học: app cũ (việc nên làm, ôn tập, thư viện, bảng 7 kỹ năng). 🎯 Mục tiêu: A1 và A2 (chỉ hai cấp này) cần đạt gì. **Mở app vào 🎯 Mục tiêu.** Không còn nút đổi lối.
> 2. **Một não:** tiến độ, bằng chứng, FSRS, bản đồ năng lực dùng chung. Mỗi câu đúng ghi thêm nơi học (`st.e.src`): lò game (Vườn từ, Vòng Chữ, Mỏ Chữ, Lò rèn) là game, còn lại là app. Không đổi bằng chứng, không đổi mastery.
> 3. **🎯 Mục tiêu** mỗi cấp: 7 kỹ năng = 7 ô đồ (Từ vựng, Ngữ pháp, Phát âm, Nghe, Nói, Đọc, Viết), phần vững nhờ game / nhờ app, nút "⚔️ Rèn ở game" (khi game có lò) và "📘 Học ở app", trận cổng của cấp, chứng chỉ ngoài app. Màn ⚖️ Đối chiếu cũ gộp vào đây.
> 4. Khối này **sửa mục 22 "Phần cũ"**: phần Học (app cũ) không cất / gỡ cho tới khi 🎯 Mục tiêu cho thấy game phủ được mọi kỹ năng. Đánh giá theo 12 khó khăn học tiếng Anh: `docs/DOI-CHIEU-GAME-APP.md` (game v134 ≈ 3,0 / 10, app cũ ≈ 5,9; tự chấm, chưa người thật kiểm).
> 5. **Theo dõi theo 7 kỹ năng, không tách bài:** bài theo chủ đề (từ + ngữ pháp cùng ngữ cảnh) giữ nguyên; bảng 7 kỹ năng ở đầu tab Học.
> 6. **(v140) Thi chuyển cấp** (người sáng lập 16/10/2026; tên "Thi chuyển cấp" là ngoại lệ duy nhất của luật không dùng chữ "thi"): là trận cổng cũ, mở khi vững ≥ 80% (`GATE.open`), gồm **4 kỹ năng**: Đọc + Nghe (bộ câu lạ cũ, IRT, quyết định đậu) và Viết 2 bài + Nói 1 bài (`gatews.ts`, bài lạ theo dạng A2 Key; chấm bằng luật + tự đánh dấu, chỉ tham khảo). **Qua là tự lên cấp:** cấp kế thành đích chính, 🎯 Mục tiêu theo cấp mới.
> 7. **(v141) Bài sinh theo tiêu chí, không bộ soạn sẵn** (người sáng lập 16/10/2026): Thi chuyển cấp A1 / A2 (và Thử sức từng kỹ năng) do máy sinh mỗi lần theo bảng tiêu chí của cấp (`testgen.ts BLUEPRINT`): khuôn Đọc / Nghe điền ngẫu nhiên (máy đọc cho Nghe), câu theo nút chưa gặp (`ev.seen`), câu có sẵn chưa dùng (bộ cổng cũ thành ngân hàng, `gg.used`), Viết / Nói từ khuôn tình huống. Phương án nhiễu cùng loại và đều có trong bài; vị trí đáp án chia đều. Rớt thì làm lại sau 3 ngày **và** khi vững thêm (`RETRY`). Độ khó câu sinh là ước tính theo khuôn. **(bản 79) 🎲 Thử sức:** mỗi dòng kỹ năng ở 🎯 Mục tiêu có nút Thử sức, sinh bài ngắn theo ô của kỹ năng (`TRY_PARTS`), dùng chung màn làm bài; chỉ là phép đo (không ghi bằng chứng, không vào thi chuyển cấp, không lên cấp), lưu số vào `gg.tries` (≤ 50); không giới hạn số lần.
> 8. **(v142, bản 80) Hướng dẫn phát âm từng câu** (người sáng lập 16/10/2026): Nói nhại và 📖 Đọc to (bài đọc unit A1 / A2) hiện mỗi câu dạng dòng đôi: chữ + IPA từng từ (danh sách từ + bảng từ chức năng / rút gọn / bất quy tắc + luật đuôi -s / -ed / -ing / -er / -ly, `src/engine/pronote.ts`), từ nhấn, từ đọc nhẹ, âm cuối dễ nuốt, nối âm, ↗ / ↘, tối đa 3 mẹo gắn bộ âm `SOUNDS`. Máy nghe chưa ra từ nào thì hiện mẹo đúng âm đó (`missTip`). **Không tính** vào mức thuộc / 🎯 Mục tiêu (chỉ để luyện; lưu `st.pron['ra:'+unit]`). Độ phủ IPA ≥ 98% trên câu A1–A2 (test `engine-pronote`); phiên âm ghép tự động, chưa người thật kiểm.
> 9. **(v143, bản 81) 📋 Phân tích bài dán vào** (người sáng lập 16/10/2026): dán bài nói / viết tiếng Anh (≤ 3000 ký tự, 60 câu) → từng câu có phiên âm + cách đọc (mục 8), **nghĩa từng từ / cụm từ** theo từ điển của app (khớp cụm dài nhất, từ gốc qua `lemmaOf`, cấp CEFR, tô từ trên cấp đích), gợi ý ngữ pháp `grammarOf` (thì, câu hỏi, phủ định, khuyết thiếu, so sánh, there is), mẹo phát âm; Đọc to cả bài. Chạy trên máy (giữ nguyên tắc không AI, không dữ liệu bên thứ ba): **không dịch cả câu**. Bài dán lưu trên máy (`localStorage`), không đồng bộ; không ghi bằng chứng.
> 10. **(v144, bản 82) 📝 Bài luyện theo cấp** (người sáng lập 16/10/2026): bài ngẫu nhiên A1 / A2 × Dễ / Vừa / Khó, nguồn **cả hai**: sinh từ khuôn song song Anh – Việt (`textbank.ts`, `textgen.ts`, có hạt; bậc theo số từ mỗi câu) và bài có sẵn có nghĩa từng câu (hội thoại; bài đọc unit tách câu khớp bản dịch), xếp bậc theo phân vị độ dài câu. Ba cách luyện: phát âm (màn Đọc to), dịch Anh → Việt (xem nghĩa + tự chấm), dịch Việt → Anh (so từ với câu gốc, `asrMatch`). Lưu `st.pron['gp:cấp:bậc:cách']`, gợi ý lên bậc khi ≥ 80%; không ghi bằng chứng. Bản dịch khuôn chưa người thật kiểm.
> 11. **(v145, bản 83) Máy nghe hiện chữ khi nói** (người sáng lập 16/10/2026, so với ELSA): `interimResults` bật, chữ tạm hiện ở ô `#asrlive` khi đang nói; WebKit iPhone không trả kết quả cuối thì chấm bằng chữ tạm cuối cùng (trước đây báo nhầm "chưa nghe thấy gì"); kết quả tô từ câu mẫu xanh / đỏ, từ nghe nhầm gạch nhạt; iPhone không nghe được thì hướng dẫn bật Đọc chính tả + micro. Máy nghe trả chữ, không chấm âm vị; chưa người thật kiểm trên iPhone.
> 12. **(v146, bản 84) 🧪 Chấm từng âm trên máy — thử khả thi** (người sáng lập 16/10/2026 chọn "mô hình chạy ngay trên máy", kiểu ELSA): Tôi → 🧪; `phon-worker.js` tải `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX` (IPA espeak, bản nén, vài trăm MB) bằng Transformers.js 3.8.1 (jsDelivr), chạy một luồng; app ghi âm 16 kHz, `src/engine/gop.ts` căn hàng CTC + GOP → điểm từng âm / từ (nửa trung bình + nửa âm kém nhất) / câu. Âm thanh không rời máy. Chưa chạy thật được ở máy soạn / CI (Hugging Face bị chặn): **chờ người sáng lập thử trên iPhone** rồi mới đưa vào Đọc to / Nói nhại. Không ghi bằng chứng.
> 13. **(v147, bản 85) Chấm từng âm, sửa theo lần thử thật trên iPhone** (17/10/2026): 8-bit chạy được (tải 13,7 s, chấm 4,3 s / 5,2 s âm thanh); fp16 ~600 MB làm trang tự tải lại → giữ kèm cảnh báo (người sáng lập: để cho bản app sau này). Điểm 15/100 cho câu đọc bình thường → gốc rễ: chấm trung bình mọi khung không hợp CTC (âm chỉ bật 1–2 khung) → đổi sang đỉnh xác suất của âm trong đoạn (nới ±2 khung, chuẩn hoá bỏ khoảng lặng). Thêm vạch âm lượng khi ghi, nghe lại, chặn chấm khi im lặng, dòng "Máy nghe ra các âm" (đọc tham lam) để đối chứng. Chưa người thật kiểm ngưỡng điểm.
> 14. **(v148, bản 86) Chấm từng âm: hai mô hình cùng lúc** (17/10/2026, người sáng lập: "dùng 2 dạng mô hình"): micro + MediaRecorder cho mô hình chấm âm mở trước, sau đó bật nhận diện chữ của trình duyệt (Web Speech, như Nói / Đọc to) để chữ hiện ngay khi nói (như ELSA web: phiên nhận diện tự tắt khi ngừng nhịp thì tự bật lại, chữ cộng dồn, chạy suốt tới lúc bấm Dừng, tối đa 10 lần); ghi xong hiện "Máy nghe ra n/m từ" rồi điểm từng âm. Rủi ro iPhone giành micro: nhận diện lỗi thì vẫn chấm âm, báo mã lỗi; có nút tắt "Hiện chữ khi nói" (`st.set.phLive`). Phiên nhận diện ở màn này không đếm, không lưu (`quiet`). Chưa người thật kiểm trên iPhone.

> **15/10/2026 — Trận đổi sang kiểu Chaos Orbit (v134).** Người sáng lập chốt: thay trận ngắm bắn kiểu Gunny bằng lối chơi hiện tại của repo `chaos-orbit-prototype` (kiểu Vampire Survivors). Khối này sửa khối 13/10/2026 ngay dưới; phần khác của khối đó giữ nguyên.
> 1. **Thay mục 2:** trận là game thuần kiểu Chaos Orbit: chạy để né, vũ khí quỹ đạo tự chém, lên cấp chọn 1 trong 3 nâng cấp, combo, tiến hoá, DASH, Tuyệt kỹ, Elite rơi rương, boss. Vẫn **không có câu tiếng Anh** trong trận, trận không ghi bằng chứng (P13).
> 2. **Thay mục 3:** kết quả trận ≈ **70% đồ, 30% tay né + cách chọn nâng cấp**. Dải khoá giữ như cũ (chênh −1 bậc, né giỏi: 20–45%; chênh −2: < 10%; dư +1 bậc, né kém: ≥ 55%; đúng bậc, né giỏi ≥ 70%). Cách làm: sát thương Vũ khí ×1,32^w, quái khu nhân máu ×1,32^bậc cần, lệch bậc so với bậc cần nhân thêm ×1,32^(1,5 × lệch) (`fight.ts` `edgeOf`).
> 3. **Ô đồ trong trận:** Vũ khí (Từ vựng) = sát thương lưỡi; Giáp (Ngữ pháp) = giảm sát thương nhận; Khiên (Nghe) = giảm Sóng rè của boss; Giày (Phát âm) = tốc chạy + hồi DASH; Bùa (Nói) = sạc Tuyệt kỹ; Mũ, Nhẫn chưa có tác dụng.
> 4. **Meta của Chaos giữ nhưng sửa cho hợp luật:** gold → xu thô (thắng trận + nhặt trong trận, phần nhặt không quá thưởng của trận); shop nâng cấp vĩnh viễn → bỏ, sức mạnh ngoài trận chỉ đến từ đồ rèn; 7 nhân vật giữ, là **lối chơi ngang sức** (test: lệch tỉ lệ thắng ≤ 20 điểm), mở bằng thành tích trong trận, không mua được; thành tích chỉ để khoe + mở nhân vật; chọn thời lượng 3/5/10 phút → bỏ, mỗi trận có thời lượng riêng; bảng tinh chỉnh chỉ bật với `?dev`.
> 5. **Thay mục 22 riêng phần trận:** mã trận Gunny (v133) xoá hẳn; còn trong lịch sử git nếu cần lui.
> 6. **Mục 15 (mỹ thuật):** trận không còn địa hình / đạn; hình vẫn tự vẽ canvas, nhân vật chibi SVG.

> **13/10/2026 — Đổi hướng: Chiến Binh Chữ.** Người sáng lập chốt sau buổi rà lại spec (20 câu hỏi). Khối này đứng trên mọi phần bên dưới; dòng nào bên dưới trái với khối này thì theo khối này (các dòng bị thay có ghi "thay bởi 13/10/2026").
>
> **Định vị và vòng lõi**
> 1. **Sản phẩm:** game nhập vai kiểu Gunny, tên mới **Chiến Binh Chữ** (thay "English Ladder"; đổi tên trong app trước khi lên store, tra trùng thương hiệu và tên trên store trước khi chốt).
> 2. **Trận đấu là game thuần:** ngắm góc, lực, gió kiểu Gunny; **không có câu tiếng Anh trong lượt bắn**. Trận đấu không ghi bằng chứng (P13). Thay luật HG24 "chữ là quân cờ" (GAME-CRITERIA §11.2 luật 4) và dòng 2 của khối 08/10/2026 ("mỗi hành động trong game là thử thách ngôn ngữ").
> 3. **Học là để rèn, chế đồ.** Kết quả trận phụ thuộc **khoảng 70% vào đồ, 30% vào tay ngắm**: chênh một bậc đồ thì ngắm giỏi vẫn lật được, chênh từ hai bậc thì gần như không. Người chơi muốn thắng thì tự nguyện học để nâng chỉ số.
> 4. **Đồ khoá theo chỉ số thật:** đồ bậc N chỉ mặc được khi kỹ năng tiếng Anh thật đạt N (luật v128 giữ nguyên). Người nạp và người không nạp có cùng trình độ thì có cùng trần sức mạnh.
> 5. **Mỗi ô đồ là một nhóm kỹ năng:**
>
>    | Ô đồ | Kỹ năng | Tác dụng trong trận |
>    | --- | --- | --- |
>    | Vũ khí | Từ vựng | Sát thương |
>    | Giáp | Ngữ pháp | Phòng thủ |
>    | Khiên | Nghe | |
>    | Mũ | Đọc | |
>    | Giày | Phát âm | Di chuyển |
>    | Bùa | Nói | Tuyệt kỹ |
>    | Nhẫn | Viết | |
>
>    Boss mỗi khu nhắm điểm yếu khác nhau. Một món không được hơn món yếu nhất quá một bậc (chống học lệch). Bùa và Nhẫn có trần bậc khi Viết/Nói còn giới hạn Confidence Vừa (Quyết định kỹ thuật §10). Máy không có micro / máy nghe thì Bùa có đường rèn thay thế (gõ câu) với trần thấp hơn, không để kẹt.
> 6. **Quên thì đồ cùn, không mất:** phần đồ gắn với mục sắp quên (FSRS) bị giảm lực; ôn đến hạn = **mài đồ**, lấy lại đủ lực. Không có cường hoá hỏng mất đồ.
> 7. **Game cũ thành lò rèn / phó bản, mở dần.** 17 game hiện có không mở cùng lúc: lò mới mở theo bậc đồ và độ khó bài (dễ → khó), để người chơi không phải chọn giữa quá nhiều thứ. Học diễn ra trong lò; trận đấu chỉ để chơi, không trộn hai việc.
>
> **Bộ não điều phối trong game**
>
> Người chơi chọn **rèn món nào**; bộ não quyết định **món đó đòi học gì**.
>
> | Bộ não cũ | Vai trò mới |
> | --- | --- |
> | `path.ts` (đường đi tối thiểu) | Cây công thức đồ của từng khu; mở lò theo tiền đề |
> | `nba.ts` (bước tiếp theo) | Nội dung của mỗi lần rèn: học mới = luyện phôi (có thẻ dạy trước), ôn đến hạn = mài đồ cùn, dò = thử quặng lạ, transfer = tôi luyện (bắt buộc khi lên bậc cao, chống học tủ) |
> | `director.ts` (chọn game) | Chọn lò hợp nhu cầu và đánh dấu **"Thợ rèn gợi ý"**: một món đáng rèn nhất, lý do bằng lời của game; theo gợi ý được thêm tinh hoa. Nút "▶ Chơi tiếp" đổi thành gợi ý này |
> | Bằng chứng L0–L4, mastery, FSRS, đèn báo học tủ | Giữ nguyên. Lượt rèn là lượt đo: không ép giờ, chỉ số trận đấu không đổi câu hỏi (P14) |
> | Trận cổng (v113–v116) | Rèn **Bảo vật khu**: câu lạ, làm một lần, không gợi ý, thành khi P(đậu) ≥ 80%. Có Bảo vật mới được đánh boss cuối khu; trận boss vẫn là game thuần |
>
> **Đối thủ, tài khoản, kiếm tiền**
> 8. **Thứ tự làm đối thủ:** đánh máy (PvE: boss, phó bản, chạy khi mất mạng) → đấu bóng ma bất đồng bộ (phát lại lượt của người thật, Supabase) → đấu thời gian thực khi đủ người.
> 9. **Tài khoản:** Supabase Auth. Người mới **chơi trước, đăng nhập sau**: chương mở đầu và vài trận PvE không cần tài khoản; đăng nhập khi đấu người thật, khi nạp, hoặc để giữ đồ. Dữ liệu khách chuyển sang tài khoản. Tuân Nghị định 13/2023, đồng ý của cha mẹ với người dưới 16 tuổi. Thay lời hứa "không tài khoản" (README, trang quyền riêng tư, mục 42 ở "Các mục được sửa").
> 10. **Kiếm tiền:** nạp để **rút ngắn thời gian cày nguyên liệu**, không mua được năng lực. Hai loại nguyên liệu:
>     - **nguyên liệu thô** (sắt, gỗ, xu) rơi từ trận đấu, mua được;
>     - **tinh hoa chữ** chỉ có khi trả lời đúng ở lò rèn, không mua được.
>
>     Món đồ cần cả hai loại và vẫn khoá theo chỉ số thật. Không quay thưởng, không VIP cộng lực chiến. Thay dòng "Kiếm tiền" (kiểu Duolingo: năng lượng theo lượt, quảng cáo) và Quyết định kỹ thuật §11.
>
> **Đích và nghiệm thu**
> 11. **Đích vẫn là đạt cấp CEFR**; game là phương tiện. Thay ý "xác nhận CEFR chỉ là tuỳ chọn ở hồ sơ" của dòng "Định vị game-first" (v121).
> 12. **Đích đầu tiên: A2.** Xác nhận đạt cấp bằng **trận cổng (Bảo vật khu) + đề mẫu Cambridge chính thức làm ngoài app** trong điều kiện thi; app chốt dự đoán trước, đối chiếu sau. Câu cổng A1/A2 do AI soạn, cần người sáng lập soát.
> 13. **Cổng lên store:** người sáng lập chơi đủ cuốn để chơi liên tục tới khi đạt cấp mục tiêu (A2, xác nhận như mục 12). Thay dòng "Cổng lên store" (điểm thi thật).
> 14. **Cách làm:** AI xây liên tục, người sáng lập chơi thử khi rảnh. Mỗi bản ghi rõ "chưa người thật kiểm"; điểm tự chấm chỉ để tham khảo, không cộng dồn thành kết luận. Trong trận có nút **góp ý nhanh** (chấm 1–5 + một dòng) để người sáng lập ghi ngay khi chơi.
> 15. **Mỹ thuật:** bộ hình giấy phép mở (CC0, ví dụ Kenney) cho địa hình, đạn, hiệu ứng; nhân vật chibi ghép từ SVG hiện có. Ghi nguồn và giấy phép từng bộ hình.
> 16. **Mốc 1:** một trận PvE đánh boss khu A1 + một lò rèn Vũ khí (nội dung từ Vòng Chữ / Mỏ Chữ) + "Thợ rèn gợi ý"; đồ đổi kết quả trận theo tỉ lệ 70/30. Mục đích: kiểm vòng "học → rèn → thắng" có cuốn không, trước khi làm tài khoản và đấu người thật.
>
> **Bổ sung sau rà soát (`docs/RA-SOAT-v133.md`).** Người sáng lập giao Claude tự quyết theo hướng mới; hai điểm có * là người sáng lập chốt.
> 17. **Chỉ số → ô đồ:** theo đúng 7 ô ở mục 5. Hai chỉ số cũ không thành ô riêng:
>     - **Trí nhớ** (FSRS, H6) thành **độ sắc** của mọi món: nhớ kém thì đồ cùn, như mục 6.
>     - **Dùng thật** (chức năng giao tiếp, transfer) thành **điều kiện tôi luyện** đồ bậc 4–5.
>
>     Ba hệ đồ hiện có (trang bị v132, 5 món buff game của Túi chữ v128, món theo kỹ năng của Lò rèn v129) gộp thành **một** hệ đồ chiến đấu; 5 món buff game bỏ.
> 18. **Game kiểu câu hỏi xen lượt chơi** (Xếp Khối, Bàn Cờ, Leo tháp, Robot, Tốc độ 60 giây, Ghép cặp, Thách đấu 10 câu): cất vào Thư viện, không rơi nguyên liệu, chỉ sửa lỗi. Vai "game vui" nay là trận đấu.
> 19. **Truyện:** boss mỗi khu là **Tiếng Ồn**, sinh vật do Sương tạo ra. Mờ giữ vai nhân vật được hoà giải bằng lời nói ở cuối (truyện v128). Trận cuối khu 4 vẫn là cuộc nói chuyện.
> 20. **Soát trận cổng\*:** người sáng lập **không xem đề** (giữ đề lạ cho chính mình). Một phiên AI độc lập soát đáp án, cấp độ, câu đố (`tools/review-export.mjs` → `review-compare.mjs`). Đề mẫu Cambridge A2 Key người sáng lập tự làm ngoài app là trọng tài: lệch nhiều so với dự đoán thì sửa cổng.
> 21. **Bộ tiêu chí\*:** mục tiêu hiện tại là **hoàn thành A2**; mọi đánh giá tính theo đó. Các thang cũ (Conformance 200, Scorecard 400, Scorecard v111, trục M / H / S / G / P) **đóng băng làm lịch sử, ngưng chấm**. Một bảng duy nhất "Chiến Binh Chữ → A2" thay thế:
>     - đo tiến tới A2 bằng bằng chứng thật;
>     - trận đấu đủ cuốn;
>     - đồ quyết định khoảng 70% (đo bằng số liệu trận);
>     - không trả tiền mua được năng lực;
>     - nhớ sau 7 / 30 ngày.
>
>     Điểm tự chấm chỉ để tham khảo (mục 14).
> 22. **Phần cũ:**
>     - tiến độ người đang dùng được giữ, chuyển thành bậc đồ;
>     - nhánh v45 bỏ;
>     - IELTS / VSTEP giữ ẩn, không đầu tư trước khi xong A2;
>     - Super giả lập thành cửa hàng giả lập (gói nguyên liệu thô);
>     - năng lượng theo lượt và quảng cáo giả gỡ ở mốc 2;
>     - người dưới 16 tuổi không nạp được khi chưa có cha mẹ đồng ý;
>     - không ưu đãi ép giờ, không quay thưởng.
>
>     Không gỡ mã cũ trước mốc 2, để còn đường lui nếu trận đấu không cuốn.
>
> **Ba rủi ro ghi nhận (không dùng để đổi hướng):**
> - Trận đấu phải vui tự thân; nếu không, học thành việc cày và cả vòng sụp. Mốc 1 kiểm đúng điều này.
> - Không có playtest định kỳ thì dễ lặp lại lần trước: tự chấm game khoảng 7, người sáng lập chơi thật thấy "quá tệ" (GAME-CRITERIA §10).
> - Đích A2 dựa vào câu cổng do AI soạn, chưa soát.

> **08/10/2026 — Spec v2.4 thay hướng sản phẩm.** Người sáng lập chốt: nguồn sự thật là **Master Spec v2.4** (`docs/SPEC-v2.4.md`), triển khai **thuần v2.4**:
> 1. MVP chỉ một Target Model là **CEFR Pre-A1 → C2**. IELTS, VSTEP, giao tiếp là Future Target Models: dữ liệu giữ nguyên (`status: "future"` trong `content/engine/goals/`), ẩn khỏi người học, bật lại được trong Cài đặt → Nâng cao; dùng để kiểm chứng mở rộng ở M10 của v2.4.
> 2. **Game là trải nghiệm chính**: người học chơi để thắng, việc học tiếng Anh nằm ẩn trong luật chơi (stealth learning) — mỗi hành động trong game là một thử thách ngôn ngữ do engine chọn, nhằm lên cấp nhanh nhất. Không dùng dark pattern; tiến độ học và dữ liệu luôn xem được.
> 3. Kiến trúc evidence theo v2.4 (Observation → Evidence → Ledger → Aggregate → Learner State → Decision Snapshot), đo bằng `docs/CONFORMANCE-200-v2.4.md` và `docs/SCORECARD-v2.4.md`.
>
> Các quyết định ở phần dưới vẫn có hiệu lực khi không trái với ba điểm trên (năng lượng/Super giả lập giữ nguyên). Lộ trình xây mới: v52 → v88 (xem phần "Lộ trình v2.4" cuối tệp).

Cập nhật: 13/10/2026 (đổi hướng Chiến Binh Chữ, khối đầu tệp; trước đó 11/10/2026 đồng bộ tới v121). Bản Claude Docs dưới đây chưa đồng bộ khối 13/10/2026. Bản đọc và bình luận: Claude Docs "English Ladder — Spec (v115)" (https://claude.ai/code/artifact/4391badc-cdcb-4248-8f65-4bbfec7ea9f7). Tệp này là bản AI đọc khi xây; hai bản phải giống nhau. Doc cũ "English Ladder — Master Spec v2" không còn được cập nhật.

## Cách đọc

Bản này chốt mọi điểm còn mở của Master Spec gốc (51 mục) để bắt tay xây engine trên app hiện tại. 51 mục gốc vẫn có hiệu lực, trừ 4 mục được sửa ở phần "Các mục được sửa".

- **Quyết định của người sáng lập**: nguồn sự thật. Không ai (kể cả AI) tự đổi; muốn đổi phải hỏi lại.
- **Quyết định kỹ thuật**: do Claude chốt theo uỷ quyền. Sửa được khi dữ liệu thật cho thấy sai, ghi lý do trong lịch sử.
- **Rủi ro**: chỉ ghi nhận, không dùng để đổi hướng.

## Quyết định của người sáng lập

App là một engine học dùng chung cho mọi mục tiêu, kiếm tiền kiểu Duolingo, và được chứng minh bằng điểm thi thật của chính người sáng lập trước khi lên store.

| Chủ đề | Quyết định |
| --- | --- |
| Giá trị lõi | Một engine cho mọi mục tiêu; thêm mục tiêu = thêm Target Model, không xây app mới |
| Phạm vi engine đầu tiên | CEFR Pre-A1 → C2; IELTS Academic + General 4.0–9.0; VSTEP B1, B2, C1; giao tiếp hằng ngày, công việc, du lịch, học tập |
| Cách xây | Xây lên app hiện tại (v44), không viết lại. AI viết code và soạn nội dung; người sáng lập định hướng và kiểm tra |
| Thời gian | Không gấp, miễn đúng. Người sáng lập đợi engine và bắt đầu học từ M4; ngày thi và doanh thu lùi theo tốc độ xây |
| Người dùng đầu tiên | Chính người sáng lập: mất gốc (A1–A2), muốn thi VSTEP và IELTS |
| Kiếm tiền | **Thay bởi 13/10/2026 mục 10.** Giống Duolingo: thuê bao tháng/năm, quảng cáo ở bản miễn phí, năng lượng theo lượt (mỗi bài tốn như nhau, đúng hay sai), XP theo hoạt động, game hoá, quy mô lớn |
| Giai đoạn demo | Web, chạy đủ cơ chế kiếm tiền nhưng chưa thu tiền thật |
| Cổng lên store | **Thay bởi 13/10/2026 mục 13.** Người sáng lập đạt điểm thi thật ở kỳ thi chọn ngay sau bài chẩn đoán đầu vào trên engine (M3); khi đó mới làm tài khoản, thanh toán, store |
| AI | Làm sau. Trước hết mọi chức năng phải tốt nhất có thể mà không lệ thuộc AI |
| Điểm kỹ thuật còn mở | Giao cho Claude quyết, miễn đúng triết lý spec |
| Thước đo đạt mục tiêu (11/10/2026, v111) | Đạt = **đậu một đề chưa từng thấy ở đúng cấp, không học tủ**. Chuẩn "đậu" theo thang Cambridge English Scale cho từng cấp. Đề trong app do app tự soạn theo đặc tả công khai của các bài Cambridge (không chép đề, không dùng tên thương hiệu như đề chính thức). Đề mẫu chính thức làm ngoài app là neo đối chiếu. Thi thật là trọng tài cuối. Chi tiết: mục "Đề sát hạch và chống học tủ" |
| Game hoá mọi chức năng (11/10/2026, v111) | Mọi chức năng học và đo đã có (xếp lớp, chọn mục tiêu, học mới, ôn, 4 kỹ năng, chẩn đoán, đo hiệu quả, kết luận đạt cấp) đều phải có **vỏ game**. Người học chỉ thấy mình đang chơi; app vẫn thu được kết quả nó cần. Màn chơi không bắt người học "làm bài", "đi thi", không dùng chữ thi / đề / kiểm tra. Đề mẫu chính thức và thi thật là **tuỳ chọn ở hồ sơ**, chỉ cho ai cần chứng chỉ. Chi tiết: mục "Game hoá mọi chức năng" |
| Định vị game-first (11/10/2026, v121) | **Thay một phần bởi 13/10/2026** (mục 1–2, 11: game nhập vai, trận đấu không có câu tiếng Anh, đích CEFR là thước đo chính). Sản phẩm là **game chữ tiếng Anh cho người Việt**, không định vị là "một app học tiếng Anh" để khỏi bị so với các app học lớn. Chữ tiếng Anh là cơ chế chơi (chữ là quân cờ); engine (NBA, FSRS, evidence) giữ nguyên bên dưới để chọn từ/câu cho màn chơi. **Phạm vi:** giữ CEFR Pre-A1 → C2, nhưng làm game theo thứ tự cấp: mỗi game chủ lực chạy tốt ở Pre-A1–B1 trước, rồi mở C1–C2 bằng chính cơ chế đó, không thêm game riêng cho cấp cao. IELTS/VSTEP vẫn ẩn. **Thước đo hai tầng, game trước:** mặt tiền đo bằng người chơi quay lại D1/D7 và số từ còn nhớ sau 7/30 ngày (FSRS); xác nhận đạt cấp CEFR bằng bằng chứng vẫn có trong engine nhưng là **tuỳ chọn ở hồ sơ**, không phải lời hứa ở mặt tiền. **Lõi:** 1–2 game chủ lực (🎡 Vòng Chữ, ⛏️ Mỏ Chữ); các game khác ngưng mở rộng, nằm ở "Luyện tập". Bước đầu là playtest của người sáng lập (`docs/PLAYTEST.md` Phần 2); điểm thật < 6 thì sửa lõi hai game này trước mọi việc khác. **Còn mở, chờ người sáng lập xem lại:** dòng "Kiếm tiền" (kiểu Duolingo) và "Cổng lên store" (điểm thi thật) chưa đổi. **Thành công = vừa quay lại, vừa dùng được:** game chủ lực đạt M ≥ 7 (GAME-CRITERIA §10) **và** cả app đạt H ≥ 7 (trục hiệu quả học thật, GAME-CRITERIA §12). Chi tiết: GAME-CRITERIA §11–§12 |
| Bản v45 (nhánh `claude/v45-ai-copy-honest-free`) | Để nguyên, quyết sau. Không gộp nguyên trạng vì chữ "không quảng cáo" trái với mô hình đã chọn |

Bài học từ lịch sử app: bản v35 chuyển sang "miễn phí 100%" do AI khuyên, không phải ý người sáng lập. Từ nay AI không đổi hướng sản phẩm khi chưa hỏi.

## Tầm nhìn và triết lý

App luôn biết bước tiếp theo người học nên làm: biết họ đang ở đâu, mục tiêu ở đâu, còn thiếu gì, và đã thật sự chứng minh được gì. Các nguyên tắc dưới đây giữ nguyên từ spec gốc.

1. **Luật vận hành**: không hỏi "đã học bao nhiêu" mà hỏi "đã chứng minh được năng lực nào so với mục tiêu" (mục 51).
2. **Đường đi tối thiểu**: chỉ học thứ còn thiếu mà mục tiêu cần; không học lại thứ đã thành thạo (mục 4, 20).
3. **Mục tiêu = Target Model có phiên bản** trên đồ thị năng lực, không phải khoá học cố định (mục 5, 6).
4. **Mastery theo 5 mức** (nhận ra, hiểu, nhớ ra, dùng có kiểm soát, dùng tự do), phụ thuộc mục tiêu, dựa trên nhiều bằng chứng (mục 8–12).
5. **Biết kiến thức ≠ làm được việc**: cần bằng chứng làm bài thật (mục 11).
6. **Learning Path tách Memory Maintenance**: đã thành thạo thì ra khỏi lộ trình, chuyển sang ôn duy trì (mục 17, 18).
7. **Tiến độ học ≠ mức sẵn sàng** cho mục tiêu (mục 19).
8. **CEFR, IELTS, VSTEP là các mô hình riêng**, chỉ tham chiếu lẫn nhau (mục 28).
9. **Nội dung là dữ liệu**, tách khỏi giao diện; có schema, kiểm tra tự động (mục 44, 45).

Vòng lặp lõi:

```
Mục tiêu → Target Model → Chẩn đoán → Trạng thái người học → Khoảng thiếu → Learning Path
  → Học + luyện → Bằng chứng → Mastery
       Mastery chưa đạt → quay lại Học + luyện
       Mastery đạt      → Ôn duy trì (FSRS); quên → quay lại Learning Path
  → Bài Can-Do → Sẵn sàng?
       chưa → tính lại Khoảng thiếu
       có   → Đạt mục tiêu (kỳ thi: bằng điểm thi thật)
```

## Mô hình học v111: mục tiêu, đầu vào, cách học, kết luận, bằng chứng

Chốt ngày 11/10/2026 từ thảo luận với người sáng lập. Chương này là bản tóm tắt có hiệu lực. Các mục chi tiết đi sau:
- "Hợp đồng hiển thị tiến độ";
- "Game hoá mọi chức năng";
- "Đề sát hạch và chống học tủ".

Chỗ nào ở phần dưới (vòng lặp lõi trên, Quyết định kỹ thuật §7–§8) trái với chương này thì theo chương này.

```
① Mục tiêu (người học chọn, trong truyện)
  → ② Đầu vào (chương mở đầu: cấp theo từng kỹ năng ± sai số)
  → ③ Bản đồ (biết gì / thiếu gì so với cấp mục tiêu)
  → ④ Vòng học: bộ não chọn game → chơi → mỗi câu trả lời là bằng chứng
        vững → ôn cách quãng; quên → học lại; đúng câu cũ mà sai câu lạ → đèn học tủ → luyện câu transfer
  → ⑤ Bản đồ báo gần đủ → mở trận cổng cuối khu (câu lạ, chơi một lần)
        P(đậu) < 80% → biết hụt phần nào → quay lại ④
        P(đậu) ≥ 80% → Đạt trong app, mở khu (cấp) kế tiếp
  → ⑥ (tuỳ chọn ở hồ sơ) đề mẫu chính thức / thi thật → xác nhận ngoài, đối chiếu dự đoán
```

### 1. Mục tiêu
- **Đích:** cấp CEFR người học muốn tới (P1 Goal First). Hỏi bằng **một lựa chọn trong truyện**, có mặc định = cấp kế tiếp sau đầu vào. Hạn chót, mục đích (thi / công việc / giao tiếp) là tuỳ chọn ở hồ sơ.
- **Có hạn chót:** app báo số giờ cần và có kịp không (dùng lại `plan.ts`).
- **Chặng:** mỗi cấp là một khu của Phố Chữ. Đích xa được chia thành từng khu, mỗi khu một trận cổng.
- **"Đạt" có nghĩa gì:** đậu câu lạ ở đúng cấp, không học tủ (quyết định của người sáng lập). Chuẩn đậu theo thang Cambridge (mục "Đề sát hạch").

### 2. Đầu vào
- **Hình thức:** chương mở đầu của truyện, ≤ 15 phút, là màn đầu tiên người mới chơi. Không có màn "bài dò".
- **Đo gì:** từ vựng + ngữ pháp (cầu thang dò đồ thị hiện có, §7), một đoạn nghe, một đoạn đọc (IRT thích ứng sẵn có, `placement.ts`). Dừng khi đủ chắc.
- **Kết quả:** cấp hiện tại **theo từng kỹ năng**, kèm sai số. Đặt tiên nghiệm (Claim) cho các nút; Claim không bao giờ thành Đạt nếu chưa có bằng chứng thật.
- **Không đụng câu lạ:** câu dùng ở đầu vào lấy từ kho riêng, không trùng câu của trận cổng.
- **Xếp lớp lại:** Thám hiểm sương mù, khi nhiều Claim còn chưa xác nhận.

### 3. Cách học (vòng học)
- **Chọn nội dung:** chỉ học phần còn thiếu mà cấp mục tiêu cần (đường đi tối thiểu §6), có truy gốc rễ khi sai lặp lại.
- **Chọn game:** bộ não chọn game (`director.ts`) chọn *dạng game* hợp nhu cầu lúc đó. Từ v111 thêm một nhu cầu: **phần đề tham chiếu đang hụt** (Đọc, Nghe, Viết, Nói, từ vựng, ngữ pháp). Thời gian chơi chia theo chỗ hụt, không theo game vui nhất.
- **Ôn:** FSRS; phần đã vững ra khỏi lộ trình, chuyển sang ôn duy trì.
- **Chống học tủ:**
  - Đạt nút cần đúng ở câu mới (transfer).
  - **Đèn báo học tủ** so tỉ lệ đúng ở câu đã gặp với câu lạ cùng nút, dùng bộ đếm `nov` / `novOk` đã có ở L2, không thêm dữ liệu. Chênh lớn thì lộ trình chuyển sang câu transfer.
- **Trận cổng là tài nguyên có hạn:** mỗi đề lạ chơi một lần là hết lạ. Chỉ mở trận cổng khi bản đồ báo gần đủ, tức nút cần của cấp đã Đạt hoặc đủ gần (tham số cấu hình). Mở sớm thì phí đề, và kết quả "chưa đậu" ai cũng đoán trước được (P10: chỉ đo khi kết quả có thể đổi quyết định).

### 4. Kết luận
- **Bản đồ (tiến độ, kỹ năng vững)** dùng để chẩn đoán. **Trận cổng** dùng để kết luận. Hai thứ hiện tách nhau trên màn hình.
- **Đạt trong app:** qua trận cổng (P(đậu) ≥ 80% trên câu lạ).
- **Xác nhận ngoài (tuỳ chọn):** đề mẫu chính thức hoặc thi thật. App chốt dự đoán trước, đối chiếu sau.

### 5. Game hoá
Mọi bước ①–⑤ đều trong vỏ game; bước ⑥ là tuỳ chọn ngoài game. Bảng chi tiết ở mục "Game hoá mọi chức năng".

### 6. Lưu bằng chứng: đủ dùng, ít dữ liệu nhất
Nguyên tắc: **chỉ giữ dữ liệu có thể đổi một quyết định** (P10, P27); thống kê đủ để tính lại thay cho dữ liệu thô.

| Lớp | Giữ gì | Giới hạn |
| --- | --- | --- |
| L0 Quan sát thô | Từng lượt, đáp án đưa ra (để bắt mẫu lỗi) | 7 ngày, ≤ 300 |
| L1 Sổ bằng chứng | Câu trả lời đã diễn giải, có tier giá trị | ≤ 2.000; dọn theo giá trị, tier cao dọn sau cùng |
| L2 Thống kê gộp | Bộ đếm theo nút × mức × ngữ cảnh × dạng câu × mới / cũ; gộp nhiều máy không đếm trùng | không lớn theo thời gian |
| L3 Mức thành thạo | Tính lại từ L2 | không lưu riêng |
| L4 Ảnh chụp quyết định | Vì sao app kết luận | ≤ 400 |
| Câu đã gặp | Mã băm 6 ký tự | ≤ 150 mỗi nút |

Bổ sung từ v111:
- **Kết quả trận cổng, đề mẫu, thi thật lưu vĩnh viễn ở tier cao nhất.** Mỗi lần chỉ vài chục byte: mã đề, điểm từng phần, P(đậu) dự đoán trước đó, ngày.
- **Danh sách câu cách ly do kho nội dung giữ.** Bản lưu người học chỉ ghi đề nào đã chơi.
- **Đèn báo học tủ và P(đậu) là số dẫn xuất**, tính lại khi cần, không lưu.
- **Mất dữ liệu là rủi ro lớn hơn dung lượng.** App nhắc bật mã đồng bộ hoặc sao lưu, ít nhất sau ván đầu tiên và mỗi lần qua cổng. Ước tính tổng dữ liệu < 1 MB; phải đo thật trên máy người dùng.

### 7. Bộ tiêu chí đánh giá
- **Bộ tiêu chí chính thức** của chương này là `docs/SCORECARD-v111.md`: 79 tiêu chí, 12 nhóm, mỗi tiêu chí có mốc 10 và gắn với một mục của chương này. Nhóm L "Rõ ràng và dễ dùng" (8 tiêu chí) thêm ở v116: trước đó bảng chỉ đo phần bên trong, nên mỗi bản thêm thẻ lên sảnh mà điểm vẫn tăng.
- **Luật màn đầu (v117, nhóm L).** Màn đầu (tab Hôm nay) có đúng một nút chính trong khung nhìn đầu tiên ở 390 × 844; tối đa 3 khối hiện ra, phần còn lại thu gọn; không thuật ngữ nội bộ (năng lực, cổng khu, bằng chứng, Can-Do, Pre-A1, kết luận). Tính năng mới không được thêm thẻ lên màn đầu: vào mục "Tự chọn" hoặc tab Thư viện. Từ v118, màn đầu là **cảnh truyện của khu đang ở**: mọi trang trí phải gắn với Phố Chữ và nói thật về tiến độ (sương tan theo kỹ năng vững thật). Kiểm tự động: `test/e2e/clarity.spec.ts`.
- **Chấm lại sau mỗi bản phát hành**, ghi điểm mới cạnh điểm cũ.
- **Không đổi mốc 10 để điểm đẹp hơn.** Muốn đổi mốc phải hỏi người sáng lập.
- **Trọng số nhóm** do người sáng lập duyệt.

### Hợp đồng hiển thị tiến độ (v110)

Spec định nghĩa kỹ cách *tính* Readiness nhưng trước v110 không nói người học phải *thấy* gì ở đâu. Hệ quả: các đợt nâng game (v89–v109) làm thưởng game (xu, ★ Phố, sự kiện tuần) nổi lên đầu sảnh, còn tiến độ học thật bị đẩy vào mục tháp đang đóng. Người học chơi mà không biết mình đang tiến tới đâu. Luật từ v110 (theo v2.4 §XIX "Play → Goal → Progress → Next Challenge", §XVII, P20):

1. **Sảnh Chơi mở đầu bằng thẻ Mục tiêu**, trên mọi phần thưởng game và trên "▶ Chơi tiếp". Thẻ có:
   - tên mục tiêu;
   - số kỹ năng đã vững bằng bằng chứng thật (tách riêng phần chỉ suy ra từ xếp lớp);
   - số vững thêm trong 7 ngày;
   - **mốc gần**: 3 năng lực gần đạt nhất;
   - số phần sắp quên.
   
   Chạm thẻ mở trang "Chưa đạt … vì còn thiếu".

   **Sửa ở v117 (nhóm L của bảng chấm, quyết định của người sáng lập ngày 11/10/2026: "giao diện quá nhiều chức năng, nhìn không biết nên làm gì").** Thẻ đầy đủ ở trên đặt đầu sảnh làm màn đầu có 5–8 con số và đẩy "▶ Chơi tiếp" xuống dưới nếp gấp. Từ v117:
   - **"▶ Chơi tiếp" là việc đầu tiên và là nút chính duy nhất** của màn đầu.
   - Ngay dưới là **thẻ Mục tiêu bản gọn**: một dòng "🎯 A1 · x/y kỹ năng đã vững" + thanh tiến độ, vẫn nằm trong màn đầu nên tiến độ học thật không bị che (mục đích của v110 giữ nguyên). Chỉ thêm dòng khi người học phải làm gì: cổng đã mở, tới hạn, đang học tủ.
   - **Bản đầy đủ** (mốc gần, năng lực, thang khu, cổng khoá, "chưa phải kết luận") chuyển lên đầu trang mục tiêu, cách một lần chạm.
   - Mọi thứ khác của sảnh (truyện, game chủ lực, game kỹ năng, phố, tháp, số liệu) nằm trong **một** mục thu gọn "Tự chọn trò chơi khác". Không khoá gì: tab Thư viện → "Tất cả trò chơi" mở thẳng mục này.
2. **Mọi màn kết game có một dòng nối ván với mục tiêu**, kể cả khi ván không làm vững thêm gì. Dòng này nói thật:
   - "vững thêm X" chỉ khi đạt **đúng mức mục tiêu cần**;
   - đạt ở mức thấp hơn thì báo "tiến một bậc";
   - không có gì thì báo số câu bằng chứng.
3. **Readiness CEFR không hiện bằng phần trăm.** Hiện số năng lực đã Đạt / cần và danh sách còn thiếu.
4. **Bản đồ khác phán quyết (v111).** Thẻ 🎯 và tiến độ kỹ năng là *bản đồ chẩn đoán*: còn thiếu gì, học gì tiếp. Kết luận "đủ trình độ" chỉ đến từ **trận cổng cuối khu** (mục "Đề sát hạch và chống học tủ"). Trên màn chơi, kết luận đó hiện bằng lời trong truyện ("cổng khu Bến Cảng sắp mở được"). Xác suất qua cổng kèm khoảng sai số chỉ nằm ở trang tiến độ, ai muốn xem thì mở.

### Game hoá mọi chức năng (v111)

Quyết định của người sáng lập: game hoá những cách học thông thường. Người học dùng game để chơi; app thì thu được kết quả như ý muốn. Bảng dưới là hợp đồng: mỗi chức năng phải có vỏ game; màn ngoài game (tab Học, Ôn tập, Kỹ năng) giữ làm lối phụ cho ai thích học kiểu thường, không phải đường chính.

| Chức năng | App cần thu được | Vỏ game |
| --- | --- | --- |
| Xếp lớp đầu vào | Cấp hiện tại theo từng kỹ năng, kèm sai số | **Chương mở đầu của truyện**: màn đầu tiên người mới chơi; câu tự lên xuống độ khó, có cả đoạn nghe và đoạn đọc ngắn. Thay bài dò hỏi thẳng hiện tại. Thám hiểm sương mù giữ làm xếp lớp lại |
| Chọn mục tiêu | Muốn tới cấp nào (P1 Goal First) | **Một lựa chọn trong truyện**: Tí hỏi "Bạn muốn đi xa tới đâu trong Phố Chữ?", có sẵn mặc định = cấp kế tiếp sau xếp lớp, một chạm. Đổi được ở hồ sơ. Hạn chót là tuỳ chọn ở hồ sơ |
| Học mới, ôn, ngữ pháp, 4 kỹ năng | Bằng chứng theo nút, theo mức | Các game hiện có (bảng GAME-CRITERIA §1) |
| Chẩn đoán liên tục | Dò phần chưa chắc | Lượt "❓ Thử sức" trong game (đã có) |
| Đo hiệu quả học (bộ câu giữ riêng v63) | Mức tăng, mức giữ lại | **Lượt "kho báu ẩn"** trộn trong game, không hiện đáp án; thay màn "Đo đầu vào / Đo sau khi học" riêng |
| Kết luận đạt cấp | P(đậu) trên câu lạ | **Trận cổng cuối khu** (mục dưới) |
| Xác nhận ngoài app | Điểm đề mẫu chính thức / thi thật | **Không game hoá**: tuỳ chọn ở hồ sơ, không hiện ở màn chơi |

Ba luật đi kèm:
1. **Màn chơi không dùng chữ** "thi", "đề", "kiểm tra", "bài dò"; dùng lời của truyện (cổng, thử sức, kho báu).
2. **Luật game không làm bẩn phép đo (P14).** Ở lượt đo (chương mở đầu, kho báu ẩn, trận cổng) không có đồng hồ ép giờ, không có tim / combo làm đổi câu hỏi hay cách tính. Rớt phải là do tiếng Anh, không do chơi game kém.
3. **Giấu cảm giác thi, không giấu sự thật.** Trang tiến độ và "Vì sao?" luôn nói rõ lượt nào là lượt đo, app đã kết luận gì, từ bằng chứng nào (không dark pattern).

### Đề sát hạch và chống học tủ (v111): trận cổng cuối khu

Quyết định của người sáng lập: thước đo chuẩn xác nhất là người học đậu bài thi ở cấp đó mà không học tủ. Bản đồ năng lực trong app tự ra đề, tự chấm, và phần lớn câu đo lấy từ chính kho câu dùng để luyện. Vì vậy nó chỉ dùng để chẩn đoán, không dùng để kết luận đạt.

**Chuẩn đậu theo cấp** (thang Cambridge English Scale, mức tối thiểu để được công nhận cấp đó):

| Cấp | Bài tham chiếu (đặc tả công khai) | Ngưỡng | Neo ngoài app |
| --- | --- | --- | --- |
| Pre-A1, A1 | Không có bài cho người lớn | Đề app, chuẩn do app đặt | **Không có.** Màn hình phải ghi rõ |
| A2 | A2 Key | ≥ 120 | Đề mẫu chính thức |
| B1 | B1 Preliminary | ≥ 140 | Đề mẫu chính thức |
| B2 | B2 First | ≥ 160 | Đề mẫu chính thức |
| C1 | C1 Advanced | ≥ 180 | Đề mẫu chính thức |
| C2 | C2 Proficiency | ≥ 200 | Đề mẫu chính thức |

Ngưỡng và đặc tả phải soát lại với tài liệu công khai mới nhất của Cambridge trước khi soạn đề mỗi cấp. Ghi nguồn và ngày soát vào tệp đề.

**Đề sát hạch của app = trận cổng cuối khu.** Mỗi cấp CEFR là một khu của Phố Chữ; muốn mở khu kế tiếp thì qua trận cổng cuối khu. Truyện hiện có 3 khu, cổng đếm 2 / 5 / 9 kỹ năng vững; phải đổi thành **một khu cho mỗi cấp, cổng = đề sát hạch của cấp đó**.
- **Cách soạn:** soạn mới theo dạng bài, số câu, cách chấm của bài tham chiếu. Không chép câu nào của đề Cambridge. Trên màn chơi là trận cổng trong truyện; trang tiến độ ghi "soạn theo đặc tả công khai của A2 Key"; không dùng logo hay tên bài như đề chính thức.
- **Cách ly:** mọi câu của đề bị loại khỏi luyện tập, game, ôn, transfer, chẩn đoán (mở rộng cơ chế câu giữ riêng của bộ đo v63, `today.ts`). Mỗi đề chỉ làm **một lần**. Mỗi cấp có nhiều đề song song. Hết đề lạ thì app nói thẳng là hết, không dùng lại đề cũ để kết luận.
- **Điều kiện đo:** không gợi ý, không hiện đáp án trong lúc chơi trận cổng; chữa bài sau khi xong trận. Không ép giờ trên màn chơi (luật 2 của mục Game hoá). App ghi thời gian làm để so với thời lượng của bài tham chiếu: chậm hơn nhiều thì trang tiến độ báo "cần nhanh hơn khi thi thật".
- **Readiness:**
  - Nghe / Đọc: từ điểm đề lạ, ước năng lực theo IRT kèm sai số, rồi tính xác suất vượt ngưỡng đậu; cùng cách làm của IELTS / VSTEP (`readiness.ts`).
  - Viết / Nói: máy chấm luật + tự chấm, giới hạn ở Confidence Vừa (mục 10).
  - Sẵn sàng khi P(đậu toàn bài) ≥ 80%.
- **Đèn báo học tủ:** so tỉ lệ đúng ở câu đã gặp khi luyện với tỉ lệ đúng ở đề lạ cùng năng lực. Chênh lệch lớn thì báo "đang nhớ câu, chưa dùng được thật" và đưa lộ trình sang câu transfer. Ngưỡng chênh là tham số cấu hình.
- **Neo ngoài (tuỳ chọn, ở hồ sơ):** ai cần chứng chỉ thì bật "Tôi muốn thi lấy chứng chỉ". Khi đó, lúc qua cổng, trang hồ sơ gợi ý làm một đề mẫu chính thức ngoài app, trong điều kiện thi, rồi nhập điểm. Đề mẫu chính thức không bao giờ được đưa vào kho của app, để nó luôn là đề lạ. Người không bật thì không bao giờ thấy phần này.
- **Chốt dự đoán:** trước mỗi lần làm đề neo hoặc thi thật, app ghi lại P(đậu) đang có (snapshot `readiness`). Sau khi có điểm, đối chiếu dự đoán với kết quả và hiện cho người học xem app đoán đúng hay sai.

**Achieved (Đạt mục tiêu CEFR):**
- **Đạt trong app:** qua trận cổng cuối khu của cấp đó (P(đậu) ≥ 80% trên câu lạ).
- **Xác nhận ngoài (tuỳ chọn):** đậu đề mẫu chính thức trong điều kiện thi, hoặc đậu thi thật. Trang tiến độ hiện riêng hai dòng này; Pre-A1 / A1 không có xác nhận ngoài.
- Người sáng lập dùng xác nhận ngoài làm cổng lên store (quyết định cũ "điểm thi thật của người sáng lập").

## Các mục được sửa

Bốn mục của spec gốc được sửa cho khớp quyết định của người sáng lập; phần còn lại giữ nguyên.

| Mục | Spec gốc | Bản sửa |
| --- | --- | --- |
| 35. AI khi chạy | Không dùng AI khi chạy | Engine không phụ thuộc AI: mọi chức năng chạy đầy đủ khi không có AI. AI là lớp cắm thêm ở giai đoạn sau (ví dụ chấm Viết/Nói trong gói trả phí), qua một giao diện "người chấm" chung với máy chấm luật và tự chấm |
| 40. Động lực | Không thao túng | Game hoá kiểu Duolingo: năng lượng theo lượt, chuỗi ngày, giải đấu, XP theo hoạt động. Năng lượng trừ theo lượt chứ không theo lỗi, vì engine cố ý cho câu vừa đủ khó; chẩn đoán, ôn đến hạn, bài Can-Do, thi thử không tốn năng lượng |
| 42. Quyền riêng tư và tài khoản | Không cần tài khoản; mã hoá xuất/nhập | **Thay bởi 13/10/2026 mục 9** (tài khoản ngay, chơi trước đăng nhập sau). Demo web: lưu trên máy + mã đồng bộ hiện có, không tài khoản. Giai đoạn store: tài khoản cho mọi người dùng (đồng bộ, mua gói); vẫn tuân Nghị định 13/2023, đồng ý của cha mẹ với người dưới 16 tuổi, không bán dữ liệu |
| 43. Kinh doanh | Không quảng cáo, không gói trả phí; nghiên cứu B2B | **Thay bởi 13/10/2026 mục 10.** Thuê bao tháng/năm + quảng cáo ở bản miễn phí + giới hạn lượt bằng năng lượng. Demo chạy đủ cơ chế, chưa thu tiền. B2B (trường, trung tâm) là hướng phụ, để sau |

## Quyết định kỹ thuật (mục 50)

Mọi điểm còn mở đều đã có phương án, chạy được khi chưa có dữ liệu người dùng và nâng cấp được khi có. Các con số (ngưỡng, dung lượng năng lượng) là tham số cấu hình, chỉnh được mà không sửa code.

### 1. Mô hình dữ liệu (mục 50.1, 50.6, 50.7)

- **Goal** → **Target Model** có phiên bản (ví dụ `ielts-ac-6.5@1.0`) → danh sách nút cần đạt, mỗi nút kèm **mức cần** (1–5) và **loại yêu cầu** (nền tảng / kỹ năng / làm bài).
- **Nút năng lực**: dùng chung cho mọi mục tiêu. Mỗi nút có kỹ năng, cấp CEFR tham chiếu, thẻ ngữ cảnh (hằng ngày, công việc, du lịch, học thuật, thi).
- **Cạnh tiền đề**: loại *cứng* (phải đạt trước) hoặc *mềm* (giúp học nhanh hơn), độ mạnh 0–1. Mặc định do người soạn đặt (cứng = 1, mềm = 0,5); sau này hiệu chỉnh bằng tỉ lệ "học nút sau thành công khi chưa đạt nút trước".
- **Mục kiến thức** (từ, cụm, ngữ pháp, chức năng giao tiếp, âm) gắn vào nút. **Câu hỏi** gắn vào mục hoặc nút, kèm mức mastery nó đo, dạng câu, ngữ cảnh và xác suất đoán mò.
- Lưu dưới dạng JSON trong `content/engine/`, có schema trong `content/schema/`. CI kiểm: đồ thị không có vòng (sắp xếp tô-pô), mọi nút trong Target Model có đủ câu đo ở mức cần, mọi id tồn tại.
- Trạng thái người học: một nhánh mới trong bản lưu (`st.e`), có số phiên bản và hàm migrate riêng, giống cách `st.x` của phần ôn thi đang làm.

### 2. Mastery (mục 50.2)

Mỗi cặp (nút, mức) giữ một phân phối Beta(α, β). Mỗi lần trả lời cộng bằng chứng, có trừ phần đoán mò g (1/số phương án với trắc nghiệm, 0 với câu tự gõ) và nhầm tay s (mặc định 0,1):

```
đúng: α ← α + w·(1 − g)      sai: β ← β + w·(1 − s)      m = α / (α + β)
```

- w = 1, còn 0,5 khi cùng một câu lặp lại trong 24 giờ (tránh nhớ đáp án).
- Bằng chứng ở mức cao tính luôn cho các mức thấp hơn của cùng nút.
- **Đạt** khi m ≥ 0,8 và cận dưới khoảng tin cậy 80% ≥ 0,6.
- Không cần dữ liệu hiệu chỉnh để chạy. Khi một câu có ≥ 200 lượt trả lời, thay g bằng tham số IRT của câu (`src/exam/irt.ts`).

### 3. Confidence (mục 50.3)

| Mức | Điều kiện |
| --- | --- |
| Thấp | Dưới 3 lượt có trọng số, hoặc cận dưới < 0,5 |
| Vừa | Đạt ngưỡng Mastery, bằng chứng từ 1 dạng câu hoặc 1–2 ngữ cảnh |
| Cao | ≥ 2 dạng câu, ≥ 3 ngữ cảnh, độ lệch chuẩn ≤ 0,1 |

### 4. Mastery theo mục tiêu

Target Model ghi mức cần cho từng nút. Mặc định: nút phục vụ Đọc/Nghe cần tới mức 3 (nhớ ra); nút phục vụ Viết/Nói cần tới mức 4–5 (dùng có kiểm soát / tự do).

### 5. Decay và Memory Maintenance (mục 50.4)

- Mỗi mục kiến thức đã đạt có thẻ FSRS-5 (`src/exam/fsrs.ts`: `review`, `retrievability`).
- Nút vào hàng ôn khi khả năng nhớ trung bình của các mục của nó < 0,85.
- Ôn đạt → giữ Đạt. Ôn trượt 2 lần liền → nút mất Đạt, quay lại Learning Path.

### 6. Đường đi tối thiểu (mục 50.5)

1. Tập thiếu = nút trong Target Model chưa đạt mức cần, cộng mọi tiền đề cứng chưa đạt của chúng (đệ quy).
2. Sắp xếp tô-pô: chỉ nút đã đủ tiền đề cứng mới được mở.
3. Trong các nút đã mở, ưu tiên = số nút mục tiêu phụ thuộc vào nó (có trọng số độ mạnh cạnh) ÷ số phút ước tính để đạt.
4. Buổi học hằng ngày theo số phút: ôn đến hạn trước (tối đa 30% thời gian), rồi nút ưu tiên cao nhất; mỗi tuần ít nhất một bài làm thật (Can-Do).
5. Nhiều mục tiêu cùng lúc: gộp Target Model, lấy mức cần cao nhất của mỗi nút; mục tiêu có ngày thi gần hơn được nhân trọng số ưu tiên.

**Kiểm tra để bỏ qua**: khi lộ trình đưa vào một nút người học thấy đã biết, họ làm một bài kiểm tra ngắn ở mức cần; qua thì nút Đạt ngay. Lý do: 20 phút chẩn đoán không phủ hết vài trăm nút.

### 7. Chẩn đoán

> Từ v111: chẩn đoán đầu vào chạy trong vỏ "chương mở đầu" và đo thêm Nghe / Đọc. Xem "Mô hình học v111", mục 2.

1. **Nghe/Đọc**: bài kiểm tra thích ứng IRT sẵn có (`src/exam/placement.ts`). Kết quả đặt tiên nghiệm cho các nút theo cấp CEFR: nút dưới cấp ước tính Beta(3, 1), trên cấp Beta(1, 3).
2. **Dò đồ thị**: chọn nút có m gần 0,5 nhất và nhiều nút mục tiêu phụ thuộc nhất. Đạt → nâng tiên nghiệm các tiền đề cứng; trượt → dò xuống tiền đề (đây cũng là cách truy gốc rễ, mục 15).
3. Dừng ở 20 phút hoặc khi mọi nút "biên" đạt Confidence Vừa. Phần còn lại dò ngầm trong các buổi học sau.

### 8. Goal Readiness và Goal Achieved (mục 50.15)

> Từ v111: dòng CEFR dưới đây theo "Mô hình học v111", mục 4.

| Loại mục tiêu | Readiness | Achieved |
| --- | --- | --- |
| IELTS, VSTEP | Nghe/Đọc: xác suất band ≥ mục tiêu từ IRT ± sai số. Viết/Nói: từ máy chấm luật + tự chấm (mục 10). Tổng: mô phỏng 4 kỹ năng theo cách tính điểm của kỳ thi (`scales.ts`). Sẵn sàng khi xác suất ≥ 80% | Điểm thi thật đạt mục tiêu |
| CEFR (từ v111) | P(đậu) trên **trận cổng cuối khu** (đề sát hạch lạ) của cấp đó ≥ 80%, kèm khoảng sai số. Tỉ lệ nút Đạt và bài Can-Do chỉ là bản đồ chẩn đoán, không dùng để kết luận sẵn sàng | Trong app: qua trận cổng. Xác nhận ngoài (tuỳ chọn): đậu đề mẫu chính thức trong điều kiện thi, hoặc thi thật; Pre-A1 / A1 không có |
| Giao tiếp (tương lai) | Tỉ lệ nút cần đã Đạt với Confidence ≥ Vừa, cộng bài Can-Do đã qua | Mọi nút Đạt + mọi bài Can-Do qua + không trượt ôn trong 14 ngày |

### 9. CEFR ↔ IELTS ↔ VSTEP (mục 50.14)

Mỗi kỳ thi có Target Model riêng. Bảng quy đổi có nguồn trong `src/exam/scales.ts` (`bandToCefr`, `bandToVstep`, `vstepToBand`) chỉ dùng để đặt tiên nghiệm và để hiển thị tham khảo, không dùng để kết luận đạt.

### 10. Viết và Nói khi chưa có AI (mục 50.8)

- **Người chấm** là một giao diện chung: máy chấm luật, tự chấm, sau này AI. Mỗi lần chấm trả điểm từng tiêu chí kèm độ tin cậy.
- Luật: `vxWChecks` (độ dài, đoạn, từ nối, lỗi chắc chắn sai), `vxSpeechStats` (tốc độ, vốn từ), `perfEst` (ước tính cấp CEFR từ 5 đặc trưng), `vocabProfile`.
- Tự chấm theo bài mẫu có chú thích từng band; theo dõi độ lệch của người tự chấm so với điểm thật và trừ độ lệch đó.
- Readiness Viết/Nói được giới hạn ở Confidence Vừa cho tới khi có người chấm AI hoặc cặp điểm thật.

### 11. Kiếm tiền trong demo (mục 50.11)

> Thay bởi 13/10/2026 mục 10 (nạp rút ngắn cày nguyên liệu thô; tinh hoa chữ không mua được). Phần dưới giữ làm lịch sử.

- **Năng lượng theo lượt**: mỗi bài học mới hoặc luyện tập tốn năng lượng như nhau, đúng hay sai không đổi; hồi theo thời gian; hết thì dừng học mới. Không trừ theo lỗi vì engine cố ý cho câu vừa đủ khó (đúng 75–85%): 5 tim trừ theo lỗi sẽ hết sau 20–33 câu. Dung lượng, chi phí mỗi bài và tốc độ hồi là tham số cấu hình. **XP** tính theo hoạt động (số bài, số phút) như Duolingo, hiển thị tách khỏi Readiness.
- **Không tốn năng lượng**: ôn tập đến hạn, chẩn đoán, bài Can-Do, đề thi thử (để không làm sai phép đo).
- **Gói Super giả lập**: công tắc trong Cài đặt; bật thì không giới hạn năng lượng, không quảng cáo.
- **Quảng cáo giả lập**: ô quảng cáo ở màn kết quả bài học (bản miễn phí).
- Ghi số liệu trên máy: số lần hết năng lượng, số phút bị chặn, để đo ảnh hưởng lên việc học của người sáng lập.
- Tái dùng mẫu `st.money` từng có ở v16–v17 (xem `migrate()` trong `app.js`).

### 12. Tài khoản và đồng bộ (mục 50.12)

Demo: lưu trên máy + mã đồng bộ `ELK-…` hiện có. Giai đoạn store: Supabase Auth, chuyển dữ liệu từ mã đồng bộ sang tài khoản, thanh toán qua cửa hàng. Chọn cách đóng gói (TWA hay app gốc) ở M8.

### 13. Các điểm còn lại

- **Kho từ vựng** (mục 50.13): bắt đầu từ `content/wordlist.json` (9.345 mục, đã gắn cấp CEFR), bổ sung theo bảng phủ từng nút.
- **Chiến thuật làm bài** (mục 50.9): là nút kỹ năng riêng trong Target Model kỳ thi, không thay nút năng lực.
- **Quy mô MVP** (mục 50.10): đủ 4 nhóm mục tiêu theo quyết định của người sáng lập; lộ trình M1–M8 bên dưới.

## Tái dùng app hiện tại

Engine được xây thành mô-đun TypeScript mới `src/engine/`, nối với app qua giao diện Host giống `src/exam/host.ts`. Phần lớn nền móng đã có sẵn:

| Phần engine | Dùng lại | Vị trí |
| --- | --- | --- |
| Nút Can-Do CEFR | Danh sách "Tôi có thể…" theo cấp × kỹ năng, nhóm năng lực | `CANDO`, `skPass`, `skLv` trong `app.js` |
| Nút kỹ năng thi | 26 dạng câu IELTS/VSTEP, bài học, ~1.350 câu có giải thích | `content/exam/types/`, `content/exam/practice/` |
| Mục từ vựng | 9.345 từ đã gắn cấp CEFR | `content/wordlist.json` |
| Bài học nền A1–C2 | Từ vựng, ngữ pháp, chức năng, đọc, nghe | `app.js`, `data/lv-*.json` |
| Chẩn đoán Nghe/Đọc | IRT 3PL thích ứng, 96 câu | `src/exam/irt.ts`, `src/exam/placement.ts` |
| Decay | FSRS-5 | `src/exam/fsrs.ts`, `src/exam/notebook.ts` |
| Kế hoạch theo ngày thi | Giờ cần theo band (Cambridge GLH), cảnh báo không kịp | `src/exam/plan.ts` (`hoursAt`, `makePlan`) |
| Quy đổi điểm | IELTS, VSTEP, CEFR có nguồn | `src/exam/scales.ts` |
| Chấm Viết/Nói bằng luật | Độ dài, từ nối, lỗi, tốc độ nói, cấp CEFR | `vxWChecks`, `vxSpeechStats`, `perfEst`, `vocabProfile` trong `app.js` |
| Bài làm thật (Can-Do) | 7 đề thi thử, thi thử Viết/Nói VSTEP, 24 hội thoại mở, nhắc lại câu | `src/exam/mock.ts`, `app.js` |
| Kiểm nội dung | Schema, đáp án, phép thử "không có bài" chống đoán mò | `tools/content-check.ts`, `content/AUTHORING.md` |
| Thống kê câu, cặp điểm thật | Độ khó thật, độ chính xác ước tính | `src/exam/net.ts`, bảng `el_resp`, `el_pair` trên Supabase |
| Game hoá | Chuỗi ngày, XP, giải đấu tuần, linh vật | `app.js`, bảng `el_league` |
| Đồng bộ | Mã `ELK-…`, sao lưu | `syncRpc`, `syncNow` trong `app.js` |

Cái cần viết mới: đồ thị + Target Model, trạng thái mastery/confidence, dò đồ thị, Learning Path, Readiness, năng lượng/Super/quảng cáo giả lập, và nội dung cho các nút còn thiếu.

## Lộ trình xây

Tám mốc theo thứ tự phụ thuộc, không hạn ngày; mỗi mốc chỉ xong khi đạt tiêu chí.

**Giai đoạn demo web (chưa thu tiền)**

| Mốc | Tiêu chí xong |
| --- | --- |
| M1 · Mô hình nội dung | Schema + đồ thị từ nội dung sẵn có; CI báo 0 vòng lặp, 0 id lạc |
| M2 · Trạng thái người học | Mastery + Confidence + FSRS chạy; bản lưu cũ migrate không mất dữ liệu |
| M3 · Chẩn đoán dò theo đồ thị | Xong trong 20 phút; mọi nút biên của mục tiêu đạt Confidence Vừa |
| M4 · Learning Path + Memory Maintenance | Màn "Bước tiếp theo" tự xếp buổi học; nút đã đạt chuyển sang ôn duy trì |
| M5 · Bài Can-Do + Goal Readiness | Readiness cho đủ 4 nhóm mục tiêu, kèm khoảng tin cậy |
| M6 · Lấp nội dung | Mọi nút của mọi Target Model có đủ câu đo ở mức cần, qua phép thử đoán mò |
| M7 · Kiếm tiền giả lập | Năng lượng theo lượt, Super, quảng cáo giả chạy; số phút bị chặn được ghi lại |

**Cổng: điểm thi thật của người sáng lập đạt mục tiêu**

**Giai đoạn store**

| Mốc | Tiêu chí xong |
| --- | --- |
| M8 · Lên store | Tài khoản cho mọi người, thanh toán thật, Google Play |

Từ M4, người sáng lập học hằng ngày bằng engine; những chỗ vướng khi học quyết định thứ tự lấp nội dung ở M6.

## Giới hạn thực tế

Bảy điều engine không làm được trong giai đoạn demo, ghi thẳng để không ai hiểu sai.

1. **Demo kiểm chứng trải nghiệm, chưa kiểm chứng độ chính xác.** Với một người dùng, mọi tham số (độ mạnh tiền đề, ngưỡng mastery, độ khó câu) là giả định của người soạn; chỉ hiệu chỉnh được khi có nhiều người dùng.
2. **Điểm thi của người sáng lập chứng minh người sáng lập học được, không chứng minh engine đúng.** Cỡ mẫu là 1, và việc duyệt nội dung hằng ngày cũng là học. Dùng được làm câu chuyện, không dùng làm bằng chứng độ chính xác.
3. **Trước khi có AI, engine không tự tuyên bố sẵn sàng cho Viết/Nói mức cao.** Luật biết người học *có dùng* một từ hay cấu trúc, không biết dùng *đúng và tự nhiên*; mức 5 (dùng tự do) chỉ đạt Confidence Vừa.
4. **Nội dung quyết định thời gian, không phải code.** Ước tính thô 10.000–20.000 câu cho 4 nhóm mục tiêu (hiện ~1.350 câu ôn thi); câu AI viết cần 2–3 vòng soát chống đoán mò (`content/AUTHORING.md`). M6 là mốc dài nhất.
5. **Ở sát ngưỡng, một lần thi là phép đo nhiễu (v111).** Đậu hay rớt khi năng lực ngay ngưỡng gần như ngẫu nhiên. Vì vậy "sẵn sàng" là xác suất đậu cao (≥ 80%), không phải "đã đậu một lần", và một lần rớt sát ngưỡng không có nghĩa app sai.
6. **Thi đậu vẫn có thể là học tủ theo dạng đề (v111).** Đề sát hạch chỉ chặn được học tủ *câu*; học tủ *dạng đề* thì giảm bằng cách xoay nhiều dạng câu và ngữ cảnh. Đề mẫu chính thức và thi thật vẫn là trọng tài cuối.
7. **Pre-A1 / A1 không có neo ngoài (v111), và đề sát hạch tốn nội dung.** Cambridge không có bài cho người lớn ở cấp này nên kết luận A1 chỉ dựa vào đề của app. Mỗi cấp cần vài đề song song, câu mới, qua phép thử đoán mò; đây là phần việc lớn của M6.

## Rủi ro đã ghi nhận

Các rủi ro dưới đây được theo dõi trong lúc xây, không dùng để đổi hướng đã chốt.

| Rủi ro | Dấu hiệu theo dõi | Cách giảm |
| --- | --- | --- |
| Khối lượng nội dung cho 4 nhóm mục tiêu rất lớn | Bảng phủ: số nút chưa đủ câu đo ở mức cần | Nút dùng chung giữa các mục tiêu; lấp theo thứ tự Learning Path của người sáng lập |
| Đợi engine làm lùi ngày học, ngày thi và doanh thu | Thời gian từ nay tới khi M4 chạy | Xây M1–M4 trước, nội dung chỉ đủ cho mục tiêu của người sáng lập rồi mới mở rộng |
| Độ mạnh tiền đề do người soạn đoán | Người học trượt nút sau dù đã đạt nút trước | Hiệu chỉnh từ dữ liệu khi có; ghi lại lý do mỗi lần sửa |
| Readiness Viết/Nói kém tin cậy khi chưa có AI | Chênh lệch tự chấm với điểm thật | Giới hạn Confidence ở Vừa; nói rõ trên màn hình |
| Năng lượng làm chậm việc học của chính người sáng lập | Số lần hết năng lượng, số phút bị chặn mỗi tuần | Công tắc Super giả lập; điều chỉnh dung lượng và tốc độ hồi |
| XP theo hoạt động kéo người học đi cày XP thay vì lấp khoảng thiếu | Tỉ lệ phút học ngoài Learning Path | Nút chính luôn là "Bước tiếp theo"; Readiness hiển thị ngang hàng XP |
| Điểm trong app của người sáng lập bị thổi phồng vì đã duyệt nội dung | Điểm app cao hơn đề ngoài | Đo mốc bằng đề ngoài chưa từng xem trước khi đăng ký thi thật |
| `app.js` lớn (3,8 MB) làm chậm máy yếu | Thời gian mở app trên Android rẻ | Engine viết thành mô-đun riêng, nội dung tải theo nút |

## Lộ trình v2.4 (từ 08/10/2026)

Mỗi mốc một PR, chấm lại 200 + 400 tiêu chí sau mỗi mốc.

| Bản | Mốc | Tiêu chí xong |
| --- | --- | --- |
| v52 | Chốt hướng: chỉ CEFR + Pre-A1 | Mục tiêu ngoài CEFR ở trạng thái tương lai, tab Ôn thi ẩn; mục tiêu Pre-A1; bài Pre-A1 là bằng chứng |
| v53 | Evidence L0–L4 | Observation, Evidence Evaluator, Ledger theo giá trị, Aggregate bảo toàn thông tin, Beta là trạng thái dẫn xuất tính lại được |
| v54 | Decision Snapshot | Quyết định quan trọng có snapshot, tái tạo được; màn "Vì sao?" |
| v55 | Mastery v3 | Phân vị Beta chính xác, giảm theo thời gian, trạng thái nút, model disagreement, misconception |
| v56 | Mô phỏng learner | 10 Scenario + 20 Meta-Test chạy tự động; báo cáo calibration, FP/FN |
| v57 | Knowledge/Graph | Universal Language Core, rationale/version cạnh, tiền đề thay thế, kiểm orphan/unreachable |
| v58 | Chẩn đoán liên tục | 5 chế độ, giá trị thông tin ÷ nỗ lực, truy gốc theo cạnh |
| v59 | Gap + NBA | 8 loại gap, utility §57, luật retention §58 |
| v60 | Transfer | Câu/ngữ cảnh mới, thất bại transfer → disagreement |
| v61 | Micro-learning | Chính sách ngắt §53, giải thích → luyện → kiểm lại → về game |
| v62 | Game Ladder Quest | Game Challenge Model, học ẩn trong game, tách kỹ năng game khỏi ngôn ngữ |
| v63 | Đo hiệu quả + chấm lại | Bộ câu giữ riêng đo trước / sau / trễ 7 và 30 ngày, nhãn A/B khi đồng ý; `npm run score` chấm lại 200 + 400 tiêu chí từ dữ liệu có test chứng minh (`docs/SCORE.md`) |
| v64 | Goal-first + Ladder Quest là màn chính | Bài dò ngắn → mục tiêu CEFR tự đặt (đổi được); mọi lối vào đều có mục tiêu; tab Chơi là màn mặc định |
| v65 | Lỗ hổng → cách sửa | remedy.ts quyết định câu theo loại lỗ hổng; nguy cơ quên từ FSRS; cờ trong game; Đạt CEFR đòi transfer (có miễn) |
| v66 | Chất lượng bằng chứng (m3.2) | Độ khó câu, ≥ 2 câu khác nhau, câu trùng nội dung, mệt; kiểm toán trôi model, ước lượng slip/guess, độ nhạy trọng số |
| v67 | Mô hình nội dung | Bản đồ câu → nút (28.114 câu, 0 mồ côi), phiên bản từng câu, nút âm vị + chức năng giao tiếp, tiền đề thay thế, Readiness theo mô hình dữ liệu |
| v68 | Chấm lại | `npm run score` trên dữ liệu chấm mới (`docs/SCORE.md`) |
| v69 | Bot người học L01 (người mới hoàn toàn) | `tools/learners/l01.ts` chơi app qua giao diện 44 ngày mô phỏng; luật m3.3 (nhớ lại cách quãng gỡ kẹt xác minh, Claim chỉ thành Đạt bằng bằng chứng thật), ôn từ sổ bằng chứng, tháp giãn cách + dạy trước + câu thử sau trại, chẩn đoán trừ đoán mò; báo cáo `reports/learners/L01/REPORT.md` |
| v70 | Bot người học L02 (người học yếu) | Lõi bot chung (`tools/learners/core.ts`); lỗ hổng từ bằng chứng (hiểu sai theo mẫu lỗi, thuộc câu → transfer, chưa có bằng chứng → hỏi thử), bí kíp nhắm đúng hiểu sai trong tháp, leo thang khi can thiệp chưa hiệu quả, ôn phần đang học, bớt dò khi sai nhiều, điểm nghẽn trên tháp, nghe phân biệt âm trong tháp; báo cáo `reports/learners/L02/REPORT.md` |
| v71 | Bot người học L03 (người học trung bình) | Mục tiêu người học chọn đứng đầu (mục tiêu tự đặt giữ làm bậc đệm); bài dò tìm trần nhận ra và dò tiếp khi còn đang lên cấp; Claim kiểm ở đúng mức đã suy ra, xác nhận xong từng phần; khám phá theo độ phủ vùng kỹ năng (nghe); điểm nghẽn = yếu × quan trọng, ưu tiên trong tầng; người học đúng ≥ 85% → hỏi thẳng mức cần, nới lượt/nút/ngày; không lùi về câu mức thấp đã Đạt; báo lên cấp cuối tầng; báo cáo `reports/learners/L03/REPORT.md` |
| v72 | Sảnh Chơi + Xếp Khối Chữ | Sảnh "Chơi" nhiều game (tháp thành "Leo nhanh"); Xếp Khối Chữ: bàn 8 × 8, mỗi bộ khối có sau một câu do engine chọn (ưu tiên rương ôn), đúng thì thêm bom / sét, sai vẫn nhận khối, cứu bàn 2 lần để ván không ngắn lại; hình khối theo seed độc lập với câu (P14); điểm / kỷ lục / chuỗi ngày là telemetry `e.bk`; âm thanh WebAudio tự tạo; test chặn tên thương hiệu game khác trong tệp phát hành |
| v73 | Bàn Cờ Phố | Bàn vòng 16 ô (Nhà, ô cảnh, 4 lô đất), 8 lượt tung / lần chơi; xúc xắc chỉ quyết định loại cảnh, nội dung do bộ chọn chung `picker` (tách từ `planFloor`, thứ tự NBA giữ nguyên dù đi đường nào); xây / nâng nhà bằng xu (ví = xu kiếm được − xu đã tiêu), đi qua nhà mình / về Nhà được thêm xu, không bao giờ trừ xu; telemetry `e.bd`; bot luân phiên 3 game |
| v74 | Bài Câu (F3 ngữ pháp) | Lá bài = từ của câu ngữ pháp do engine chọn (`picker`, nút g:, `app.js eOrder`: câu sắp xếp / câu tự gõ đã điền / câu sửa đúng + lá bẫy từ đáp án sai hay gặp); tự dựng câu = bằng chứng mức 3 (g = 0); 3 bàn × 3 lượt, chip × nhân, bùa chọn sau mỗi bàn; thua bàn không kết thúc ván; telemetry `e.gc` |
| v75 | Quán Cà Phê (F5 nghe + F7 giao tiếp) | 6 khách / ca; câu của nút fn: (`app.js eFn`): nghe khách nói bằng giọng máy → chọn nghĩa (mức 2), tình huống + văn phong → chọn câu đáp (mức 3), luôn 4 lựa chọn; sao + đồ trang trí quán; telemetry `e.gq` |
| v76 | Bắt Âm (F4 phát âm) | Nghe một từ của cặp âm, chạm đúng 1 trong 3 bong bóng (đoán mò 1/3); câu nghe phân biệt âm dùng chung đổi từ 2 → 3 lựa chọn; không hết giờ, bong bóng đứng yên khi chạm; sai thì nghe lại hai từ của cặp + mẹo khẩu hình; telemetry `e.gs`; sảnh Chơi nhóm theo mục đích học |
| v77 | Câu đố ngày (F10 ôn tập + F2) | 16 ô từ của 4 cụm (u:) do engine chọn (ôn → đang học → lộ trình), mỗi cụm một họ chủ đề khác (`puzzle.ts family`); ghép nhóm không vào năng lực; sau mỗi nhóm nhớ lại một từ khác của cụm (tự gõ mức 3 nếu đã học, chọn trong 4 mức 2 nếu mới); không giới hạn lượt nộp; câu đố mỗi ngày + ván luyện thêm; telemetry `e.gd` |
| v78 | Thám tử (F6 đọc + F11) | Một bài đọc đúng cấp đang học (`app.js eTexts`: văn bản đời thường, bài dài, bài của unit), chưa làm trước, bài của unit đã học trước; mỗi câu hỏi là một manh mối (3 lựa chọn), câu ý chính là kết luận; sai thì tô sáng câu chứa đáp án + vì sao + thử lại không tính điểm; chạm từ để xem nghĩa; điểm lưu như tab Đọc (Can-Do); telemetry `e.gt` |
| v79 | Đài phát thanh (F5 nghe đoạn) | Cùng lõi với Thám tử nhưng nghe cả bài bằng giọng máy (hai giọng), lời ẩn tới cuối, nghe lại / chậm không giới hạn; điểm lưu như tab Nghe (Can-Do); máy không có giọng thì ẩn game; telemetry `e.gr` |
| v80 | Bắt Âm: vòng nói thử (F4) | Sau mỗi từ có nút "Nói thử" (máy nghe giọng của app, `asrBox`): máy nghe ra đúng từ hay từ kia của cặp âm; đúng +5 điểm (telemetry, không vào năng lực); máy không nghe được giọng thì ẩn |
| v81 | Karaoke hội thoại (F8 nói) | Hội thoại đúng cấp đang học (chưa đóng vai, có chức năng đang học); người học nói vai B, máy đọc vai A; máy nghe khớp từ hoặc tự chấm; kết quả lưu như màn Đóng vai (Can-Do nói); không ghi bằng chứng vào nút; telemetry `e.gk` |
| v82 | Xưởng sửa câu (F3 + F9) | Câu sai hay gặp (`fx`) của điểm ngữ pháp do engine chọn; tự gõ lại câu đúng = bằng chứng mức 4 (g = 0); sai thì tô từ cần sửa + vì sao; 6 đơn / ca; telemetry `e.gw` |
| v83 | Thư gửi cư dân phố (F9 viết đoạn) | Đề viết (`WTASKS`) đúng cấp đang học, chưa viết trước; máy kiểm thư `writeChecks` + lỗi hay gặp; cư dân hồi âm (đạt như màn Viết theo đề → quà, thiếu → hỏi lại đúng mục); tự chấm 4 tiêu chí; lưu như màn Viết theo đề (Can-Do viết); telemetry `e.gl` |
| v84 | Ra lệnh cho robot (F8 nói + F2) | Lưới 5 × 5, đồ vật là hình của từ thuộc cụm do engine chọn; lệnh tiếng Anh nói (máy nghe tự do) hoặc gõ; robot chỉ nhặt khi gọi đúng tên; không vào mức thuộc; telemetry `e.gb` |
| v85 | Tốc độ 60 giây / Ghép cặp | Nguồn từ: đến hạn ôn trước, rồi từ mới học (thay cho ngẫu nhiên); ghép nhầm giải thích nghĩa cả hai từ |
| v86 | Thám hiểm sương mù (F1 xếp lớp) | Bài chẩn đoán dạng bản đồ 4 × 4: người chơi chọn đường Từ vựng / Ngữ pháp, engine chọn điểm dò; ô mở dù đúng hay sai (không thưởng câu đúng); một đường đủ nửa thì khoá; kết quả = màn chẩn đoán; 7 ngày một lần; telemetry `e.gf`. Từ v86 app chỉ tập trung CEFR: game luyện thi (F12) bỏ khỏi kế hoạch |
| v87 | Vườn từ (F2 từ mới) | Từ mới của cụm do engine chọn: hạt (thẻ dạy trước: hình, IPA, âm, câu ví dụ) → mầm (nhận ra, mức 1) → cây (nhớ ngược, mức 2) → hoa (tự gõ, mức 3); một bậc / ngày; sai giữ bậc + xem lại thẻ; bậc cây trong `e.gv` |
| v88 | Bộ não chọn game (director) | Sảnh không còn bắt người học tự chọn trong 15 game: `director.ts` đọc nhu cầu học lúc này (chưa xếp lớp, cây đến ngày tưới, phần sắp quên, loại nút đầu lộ trình NBA, điểm nghẽn, Can-Do kỹ năng còn thiếu, máy có giọng đọc / máy nghe) → một nút "▶ Chơi tiếp" kèm lý do + lộ trình 3 chặng / ngày (mỗi chặng một nhu cầu, tối đa một chặng kỹ năng); đổi dạng sau mỗi game; màn kết mọi game có "▶ Tiếp"; danh sách game thu gọn trong "Tất cả trò chơi"; snapshot `dir` cho Vì sao?; trạng thái `e.gp` |
| v89 | Trục trải nghiệm T + Phố chung | `docs/GAME-CRITERIA.md` §8–§9 (đối chiếu spec ở §9.0): trục T tách khỏi trục học, phục vụ North Star, không tối ưu thời gian trong app; `play.ts` đo theo game: bỏ giữa, chơi tiếp sau ván (Persistence C336), câu bằng chứng / phút (C341, C360), giây tới thao tác đầu, thời lượng (tier 0, chỉ ở máy, `st.e.pm`); `town.ts` Phố chung 15 công trình × 4 ★ suy ra từ bản lưu từng game (không thêm dữ liệu), màn kết báo Phố mới + mốc gần nhất; Tí dẫn đường; âm Leo tháp; Tốc độ 60 giây / Ghép cặp thu vào Trò nhanh (cũ) |
| v90 | Quyết định là hành động tiếng Anh (đợt 2 phần 1) | Quán: khách phản ứng theo loại câu đáp (đúng việc + văn phong / lệch văn phong / sai việc), tiền boa theo văn phong hợp (`eFn` thêm `react`, `regs`; đúng / sai vẫn theo đáp án); Xưởng: chạm chỗ hỏng trước khi gõ (dãy con chung dài nhất; chạm sai → câu gõ sau là có gợi ý) |
| v91 | Xu chung có chỗ tiêu | Trang trí Phố (4 món / công trình, mở theo ★, `st.e.tw`), hồi tim Leo tháp bằng 25 xu một lần mỗi tầng; ví = xu kiếm − xu Bàn Cờ − xu Phố; màu `--bad` đạt WCAG AA trên nền báo sai |
| v92 | Game tiếp nhận / trình diễn nâng bằng trình bày | Thám tử / Đài: bảng manh mối (câu đúng ghim đáp án, câu kết luận ghép từ các mảnh), biên bản vụ án / ghi chép bản tin ở màn kết; Karaoke: màn biểu diễn (mức máy nghe ra từng câu, câu hay nhất, câu nên luyện lại, nghe mẫu); chặng đã xong của lộ trình đạt WCAG AA |
| v93 | Game chủ lực Vòng Chữ (GAME-CRITERIA §10.5) | Vuốt chữ thành từ trên canvas toàn màn hình (lớp phủ ngoài #app, 60 fps, vuốt / bàn phím / ô gõ, âm theo chữ, nhạc nền tắt được, hướng dẫn lần đầu); màn dựng từ cụm u: do bộ chọn chung đưa ra + kho 6.343 từ đơn của app (`host.lexicon`); bằng chứng mức 2 chỉ ở ô của cụm engine chọn (gợi ý → có trợ giúp / sai); đường cong độ khó theo màn, 6 chương; thử thách ngày + chia sẻ; bộ não chọn game ưu tiên cho ôn từ; Phố có công trình mới; `st.e.gh`; bot `playWheel` |
| v94 | Vòng Chữ: chiều sâu, sưu tập, phong cảnh | Combo nhân xu, ô vàng (ưu tiên ô của cụm engine chọn), hũ từ thưởng đổi gợi ý miễn phí; sổ từ theo chương (chạm để nghe); phong cảnh canvas động cho 6 chương; chuỗi ngày thử thách ngày; `st.e.gh.book / jar / free / daily.streak` |
| v95 | Game chủ lực thứ hai Mỏ Chữ (GAME-CRITERIA §10.7) | Lưới chữ 6 × 7 canvas toàn màn hình, vuốt ô kề nhau (cả chéo) thành từ; ô vỡ, chữ rơi, lấp từ trên; nhiệm vụ = từ của cụm u: do bộ chọn chung đưa ra, luôn có đường (gieo lại khi bị phá); giới hạn lượt (không đồng hồ), từ sai không tốn lượt; đá quý vỡ hàng, ô vàng, chuỗi; bằng chứng mức 2 chỉ ở nhiệm vụ của cụm; mỏ hôm nay + chuỗi ngày + chia sẻ; `st.e.gn`; bot `playHunt` |
| v96 | Mỏ Chữ: mục tiêu kiểu ghép 3, màn mốc, sổ từ chung (GAME-CRITERIA §10.8) | Mục tiêu theo màn: tìm từ / phá băng / đưa rương xuống đáy (từ màn 4); màn mốc 10, 20… có băng hình vẽ tay; thắng = đủ từ nhiệm vụ + xong mục tiêu, gợi ý chuyển sang từ ngắn có trên lưới nên không kẹt; mục tiêu cũng ở DOM cho trình đọc màn hình; từ nhiệm vụ vào sổ từ chung (chương ⛏️ Mỏ Chữ); bộ não xen kẽ hai game chủ lực theo game chơi gần nhất (`flag`), kể cả trong lộ trình ngày; băng / rương không ghi bằng chứng |
| v97 | Bài Câu bản chủ lực toàn màn hình (GAME-CRITERIA §10.9) | Lớp phủ ngoài #app: bàn nỉ canvas + lá bài là nút DOM di chuyển bằng transform (không vẽ lại #app); kéo thả chèn đúng chỗ / kéo ra để bỏ, chạm và bàn phím vẫn dùng được; câu đúng tự chuyển lượt (1,3 s), câu sai dừng hiện câu đúng; thẻ lớn ở sảnh; luật, bằng chứng mức 3 order giữ nguyên |
| v98 | Cân độ khó bằng mô phỏng + sự kiện tuần (GAME-CRITERIA §10.10) | `tools/sim/levels.ts` chơi Mỏ Chữ bằng hàm thật; tìm ra rương kẹt hàng sát đáy (màn không giải được) → `findPathVia` / `keepGoalReachable` bảo đảm nước đi cho mục tiêu, `goalWord` chọn từ tốt nhất, `sawtooth` nhịp răng cưa mỗi chương; rương 3–35 % → 50–87 %; test khoá dải tỉ lệ thắng; sự kiện tuần 4 chủ đề xoay vòng, 3 mốc xu + huy hiệu (`st.e.wk`, không ghi bằng chứng) |
| v99 | Sảnh tập trung game chủ lực (GAME-CRITERIA §10.11) | Lộ trình → ⭐ 3 game chủ lực → sự kiện tuần → 📚 Luyện tập theo kỹ năng (thu gọn, 13 game cũ) → Phố → 🏰 Leo tháp (thu gọn); không xoá game nào |
| v100 | Gói chơi thử + sửa CI / hồi quy (GAME-CRITERIA §10.12) | `docs/PLAYTEST.md` + `?playtest=1` nhảy màn Mỏ Chữ; lớp phủ Bài Câu đồng bộ DOM ngay sau thao tác (Safari), vị trí thả lấy từ pointerup; mục thu gọn giữ trạng thái mở qua render; sửa hồi quy v99 (mất lối vào Lộ trình hôm nay ở sảnh); bot L01: 72 % lượt chơi ở game chủ lực |
| v101 | Cốt truyện "Phố Chữ mất tiếng" nối 3 game (GAME-CRITERIA §10.13) | Mở đầu + 3 khu × 4 chương; nhiệm vụ đào chữ (Mỏ Chữ) / thắp đèn (Vòng Chữ) / trả câu nói (Bài Câu) hiện ở thẻ sảnh và phụ đề game; cảnh truyện tiếng Anh A1 có dịch + nghe; chương cuối khu cần 2 / 5 / 9 kỹ năng vững thật; `st.e.sy`; không ghi bằng chứng |
| v102 | Sân khấu dùng chung cho 14 game kỹ năng (GAME-CRITERIA §10.14) | `EM.stage()` + `stagefx.ts`: khi game kỹ năng chạy ở route game thì ẩn khung app, cảnh động canvas theo game, thanh ✕ (`stexit`) + tên game, nội dung trên thẻ nền đặc; phản hồi đúng / sai có hạt, âm, nảy / rung; không đổi luật / bằng chứng |
| v103 | Nối truyện vào game kỹ năng (GAME-CRITERIA §10.15) | Cư dân của chương là người nhờ viết ở Thư và khách đầu ca ở Quán; việc phụ trên thẻ truyện +10 xu mỗi việc mỗi chương; không bắt buộc, không ghi bằng chứng (`st.e.sy.side`) |
| v104 | Bắt Âm bản toàn màn hình (GAME-CRITERIA §10.16) | `bubblefx.ts`: cảnh dưới nước, bong bóng chữ là nút thật (vùng chạm đứng yên, hình nhấp nhô bằng CSS), đúng nổ + tự sang từ kế, sai xẹp + nghe lại cặp; luật / bằng chứng giữ nguyên |
| v105–v106 | Cảnh sống cho Vườn từ và Quán (GAME-CRITERIA §10.17) | Sân khấu có cảnh 1/3 trên: chậu cây lớn theo bậc nhớ, bình tưới khi đúng; quán có khách bước vào, nét mặt theo câu trả lời, cư dân truyện có khuôn mặt + bảng tên; thẻ câu hỏi giữ nguyên; `--good` sáng #127050 (đạt AA) |
| v106 (sửa) | Nút ▶ Chơi khi mạng chậm | Bài học A2–C2 chưa tải xong thì nút ▶ Chơi bị giữ chờ ("Đang tải thêm bài học…") dù sảnh game không dùng tới, vẽ lại giữa chừng thì mất cú bấm (CI Safari iOS bắt được). `quest` vào `DETAIL_SAFE_ACT`; test hồi quy treo `data/lv-*.json` |
| v106 (sửa) | Thư: cụm gợi ý tràn ngang | Cụm gợi ý dài (đề thiệp mời, 409 px) không xuống dòng làm trang trượt ngang trên điện thoại và che nút Gửi thư (CI Android bắt được, 3/20 lần). `.ltphr .pill` xuống dòng trong khung; test hồi quy ở 390px |
| v107 | Cảnh sống cho 7 game kỹ năng còn lại (GAME-CRITERIA §10.18) | `scenefx.ts`: Xưởng (băng chuyền), Thư (bàn viết + cư dân), Thám tử (bảng manh mối), Đài (máy thu, sóng rõ dần), Karaoke (sân khấu, đèn rọi), Robot (pin món đã lấy), Leo tháp (người leo bậc, tim); chỉ trình bày, đọc trạng thái lượt; Karaoke dòng kế bỏ mờ (WCAG AA) |
| v108 | Hiệu ứng trên bàn chơi có sẵn (GAME-CRITERIA §10.19) | `#stagepop`: hạt nổ vẽ trên thẻ (trước đây sau thẻ đặc nên không thấy), không chặn chạm; `stageBurst`: Xếp Khối nổ hàng, Câu đố giải nhóm, Thám hiểm mở ô, Bàn Cờ xúc xắc xoay / xây nhà |
| v109 | Trò nhanh cũ lên sân khấu + bảng chấm lại (GAME-CRITERIA §10.20) | `EM.stageApp`: Tốc độ 60 giây, Ghép cặp, Thách đấu toàn màn, ✕ = thoát trò (xác nhận khi đang chơi), điểm tăng → nảy + hạt; mọi game đã qua ít nhất một đợt nâng; bảng chấm 17 game + phản biện: bước tiếp theo là làm lại cơ chế theo số liệu chơi thật, không dàn trải |
| v110 | Mục tiêu + tiến độ lên sảnh và màn kết (mục "Hợp đồng hiển thị tiến độ") | `goalbar.ts`: thẻ 🎯 Mục tiêu đầu sảnh (kỹ năng vững thật / suy ra, +7 ngày, 3 năng lực gần đạt nhất, phần sắp quên; chạm → trang mục tiêu); dòng 🎯 ở màn kết mọi game qua `endExtras`, và ở lớp phủ Vòng Chữ / Mỏ Chữ / Bài Câu; "vững thêm" chỉ tính khi Đạt đúng mức mục tiêu cần, mức thấp hơn báo "tiến một bậc" (trước đây Vườn báo "Lên cấp" ở mức 2 trong khi mục tiêu cần mức 3); chip Sẵn sàng CEFR bỏ phần trăm (§XVII); không đổi luật chơi, bằng chứng, bộ não chọn game |
| v111 | Chốt thước đo đạt mục tiêu + game hoá mọi chức năng (chỉ sửa spec) | Bộ tiêu chí 71 mục theo spec mới: `docs/SCORECARD-v111.md` (chung 4,9 / 10; sau v114: 6,6; sau v115–v116: 6,7); Quyết định người sáng lập "đậu đề lạ, không học tủ"; mục "Đề sát hạch và chống học tủ"; §8 dòng CEFR viết lại; hợp đồng hiển thị điểm 4 (bản đồ ≠ phán quyết); Giới hạn thực tế 5–7 |
| v111b | Thắng nhanh theo bộ tiêu chí | Đèn báo học tủ (`rote.ts`: chênh câu đã gặp / câu lạ ≥ 25 điểm và ≥ 2 sai số; đưa phần đó lên lượt trùm tháp và bộ não chọn game); chặn chữ thi / kiểm tra trên màn chơi bằng test; bộ não: nhu cầu kỹ năng 56 + 20·hụt, từ A2 được 2 chặng kỹ năng; "⬆ Lên cấp" chỉ khi đạt đúng mức mục tiêu; nhắc sao lưu sau ván đầu (bỏ khi đã đồng bộ); hạn chót → phút mỗi ngày trên thẻ 🎯 |
| v112 | Đầu vào bằng game | Chương mở đầu "Sương Câm" thay màn bài dò (thắp đèn = phần dò); đèn Nghe + Đọc dùng bộ xếp lớp thích ứng của phần ôn thi (`LrApi`, engine tự vẽ, không đồng hồ); kết quả theo kỹ năng; Tí hỏi "đi xa tới đâu" (giữ / xa hơn / tự chọn, snapshot `goal:STORY`) |
| v113 | Trận cổng A1 + A2 | `content/exam/gate` (mode `gate`, gói riêng): 2 đề mỗi cấp, Đọc + Nghe (âm thanh Kokoro), soạn theo đặc tả công khai A2 Key (rút gọn); `gate.ts`: P(qua) từ IRT ± sai số, qua khi ≥ 80%, mở khi ≥ 70% kỹ năng vững, đề đã mở không dùng lại; Đạt trong app = qua cổng; thẻ 🎯 có thang khu + trạng thái cổng; "🎓 Chứng chỉ" tuỳ chọn ở trang mục tiêu (ghi điểm ngoài kèm dự đoán của app). Câu cổng do AI soạn, **cần người sáng lập soát** |
| v114 | Kho báu ẩn | Bộ đo hiệu quả 12 câu (v63) thành "🎁 Kho báu ẩn" ở sảnh khi tới hạn; không hiện đúng / sai; xu theo số rương mở |
| v115 | Soát đề cổng + khu truyện cuối = trận cổng | Phép thử không có bài 3 vòng cho 86 câu cổng (`content/exam/gate/README.md`: Đọc 69% → 49%, Nghe 69% → 14%; ngưỡng 55%), xếp vị trí đáp án ngẫu nhiên cân bằng, câu nghe nhắc cả 3 phương án; chương cuối truyện (Rừng Trúc) cần qua trận cổng của đích; tab học kiểu cũ bỏ chữ "bài kiểm tra / thi vượt"; đo bot theo bộ não (game chủ lực 41–65%, trước 72%). Câu cổng vẫn cần người sáng lập soát |
| v116 | Trận cổng B1 | `content/exam/gate/b1-1.json`, `b1-2.json`: 2 đề × 24 câu (Đọc: thông báo, bài dài có ý / thái độ, điền từ; Nghe: đoạn ngắn + phỏng vấn), soạn theo đặc tả công khai B1 Preliminary (rút gọn), âm thanh Kokoro; ngưỡng band 3,75 (B1 từ band 4); phép thử không có bài 2 vòng: Đọc 82% → 28%, Nghe 78% → 31%. Đích B1 giờ đạt bằng trận cổng; chương cuối truyện với đích B1 cũng là trận cổng. Câu cổng do AI soạn, **cần người sáng lập soát** |
| v117 | Rõ ràng: màn đầu một việc, 4 tab | Bảng chấm thêm nhóm L (8 tiêu chí). Sảnh: "▶ Chơi tiếp" lên đầu, thành nút đặc màu nhấn (nút chính duy nhất); thẻ Mục tiêu bản gọn một dòng (`viewGoalSlim`), bản đầy đủ lên đầu trang mục tiêu; Kho báu ẩn thành dòng phụ; truyện, game chủ lực, game kỹ năng, phố, tháp, số liệu vào một mục thu gọn "Tự chọn trò chơi khác" (trang dài ~4.300 px → ~1.000 px ở 390 px). Điều hướng 5 → 4 tab: Hôm nay · Ôn tập · Thư viện · Tôi (Học + Kỹ năng + Sổ từ + Thử thách + tất cả trò chơi vào Thư viện, route `quest/all`). Thanh đầu trang: số có chữ đi kèm, năng lượng chỉ hiện khi thiếu. Không đổi luật chơi, bằng chứng, bộ não chọn game |
| v118 | Màn Hôm nay là cảnh Phố Chữ | Người sáng lập: v117 "đơn giản quá, phải đẹp, hấp dẫn, đồng bộ cốt truyện". Hộp Chơi tiếp thành cảnh của khu đang ở (`story.ts` `sceneOf`, `sceneArt`: nền màu khu, hình phố / bến cảng / rừng trúc vẽ SVG nội tuyến); **Sương Câm dày theo phần kỹ năng mục tiêu chưa vững** (học thật thì sương tan, không thổi phồng); dòng "📍 Khu · Chương"; Tí kể việc của cư dân chương; nút Chơi tiếp màu vàng kiểu truyện; lộ trình 3 chặng = 3 đèn lồng (xong chặng thì đèn sáng); cảnh truyện sẵn sàng có lối phụ "📖 Xem cảnh". Vẫn đúng luật màn đầu (một nút chính, ≤ 3 khối); chữ trắng nằm trên lớp phủ tối; tắt chuyển động khi máy bật giảm chuyển động. Không đổi luật chơi, bằng chứng, bộ não |
| v119 | Người mới tinh: dạy trước có điều kiện | Đánh giá "sẵn sàng cho người mới" (11/10/2026): người chưa biết gì bị hỏi thử trước (v70) nên chỉ đoán mò. Sửa: phần xếp lớp coi là **chưa biết** (tiên nghiệm diag nghiêng về sai, `priorUnknown` ở `ev/store.ts`) và chưa gặp lần nào thì câu đầu đi sau thẻ dạy (`eMicroCard`), ở tháp / Xếp Khối / Bàn Cờ (`qLoad`) và Bài Câu (`cLoad`, thẻ trong lớp phủ; chưa đọc thẻ thì chưa ra bài); câu ngay sau thẻ là có trợ giúp (hint). Phần chưa có bằng chứng (có thể đã biết) vẫn hỏi thử trước như v70. Chương mở đầu có nút "Tôi chưa biết gì tiếng Anh": bỏ lượt dò, mọi cụm từ / điểm ngữ pháp là chưa biết, đích A1 (gồm Pre-A1); test `zero.spec.ts`. Pre-A1 thêm bài **Chữ cái và âm** (`pa-phon`, phonics: tên chữ khác âm chữ, 5 nguyên âm ngắn trong từ ba chữ, sh / ch / th, âm cuối; 6 câu nghe chọn trong nhóm chỉ khác một âm + 4 câu nghe gõ), nút `pa:phon` là tiền đề cứng của Can-Do A1 như các bài Pre-A1 khác |
| v120 | Âm thanh thu sẵn Pre-A1–B1 | Đánh giá tiêu chí 6 (Nghe): game và bài học dùng giọng đọc của trình duyệt, mỗi máy một kiểu, trình duyệt trong Zalo / Messenger thường không có. `tools/clips-list.mjs` gom mọi câu app đọc to ở Pre-A1–B1 (2.550 từ, 2.550 câu ví dụ, câu thoại hai giọng, câu giao tiếp, từ của 26 cặp âm, Pre-A1 cố định: 5.753 câu) → `content/clips.json`; `tools/clips-audio.cjs` thu bằng Kokoro (giọng chính af_bella, người B am_michael) → `a/c/<khoá>.mp3`, danh mục `a/c/index.<băm>.json` (build ghi tên vào `CLIPS_IDX`). `say` / `sayLines` phát tệp khi có (chậm = playbackRate 0,75), không có hoặc lỗi thì giọng máy; `canSay(câu)` thay `HAS_TTS` ở chỗ gắn với một câu: máy không có giọng đọc vẫn nghe được câu có tệp, câu không có tệp hiện chữ như trước. Service worker lưu tệp đã nghe (offline). B2+ và bài nghe dài vẫn dùng giọng máy; test `clips.spec.ts` |
| v121 | Định vị game-first, trục H | Chỉ tài liệu. Dòng "Định vị game-first" ở bảng quyết định; GAME-CRITERIA §11 (luật làm việc), §12 (trục H: hiệu quả học thật, 10 tiêu chí), §13 (chiến lược game hoá để nâng H) |
| v122 | Bảng đo H | `src/engine/hmeter.ts`: nhật ký H theo ngày ở `st.e.vo.hx` (telemetry, không vào mastery, giữ 120 ngày, gộp hai máy kiểu G-counter theo ngày): lượt tự nói / gõ cả câu, lượt chọn, thời gian nghĩ, giây nghe / đọc liền mạch, nghe có âm phố, dùng ở tình huống mới, nhớ trễ 7 / 30 ngày, cặp âm nói ra, hội thoại đạt, nhiệm vụ ngoài đời. `hScore` đổi số đo ra điểm theo mốc GAME-CRITERIA §12.1; chưa đủ số liệu thì "ước tính", tối đa 6. App ghi thêm từ Hội thoại mở (`cvAnswer`, `cvFinish`) và lịch ôn (`srsStep`: nhớ trễ khi tới hạn). Màn "📏 Bảng đo H" trong sảnh |
| v123 | Quán Phố Chữ bằng giọng | `voicectl.ts` + `voiceview.ts`: khách là hội thoại nhánh CONV đúng cấp (móc `convs` / `cvTurn` / `convSave` của app, nhận ý bằng `cvMatch`); lớp nhập Lời nói: 🎙 nói (nghe tự do, gửi ngay khi máy nghe xong) → ⌨️ gõ → 👆 chọn (chỉ hiện sau khi khách hỏi lại, không tính là tự nói). Thanh kiên nhẫn chạy theo cấp (`patience`), đáp kịp mức `RT` được tip, chậm không bị phạt. Mỗi khách lưu như Hội thoại mở (Can-Do nói). Món đặc biệt cuối ca: từ vừa tìm ở Mỏ Chữ / Vòng Chữ phải dùng trong câu của mình (tự gõ → bằng chứng `ctx: 'use'` mức 3). Câu khách hiểu = trả câu nói (truyện) |
| v124 | Sương quay lại + âm cảnh | 🌫️ Biển hiệu = từ đã học có khả năng nhớ FSRS thấp nhất (móc `fading`); nhớ ra tên tiếng Anh (nói / gõ) là một lần ôn thật (`wordRecall` → `srsStep`), tự gõ thêm bằng chứng `recall` mức 2; nhớ trễ ≥ 7 / ≥ 30 ngày vào H6. `ambience.ts`: âm nền tổng hợp WebAudio theo khu (chợ / bến cảng / rừng trúc), bật trong Quán (từ A2, có nút tắt) và Đài Phố Chữ (từ A2) |
| v125 | Hỏi chuyện nhân chứng | 9 vụ A1–B1 (`CASES`): nhân chứng biết 4 điều, chỉ trả lời câu HỎI có từ để hỏi + từ khoá (`askMatch`, nhận cả câu không dấu hỏi của máy nghe); sổ manh mối tự điền; đủ manh mối thì đọc mô tả tiếng Anh của 3 nghi phạm để chọn. Câu tự gõ được dò lỗi ngữ pháp hay gặp (`ghints`). Mỗi câu hỏi tính vào H2 |
| v126 | Bến Cảng lệnh giọng | 8 lệnh / ca từ 26 cặp âm (`sounds`), cặp yếu nhất (mastery `ph:` thấp) trước. Có máy nghe: nói từ đích, `asrWord` nghe thành từ kia thì cẩu nhấc nhầm thùng (vào H7, không vào mastery). Không có máy nghe: chế độ nghe phân biệt, bằng chứng `ph:` mức 1 như màn Âm |
| v127 | Đài Phố Chữ + Phố thật | Đài phát thanh đổi tên Đài Phố Chữ (tập theo số ván), ghi giây nghe (H3), âm phố từ A2 và tỉ lệ đúng khi có âm phố (H4); Thám tử ghi giây đọc. 🌍 Phố thật: 12 nhiệm vụ ngoài đời theo cấp, mỗi tuần một nhiệm vụ (`realTask`), tự báo cáo +30 xu, vào H10 (trần 7). Bộ não: đã luyện hiểu chức năng giao tiếp → Quán bằng giọng; ≥ 3 biển mờ → Sương quay lại; âm đã nghe nhiều + có máy nghe → Bến Cảng; Can-Do nói → Quán / Hỏi chuyện. Phố có 4 công trình mới |
| v128 | Cốt truyện đầy đủ + Túi chữ · Xưởng của Tí · Chỉ số | GAME-CRITERIA §14–§15. Truyện: Sương Câm là Mờ (bị cười vì nói sai), kỷ vật mỗi chương, cú lật giữa truyện, 3 lựa chọn đổi lời thoại và cảnh kết, khung "Đến lượt bạn" (nói / gõ, `sayOk`, ghi nhật ký H), khu 4 Phố Đêm + trận cuối là cuộc nói chuyện, hết mùa 1; tiếng Anh lớn dần theo khu (≤ 10 → 16 từ). Túi chữ (`bag.ts`, `bagview.ts`, `bagctl.ts`, `st.e.bg`): nguyên liệu suy ra từ việc học, ngọc từ có độ hiếm = độ nhớ thật, album theo cụm từ, Xưởng (ghép từ, ghép cụm, đúc câu + thổi hồn), 5 trang bị chỉ đổi game và chỉ phát huy khi chỉ số thật đủ, 7 chỉ số thật từ bản đồ năng lực + Bảng đo H đã đo. Chế tạo không ghi bằng chứng |
| v129 | Lò rèn năng lực + Bản đồ phủ cấp | GAME-CRITERIA §16. Mỗi kỹ năng mục tiêu là món đồ 5 bậc, bậc = mức Đạt thật; đề lấy từ nội dung của nút (probe, order, fixes, fn, câu ngữ cảnh mới), câu trả lời là bằng chứng thật (`ingest`, ctx 'forge', luật giữ nguyên). Rèn từ dưới (có bí kíp cho món mới) / vượt bậc (thử bậc cao trước, sai lùi một bậc). Tối đa 5 lượt có tính mỗi kỹ năng mỗi ngày. Bản đồ phủ từ `computePath().all`: "Đã phủ x/y", "còn thiếu: …". Xưởng v128 thành "Luyện tay", không tính bằng chứng |
| — | Tiêu chí game theo chức năng | `docs/GAME-CRITERIA.md`: 13 chức năng học của app; 10 tiêu chí chung (G1–G10, thang 10, trọng số; bắt buộc G3 ≥ 8 và G9 ≥ 8) + tiêu chí riêng theo chức năng; chấm 5 game hiện có (Leo tháp 7,1 · Xếp Khối 7,6 · Bàn Cờ 7,1 · Tốc độ 60 giây 5,6 · Ghép cặp 5,9); thứ tự game nên làm tiếp |
