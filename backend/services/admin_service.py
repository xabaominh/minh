import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float


def _serialize_dates(row):
    for key in ('created_at', 'updated_at'):
        if row.get(key) and hasattr(row[key], 'strftime'):
            row[key] = row[key].strftime('%Y-%m-%d %H:%M:%S')
    return row


def get_dashboard_data():
    """Lấy dữ liệu tổng quan cho trang quản trị."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM users WHERE is_active = TRUE) AS total_users,
                (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL AND is_active = TRUE) AS total_products,
                (SELECT COUNT(*) FROM categories WHERE is_active = TRUE) AS total_categories,
                (SELECT COUNT(*) FROM orders) AS total_orders,
                (SELECT COUNT(*) FROM orders WHERE order_status = 'PENDING') AS pending_orders,
                (
                    SELECT COALESCE(SUM(final_amount), 0)
                    FROM orders
                    WHERE order_status <> 'CANCELLED'
                ) AS revenue
        """)
        summary = cursor.fetchone() or {}

        cursor.execute("""
            SELECT o.id, o.total_amount, o.final_amount, o.order_status,
                   o.receiver_name, o.receiver_phone, o.created_at,
                   u.username, u.full_name,
                   p.payment_method, p.payment_status
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN payments p ON o.id = p.order_id
            ORDER BY o.created_at DESC
            LIMIT 8
        """)
        recent_orders = [_serialize_dates(row) for row in cursor.fetchall()]

        cursor.execute("""
            SELECT p.id, p.sku, p.product_name, p.stock_quantity,
                   c.category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.deleted_at IS NULL
              AND p.is_active = TRUE
              AND p.stock_quantity <= 5
            ORDER BY p.stock_quantity ASC, p.id DESC
            LIMIT 8
        """)
        low_stock_products = cursor.fetchall()

        data = {
            "summary": summary,
            "recent_orders": recent_orders,
            "low_stock_products": low_stock_products
        }
        return decimal_to_float(data), None

    except mysql.connector.Error as err:
        print(f"Admin Dashboard Error: {err}")
        return None, "Không thể tải dữ liệu quản trị"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_all_orders(status_filter=None):
    """Lấy tất cả đơn hàng cho admin (kèm chi tiết sản phẩm)."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT o.id, o.user_id, o.total_amount, o.discount_amount,
                   o.final_amount, o.order_status,
                   o.receiver_name, o.receiver_phone, o.shipping_address,
                   o.note, o.created_at, o.updated_at,
                   u.username, u.full_name, u.email, u.phone AS user_phone,
                   p.payment_method, p.payment_status, p.transaction_id
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN payments p ON o.id = p.order_id
        """
        params = []

        if status_filter:
            query += " WHERE o.order_status = %s"
            params.append(status_filter.upper())

        query += " ORDER BY o.created_at DESC"

        cursor.execute(query, params)
        orders = cursor.fetchall()

        # Serialize dates + lấy chi tiết sản phẩm
        for order in orders:
            _serialize_dates(order)
            cursor.execute("""
                SELECT oi.product_name, oi.quantity, oi.price, pr.thumbnail_url
                FROM order_items oi
                LEFT JOIN products pr ON oi.product_id = pr.id
                WHERE oi.order_id = %s
            """, (order['id'],))
            order['items'] = cursor.fetchall()

        return decimal_to_float(orders), None

    except mysql.connector.Error as err:
        print(f"Admin Orders Error: {err}")
        return None, "Không thể tải danh sách đơn hàng"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_order_status(order_id, new_status):
    """Cập nhật trạng thái đơn hàng."""
    valid_statuses = ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED')
    new_status = new_status.upper()

    if new_status not in valid_statuses:
        return False, f"Trạng thái không hợp lệ. Chấp nhận: {', '.join(valid_statuses)}", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Kiểm tra đơn hàng tồn tại
        cursor.execute("SELECT id, order_status FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()

        if not order:
            return False, "Không tìm thấy đơn hàng", 404

        current_status = order['order_status']

        # Không cho phép thay đổi đơn đã hủy hoặc hoàn tất
        if current_status in ('CANCELLED', 'COMPLETED') and new_status != current_status:
            return False, f"Không thể thay đổi trạng thái đơn hàng đã {('hủy' if current_status == 'CANCELLED' else 'hoàn tất')}", 400

        # Cập nhật trạng thái đơn hàng
        cursor.execute(
            "UPDATE orders SET order_status = %s WHERE id = %s",
            (new_status, order_id)
        )

        # Nếu hoàn tất đơn -> cập nhật payment_status = SUCCESS
        if new_status == 'COMPLETED':
            cursor.execute(
                "UPDATE payments SET payment_status = 'SUCCESS', paid_at = CURRENT_TIMESTAMP WHERE order_id = %s",
                (order_id,)
            )

        # Nếu hủy đơn -> hoàn trả stock
        if new_status == 'CANCELLED' and current_status != 'CANCELLED':
            cursor.execute(
                "SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = %s",
                (order_id,)
            )
            items = cursor.fetchall()
            for item in items:
                if item.get('variant_id'):
                    cursor.execute(
                        "UPDATE product_variants SET stock_quantity = stock_quantity + %s WHERE id = %s",
                        (item['quantity'], item['variant_id'])
                    )
                cursor.execute(
                    "UPDATE products SET stock_quantity = stock_quantity + %s WHERE id = %s",
                    (item['quantity'], item['product_id'])
                )
            # Cập nhật payment_status = FAILED
            cursor.execute(
                "UPDATE payments SET payment_status = 'FAILED' WHERE order_id = %s",
                (order_id,)
            )

        conn.commit()
        return True, None, 200

    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Update Order Status Error: {err}")
        return False, "Lỗi cập nhật trạng thái đơn hàng", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

