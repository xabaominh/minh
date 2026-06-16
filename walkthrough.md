# Hướng Dẫn Dự Án LuxDecor (Cập nhật SPA)

Dự án LuxDecor đã được thiết kế lại theo cấu trúc **Single Page Application (SPA)** thuần tĩnh, không còn sử dụng Backend Python và Database MySQL.

## 1. Cấu trúc file hiện tại
Toàn bộ dự án nay chỉ còn 3 file quan trọng nhất nằm ở thư mục gốc:

- `index.html`: File giao diện duy nhất chứa cả "Trang Chủ" và "Bộ Sưu Tập".
- `script.js`: File xử lý logic (chuyển trang, lọc, tìm kiếm, giỏ hàng) và **chứa Database giả lập**.
- `style.css`: File định dạng giao diện.

> [!TIP]
> Các file cũ liên quan tới phiên bản có Python (`web.html`, `web1.html`, `web.js`, `web1.js`, `server.py`, `database.sql`) đã được gom gọn vào thư mục `old_version_flask/` để bạn lưu trữ nếu cần xem lại.

## 2. Cách chạy dự án
Vì dự án giờ là thuần tĩnh (HTML/CSS/JS), bạn **không cần chạy XAMPP** và **không cần chạy lệnh `python server.py`**.
- Chỉ cần **click đúp vào file `index.html`** để mở thẳng trên trình duyệt. Mọi tính năng sẽ hoạt động ngay lập tức.

## 3. Database mới hoạt động ra sao?
Cơ sở dữ liệu đã được nhúng trực tiếp vào đầu file `script.js` dưới biến `database`. Nó là một mảng Object chứa 20 sản phẩm.
- Khi cần thêm/sửa/xoá sản phẩm, bạn chỉ cần mở file `script.js` và chỉnh sửa dữ liệu trong mảng `database.products`.
- Vì chạy trực tiếp trên máy khách (client-side), việc tìm kiếm và lọc sản phẩm diễn ra **tức thì**, không có độ trễ do gọi mạng (API).

## 4. Tính năng đã được giữ lại và cải tiến
1. **Chuyển trang mượt mà**: Chuyển đổi giữa Trang Chủ và Bộ Sưu Tập không cần tải lại trang.
2. **Giỏ hàng (Cart)**: Vẫn lưu trong `localStorage`, hiển thị số lượng badge thời gian thực.
3. **Bộ lọc đa dạng**: 
   - Lọc theo danh mục (Phòng Khách, Phòng Ngủ...)
   - Lọc theo khoảng giá.
   - Tìm kiếm theo tên theo thời gian thực (Debounce 400ms).
   - Sắp xếp (Giá cao thấp, tên A-Z).
4. **Responsive**: Tương thích tốt trên màn hình Mobile.

## 5. Xác minh (Verification)
- Đã kiểm tra chức năng tìm kiếm sản phẩm.
- Đã kiểm tra chức năng thêm vào giỏ hàng và thanh toán (mockup).
- Đã kiểm tra chức năng lọc danh mục, giá tiền.
- Đã kiểm tra việc chuyển trang SPA hoạt động ổn định.
