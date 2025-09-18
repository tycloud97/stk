# Ứng dụng quản lý chi tiêu đơn giản

Ứng dụng React một trang giúp ghi nhận chi tiêu hằng ngày, tổng hợp báo cáo theo tháng và mô phỏng các tính năng phân tích nâng cao như OCR hóa đơn và dự đoán thói quen chi tiêu.

## Cách sử dụng

1. Mở file `index.html` bằng trình duyệt.
2. Sử dụng biểu mẫu để nhập chi tiêu mới:
   - Nhập đầy đủ ngày, mô tả, số tiền và ghi chú (nếu có).
   - Hoặc sử dụng ô **Nhập nhanh** để dán câu văn tự nhiên, ví dụ: `Hôm nay mua cà phê 50k, ăn trưa 100k`.
3. Ứng dụng sẽ hiển thị tổng chi tiêu, thống kê theo tháng và các gợi ý nâng cao.

## Tính năng chính

- Lưu dữ liệu cục bộ bằng `localStorage`.
- Gợi ý hạng mục chi tiêu dựa trên từ khóa phổ biến.
- Báo cáo tháng với tổng tiền, số giao dịch và phân bổ theo hạng mục.
- Phân tích nâng cao (minh họa) gồm OCR hóa đơn và dự đoán chi tiêu tháng tới.

## Phát triển thêm

- Tích hợp dịch vụ OCR thực tế (ví dụ Tesseract.js) để đọc ảnh hóa đơn.
- Kết nối mô hình máy học để dự báo ngân sách theo thói quen.
- Xuất dữ liệu ra CSV hoặc Google Sheets.
