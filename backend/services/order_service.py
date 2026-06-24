import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float
from models.order import serialize_order


def create_order(user_id, payment_method, shipping_address, receiver_name='', receiver_phone=''):
    """
    Tạo đơn hàng mới từ giỏ hàng.
    Trả về (result_dict, error_message, status_code).
    """
    if payment_method not in ('COD', 'BANK_TRANSFER'):
        return None, "Phương thức thanh toán không hợp lệ", 400
    if not shipping_address:
        return None, "Vui lòng nhập địa chỉ giao hàng", 400
    receiver_name = receiver_name.strip() or "Người nhận"
    receiver_phone = receiver_phone.strip()

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Lấy giỏ hàng
        cursor.execute("""
            SELECT ci.id AS item_id, ci.quantity, p.id AS product_id, p.price, p.stock_quantity, p.product_name
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cursor.fetchall()

        if not cart_items:
            return None, "Giỏ hàng trống", 400

        # Kiểm tra tồn kho
        for item in cart_items:
            if item['quantity'] > item['stock_quantity']:
                return None, f"Sản phẩm '{item['product_name']}' không đủ hàng (còn {item['stock_quantity']})", 400

        # Tính tổng
        total = sum(item['price'] * item['quantity'] for item in cart_items)

        # Tạo đơn hàng
        cursor.execute(
            """
            INSERT INTO orders (
                user_id, total_amount, discount_amount, final_amount,
                order_status, receiver_name, receiver_phone, shipping_address
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (user_id, total, 0, total, 'PENDING', receiver_name, receiver_phone, shipping_address)
        )
        order_id = cursor.lastrowid

        # Insert vào payments table
        cursor.execute(
            "INSERT INTO payments (order_id, payment_method, amount) VALUES (%s,%s,%s)",
            (order_id, payment_method, total)
        )

        # Tạo order_items + trừ stock
        for item in cart_items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (%s,%s,%s,%s,%s)",
                (order_id, item['product_id'], item['product_name'], item['quantity'], item['price'])
            )
            cursor.execute(
                "UPDATE products SET stock_quantity = stock_quantity - %s WHERE id = %s",
                (item['quantity'], item['product_id'])
            )

        # Xóa giỏ hàng
        cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
        cart = cursor.fetchone()
        if cart:
            cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart['id'],))

        conn.commit()

        return {"order_id": order_id, "total": float(total)}, None, 201

    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Order Error: {err}")
        return None, "Lỗi tạo đơn hàng", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_user_orders(user_id):
    """Lấy danh sách đơn hàng của user (kèm chi tiết sản phẩm)."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT o.id, o.total_amount, p.payment_method, o.order_status,
                   o.receiver_name, o.receiver_phone, o.shipping_address, o.created_at
            FROM orders o
            LEFT JOIN payments p ON o.id = p.order_id
            WHERE o.user_id = %s ORDER BY o.created_at DESC
        """, (user_id,))
        orders = cursor.fetchall()

        # Lấy chi tiết sản phẩm cho từng đơn hàng
        result = []
        for order in orders:
            cursor.execute("""
                SELECT oi.product_name, oi.quantity, oi.price, p.thumbnail_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            items = cursor.fetchall()
            order_data = serialize_order(order)
            order_data['items'] = decimal_to_float(items)
            result.append(order_data)

        return result, None

    except mysql.connector.Error as err:
        print(f"Orders Error: {err}")
        return None, "Lỗi truy vấn đơn hàng"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_order_detail(user_id, order_id):
    """Lấy chi tiết 1 đơn hàng."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM orders WHERE id = %s AND user_id = %s
        """, (order_id, user_id))
        order = cursor.fetchone()

        if not order:
            return None, "Không tìm thấy đơn hàng"

        cursor.execute("""
            SELECT oi.*, p.thumbnail_url
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        order = serialize_order(order)
        order['items'] = decimal_to_float(items)

        return order, None

    except mysql.connector.Error as err:
        print(f"Order Detail Error: {err}")
        return None, "Lỗi truy vấn"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
