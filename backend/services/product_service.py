import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float


def get_categories():
    """Lấy danh sách tất cả danh mục."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, category_name FROM categories ORDER BY id")
        return cursor.fetchall(), None
    except mysql.connector.Error as err:
        print(f"Categories Error: {err}")
        return None, "Không thể lấy danh mục"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_products(category_id=None, search=None, limit=None):
    """Lấy danh sách sản phẩm với bộ lọc tùy chọn."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT p.id, p.product_name, p.price, p.thumbnail_url,
                   p.description, p.stock_quantity, p.dimensions, p.wood_material,
                   p.is_active, c.id AS category_id, c.category_name
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = TRUE
        """
        params = []

        if category_id:
            query += " AND p.category_id = %s"
            params.append(category_id)

        if search:
            query += " AND (p.product_name LIKE %s OR p.description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.id DESC"

        if limit:
            query += " LIMIT %s"
            params.append(limit)

        cursor.execute(query, params)
        products = cursor.fetchall()

        return decimal_to_float(products), None

    except mysql.connector.Error as err:
        print(f"Products Error: {err}")
        return None, "Không thể truy vấn sản phẩm"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_product_detail(product_id):
    """Lấy chi tiết 1 sản phẩm kèm ảnh phụ."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT p.*, c.category_name
            FROM products p JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s
        """, (product_id,))
        product = cursor.fetchone()

        if not product:
            return None, "Không tìm thấy sản phẩm"

        # Lấy ảnh phụ
        cursor.execute("SELECT id, image_url AS url FROM product_images WHERE product_id = %s", (product_id,))
        images = cursor.fetchall()
        product['images'] = images

        return decimal_to_float(product), None

    except mysql.connector.Error as err:
        print(f"Product Detail Error: {err}")
        return None, "Lỗi truy vấn"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
