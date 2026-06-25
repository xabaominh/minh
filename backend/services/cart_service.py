import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float, effective_price


def _get_or_create_cart(cursor, conn, user_id):
    """Tìm hoặc tạo cart cho user. Trả về cart_id."""
    cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
    cart = cursor.fetchone()
    if not cart:
        cursor.execute("INSERT INTO carts (user_id) VALUES (%s)", (user_id,))
        conn.commit()
        return cursor.lastrowid
    return cart['id']


def get_cart(user_id):
    """Lấy giỏ hàng của user."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT ci.id AS item_id, ci.quantity, ci.variant_id,
                   p.id AS product_id, p.product_name, p.price, p.discount_price,
                   p.thumbnail_url, p.stock_quantity,
                   v.variant_name, v.price AS variant_price, v.discount_price AS variant_discount_price,
                   v.thumbnail_url AS variant_thumbnail, v.stock_quantity AS variant_stock
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN product_variants v ON ci.variant_id = v.id
            WHERE c.user_id = %s
        """, (user_id,))
        items = cursor.fetchall()

        for item in items:
            if item.get('variant_id'):
                item['price'] = item['variant_price']
                item['discount_price'] = item['variant_discount_price']
                if item.get('variant_thumbnail'):
                    item['thumbnail_url'] = item['variant_thumbnail']
                item['stock_quantity'] = item['variant_stock']
            item['unit_price'] = effective_price(item['price'], item.get('discount_price'))

        total = sum(item['unit_price'] * item['quantity'] for item in items)

        return decimal_to_float({"items": items, "total": float(total)}), None

    except mysql.connector.Error as err:
        print(f"Cart Error: {err}")
        return None, "Lỗi truy vấn giỏ hàng"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def add_item(user_id, product_id, quantity=1, variant_id=None):
    """Thêm sản phẩm vào giỏ hàng."""
    if not product_id:
        return "Thiếu product_id", 400

    if variant_id:
        try:
            variant_id = int(variant_id)
        except (ValueError, TypeError):
            variant_id = None

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cart_id = _get_or_create_cart(cursor, conn, user_id)

        # Kiểm tra đã có trong giỏ chưa
        if variant_id:
            cursor.execute(
                "SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s AND variant_id = %s",
                (cart_id, product_id, variant_id)
            )
        else:
            cursor.execute(
                "SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s AND variant_id IS NULL",
                (cart_id, product_id)
            )
        existing = cursor.fetchone()

        if existing:
            new_qty = existing['quantity'] + quantity
            cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (new_qty, existing['id']))
        else:
            if variant_id:
                cursor.execute(
                    "INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (%s,%s,%s,%s)",
                    (cart_id, product_id, variant_id, quantity)
                )
            else:
                cursor.execute(
                    "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s,%s,%s)",
                    (cart_id, product_id, quantity)
                )

        conn.commit()
        return None, 200

    except mysql.connector.Error as err:
        print(f"Add to cart Error: {err}")
        return "Lỗi thêm giỏ hàng", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_item(user_id, item_id, quantity):
    """Cập nhật số lượng sản phẩm trong giỏ."""
    if not item_id or quantity is None:
        return "Thiếu thông tin", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Xác minh item thuộc user
        cursor.execute("""
            SELECT ci.id FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = %s AND c.user_id = %s
        """, (item_id, user_id))

        if not cursor.fetchone():
            return "Không tìm thấy sản phẩm trong giỏ", 404

        if quantity <= 0:
            cursor.execute("DELETE FROM cart_items WHERE id = %s", (item_id,))
        else:
            cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (quantity, item_id))

        conn.commit()
        return None, 200

    except mysql.connector.Error as err:
        print(f"Update cart Error: {err}")
        return "Lỗi cập nhật", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def remove_item(user_id, item_id):
    """Xóa sản phẩm khỏi giỏ hàng."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT ci.id FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = %s AND c.user_id = %s
        """, (item_id, user_id))

        if not cursor.fetchone():
            return "Không tìm thấy", 404

        cursor.execute("DELETE FROM cart_items WHERE id = %s", (item_id,))
        conn.commit()
        return None, 200

    except mysql.connector.Error as err:
        print(f"Remove cart Error: {err}")
        return "Lỗi xóa", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def merge_cart(user_id, items):
    """Gộp giỏ hàng từ localStorage vào server."""
    if not items:
        return None, 200

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cart_id = _get_or_create_cart(cursor, conn, user_id)

        for item in items:
            pid = item.get('product_id')
            qty = item.get('quantity', 1)
            vid = item.get('variant_id')
            if not pid:
                continue

            try:
                pid = int(pid)
                qty = int(qty)
                vid = int(vid) if vid else None
            except (ValueError, TypeError):
                continue

            if vid:
                cursor.execute(
                    "SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s AND variant_id = %s",
                    (cart_id, pid, vid)
                )
            else:
                cursor.execute(
                    "SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s AND variant_id IS NULL",
                    (cart_id, pid)
                )
            existing = cursor.fetchone()
            if existing:
                new_qty = existing['quantity'] + qty
                cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (new_qty, existing['id']))
            else:
                if vid:
                    cursor.execute(
                        "INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (%s,%s,%s,%s)",
                        (cart_id, pid, vid, qty)
                    )
                else:
                    cursor.execute(
                        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s,%s,%s)",
                        (cart_id, pid, qty)
                    )

        conn.commit()
        return None, 200

    except mysql.connector.Error as err:
        print(f"Merge cart Error: {err}")
        return "Lỗi gộp giỏ hàng", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
