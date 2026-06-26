-- Cập nhật ảnh phụ 1: Đèn Ngủ Để Bàn (9), Đèn Bàn LED Thông Minh (18)
USE furniture_shop;

UPDATE product_images
SET image_url = 'https://images.pexels.com/photos/19227253/pexels-photo-19227253.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop'
WHERE product_id = 9 AND display_order = 1;

UPDATE product_images
SET image_url = 'https://images.pexels.com/photos/11784437/pexels-photo-11784437.jpeg?auto=compress&cs=srgb&w=960&h=720&fit=crop'
WHERE product_id = 18 AND display_order = 1;
