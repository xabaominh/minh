-- Gắn đánh giá với đơn hàng: mỗi lần mua hoàn thành được đánh giá một lần
-- Chạy file này một lần trên database đã tồn tại.

ALTER TABLE reviews
    ADD COLUMN order_id INT NULL AFTER product_id;

ALTER TABLE reviews
    ADD CONSTRAINT fk_reviews_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Bỏ qua nếu đã có cột/constraint (lỗi duplicate column name)
