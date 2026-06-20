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
