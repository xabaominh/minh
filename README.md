# 🛋️ Hướng Dẫn Cài Đặt Dự Án LuxDecor (Production-Ready)

Dự án đã được tái cấu trúc thành một **Single Page Application (SPA)** với Frontend tách biệt hoàn toàn khỏi Backend. Gần đây, hệ thống cơ sở dữ liệu đã được tối ưu hóa theo tiêu chuẩn thực tế (Production-Ready) dành cho các hệ thống thương mại điện tử.

## 🛠️ 1. Yêu cầu hệ thống
- **Cơ sở dữ liệu:** MySQL/MariaDB (khuyến nghị XAMPP, WAMP, MySQL Workbench hoặc DBeaver).
- **Backend:** Python 3.8+
- **Frontend:** Trình duyệt web hiện đại (Chrome, Edge, Firefox, Safari).

---

## 🗄️ 2. Cài đặt Cơ sở dữ liệu (MySQL)
Cơ sở dữ liệu đã được chuẩn hóa để bao gồm: Quản lý địa chỉ giao hàng (user_addresses), Lịch sử thanh toán (payments), Mã giảm giá (coupons), Đánh giá (reviews), và Sản phẩm yêu thích (wishlist).

1. Mở công cụ quản lý MySQL của bạn.
2. Mở và chạy file `backend/migrations/schema.sql` để tạo database `furniture_shop` và cấu trúc các bảng mới nhất.
3. Mở và chạy file `backend/migrations/seed.sql` để chèn dữ liệu mẫu (sản phẩm, danh mục, users...).

> **Lưu ý:** User mẫu có sẵn:
> - **Admin:** `admin` / `123456`
> - **User:** `user1` / `123456`

---

## ⚙️ 3. Cài đặt Backend (Flask)
1. Mở Terminal/Command Prompt, di chuyển vào thư mục `backend`.
2. Tạo Virtual Environment (Khuyến nghị):
   ```bash
   python -m venv venv
   # Kích hoạt trên Windows:
   venv\Scripts\activate
   # Kích hoạt trên Mac/Linux:
   source venv/bin/activate
   ```
3. Cài đặt thư viện:
   ```bash
   pip install -r requirements.txt
   ```
4. Cấu hình biến môi trường:
   - Mở file `backend/.env`.
   - Chỉnh sửa `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` cho phù hợp với MySQL của bạn.

5. Chạy Server:
   ```bash
   python app.py
   ```
   > Backend API sẽ chạy tại: `http://127.0.0.1:5000`

---

## 🎨 4. Chạy Frontend
Vì Frontend là SPA thuần tĩnh load component động (fetch HTML), bạn **không thể** mở file `index.html` trực tiếp bằng cách click đúp (lỗi CORS do giao thức `file://`).

Bạn cần serve thư mục `frontend` bằng một HTTP Server tĩnh.

**Cách 1: Dùng VS Code Live Server (Khuyên dùng)**
- Mở thư mục `frontend` bằng VS Code.
- Cài extension "Live Server".
- Click chuột phải vào `index.html` > "Open with Live Server".

**Cách 2: Dùng Python HTTP Server**
- Mở Terminal mới, di chuyển vào thư mục `frontend`:
  ```bash
  cd frontend
  python -m http.server 8000
  ```
- Truy cập trình duyệt: `http://localhost:8000`

---

## 🔌 5. Danh sách API Endpoints Cơ Bản

**Auth**
- `POST /api/register`: Đăng ký (Hỗ trợ lưu nhiều địa chỉ qua `user_addresses`)
- `POST /api/login`: Đăng nhập
- `POST /api/logout`: Đăng xuất
- `GET /api/profile`: Lấy thông tin cá nhân

**Products**
- `GET /api/categories`: Danh mục (hỗ trợ slug)
- `GET /api/products?category_id=X&search=Y&limit=Z`: Danh sách sản phẩm (có SKU, attributes JSON)
- `GET /api/products/<id>`: Chi tiết sản phẩm

**Cart** (Hỗ trợ session/đăng nhập)
- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/update`
- `DELETE /api/cart/remove/<id>`
- `POST /api/cart/merge`

**Orders & Payments** (Yêu cầu đăng nhập)
- `POST /api/orders`: Tạo đơn (chốt order_items giá tĩnh, thêm bản ghi payments)
- `GET /api/orders`: Lịch sử mua hàng
- `GET /api/orders/<id>`: Chi tiết đơn hàng

*(Các endpoint cho tính năng mở rộng như wishlist, coupons, reviews sẽ tiếp tục được bổ sung thêm)*
