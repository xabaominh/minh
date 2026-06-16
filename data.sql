-- =====================================================
-- LuxDecor — Database Schema v2
-- 8 bảng: users, categories, products, product_images,
--         cart, cart_items, orders, order_items
-- =====================================================

DROP DATABASE IF EXISTS furniture_shop;

CREATE DATABASE furniture_shop
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE furniture_shop;

-- =====================================
-- USERS
-- =====================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- CATEGORIES
-- =====================================
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================
-- PRODUCTS
-- =====================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    description TEXT,
    stock_quantity INT DEFAULT 0,
    dimensions VARCHAR(100),
    wood_material VARCHAR(100),
    thumbnail_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- =====================================
-- PRODUCT IMAGES
-- =====================================
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =====================================
-- CART
-- =====================================
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================
-- CART ITEMS
-- =====================================
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =====================================
-- ORDERS
-- =====================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('COD', 'BANK_TRANSFER') NOT NULL,
    order_status ENUM('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================================
-- ORDER ITEMS
-- =====================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);


-- =====================================================
-- SEED DATA
-- =====================================================

-- Tài khoản mẫu (password: 123456)
-- Hash được tạo bằng werkzeug.security.generate_password_hash
INSERT INTO users (username, email, password_hash, full_name, phone, address, role) VALUES
('admin', 'admin@luxdecor.vn', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Quản Trị Viên', '0901234567', 'Hà Nội', 'ADMIN'),
('user1', 'user1@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Nguyễn Văn A', '0912345678', '123 Lê Lợi, Q1, TP.HCM', 'USER');

-- 5 danh mục
INSERT INTO categories (category_name) VALUES
('Phòng Khách'),
('Phòng Ngủ'),
('Phòng Ăn'),
('Văn Phòng'),
('Kho Đồ');

-- 20 sản phẩm
-- PHÒNG KHÁCH (category_id = 1)
INSERT INTO products (category_id, product_name, price, description, stock_quantity, dimensions, wood_material, thumbnail_url) VALUES
(1, 'Sofa Xám Hiện Đại',   15900000, 'Sofa 3 chỗ ngồi với chất liệu vải cao cấp, đệm mút siêu êm, khung gỗ tự nhiên bền bỉ.', 15, '220x85x80 cm', 'Gỗ tự nhiên', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
(1, 'Sofa Góc Chữ L Nâu',  22500000, 'Sofa góc chữ L rộng rãi, bọc da PU cao cấp, phù hợp phòng khách lớn.', 8, '280x170x85 cm', 'Khung thép + gỗ', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'),
(1, 'Bàn Trà Gỗ Sồi',       4500000, 'Bàn trà hình chữ nhật gỗ sồi tự nhiên, thiết kế tối giản Scandinavian.', 20, '120x60x45 cm', 'Gỗ sồi', 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80'),
(1, 'Kệ Tivi Gỗ Óc Chó',    8900000, 'Kệ TV gỗ óc chó nguyên khối, có ngăn chứa đồ rộng rãi, chân thép sơn tĩnh điện.', 10, '180x40x55 cm', 'Gỗ óc chó', 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&q=80'),
(1, 'Ghế Thư Giãn Bành',     6700000, 'Ghế bành đơn phong cách mid-century, đệm êm, chân gỗ tự nhiên.', 12, '75x80x95 cm', 'Gỗ tự nhiên', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80');

-- PHÒNG NGỦ (category_id = 2)
INSERT INTO products (category_id, product_name, price, description, stock_quantity, dimensions, wood_material, thumbnail_url) VALUES
(2, 'Giường Ngủ Gỗ Hiện Đại', 12500000, 'Giường đôi 1m8 khung gỗ thông nhập khẩu, đầu giường bọc nệm êm ái.', 10, '200x180x100 cm', 'Gỗ thông', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),
(2, 'Tủ Quần Áo 3 Cánh',       9800000, 'Tủ quần áo 3 cánh gỗ MDF phủ melamine, có gương soi và nhiều ngăn chia.', 7, '150x60x200 cm', 'Gỗ MDF', 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80'),
(2, 'Bàn Đầu Giường Nhỏ Gọn',  2200000, 'Tab đầu giường 2 ngăn kéo, gỗ cao su tự nhiên phủ sơn PU.', 25, '45x40x55 cm', 'Gỗ cao su', 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80'),
(2, 'Đèn Ngủ Để Bàn',           890000, 'Đèn ngủ chao vải linen, chân đồng mạ vàng, ánh sáng ấm dịu.', 30, '25x25x45 cm', NULL, 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&q=80'),
(2, 'Gương Trang Điểm LED',    3500000, 'Gương trang điểm có đèn LED viền, 3 chế độ ánh sáng, cảm ứng chạm.', 18, '60x80 cm', NULL, 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80');

-- PHÒNG ĂN (category_id = 3)
INSERT INTO products (category_id, product_name, price, description, stock_quantity, dimensions, wood_material, thumbnail_url) VALUES
(3, 'Bàn Ăn Gỗ Trắc 6 Ghế',  18900000, 'Bộ bàn ăn gỗ trắc 6 ghế, mặt bàn nguyên tấm dày 4cm, thiết kế sang trọng.', 5, '180x90x75 cm', 'Gỗ trắc', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80'),
(3, 'Ghế Ăn Bọc Nệm Xám',     1800000, 'Ghế ăn khung thép sơn tĩnh điện, nệm ngồi bọc vải chống thấm.', 40, '45x50x85 cm', 'Khung thép', 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80'),
(3, 'Tủ Rượu Gỗ Sồi',         7500000, 'Tủ rượu gỗ sồi Mỹ với kính cường lực, đèn LED trang trí bên trong.', 6, '80x40x180 cm', 'Gỗ sồi Mỹ', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80'),
(3, 'Bàn Ăn Tròn Đá Marble',  14500000, 'Bàn ăn tròn mặt đá marble trắng tự nhiên, chân thép mạ vàng.', 4, 'Đường kính 120 cm', 'Đá marble + thép', 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=600&q=80');

-- VĂN PHÒNG (category_id = 4)
INSERT INTO products (category_id, product_name, price, description, stock_quantity, dimensions, wood_material, thumbnail_url) VALUES
(4, 'Ghế Công Thái Học Premium', 5900000, 'Ghế ergonomic lưng lưới, tựa đầu điều chỉnh, tay vịn 3D, hỗ trợ thắt lưng.', 20, '65x65x120 cm', 'Nhựa + lưới', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80'),
(4, 'Bàn Làm Việc Nâng Hạ',     8500000, 'Bàn standing desk điện tử, điều chỉnh chiều cao 72-120cm, mặt bàn gỗ tre.', 12, '140x70x72-120 cm', 'Gỗ tre', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'),
(4, 'Kệ Sách 5 Tầng',           3200000, 'Kệ sách 5 tầng khung thép sơn tĩnh điện, mặt gỗ MDF vân sồi.', 15, '80x30x180 cm', 'Gỗ MDF + thép', 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80'),
(4, 'Đèn Bàn LED Thông Minh',   1200000, 'Đèn bàn LED cảm ứng, 5 mức sáng, 3 chế độ màu, cổng sạc USB tích hợp.', 35, '15x15x45 cm', NULL, 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=600&q=80');

-- KHO ĐỒ (category_id = 5)
INSERT INTO products (category_id, product_name, price, description, stock_quantity, dimensions, wood_material, thumbnail_url) VALUES
(5, 'Tủ Giày 4 Tầng',         2800000, 'Tủ giày 4 tầng gỗ MDF cánh lật, chứa được 16 đôi giày.', 22, '80x30x120 cm', 'Gỗ MDF', 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80'),
(5, 'Hộp Lưu Trữ Đa Năng',    450000, 'Bộ 3 hộp lưu trữ vải canvas có nắp, nhiều kích cỡ, có thể gấp gọn.', 50, '40x30x25 cm', NULL, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80');

-- Ảnh phụ cho 1 số sản phẩm
INSERT INTO product_images (product_id, image_url) VALUES
(1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
(1, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'),
(2, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'),
(6, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),
(11, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80');

-- =====================================================
-- KIỂM TRA
-- =====================================================
SELECT p.id, p.product_name, FORMAT(p.price, 0) AS gia_vnd, c.category_name, p.stock_quantity
FROM products p JOIN categories c ON p.category_id = c.id
ORDER BY p.id;

SELECT c.category_name AS danh_muc, COUNT(p.id) AS so_luong
FROM categories c LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.category_name ORDER BY c.category_name;
