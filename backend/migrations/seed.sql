-- =====================================================
-- LuxDecor — Seed Data (Updated)
-- Dữ liệu mẫu cho development/testing
-- =====================================================

USE furniture_shop;

-- Tài khoản mẫu (password: 123456)
INSERT INTO users (id, username, email, password_hash, full_name, phone, role) VALUES
(1, 'admin', 'admin@luxdecor.vn', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Quản Trị Viên', '0901234567', 'ADMIN'),
(2, 'user1', 'user1@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Nguyễn Văn A', '0912345678', 'USER');

-- Địa chỉ user
INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, is_default) VALUES
(1, 'Quản Trị Viên', '0901234567', 'Hà Nội', TRUE),
(2, 'Nguyễn Văn A', '0912345678', '123 Lê Lợi, Q1, TP.HCM', TRUE);

-- 5 danh mục
INSERT INTO categories (id, category_name, slug) VALUES
(1, 'Phòng Khách', 'phong-khach'),
(2, 'Phòng Ngủ', 'phong-ngu'),
(3, 'Phòng Ăn', 'phong-an'),
(4, 'Văn Phòng', 'van-phong'),
(5, 'Kho Đồ', 'kho-do');

-- 20 sản phẩm
-- PHÒNG KHÁCH (category_id = 1)
INSERT INTO products (id, category_id, sku, product_name, slug, price, description, stock_quantity, attributes, thumbnail_url) VALUES
(1, 1, 'PK001', 'Sofa Xám Hiện Đại', 'sofa-xam-hien-dai', 15900000, 'Sofa 3 chỗ ngồi với chất liệu vải cao cấp, đệm mút siêu êm, khung gỗ tự nhiên bền bỉ.', 15, '{"dimensions": "220x85x80 cm", "material": "Gỗ tự nhiên"}', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
(2, 1, 'PK002', 'Sofa Góc Chữ L Nâu', 'sofa-goc-chu-l-nau', 22500000, 'Sofa góc chữ L rộng rãi, bọc da PU cao cấp, phù hợp phòng khách lớn.', 8, '{"dimensions": "280x170x85 cm", "material": "Khung thép + gỗ"}', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'),
(3, 1, 'PK003', 'Bàn Trà Gỗ Sồi', 'ban-tra-go-soi', 4500000, 'Bàn trà hình chữ nhật gỗ sồi tự nhiên, thiết kế tối giản Scandinavian.', 20, '{"dimensions": "120x60x45 cm", "material": "Gỗ sồi"}', 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80'),
(4, 1, 'PK004', 'Kệ Tivi Gỗ Óc Chó', 'ke-tivi-go-oc-cho', 8900000, 'Kệ TV gỗ óc chó nguyên khối, có ngăn chứa đồ rộng rãi, chân thép sơn tĩnh điện.', 10, '{"dimensions": "180x40x55 cm", "material": "Gỗ óc chó"}', 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&q=80'),
(5, 1, 'PK005', 'Ghế Thư Giãn Bành', 'ghe-thu-gian-banh', 6700000, 'Ghế bành đơn phong cách mid-century, đệm êm, chân gỗ tự nhiên.', 12, '{"dimensions": "75x80x95 cm", "material": "Gỗ tự nhiên"}', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80');

-- PHÒNG NGỦ (category_id = 2)
INSERT INTO products (id, category_id, sku, product_name, slug, price, description, stock_quantity, attributes, thumbnail_url) VALUES
(6, 2, 'PN001', 'Giường Ngủ Gỗ Hiện Đại', 'giuong-ngu-go-hien-dai', 12500000, 'Giường đôi 1m8 khung gỗ thông nhập khẩu, đầu giường bọc nệm êm ái.', 10, '{"dimensions": "200x180x100 cm", "material": "Gỗ thông"}', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),
(7, 2, 'PN002', 'Tủ Quần Áo 3 Cánh', 'tu-quan-ao-3-canh', 9800000, 'Tủ quần áo 3 cánh gỗ MDF phủ melamine, có gương soi và nhiều ngăn chia.', 7, '{"dimensions": "150x60x200 cm", "material": "Gỗ MDF"}', 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=600&q=80'),
(8, 2, 'PN003', 'Bàn Đầu Giường Nhỏ Gọn', 'ban-dau-giuong-nho-gon', 2200000, 'Tab đầu giường 2 ngăn kéo, gỗ cao su tự nhiên phủ sơn PU.', 25, '{"dimensions": "45x40x55 cm", "material": "Gỗ cao su"}', 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=600&q=80'),
(9, 2, 'PN004', 'Đèn Ngủ Để Bàn', 'den-ngu-de-ban', 890000, 'Đèn ngủ chao vải linen, chân đồng mạ vàng, ánh sáng ấm dịu.', 30, '{"dimensions": "25x25x45 cm", "material": "Đồng"}', 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&q=80'),
(10, 2, 'PN005', 'Gương Trang Điểm LED', 'guong-trang-diem-led', 3500000, 'Gương trang điểm có đèn LED viền, 3 chế độ ánh sáng, cảm ứng chạm.', 18, '{"dimensions": "60x80 cm"}', 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80');

-- PHÒNG ĂN (category_id = 3)
INSERT INTO products (id, category_id, sku, product_name, slug, price, description, stock_quantity, attributes, thumbnail_url) VALUES
(11, 3, 'PA001', 'Bàn Ăn Gỗ Trắc 6 Ghế', 'ban-an-go-trac-6-ghe', 18900000, 'Bộ bàn ăn gỗ trắc 6 ghế, mặt bàn nguyên tấm dày 4cm, thiết kế sang trọng.', 5, '{"dimensions": "180x90x75 cm", "material": "Gỗ trắc"}', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80'),
(12, 3, 'PA002', 'Ghế Ăn Bọc Nệm Xám', 'ghe-an-boc-nem-xam', 1800000, 'Ghế ăn khung thép sơn tĩnh điện, nệm ngồi bọc vải chống thấm.', 40, '{"dimensions": "45x50x85 cm", "material": "Khung thép"}', 'https://images.unsplash.com/photo-1503602642458-232111445657?w=600&q=80'),
(13, 3, 'PA003', 'Tủ Rượu Gỗ Sồi', 'tu-ruou-go-soi', 7500000, 'Tủ rượu gỗ sồi Mỹ với kính cường lực, đèn LED trang trí bên trong.', 6, '{"dimensions": "80x40x180 cm", "material": "Gỗ sồi Mỹ"}', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&q=80'),
(14, 3, 'PA004', 'Bàn Ăn Tròn Đá Marble', 'ban-an-tron-da-marble', 14500000, 'Bàn ăn tròn mặt đá marble trắng tự nhiên, chân thép mạ vàng.', 4, '{"dimensions": "Đường kính 120 cm", "material": "Đá marble + thép"}', 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?w=600&q=80');

-- VĂN PHÒNG (category_id = 4)
INSERT INTO products (id, category_id, sku, product_name, slug, price, description, stock_quantity, attributes, thumbnail_url) VALUES
(15, 4, 'VP001', 'Ghế Công Thái Học Premium', 'ghe-cong-thai-hoc-premium', 5900000, 'Ghế ergonomic lưng lưới, tựa đầu điều chỉnh, tay vịn 3D, hỗ trợ thắt lưng.', 20, '{"dimensions": "65x65x120 cm", "material": "Nhựa + lưới"}', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&q=80'),
(16, 4, 'VP002', 'Bàn Làm Việc Nâng Hạ', 'ban-lam-viec-nang-ha', 8500000, 'Bàn standing desk điện tử, điều chỉnh chiều cao 72-120cm, mặt bàn gỗ tre.', 12, '{"dimensions": "140x70x72-120 cm", "material": "Gỗ tre"}', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'),
(17, 4, 'VP003', 'Kệ Sách 5 Tầng', 'ke-sach-5-tang', 3200000, 'Kệ sách 5 tầng khung thép sơn tĩnh điện, mặt gỗ MDF vân sồi.', 15, '{"dimensions": "80x30x180 cm", "material": "Gỗ MDF + thép"}', 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&q=80'),
(18, 4, 'VP004', 'Đèn Bàn LED Thông Minh', 'den-ban-led-thong-minh', 1200000, 'Đèn bàn LED cảm ứng, 5 mức sáng, 3 chế độ màu, cổng sạc USB tích hợp.', 35, '{"dimensions": "15x15x45 cm"}', 'https://images.unsplash.com/photo-1534073737927-85f1ebff1f5d?w=600&q=80');

-- KHO ĐỒ (category_id = 5)
INSERT INTO products (id, category_id, sku, product_name, slug, price, description, stock_quantity, attributes, thumbnail_url) VALUES
(19, 5, 'KD001', 'Tủ Giày 4 Tầng', 'tu-giay-4-tang', 2800000, 'Tủ giày 4 tầng gỗ MDF cánh lật, chứa được 16 đôi giày.', 22, '{"dimensions": "80x30x120 cm", "material": "Gỗ MDF"}', 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&q=80'),
(20, 5, 'KD002', 'Hộp Lưu Trữ Đa Năng', 'hop-luu-tru-da-nang', 450000, 'Bộ 3 hộp lưu trữ vải canvas có nắp, nhiều kích cỡ, có thể gấp gọn.', 50, '{"dimensions": "40x30x25 cm", "material": "Vải canvas"}', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&q=80');

-- Ảnh phụ cho 1 số sản phẩm
INSERT INTO product_images (product_id, image_url, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', 1),
(1, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80', 2),
(2, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80', 1),
(6, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80', 1),
(11, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80', 1);

-- =====================================================
-- KIỂM TRA
-- =====================================================
SELECT p.id, p.sku, p.product_name, FORMAT(p.price, 0) AS gia_vnd, c.category_name, p.stock_quantity
FROM products p JOIN categories c ON p.category_id = c.id
ORDER BY p.id;

SELECT c.category_name AS danh_muc, COUNT(p.id) AS so_luong
FROM categories c LEFT JOIN products p ON c.id = p.category_id
GROUP BY c.category_name ORDER BY c.category_name;
