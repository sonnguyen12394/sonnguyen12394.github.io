# Nguồn hình và âm (Chiến Binh Chữ)

Mỗi bộ hình / âm dùng trong app ghi nguồn và giấy phép ở đây (SPEC 13/10/2026 mục 15).

| Phần | Nguồn | Giấy phép | Ghi chú |
|---|---|---|---|
| Nhân vật chibi (sảnh, trận) | Tự vẽ bằng SVG trong `src/engine/avatar.ts` (v132) | Mã của dự án | |
| Trận đấu (v134, kiểu Chaos Orbit): lưới nền, quái, lưỡi quỹ đạo, boss Tiếng Ồn, vòng nổ, sét, hạt | Tự vẽ bằng canvas trong `src/engine/fightview.ts`, port từ repo `chaos-orbit-prototype` của dự án | Mã của dự án | Không dùng tệp ảnh nào |
| Âm trận (chém, chí mạng, hạ quái, lên cấp, DASH, Tuyệt kỹ, thua) | Tổng hợp WebAudio trong `fightview.ts`, `sfx.ts`, `wheelview.ts` | Mã của dự án | Không dùng tệp âm nào |
| Giọng đọc tiếng Anh (5.753 tệp) | Kokoro (xem `a/`) | Như ghi ở thư mục âm | Có từ trước v133 |

## Bộ hình CC0 (chưa có)

Kế hoạch C12 dùng bộ hình CC0 (Kenney "Tanks", "Pixel Platformer", "Particle Pack" hoặc tương đương). Ngày 13/10/2026 máy làm việc của Claude **không tải được** kenney.nl và opengameart.org (mạng chặn), nên mốc 1 vẽ hình bằng mã. Việc còn lại:
1. Tải bộ hình CC0 (người sáng lập tải hoặc phiên có mạng), đặt ở `a/art/`, tổng ≤ 400 KB, tải sau khi vào trận lần đầu.
2. Ghi tên bộ, đường dẫn trang gốc, giấy phép (CC0 1.0) vào bảng trên.
3. Thay phần vẽ địa hình / đạn / nổ trong `fightview.ts` bằng ảnh; giữ nhân vật SVG.
