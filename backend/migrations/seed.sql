-- =====================================================
-- LuxDecor — Seed Data
-- Dữ liệu mẫu cho development/testing
-- Chạy file này SAU schema.sql để thêm dữ liệu mẫu
-- =====================================================

USE furniture_shop;

-- =====================================
-- 1. TÀI KHOẢN MẪU (password: 123456)
-- =====================================
INSERT INTO users (id, username, email, password_hash, full_name, phone, role) VALUES
(1, 'admin', 'admin@luxdecor.vn', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Quản Trị Viên', '0901234567', 'ADMIN'),
(2, 'user1', 'user1@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Nguyễn Văn A', '0912345678', 'USER'),
(3, 'user2', 'user2@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Trần Thị B', '0923456789', 'USER'),
(4, 'user3', 'user3@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Lê Văn C', '0934567890', 'USER'),
(5, 'user4', 'user4@gmail.com', 'scrypt:32768:8:1$Bbaj1GgCjacQvg0I$f07677d322b19fe6dae76b73f4116ce9c0ad867bb19304e2ab2e0123a95ba02a9d854328c88a9200f3678af8f5a6494487c5741cd24b10b684bbe41defb879f3', 'Phạm Minh D', '0945678901', 'USER');

-- Địa chỉ user
INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, is_default) VALUES
(1, 'Quản Trị Viên', '0901234567', 'Hà Nội', TRUE),
(2, 'Nguyễn Văn A', '0912345678', '123 Lê Lợi, Q1, TP.HCM', TRUE),
(3, 'Trần Thị B', '0923456789', '456 Nguyễn Thị Minh Khai, Q3, TP.HCM', TRUE),
(4, 'Lê Văn C', '0934567890', '789 Trần Hưng Đạo, Q5, TP.HCM', TRUE),
(5, 'Phạm Minh D', '0945678901', '101 Cầu Giấy, Q.Cầu Giấy, Hà Nội', TRUE);

-- =====================================
-- 2. DANH MỤC
-- =====================================
INSERT INTO categories (id, category_name, slug) VALUES
(1, 'Phòng Khách', 'phong-khach'),
(2, 'Phòng Ngủ', 'phong-ngu'),
(3, 'Phòng Ăn', 'phong-an'),
(4, 'Văn Phòng', 'van-phong'),
(5, 'Kho Đồ', 'kho-do');

-- =====================================
-- 3. SẢN PHẨM (20 sản phẩm)
-- =====================================

-- PHÒNG KHÁCH (category_id = 1)
INSERT INTO products (id, category_id, sku, product_name, slug, price, discount_price, description, stock_quantity, attributes, thumbnail_url) VALUES
(1, 1, 'PK001', 'Sofa Xám Hiện Đại', 'sofa-xam-hien-dai', 15900000, 13900000, 'Sofa 3 chỗ ngồi với chất liệu vải cao cấp, đệm mút siêu êm, khung gỗ tự nhiên bền bỉ.', 15, '{"dimensions": "220x85x80 cm", "material": "Gỗ tự nhiên"}', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
(2, 1, 'PK002', 'Sofa Góc Chữ L Nâu', 'sofa-goc-chu-l-nau', 22500000, 19900000, 'Sofa góc chữ L rộng rãi, bọc da PU cao cấp, phù hợp phòng khách lớn.', 8, '{"dimensions": "280x170x85 cm", "material": "Khung thép + gỗ"}', 'https://images.pexels.com/photos/276566/pexels-photo-276566.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(3, 1, 'PK003', 'Bàn Trà Gỗ Sồi', 'ban-tra-go-soi', 4500000, NULL, 'Bàn trà hình chữ nhật gỗ sồi tự nhiên, thiết kế tối giản Scandinavian.', 20, '{"dimensions": "120x60x45 cm", "material": "Gỗ sồi"}', 'https://images.pexels.com/photos/6661224/pexels-photo-6661224.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(4, 1, 'PK004', 'Kệ Tivi Gỗ Óc Chó', 'ke-tivi-go-oc-cho', 8900000, NULL, 'Kệ TV gỗ óc chó nguyên khối, có ngăn chứa đồ rộng rãi, chân thép sơn tĩnh điện.', 10, '{"dimensions": "180x40x55 cm", "material": "Gỗ óc chó"}', 'https://images.pexels.com/photos/1714433/pexels-photo-1714433.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(5, 1, 'PK005', 'Ghế Thư Giãn Bành', 'ghe-thu-gian-banh', 6700000, NULL, 'Ghế bành đơn phong cách mid-century, đệm êm, chân gỗ tự nhiên.', 12, '{"dimensions": "75x80x95 cm", "material": "Gỗ tự nhiên"}', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80');

-- PHÒNG NGỦ (category_id = 2)
INSERT INTO products (id, category_id, sku, product_name, slug, price, discount_price, description, stock_quantity, attributes, thumbnail_url) VALUES
(6, 2, 'PN001', 'Giường Ngủ Gỗ Hiện Đại', 'giuong-ngu-go-hien-dai', 12500000, 10900000, 'Giường đôi 1m8 khung gỗ thông nhập khẩu, đầu giường bọc nệm êm ái.', 10, '{"dimensions": "200x180x100 cm", "material": "Gỗ thông"}', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),
(7, 2, 'PN002', 'Tủ Quần Áo 3 Cánh', 'tu-quan-ao-3-canh', 9800000, NULL, 'Tủ quần áo 3 cánh gỗ MDF phủ melamine, có gương soi và nhiều ngăn chia.', 7, '{"dimensions": "150x60x200 cm", "material": "Gỗ MDF"}', 'https://images.pexels.com/photos/27562190/pexels-photo-27562190.png?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(8, 2, 'PN003', 'Bàn Đầu Giường Nhỏ Gọn', 'ban-dau-giuong-nho-gon', 2200000, NULL, 'Tab đầu giường 2 ngăn kéo, gỗ cao su tự nhiên phủ sơn PU.', 25, '{"dimensions": "45x40x55 cm", "material": "Gỗ cao su"}', 'https://images.pexels.com/photos/6266190/pexels-photo-6266190.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(9, 2, 'PN004', 'Đèn Ngủ Để Bàn', 'den-ngu-de-ban', 890000, NULL, 'Đèn ngủ chao vải linen, chân đồng mạ vàng, ánh sáng ấm dịu.', 30, '{"dimensions": "25x25x45 cm", "material": "Đồng"}', 'https://images.pexels.com/photos/17994856/pexels-photo-17994856.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(10, 2, 'PN005', 'Gương Trang Điểm LED', 'guong-trang-diem-led', 3500000, NULL, 'Gương trang điểm có đèn LED viền, 3 chế độ ánh sáng, cảm ứng chạm.', 18, '{"dimensions": "60x80 cm"}', 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80');

-- PHÒNG ĂN (category_id = 3)
INSERT INTO products (id, category_id, sku, product_name, slug, price, discount_price, description, stock_quantity, attributes, thumbnail_url) VALUES
(11, 3, 'PA001', 'Bàn Ăn Gỗ Trắc 6 Ghế', 'ban-an-go-trac-6-ghe', 18900000, NULL, 'Bộ bàn ăn gỗ trắc 6 ghế, mặt bàn nguyên tấm dày 4cm, thiết kế sang trọng.', 5, '{"dimensions": "180x90x75 cm", "material": "Gỗ trắc"}', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80'),
(12, 3, 'PA002', 'Ghế Ăn Bọc Nệm Xám', 'ghe-an-boc-nem-xam', 1800000, 1500000, 'Ghế ăn khung thép sơn tĩnh điện, nệm ngồi bọc vải chống thấm.', 40, '{"dimensions": "45x50x85 cm", "material": "Khung thép"}', 'https://images.pexels.com/photos/15071703/pexels-photo-15071703.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(13, 3, 'PA003', 'Tủ Rượu Gỗ Sồi', 'tu-ruou-go-soi', 7500000, NULL, 'Tủ rượu gỗ sồi Mỹ với kính cường lực, đèn LED trang trí bên trong.', 6, '{"dimensions": "80x40x180 cm", "material": "Gỗ sồi Mỹ"}', 'https://images.pexels.com/photos/27819659/pexels-photo-27819659.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(14, 3, 'PA004', 'Bàn Ăn Tròn Đá Marble', 'ban-an-tron-da-marble', 14500000, NULL, 'Bàn ăn tròn mặt đá marble trắng tự nhiên, chân thép mạ vàng.', 4, '{"dimensions": "Đường kính 120 cm", "material": "Đá marble + thép"}', 'https://images.pexels.com/photos/32709576/pexels-photo-32709576.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop');

-- VĂN PHÒNG (category_id = 4)
INSERT INTO products (id, category_id, sku, product_name, slug, price, discount_price, description, stock_quantity, attributes, thumbnail_url) VALUES
(15, 4, 'VP001', 'Ghế Công Thái Học Premium', 'ghe-cong-thai-hoc-premium', 5900000, 5200000, 'Ghế ergonomic lưng lưới, tựa đầu điều chỉnh, tay vịn 3D, hỗ trợ thắt lưng.', 20, '{"dimensions": "65x65x120 cm", "material": "Nhựa + lưới"}', 'https://images.pexels.com/photos/18435547/pexels-photo-18435547.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(16, 4, 'VP002', 'Bàn Làm Việc Nâng Hạ', 'ban-lam-viec-nang-ha', 8500000, NULL, 'Bàn standing desk điện tử, điều chỉnh chiều cao 72-120cm, mặt bàn gỗ tre.', 12, '{"dimensions": "140x70x72-120 cm", "material": "Gỗ tre"}', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'),
(17, 4, 'VP003', 'Kệ Sách 5 Tầng', 'ke-sach-5-tang', 3200000, NULL, 'Kệ sách 5 tầng khung thép sơn tĩnh điện, mặt gỗ MDF vân sồi.', 15, '{"dimensions": "80x30x180 cm", "material": "Gỗ MDF + thép"}', 'https://images.pexels.com/photos/4440116/pexels-photo-4440116.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(18, 4, 'VP004', 'Đèn Bàn LED Thông Minh', 'den-ban-led-thong-minh', 1200000, NULL, 'Đèn bàn LED cảm ứng, 5 mức sáng, 3 chế độ màu, cổng sạc USB tích hợp.', 35, '{"dimensions": "15x15x45 cm"}', 'https://images.pexels.com/photos/15519510/pexels-photo-15519510.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop');

-- KHO ĐỒ (category_id = 5)
INSERT INTO products (id, category_id, sku, product_name, slug, price, discount_price, description, stock_quantity, attributes, thumbnail_url) VALUES
(19, 5, 'KD001', 'Tủ Giày 4 Tầng', 'tu-giay-4-tang', 2800000, NULL, 'Tủ giày 4 tầng gỗ MDF cánh lật, chứa được 16 đôi giày.', 22, '{"dimensions": "80x30x120 cm", "material": "Gỗ MDF"}', 'https://images.pexels.com/photos/37595188/pexels-photo-37595188.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(20, 5, 'KD002', 'Hộp Lưu Trữ Đa Năng', 'hop-luu-tru-da-nang', 450000, NULL, 'Bộ 3 hộp lưu trữ vải canvas có nắp, nhiều kích cỡ, có thể gấp gọn.', 50, '{"dimensions": "40x30x25 cm", "material": "Vải canvas"}', 'https://images.pexels.com/photos/9646747/pexels-photo-9646747.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop');

-- =====================================
-- 4. ẢNH PHỤ SẢN PHẨM
-- =====================================
INSERT INTO product_images (product_id, image_url, display_order) VALUES
(1, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', 1),
(1, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80', 2),
(2, 'https://images.pexels.com/photos/276566/pexels-photo-276566.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop', 1),
(6, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80', 1),
(11, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80', 1);

-- =====================================
-- 5. MÃ GIẢM GIÁ
-- =====================================
INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, valid_from, valid_until, usage_limit, used_count, is_active) VALUES
('LUXDECOR10', 10, 'PERCENT', 1000000, '2025-01-01 00:00:00', '2027-12-31 23:59:59', 100, 0, TRUE),
('GIAM100K', 100000, 'FIXED', 3000000, '2025-01-01 00:00:00', '2027-12-31 23:59:59', 50, 0, TRUE);

-- =====================================
-- 6. ĐÁNH GIÁ MẪU
-- =====================================
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
-- PK001 (Sofa Xám Hiện Đại)
(2, 1, 5, 'Sofa rất đẹp, chất lượng tốt, giao hàng nhanh.'),
(3, 1, 4, 'Đệm ngồi êm ái, màu xám sang trọng, đóng gói cẩn thận.'),
(4, 1, 5, 'Cực kỳ ưng ý luôn, nhân viên giao hàng nhiệt tình!'),

-- PK002 (Sofa Góc Chữ L Nâu)
(2, 2, 4, 'Sofa góc rộng rãi thoải mái, da PU mềm đẹp.'),
(4, 2, 5, 'Đẹp xuất sắc, rất xứng đáng với giá tiền.'),

-- PK003 (Bàn Trà Gỗ Sồi)
(3, 3, 5, 'Gỗ sồi tự nhiên chắc chắn, góc cạnh mài nhẵn mịn màng.'),
(5, 3, 4, 'Bàn trà nhỏ gọn xinh xắn, chuẩn phong cách Scandinavian.'),

-- PK004 (Kệ Tivi Gỗ Óc Chó)
(4, 4, 5, 'Gỗ óc chó màu rất sang, kệ chắc chắn và nặng tay.'),
(3, 4, 4, 'Đẹp, nhiều ngăn chứa đồ tiện lợi.'),

-- PK005 (Ghế Thư Giãn Bành)
(5, 5, 5, 'Ngồi đọc sách cực êm và dễ chịu, rất đáng mua.'),
(2, 5, 4, 'Kiểu dáng vintage rất đẹp, phù hợp với phòng khách nhà mình.'),

-- PN001 (Giường Ngủ Gỗ Hiện Đại)
(2, 6, 5, 'Giường gỗ thông lắp đặt chắc chắn, mùi gỗ tự nhiên dễ chịu.'),
(4, 6, 5, 'Giường đẹp, cứng cáp, giao hàng đúng hẹn.'),

-- PN002 (Tủ Quần Áo 3 Cánh)
(3, 7, 4, 'Tủ rộng rãi, chứa được nhiều đồ, lắp ráp hơi lâu một chút.'),
(5, 7, 5, 'Màu gỗ MDF phủ melamine rất mịn, đẹp hiện đại.'),

-- PN003 (Bàn Đầu Giường Nhỏ Gọn)
(4, 8, 5, 'Nhỏ gọn xinh xắn, để cạnh giường rất tiện.'),
(2, 8, 4, 'Gỗ cao su hoàn thiện tốt, đóng gói kỹ lưỡng.'),

-- PN004 (Đèn Ngủ Để Bàn)
(3, 9, 5, 'Ánh sáng vàng ấm dịu, chao đèn vải linen nhìn rất cổ điển và sang.'),
(5, 9, 4, 'Đèn đẹp, thiết kế tinh tế, ánh sáng vừa phải không chói mắt.'),

-- PN005 (Gương Trang Điểm LED)
(5, 10, 4, 'Đèn LED sáng, cảm ứng nhạy, soi gương rất rõ nét.'),
(2, 10, 5, 'Quá tiện lợi luôn, có 3 chế độ màu cực kỳ thích.'),

-- PA001 (Bàn Ăn Gỗ Trắc 6 Ghế)
(3, 11, 5, 'Bàn ăn gỗ trắc quá đẳng cấp, mặt bàn dày dặn đẹp tuyệt vời.'),
(4, 11, 5, 'Hàng cao cấp có khác, cả nhà ai cũng khen đẹp sang trọng.'),

-- PA002 (Ghế Ăn Bọc Nệm Xám)
(4, 12, 5, 'Ghế ăn ngồi êm, chân thép sơn tĩnh điện chắc chắn.'),
(2, 12, 4, 'Nệm êm, bọc vải tốt, dễ dàng lau chùi vệ sinh.'),

-- PA003 (Tủ Rượu Gỗ Sồi)
(5, 13, 4, 'Trưng bày rượu nhìn sang hẳn phòng ăn, đèn LED lung linh.'),
(3, 13, 5, 'Tủ chắc chắn, chất gỗ sồi rất đẹp và vân gỗ tự nhiên.'),

-- PA004 (Bàn Ăn Tròn Đá Marble)
(2, 14, 5, 'Mặt đá marble trắng bóng vân tự nhiên cực kỳ đẹp.'),
(5, 14, 4, 'Bàn tròn tiết kiệm không gian, chân mạ vàng sáng loáng.'),

-- VP001 (Ghế Công Thái Học Premium)
(4, 15, 5, 'Ngồi làm việc cả ngày không bị đau lưng, tựa đầu và tay vịn điều chỉnh linh hoạt.'),
(3, 15, 4, 'Rất nâng đỡ cột sống, chất liệu lưới thoáng mát.'),

-- VP002 (Bàn Làm Việc Nâng Hạ)
(5, 16, 5, 'Động cơ nâng hạ êm ái, ghi nhớ chiều cao rất tiện.'),
(2, 16, 4, 'Khung thép chắc chắn, nâng lên hạ xuống mượt mà.'),

-- VP003 (Kệ Sách 5 Tầng)
(2, 17, 4, 'Kệ chắc chắn, để được nhiều sách, khung thép vững chãi.'),
(4, 17, 5, 'Lắp đặt dễ dàng, gỗ công nghiệp nhưng hoàn thiện rất thẩm mỹ.'),

-- VP004 (Đèn Bàn LED Thông Minh)
(3, 18, 5, 'Có nhiều chế độ sáng và cổng USB sạc điện thoại cực tiện.'),
(5, 18, 4, 'Đèn gập mở linh hoạt, ánh sáng bảo vệ mắt rất tốt.'),

-- KD001 (Tủ Giày 4 Tầng)
(4, 19, 4, 'Cánh lật thông minh tiết kiệm diện tích, chứa được nhiều giày.'),
(2, 19, 5, 'Tủ đẹp, để được gọn gàng khoảng 16 đôi giày của gia đình.'),

-- KD002 (Hộp Lưu Trữ Đa Năng)
(5, 20, 5, 'Hộp vải dày dặn, cứng cáp, màu canvas sạch sẽ.'),
(3, 20, 4, 'Tiện lợi để đựng đồ chơi cho bé hoặc quần áo xếp gọn.');

-- =====================================
-- 7. BIẾN THỂ SẢN PHẨM (PRODUCT VARIANTS)
-- =====================================
INSERT INTO product_variants (product_id, variant_name, sku, price, discount_price, stock_quantity, thumbnail_url) VALUES
-- Sofa Xám Hiện Đại (product_id = 1)
(1, 'Đệm Nỉ / Khung Gỗ Thông', 'PK001-NI', 13900000.00, 12900000.00, 10, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'),
(1, 'Đệm Da PU / Khung Thép', 'PK001-DA', 15900000.00, 14900000.00, 5, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80'),

-- Sofa Góc Chữ L Nâu (product_id = 2)
(2, 'Góc Trái / Da Bò Ý', 'PK002-TRAI', 22500000.00, 19900000.00, 4, 'https://images.pexels.com/photos/276566/pexels-photo-276566.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(2, 'Góc Phải / Da Bò Ý', 'PK002-PHAI', 22500000.00, 19900000.00, 4, 'https://images.pexels.com/photos/276566/pexels-photo-276566.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Bàn Trà Gỗ Sồi (product_id = 3)
(3, 'Màu Tự Nhiên / Gỗ Sồi', 'PK003-NAT', 4500000.00, NULL, 12, 'https://images.pexels.com/photos/6661224/pexels-photo-6661224.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(3, 'Màu Hạt Dẻ / Gỗ Sồi', 'PK003-BRW', 4700000.00, 4400000.00, 8, 'https://images.pexels.com/photos/6661224/pexels-photo-6661224.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Kệ Tivi Gỗ Óc Chó (product_id = 4)
(4, 'Kích thước 1m8 / Gỗ Óc Chó', 'PK004-18M', 8900000.00, NULL, 6, 'https://images.pexels.com/photos/1714433/pexels-photo-1714433.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(4, 'Kích thước 2m0 / Gỗ Óc Chó', 'PK004-20M', 9800000.00, 9200000.00, 4, 'https://images.pexels.com/photos/1714433/pexels-photo-1714433.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Ghế Thư Giãn Bành (product_id = 5)
(5, 'Vải Nhung Xanh Dương / Chân Gỗ', 'PK005-BLU', 6700000.00, NULL, 6, 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80'),
(5, 'Vải Bố Màu Kem / Chân Gỗ', 'PK005-CRE', 6500000.00, 5900000.00, 6, 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=80'),

-- Giường Ngủ Gỗ Hiện Đại (product_id = 6)
(6, '1m6 x 2m / Gỗ Thông', 'PN001-16M', 11500000.00, 9900000.00, 5, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),
(6, '1m8 x 2m / Gỗ Thông', 'PN001-18M', 12500000.00, 10900000.00, 5, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80'),

-- Tủ Quần Áo 3 Cánh (product_id = 7)
(7, 'Màu Vân Gỗ Sồi / MDF', 'PN002-OAK', 9800000.00, NULL, 4, 'https://images.pexels.com/photos/27562190/pexels-photo-27562190.png?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(7, 'Màu Trắng Sứ / MDF', 'PN002-WHT', 9800000.00, 8900000.00, 3, 'https://images.pexels.com/photos/27562190/pexels-photo-27562190.png?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Bàn Đầu Giường Nhỏ Gọn (product_id = 8)
(8, 'Gỗ Cao Su Tự Nhiên', 'PN003-NAT', 2200000.00, NULL, 15, 'https://images.pexels.com/photos/6266190/pexels-photo-6266190.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(8, 'Sơn Trắng Cổ Điển', 'PN003-WHT', 2400000.00, 2100000.00, 10, 'https://images.pexels.com/photos/6266190/pexels-photo-6266190.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Đèn Ngủ Để Bàn (product_id = 9)
(9, 'Chao Vải / Ánh Sáng Vàng', 'PN004-YEL', 890000.00, NULL, 20, 'https://images.pexels.com/photos/17994856/pexels-photo-17994856.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(9, 'Chao Vải / Ánh Sáng Trắng', 'PN004-WHT', 990000.00, 850000.00, 10, 'https://images.pexels.com/photos/17994856/pexels-photo-17994856.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Gương Trang Điểm LED (product_id = 10)
(10, 'Kính Tròn Đường kính 60cm', 'PN005-60', 3500000.00, NULL, 10, 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80'),
(10, 'Kính Tròn Đường kính 80cm', 'PN005-80', 4200000.00, 3800000.00, 8, 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=80'),

-- Bàn Ăn Gỗ Trắc 6 Ghế (product_id = 11)
(11, 'Kèm 6 Ghế Bọc Nỉ / Gỗ Trắc', 'PA001-6G', 18900000.00, NULL, 3, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80'),
(11, 'Kèm 8 Ghế Bọc Nỉ / Gỗ Trắc', 'PA001-8G', 22900000.00, 20900000.00, 2, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80'),

-- Ghế Ăn Bọc Nệm Xám (product_id = 12)
(12, 'Chân Thép Đen', 'PA002-DEN', 1800000.00, 1500000.00, 25, 'https://images.pexels.com/photos/15071703/pexels-photo-15071703.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(12, 'Chân Mạ Vàng', 'PA002-VANG', 2100000.00, 1800000.00, 15, 'https://images.pexels.com/photos/15071703/pexels-photo-15071703.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Tủ Rượu Gỗ Sồi (product_id = 13)
(13, 'Bản Kính Trong Suốt / Gỗ Sồi', 'PA003-CLR', 7500000.00, NULL, 3, 'https://images.pexels.com/photos/27819659/pexels-photo-27819659.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(13, 'Bản Kính Mờ Cường Lực / Gỗ Sồi', 'PA003-FRT', 8000000.00, 7600000.00, 3, 'https://images.pexels.com/photos/27819659/pexels-photo-27819659.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Bàn Ăn Tròn Đá Marble (product_id = 14)
(14, 'Đá Trắng Carrara / Chân Mạ Vàng', 'PA004-WHT', 14500000.00, NULL, 2, 'https://images.pexels.com/photos/32709576/pexels-photo-32709576.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(14, 'Đá Đen Nero Marquina / Chân Mạ Vàng', 'PA004-BLK', 15500000.00, 14500000.00, 2, 'https://images.pexels.com/photos/32709576/pexels-photo-32709576.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Ghế Công Thái Học Premium (product_id = 15)
(15, 'Khung Đen / Lưới Đen', 'VP001-DEN', 5900000.00, 5200000.00, 12, 'https://images.pexels.com/photos/18435547/pexels-photo-18435547.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(15, 'Khung Trắng / Lưới Xám', 'VP001-XAM', 6200000.00, 5500000.00, 8, 'https://images.pexels.com/photos/18435547/pexels-photo-18435547.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Bàn Làm Việc Nâng Hạ (product_id = 16)
(16, 'Mặt Tre 1m4 / Chân Đen', 'VP002-140', 8500000.00, NULL, 7, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'),
(16, 'Mặt Gỗ Óc Chó 1m6 / Chân Trắng', 'VP002-160', 10500000.00, 9500000.00, 5, 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&q=80'),

-- Kệ Sách 5 Tầng (product_id = 17)
(17, 'Khung Đen / Gỗ Óc Chó', 'VP003-DK', 3200000.00, NULL, 8, 'https://images.pexels.com/photos/4440116/pexels-photo-4440116.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(17, 'Khung Trắng / Gỗ Sồi', 'VP003-LT', 3200000.00, 2900000.00, 7, 'https://images.pexels.com/photos/4440116/pexels-photo-4440116.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Đèn Bàn LED Thông Minh (product_id = 18)
(18, 'Màu Đen Nhám', 'VP004-BLK', 1200000.00, NULL, 20, 'https://images.pexels.com/photos/15519510/pexels-photo-15519510.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(18, 'Màu Trắng Tuyết', 'VP004-WHT', 1200000.00, NULL, 15, 'https://images.pexels.com/photos/15519510/pexels-photo-15519510.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Tủ Giày 4 Tầng (product_id = 19)
(19, 'Cánh Lật / Vân Gỗ Sồi', 'KD001-OAK', 2800000.00, NULL, 12, 'https://images.pexels.com/photos/37595188/pexels-photo-37595188.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(19, 'Cánh Lật / Màu Walnut Trầm', 'KD001-WAL', 3000000.00, 2700000.00, 10, 'https://images.pexels.com/photos/37595188/pexels-photo-37595188.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),

-- Hộp Lưu Trữ Đa Năng (product_id = 20)
(20, 'Vải Canvas Màu Kem', 'KD002-CRE', 450000.00, NULL, 30, 'https://images.pexels.com/photos/9646747/pexels-photo-9646747.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop'),
(20, 'Vải Canvas Màu Xám Ghi', 'KD002-GRY', 450000.00, NULL, 20, 'https://images.pexels.com/photos/9646747/pexels-photo-9646747.jpeg?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop');

-- Đồng bộ lại stock_quantity cho các sản phẩm chính có biến thể
UPDATE products p
INNER JOIN (
    SELECT product_id, SUM(stock_quantity) as total_stock
    FROM product_variants
    GROUP BY product_id
) v ON p.id = v.product_id
SET p.stock_quantity = v.total_stock;

