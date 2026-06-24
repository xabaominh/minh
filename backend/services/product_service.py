import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float
from services.review_service import get_product_review_data


def get_categories():
    """Lấy danh sách tất cả danh mục."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, category_name, slug FROM categories WHERE is_active = TRUE ORDER BY id")
        return cursor.fetchall(), None
    except mysql.connector.Error as err:
        print(f"Categories Error: {err}")
        return None, "Không thể lấy danh mục"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_products(category_id=None, search=None, limit=None, include_inactive=False):
    """Lấy danh sách sản phẩm với bộ lọc tùy chọn."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT p.id, p.sku, p.product_name, p.slug, p.price, p.discount_price, p.thumbnail_url,
                   p.description, p.stock_quantity, p.attributes,
                   p.is_active, c.id AS category_id, c.category_name, c.slug AS category_slug
            FROM products p
            JOIN categories c ON p.category_id = c.id
            WHERE p.deleted_at IS NULL
        """
        if not include_inactive:
            query += " AND p.is_active = TRUE"

        params = []

        if category_id:
            query += " AND p.category_id = %s"
            params.append(category_id)

        if search:
            query += " AND (p.product_name LIKE %s OR p.description LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY p.id DESC"

        if limit:
            query += f" LIMIT {int(limit)}"

        cursor.execute(query, params)
        products = cursor.fetchall()
        
        # MySQL JSON might be returned as string, parse it if needed
        import json
        for p in products:
            if isinstance(p.get('attributes'), str):
                try:
                    p['attributes'] = json.loads(p['attributes'])
                except:
                    pass

        return decimal_to_float(products), None

    except mysql.connector.Error as err:
        print(f"Products Error: {err}")
        return None, "Không thể truy vấn sản phẩm"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_product_detail(product_id, user_id=None):
    """Lấy chi tiết 1 sản phẩm kèm ảnh phụ và dữ liệu đánh giá."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT p.*, c.category_name, c.slug AS category_slug
            FROM products p JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s AND p.deleted_at IS NULL
        """, (product_id,))
        product = cursor.fetchone()

        if not product:
            return None, "Không tìm thấy sản phẩm"

        import json
        if isinstance(product.get('attributes'), str):
            try:
                product['attributes'] = json.loads(product['attributes'])
            except:
                pass

        # Lấy ảnh phụ
        cursor.execute("SELECT id, image_url AS url FROM product_images WHERE product_id = %s ORDER BY display_order", (product_id,))
        images = cursor.fetchall()
        product['images'] = images

        review_data, review_error = get_product_review_data(product_id, user_id=user_id)
        if review_error:
            return None, review_error

        product['review_summary'] = review_data.get('summary', {})
        product['reviews'] = review_data.get('reviews', [])
        product['can_review'] = review_data.get('can_review', False)
        product['user_review'] = review_data.get('user_review')

        return decimal_to_float(product), None

    except mysql.connector.Error as err:
        print(f"Product Detail Error: {err}")
        return None, "Lỗi truy vấn"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def create_product(data):
    """Tạo sản phẩm mới."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        query = """
            INSERT INTO products (
                sku, product_name, slug, category_id, price, discount_price, 
                stock_quantity, thumbnail_url, description, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        # Simple slug generation if not provided
        import re
        slug = data.get('slug')
        if not slug and data.get('product_name'):
            slug = re.sub(r'[^a-z0-9]+', '-', data.get('product_name').lower()).strip('-')

        params = (
            data.get('sku'),
            data.get('product_name'),
            slug,
            data.get('category_id'),
            data.get('price'),
            data.get('discount_price'),
            data.get('stock_quantity', 0),
            data.get('thumbnail_url'),
            data.get('description'),
            data.get('is_active', True)
        )

        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid, None
    except mysql.connector.Error as err:
        print(f"Create Product Error: {err}")
        return None, "Không thể tạo sản phẩm. Vui lòng kiểm tra SKU hoặc Slug có bị trùng lặp không."
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_product(product_id, data):
    """Cập nhật sản phẩm."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        updates = []
        params = []

        # Allow updating specific fields
        fields = ['sku', 'product_name', 'slug', 'category_id', 'price', 
                  'discount_price', 'stock_quantity', 'thumbnail_url', 
                  'description', 'is_active']
                  
        for field in fields:
            if field in data:
                updates.append(f"{field} = %s")
                params.append(data[field])

        if not updates:
            return False, "Không có dữ liệu cập nhật"

        query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
        params.append(product_id)

        cursor.execute(query, tuple(params))
        conn.commit()

        if cursor.rowcount == 0:
            return False, "Sản phẩm không tồn tại hoặc dữ liệu không thay đổi"
            
        return True, None
    except mysql.connector.Error as err:
        print(f"Update Product Error: {err}")
        return False, "Không thể cập nhật sản phẩm. Vui lòng kiểm tra lại thông tin."
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def delete_product(product_id):
    """Xóa mềm sản phẩm (soft delete)."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s", (product_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return False, "Sản phẩm không tồn tại"
            
        return True, None
    except mysql.connector.Error as err:
        print(f"Delete Product Error: {err}")
        return False, "Không thể xóa sản phẩm"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
