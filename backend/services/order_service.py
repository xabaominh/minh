import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float
from models.order import serialize_order


def create_order(user_id, payment_method, shipping_address):
    """
    Tạo đơn hàng mới từ giỏ hàng.
    Trả về (result_dict, error_message, status_code).
    """
    if payment_method not in ('COD', 'BANK_TRANSFER'):
        return None, "Phương thức thanh toán không hợp lệ", 400
    if not shipping_address:
        return None, "Vui lòng nhập địa chỉ giao hàng", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Lấy giỏ hàng
        cursor.execute("""
            SELECT ci.id AS item_id, ci.quantity, p.id AS product_id, p.price, p.stock_quantity, p.product_name
            FROM cart c
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
            "INSERT INTO orders (user_id, total_amount, payment_method, shipping_address) VALUES (%s,%s,%s,%s)",
            (user_id, total, payment_method, shipping_address)
        )
        order_id = cursor.lastrowid

        # Tạo order_items + trừ stock
        for item in cart_items:
            cursor.execute(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (%s,%s,%s,%s)",
                (order_id, item['product_id'], item['quantity'], item['price'])
            )
            cursor.execute(
                "UPDATE products SET stock_quantity = stock_quantity - %s WHERE id = %s",
                (item['quantity'], item['product_id'])
            )

        # Xóa giỏ hàng
        cursor.execute("SELECT id FROM cart WHERE user_id = %s", (user_id,))
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
    """Lấy danh sách đơn hàng của user."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, total_amount, payment_method, order_status, shipping_address, created_at
            FROM orders WHERE user_id = %s ORDER BY created_at DESC
        """, (user_id,))
        orders = cursor.fetchall()

        # Serialize: datetime → string
        result = [serialize_order(order) for order in orders]
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
            SELECT oi.*, p.product_name, p.thumbnail_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
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
