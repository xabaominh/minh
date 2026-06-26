-- Cập nhật ảnh phụ từ anh_phu.txt (chạy trên DB đã có dữ liệu)
USE furniture_shop;

DELETE FROM product_images WHERE product_id IN (2, 3, 4, 7, 8, 10, 12, 13, 16, 17);

INSERT INTO product_images (product_id, image_url, display_order) VALUES
-- Product 2 (Sofa Góc Chữ L Nâu)
(2, 'https://images.pexels.com/photos/36681535/pexels-photo-36681535.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(2, 'https://images.pexels.com/photos/7786775/pexels-photo-7786775.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 3 (Bàn Trà Gỗ Sồi)
(3, 'https://images.pexels.com/photos/7607460/pexels-photo-7607460.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(3, 'https://images.pexels.com/photos/33219216/pexels-photo-33219216.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 4 (Kệ Tivi Gỗ Óc Chó)
(4, 'https://images.pexels.com/photos/5755711/pexels-photo-5755711.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(4, 'https://images.pexels.com/photos/31338029/pexels-photo-31338029.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 7 (Tủ Quần Áo 3 Cánh)
(7, 'https://images.pexels.com/photos/17495860/pexels-photo-17495860.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(7, 'https://images.pexels.com/photos/36887757/pexels-photo-36887757.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 8 (Bàn Đầu Giường Nhỏ Gọn)
(8, 'https://images.pexels.com/photos/31967700/pexels-photo-31967700.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(8, 'https://images.pexels.com/photos/7195725/pexels-photo-7195725.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 10 (Gương Trang Điểm LED)
(10, 'https://images.pexels.com/photos/13068369/pexels-photo-13068369.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(10, 'https://images.pexels.com/photos/5646480/pexels-photo-5646480.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 12 (Ghế Ăn Bọc Nệm Xám)
(12, 'https://images.pexels.com/photos/6920630/pexels-photo-6920630.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(12, 'https://images.pexels.com/photos/6920630/pexels-photo-6920630.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 13 (Tủ Rượu Gỗ Sồi)
(13, 'https://images.pexels.com/photos/27819641/pexels-photo-27819641.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(13, 'https://images.pexels.com/photos/34937973/pexels-photo-34937973.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 16 (Bàn Làm Việc Nâng Hạ)
(16, 'https://images.pexels.com/photos/8001042/pexels-photo-8001042.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(16, 'https://images.pexels.com/photos/8001034/pexels-photo-8001034.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2),
-- Product 17 (Kệ Sách 5 Tầng)
(17, 'https://images.pexels.com/photos/17390716/pexels-photo-17390716.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 1),
(17, 'https://images.pexels.com/photos/16246163/pexels-photo-16246163.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop', 2);
