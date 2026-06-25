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
                   p.is_active, c.id AS category_id, c.category_name, c.slug AS category_slug,
                   (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) AS variant_count
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


def get_product_detail(product_id):
    """Lấy chi tiết 1 sản phẩm kèm ảnh phụ."""
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

        # Lấy variants
        cursor.execute("SELECT * FROM product_variants WHERE product_id = %s ORDER BY id", (product_id,))
        variants = cursor.fetchall()
        product['variants'] = decimal_to_float(variants)

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
        cursor = conn.cursor(dictionary=True)

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
        product_id = cursor.lastrowid
        
        # Đồng bộ variants
        variants = data.get('variants')
        if variants:
            sync_product_variants(cursor, product_id, variants)

        conn.commit()
        return product_id, None
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
        cursor = conn.cursor(dictionary=True)

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

        if not updates and 'variants' not in data:
            return False, "Không có dữ liệu cập nhật"

        if updates:
            query = f"UPDATE products SET {', '.join(updates)} WHERE id = %s"
            params.append(product_id)
            cursor.execute(query, tuple(params))

        # Đồng bộ variants
        if 'variants' in data:
            sync_product_variants(cursor, product_id, data['variants'])

        conn.commit()
        return True, None
    except mysql.connector.Error as err:
        print(f"Update Product Error: {err}")
        return False, "Không thể cập nhật sản phẩm. Vui lòng kiểm tra lại thông tin."
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def sync_product_variants(cursor, product_id, variants):
    """Đồng bộ hóa danh sách biến thể của sản phẩm."""
    if not isinstance(variants, list):
        return

    # Lấy ID biến thể hiện tại
    cursor.execute("SELECT id FROM product_variants WHERE product_id = %s", (product_id,))
    rows = cursor.fetchall()
    existing_ids = set()
    for row in rows:
        if isinstance(row, dict):
            existing_ids.add(row['id'])
        else:
            existing_ids.add(row[0])

    keep_ids = set()
    for var in variants:
        var_id = var.get('id')
        variant_name = var.get('variant_name')
        sku = var.get('sku')
        price = var.get('price')
        discount_price = var.get('discount_price')
        stock_quantity = var.get('stock_quantity', 0)
        thumbnail_url = var.get('thumbnail_url')

        if not variant_name or not sku or price is None:
            continue  # Bỏ qua dòng lỗi

        if var_id and int(var_id) in existing_ids:
            # Cập nhật biến thể cũ
            cursor.execute("""
                UPDATE product_variants 
                SET variant_name = %s, sku = %s, price = %s, discount_price = %s, stock_quantity = %s, thumbnail_url = %s
                WHERE id = %s AND product_id = %s
            """, (variant_name, sku, price, discount_price, stock_quantity, thumbnail_url, var_id, product_id))
            keep_ids.add(int(var_id))
        else:
            # Tạo biến thể mới
            cursor.execute("""
                INSERT INTO product_variants (product_id, variant_name, sku, price, discount_price, stock_quantity, thumbnail_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (product_id, variant_name, sku, price, discount_price, stock_quantity, thumbnail_url))

    # Xóa các biến thể không còn trong danh sách gửi lên
    delete_ids = existing_ids - keep_ids
    if delete_ids:
        format_strings = ','.join(['%s'] * len(delete_ids))
        cursor.execute(f"DELETE FROM product_variants WHERE id IN ({format_strings}) AND product_id = %s", tuple(list(delete_ids) + [product_id]))

    # Tính tổng tồn kho của biến thể và đồng bộ vào sản phẩm chính
    cursor.execute("SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = %s", (product_id,))
    total_stock_row = cursor.fetchone()
    total_stock = 0
    if total_stock_row:
        if isinstance(total_stock_row, dict):
            total_stock = list(total_stock_row.values())[0] or 0
        else:
            total_stock = total_stock_row[0] or 0
    cursor.execute("UPDATE products SET stock_quantity = %s WHERE id = %s", (total_stock, product_id))


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


def get_next_sku(category_id):
    """Tính toán mã SKU tiếp theo cho danh mục dựa trên tiền tố của danh mục."""
    if not category_id:
        return None, "Vui lòng chọn danh mục"
        
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # 1. Lấy tên danh mục
        cursor.execute("SELECT category_name FROM categories WHERE id = %s", (category_id,))
        cat = cursor.fetchone()
        if not cat:
            return None, "Không tìm thấy danh mục"
            
        category_name = cat['category_name']
        
        # 2. Sinh tiền tố từ tên danh mục
        import unicodedata
        import re
        
        # Chuẩn hóa loại bỏ dấu tiếng Việt
        nfkd_form = unicodedata.normalize('NFKD', category_name)
        only_ascii = nfkd_form.encode('ASCII', 'ignore').decode('ASCII')
        
        # Lấy các chữ cái đầu tiên của từng từ
        words = re.findall(r'[a-zA-Z]+', only_ascii)
        if words:
            prefix = ''.join([w[0].upper() for w in words])
        else:
            prefix = 'SP'
            
        # 3. Tìm tất cả SKU có tiền tố này trong DB để tìm số lớn nhất
        cursor.execute(
            "SELECT sku FROM products WHERE sku LIKE %s AND deleted_at IS NULL",
            (f"{prefix}%",)
        )
        rows = cursor.fetchall()
        
        max_num = 0
        for r in rows:
            sku = r['sku']
            # Trích xuất phần số sau tiền tố
            num_part = sku[len(prefix):]
            try:
                # Tìm số nguyên
                match = re.search(r'\d+', num_part)
                if match:
                    num = int(match.group())
                    if num > max_num:
                        max_num = num
            except ValueError:
                pass
                
        next_num = max_num + 1
        next_sku = f"{prefix}{next_num:03d}"
        
        return next_sku, None
    except mysql.connector.Error as err:
        print(f"Get Next SKU Error: {err}")
        return None, "Lỗi tính toán SKU"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
