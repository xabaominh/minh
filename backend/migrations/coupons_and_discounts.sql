-- Chạy file này nếu DB đã tồn tại (bổ sung giá KM + mã giảm giá)
USE furniture_shop;

UPDATE products SET discount_price = 13900000 WHERE id = 1;
UPDATE products SET discount_price = 19900000 WHERE id = 2;
UPDATE products SET discount_price = 10900000 WHERE id = 6;
UPDATE products SET discount_price = 5200000 WHERE id = 15;
UPDATE products SET discount_price = 1500000 WHERE id = 12;

INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, valid_from, valid_until, usage_limit, used_count, is_active)
SELECT * FROM (
    SELECT 'LUXDECOR10' AS code, 10 AS discount_amount, 'PERCENT' AS discount_type, 1000000 AS min_order_amount,
           '2025-01-01 00:00:00' AS valid_from, '2027-12-31 23:59:59' AS valid_until, 100 AS usage_limit, 0 AS used_count, TRUE AS is_active
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'LUXDECOR10');

INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, valid_from, valid_until, usage_limit, used_count, is_active)
SELECT * FROM (
    SELECT 'GIAM100K', 100000, 'FIXED', 3000000, '2025-01-01 00:00:00', '2027-12-31 23:59:59', 50, 0, TRUE
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'GIAM100K');
