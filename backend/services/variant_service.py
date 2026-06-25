import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float, effective_price


def variant_unit_price(product_price, product_discount, variant_price, variant_discount):
    price = variant_price if variant_price is not None else product_price
    discount = variant_discount if variant_discount is not None else product_discount
    return effective_price(price, discount)


def get_product_variants(product_id, active_only=True):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT id, product_id, sku, size, color, material,
                   price, discount_price, stock_quantity, is_active
            FROM product_variants
            WHERE product_id = %s
        """
        if active_only:
            query += " AND is_active = TRUE"
        query += " ORDER BY id"
        cursor.execute(query, (product_id,))
        return decimal_to_float(cursor.fetchall()), None
    except mysql.connector.Error as err:
        print(f"Variants Error: {err}")
        return None, "Không thể tải biến thể sản phẩm"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_variant_by_id(variant_id, product_id=None):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        if product_id:
            cursor.execute(
                """
                SELECT pv.*, p.price AS product_price, p.discount_price AS product_discount,
                       p.product_name, p.thumbnail_url, p.is_active AS product_active,
                       p.deleted_at
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = %s AND pv.product_id = %s
                """,
                (variant_id, product_id)
            )
        else:
            cursor.execute(
                """
                SELECT pv.*, p.price AS product_price, p.discount_price AS product_discount,
                       p.product_name, p.thumbnail_url, p.is_active AS product_active,
                       p.deleted_at
                FROM product_variants pv
                JOIN products p ON pv.product_id = p.id
                WHERE pv.id = %s
                """,
                (variant_id,)
            )
        row = cursor.fetchone()
        if not row or row.get('deleted_at'):
            return None, "Không tìm thấy biến thể"
        if not row.get('is_active') or not row.get('product_active'):
            return None, "Biến thể không khả dụng"
        row['unit_price'] = variant_unit_price(
            row['product_price'], row.get('product_discount'),
            row.get('price'), row.get('discount_price')
        )
        return decimal_to_float(row), None
    except mysql.connector.Error as err:
        print(f"Variant Detail Error: {err}")
        return None, "Không thể tải biến thể"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def build_variant_options(variants):
    sizes = sorted({v['size'] for v in variants})
    colors = sorted({v['color'] for v in variants})
    materials = sorted({v['material'] for v in variants})
    return {'sizes': sizes, 'colors': colors, 'materials': materials}
