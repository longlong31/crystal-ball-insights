# Bổ sung BVH và sửa lỗi ký tự bộ lọc

## Thay đổi
- Thêm mã `BVH.VN` — Tập đoàn Bảo Việt vào danh sách cổ phiếu Việt Nam và danh mục VN30.
- Sửa cách bỏ cờ quốc gia khỏi tên danh mục để không còn hiện ký tự lỗi `�`/dấu hỏi.
- Giữ nguyên bố cục và hành vi tìm kiếm hiện tại.

## Kiểm tra
- Tìm `BVH` phải trả về Tập đoàn Bảo Việt và chọn được mã.
- Các nhãn VN, US, Europe, Asia và ETF hiển thị đúng, không có ký tự lỗi.
