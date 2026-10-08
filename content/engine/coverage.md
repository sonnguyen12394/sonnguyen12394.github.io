# Bảng phủ engine

Tạo bởi `tools/engine-gen.ts`. Mỗi mục tiêu: số nút ghi trực tiếp, số nút sau khi đóng tiền đề cứng, số nút chưa có gì để đo (cần nội dung ở M6).

| Mục tiêu | Trạng thái | Phiên bản | Nút ghi | Sau đóng tiền đề | Chưa có gì để đo |
|---|---|---|---|---|---|
| Khởi động Pre-A1 (người mới tinh) (`cefr-pre-a1`) | MVP | 1.0 | 7 | 7 | 0 |
| Tiếng Anh tổng quát A1 (Sơ cấp) (`cefr-a1`) | MVP | 1.0 | 47 | 169 | 0 |
| Tiếng Anh tổng quát A2 (Sơ trung cấp) (`cefr-a2`) | MVP | 1.0 | 47 | 325 | 0 |
| Tiếng Anh tổng quát B1 (Trung cấp) (`cefr-b1`) | MVP | 1.0 | 49 | 483 | 0 |
| Tiếng Anh tổng quát B2 (Trung cao cấp) (`cefr-b2`) | MVP | 1.0 | 50 | 661 | 0 |
| Tiếng Anh tổng quát C1 (Cao cấp) (`cefr-c1`) | MVP | 1.0 | 50 | 835 | 0 |
| Tiếng Anh tổng quát C2 (Thành thạo) (`cefr-c2`) | MVP | 1.0 | 49 | 960 | 0 |
| IELTS Academic 4.0 (`ielts-ac-4.0`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS Academic 4.5 (`ielts-ac-4.5`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS Academic 5.0 (`ielts-ac-5.0`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS Academic 5.5 (`ielts-ac-5.5`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS Academic 6.0 (`ielts-ac-6.0`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS Academic 6.5 (`ielts-ac-6.5`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS Academic 7.0 (`ielts-ac-7.0`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS Academic 7.5 (`ielts-ac-7.5`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS Academic 8.0 (`ielts-ac-8.0`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS Academic 8.5 (`ielts-ac-8.5`) | tương lai | 1.0 | 76 | 987 | 0 |
| IELTS Academic 9.0 (`ielts-ac-9.0`) | tương lai | 1.0 | 76 | 987 | 0 |
| IELTS General Training 4.0 (`ielts-gt-4.0`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS General Training 4.5 (`ielts-gt-4.5`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS General Training 5.0 (`ielts-gt-5.0`) | tương lai | 1.0 | 76 | 510 | 0 |
| IELTS General Training 5.5 (`ielts-gt-5.5`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS General Training 6.0 (`ielts-gt-6.0`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS General Training 6.5 (`ielts-gt-6.5`) | tương lai | 1.0 | 77 | 688 | 0 |
| IELTS General Training 7.0 (`ielts-gt-7.0`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS General Training 7.5 (`ielts-gt-7.5`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS General Training 8.0 (`ielts-gt-8.0`) | tương lai | 1.0 | 77 | 862 | 0 |
| IELTS General Training 8.5 (`ielts-gt-8.5`) | tương lai | 1.0 | 76 | 987 | 0 |
| IELTS General Training 9.0 (`ielts-gt-9.0`) | tương lai | 1.0 | 76 | 987 | 0 |
| VSTEP Bậc 3 (B1) (`vstep-b1`) | tương lai | 1.0 | 58 | 492 | 0 |
| VSTEP Bậc 4 (B2) (`vstep-b2`) | tương lai | 1.0 | 59 | 670 | 0 |
| VSTEP Bậc 5 (C1) (`vstep-c1`) | tương lai | 1.0 | 59 | 844 | 0 |
| Giao tiếp hằng ngày (`comm-daily`) | tương lai | 1.0 | 55 | 166 | 0 |
| Giao tiếp khi du lịch (`comm-travel`) | tương lai | 1.0 | 8 | 222 | 0 |
| Giao tiếp nơi làm việc (`comm-work`) | tương lai | 1.0 | 10 | 329 | 0 |
| Giao tiếp trong học tập (`comm-study`) | tương lai | 1.0 | 16 | 610 | 0 |

Tổng: 1005 nút (299 Can-Do, 515 cụm từ vựng, 154 điểm ngữ pháp, 37 dạng bài thi), 2614 cạnh (2237 cứng), 36 mục tiêu. Nút chưa có gì để đo: 0.

## Universal Language Core theo mục tiêu đang mở

Số nút (kể cả tiền đề) thuộc từng năng lực của spec v2.4 §14. Một nút có thể thuộc nhiều năng lực.

| Mục tiêu | Từ vựng | Ngữ pháp | Âm vị | Tiếp nhận | Sản sinh | Tương tác | Ngữ dụng | Diễn ngôn |
|---|---|---|---|---|---|---|---|---|
| `cefr-pre-a1` | 7 | 0 | 2 | 7 | 0 | 1 | 0 | 0 |
| `cefr-a1` | 101 | 34 | 9 | 16 | 18 | 12 | 4 | 6 |
| `cefr-a2` | 188 | 70 | 13 | 18 | 36 | 20 | 8 | 12 |
| `cefr-b1` | 278 | 104 | 19 | 27 | 55 | 30 | 13 | 23 |
| `cefr-b2` | 390 | 136 | 25 | 36 | 74 | 44 | 17 | 36 |
| `cefr-c1` | 501 | 164 | 31 | 46 | 93 | 53 | 24 | 52 |
| `cefr-c2` | 566 | 190 | 37 | 56 | 111 | 60 | 33 | 64 |

## Kiểm định đồ thị

- Nút mồ côi (không thuộc mục tiêu nào, không có cạnh): 0.
- Nút mục tiêu không học được (không có hoạt động): 0.
- Tiền đề cứng ngược cấp (tiền đề ở cấp cao hơn): 0.
- Nút trùng tên cùng loại: u:c1-u13 = u:c1-u58; u:c1-u27 = u:c1-u94.
- Nhóm tiền đề thay thế sai (need > số nút): 0.
- Năng lực Universal Core chưa có nút ở mục tiêu: cefr-pre-a1: Ngữ pháp; cefr-pre-a1: Sản sinh; cefr-pre-a1: Ngữ dụng; cefr-pre-a1: Diễn ngôn.
- Cạnh có lý do: 2614/2614; nút có cặp dễ nhầm: 73; nút có lỗi hay gặp: 28.
