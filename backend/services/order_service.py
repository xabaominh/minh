import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float, effective_price
from utils.validators import validate_phone
from services.coupon_service import validate_coupon
from services.variant_service import variant_unit_price
from models.order import serialize_order


def create_order(user_id, payment_method, shipping_address, receiver_name='', receiver_phone='', coupon_code=''):
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
    if not validate_phone(receiver_phone):
        return None, "Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Lấy giỏ hàng
        cursor.execute("""
            SELECT ci.id AS item_id, ci.quantity, ci.variant_id,
                   p.id AS product_id, p.price, p.discount_price, p.product_name,
                   pv.stock_quantity, pv.size AS variant_size, pv.color AS variant_color,
                   pv.material AS variant_material, pv.price AS variant_price,
                   pv.discount_price AS variant_discount
            FROM carts c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            JOIN product_variants pv ON ci.variant_id = pv.id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cursor.fetchall()

        if not cart_items:
            return None, "Giỏ hàng trống", 400

        for item in cart_items:
            item['unit_price'] = variant_unit_price(
                item['price'], item.get('discount_price'),
                item.get('variant_price'), item.get('variant_discount')
            )

        # Kiểm tra tồn kho
        for item in cart_items:
            if item['quantity'] > item['stock_quantity']:
                label = f"{item['product_name']} ({item['variant_size']} / {item['variant_color']} / {item['variant_material']})"
                return None, f"Sản phẩm '{label}' không đủ hàng (còn {item['stock_quantity']})", 400

        # Tính tổng
        total = sum(item['unit_price'] * item['quantity'] for item in cart_items)

        discount_amount = 0
        coupon_id = None
        if coupon_code:
            coupon_data, coupon_error, coupon_status = validate_coupon(coupon_code, total)
            if coupon_error:
                return None, coupon_error, coupon_status
            discount_amount = coupon_data['discount_amount']
            coupon_id = coupon_data['coupon_id']

        final_amount = total - discount_amount

        # Tạo đơn hàng
        cursor.execute(
            """
            INSERT INTO orders (
                user_id, coupon_id, total_amount, discount_amount, final_amount,
                order_status, receiver_name, receiver_phone, shipping_address
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (user_id, coupon_id, total, discount_amount, final_amount,
             'PENDING', receiver_name, receiver_phone, shipping_address)
        )
        order_id = cursor.lastrowid

        # Insert vào payments table
        cursor.execute(
            "INSERT INTO payments (order_id, payment_method, amount) VALUES (%s,%s,%s)",
            (order_id, payment_method, final_amount)
        )

        # Tạo order_items + trừ stock
        for item in cart_items:
            cursor.execute(
                """
                INSERT INTO order_items (
                    order_id, product_id, variant_id, product_name,
                    variant_size, variant_color, variant_material,
                    quantity, price
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                """,
                (
                    order_id, item['product_id'], item['variant_id'], item['product_name'],
                    item['variant_size'], item['variant_color'], item['variant_material'],
                    item['quantity'], item['unit_price']
                )
            )
            cursor.execute(
                "UPDATE product_variants SET stock_quantity = stock_quantity - %s WHERE id = %s",
                (item['quantity'], item['variant_id'])
            )
            cursor.execute(
                "UPDATE products SET stock_quantity = GREATEST(stock_quantity - %s, 0) WHERE id = %s",
                (item['quantity'], item['product_id'])
            )

        # Xóa giỏ hàng
        cursor.execute("SELECT id FROM carts WHERE user_id = %s", (user_id,))
        cart = cursor.fetchone()
        if cart:
            cursor.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart['id'],))

        if coupon_id:
            cursor.execute(
                "UPDATE coupons SET used_count = used_count + 1 WHERE id = %s",
                (coupon_id,)
            )

        conn.commit()

        return {"order_id": order_id, "total": float(final_amount), "discount_amount": float(discount_amount)}, None, 201

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
            SELECT o.id, o.total_amount, o.discount_amount, o.final_amount,
                   p.payment_method, o.order_status,
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
                SELECT oi.product_id, oi.product_name, oi.quantity, oi.price, p.thumbnail_url,
                       oi.variant_id, oi.variant_size, oi.variant_color, oi.variant_material,
                       EXISTS(
                           SELECT 1 FROM reviews r
                           WHERE r.user_id = %s AND r.product_id = oi.product_id
                             AND r.order_id = oi.order_id
                       ) AS reviewed
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s
            """, (user_id, order['id']))
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
