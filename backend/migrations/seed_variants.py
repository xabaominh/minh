"""Seed product variants for all products. Run: python migrations/seed_variants.py"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db

# (product_id, sku_suffix, size, color, material, price, discount_price, stock)
VARIANTS = [
    # PK001 Sofa Xám
    (1, 'V01', '220x85x80 cm', 'Xám', 'Vải bọc', None, None, 6),
    (1, 'V02', '240x90x85 cm', 'Xám', 'Vải bọc', 16900000, 14900000, 4),
    (1, 'V03', '220x85x80 cm', 'Be', 'Vải bọc', None, None, 5),
    (1, 'V04', '220x85x80 cm', 'Xám', 'Da PU', 18900000, 16900000, 3),
    (1, 'V05', '220x85x80 cm', 'Xanh navy', 'Vải bọc', None, None, 4),
    # PK002 Sofa góc
    (2, 'V01', '280x170x85 cm', 'Nâu', 'Da PU', None, None, 4),
    (2, 'V02', '280x170x85 cm', 'Đen', 'Da PU', None, None, 3),
    (2, 'V03', '300x180x85 cm', 'Nâu', 'Da PU', 23500000, 20900000, 2),
    (2, 'V04', '280x170x85 cm', 'Nâu', 'Vải bọc', 21500000, 18900000, 3),
    # PK003 Bàn trà
    (3, 'V01', '120x60x45 cm', 'Tự nhiên', 'Gỗ sồi', None, None, 10),
    (3, 'V02', '140x70x45 cm', 'Tự nhiên', 'Gỗ sồi', 5200000, None, 6),
    (3, 'V03', '120x60x45 cm', 'Walnut', 'Gỗ sồi', 4800000, None, 8),
    (4, 'V01', '180x40x55 cm', 'Walnut', 'Gỗ óc chó', None, None, 5),
    (4, 'V02', '200x45x55 cm', 'Walnut', 'Gỗ óc chó', 9500000, None, 3),
    (4, 'V03', '180x40x55 cm', 'Đen', 'Gỗ óc chó + thép', 9200000, None, 4),
    (5, 'V01', '75x80x95 cm', 'Xám', 'Gỗ tự nhiên', None, None, 6),
    (5, 'V02', '75x80x95 cm', 'Xanh lá', 'Gỗ tự nhiên', None, None, 4),
    (5, 'V03', '75x80x95 cm', 'Xám', 'Vải bọc', 6900000, None, 5),
    # PN001 Giường
    (6, 'V01', '200x180 cm', 'Tự nhiên', 'Gỗ thông', None, None, 5),
    (6, 'V02', '200x200 cm', 'Tự nhiên', 'Gỗ thông', 13500000, 11900000, 3),
    (6, 'V03', '200x180 cm', 'Trắng', 'Gỗ thông', None, None, 4),
    (6, 'V04', '200x180 cm', 'Tự nhiên', 'Gỗ sồi', 14500000, 12900000, 2),
    (7, 'V01', '150x60x200 cm', 'Trắng', 'Gỗ MDF', None, None, 4),
    (7, 'V02', '180x60x200 cm', 'Trắng', 'Gỗ MDF', 10800000, None, 2),
    (7, 'V03', '150x60x200 cm', 'Walnut', 'Gỗ MDF', 10200000, None, 3),
    (8, 'V01', '45x40x55 cm', 'Tự nhiên', 'Gỗ cao su', None, None, 12),
    (8, 'V02', '50x45x55 cm', 'Tự nhiên', 'Gỗ cao su', 2500000, None, 8),
    (8, 'V03', '45x40x55 cm', 'Trắng', 'Gỗ cao su', None, None, 10),
    (9, 'V01', '25x25x45 cm', 'Kem', 'Vải linen', None, None, 15),
    (9, 'V02', '25x25x45 cm', 'Xám', 'Vải linen', None, None, 12),
    (9, 'V03', '30x30x50 cm', 'Kem', 'Vải linen', 990000, None, 10),
    (10, 'V01', '60x80 cm', 'Bạc', 'Nhựa + LED', None, None, 9),
    (10, 'V02', '70x90 cm', 'Bạc', 'Nhựa + LED', 3900000, None, 6),
    (10, 'V03', '60x80 cm', 'Đen', 'Nhựa + LED', None, None, 8),
    # PA
    (11, 'V01', '180x90x75 cm', 'Tự nhiên', 'Gỗ trắc', None, None, 3),
    (11, 'V02', '200x100x75 cm', 'Tự nhiên', 'Gỗ trắc', 20500000, None, 2),
    (11, 'V03', '180x90x75 cm', 'Walnut', 'Gỗ trắc', 19500000, None, 2),
    (12, 'V01', '45x50x85 cm', 'Xám', 'Vải chống thấm', None, None, 20),
    (12, 'V02', '45x50x85 cm', 'Be', 'Vải chống thấm', None, None, 15),
    (12, 'V03', '45x50x85 cm', 'Xám', 'Da PU', 2100000, 1750000, 10),
    (13, 'V01', '80x40x180 cm', 'Tự nhiên', 'Gỗ sồi Mỹ', None, None, 3),
    (13, 'V02', '100x45x200 cm', 'Tự nhiên', 'Gỗ sồi Mỹ', 8200000, None, 2),
    (13, 'V03', '80x40x180 cm', 'Đen', 'Gỗ sồi + kính', 7800000, None, 3),
    (14, 'V01', 'Ø120 cm', 'Trắng', 'Đá marble + thép', None, None, 2),
    (14, 'V02', 'Ø140 cm', 'Trắng', 'Đá marble + thép', 16500000, None, 1),
    (14, 'V03', 'Ø120 cm', 'Đen', 'Đá marble + thép', 15200000, None, 2),
    # VP
    (15, 'V01', 'Tiêu chuẩn', 'Đen', 'Lưới + nhựa', None, None, 10),
    (15, 'V02', 'Cao cấp', 'Đen', 'Lưới + nhựa', 6200000, 5500000, 6),
    (15, 'V03', 'Tiêu chuẩn', 'Xám', 'Lưới + nhựa', None, None, 8),
    (15, 'V04', 'Tiêu chuẩn', 'Đen', 'Da PU', 6500000, 5800000, 5),
    (16, 'V01', '140x70 cm', 'Tự nhiên', 'Gỗ tre', None, None, 6),
    (16, 'V02', '160x80 cm', 'Tự nhiên', 'Gỗ tre', 9200000, None, 4),
    (16, 'V03', '140x70 cm', 'Đen', 'Gỗ tre + thép', 8800000, None, 5),
    (17, 'V01', '80x30x180 cm', 'Walnut', 'Gỗ MDF + thép', None, None, 8),
    (17, 'V02', '100x30x180 cm', 'Walnut', 'Gỗ MDF + thép', 3600000, None, 5),
    (17, 'V03', '80x30x180 cm', 'Trắng', 'Gỗ MDF + thép', None, None, 7),
    (18, 'V01', '15x15x45 cm', 'Trắng', 'Nhựa ABS', None, None, 18),
    (18, 'V02', '15x15x45 cm', 'Đen', 'Nhựa ABS', None, None, 15),
    (18, 'V03', '18x18x50 cm', 'Trắng', 'Nhựa ABS', 1400000, None, 12),
    # KD
    (19, 'V01', '80x30x120 cm', 'Trắng', 'Gỗ MDF', None, None, 11),
    (19, 'V02', '100x35x120 cm', 'Trắng', 'Gỗ MDF', 3100000, None, 7),
    (19, 'V03', '80x30x120 cm', 'Walnut', 'Gỗ MDF', None, None, 9),
    (20, 'V01', '40x30x25 cm', 'Xám', 'Vải canvas', None, None, 25),
    (20, 'V02', '50x40x30 cm', 'Be', 'Vải canvas', 550000, None, 20),
    (20, 'V03', '40x30x25 cm', 'Xanh navy', 'Vải canvas', None, None, 22),
]

def main():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT id, sku FROM products ORDER BY id')
    products = {row['id']: row['sku'] for row in cursor.fetchall()}

    inserted = 0
    for product_id, suffix, size, color, material, price, discount, stock in VARIANTS:
        if product_id not in products:
            continue
        sku = f"{products[product_id]}-{suffix}"
        cursor.execute('SELECT id FROM product_variants WHERE sku = %s', (sku,))
        if cursor.fetchone():
            continue
        cursor.execute(
            """
            INSERT INTO product_variants
            (product_id, sku, size, color, material, price, discount_price, stock_quantity)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (product_id, sku, size, color, material, price, discount, stock)
        )
        inserted += 1

    conn.commit()

    # cart_items: gán variant mặc định nếu cột tồn tại và đang NULL
    try:
        cursor.execute("SHOW COLUMNS FROM cart_items LIKE 'variant_id'")
        if cursor.fetchone():
            cursor.execute("""
                UPDATE cart_items ci
                JOIN (
                    SELECT product_id, MIN(id) AS first_variant_id
                    FROM product_variants GROUP BY product_id
                ) fv ON fv.product_id = ci.product_id
                SET ci.variant_id = fv.first_variant_id
                WHERE ci.variant_id IS NULL
            """)
            conn.commit()
    except Exception as e:
        print('cart migrate note:', e)

    print(f'Seeded {inserted} variants')
    cursor.close()
    conn.close()


if __name__ == '__main__':
    main()
