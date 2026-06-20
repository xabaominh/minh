USE furniture_shop;

ALTER TABLE orders
    ADD COLUMN receiver_name VARCHAR(100) NULL AFTER order_status,
    ADD COLUMN receiver_phone VARCHAR(20) NULL AFTER receiver_name;
