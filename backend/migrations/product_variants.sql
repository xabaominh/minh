-- Product variants: kích cỡ, màu sắc, chất liệu
-- Chạy sau schema.sql / seed.sql trên DB đã tồn tại

CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    sku VARCHAR(80) NOT NULL UNIQUE,
    size VARCHAR(80) NOT NULL,
    color VARCHAR(80) NOT NULL,
    material VARCHAR(120) NOT NULL,
    price DECIMAL(12,2) DEFAULT NULL,
    discount_price DECIMAL(12,2) DEFAULT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_variant_combo (product_id, size, color, material)
);

-- Chạy: python migrations/seed_variants.py để chèn biến thể mẫu

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS variant_id INT NULL AFTER product_id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id INT NULL AFTER product_id;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_size VARCHAR(80) NULL AFTER product_name;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_color VARCHAR(80) NULL AFTER variant_size;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_material VARCHAR(120) NULL AFTER variant_color;
