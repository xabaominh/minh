from flask import Flask, jsonify, request, session
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from decimal import Decimal

app = Flask(__name__)
app.secret_key = 'luxdecor_secret_key_2026'
CORS(app, supports_credentials=True)

# =====================================================
# CẤU HÌNH DATABASE
# =====================================================
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'furniture_shop'
}

def get_db():
    return mysql.connector.connect(**db_config)


# =====================================================
# HELPER: Kiểm tra đăng nhập
# =====================================================
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Vui lòng đăng nhập"}), 401
        return f(*args, **kwargs)
    return decorated


# Helper: Decimal → float cho JSON
def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj


# =====================================================
# AUTH: ĐĂNG KÝ
# POST /api/register
# Body: { username, email, password, full_name?, phone?, address? }
# =====================================================
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()

    if not username or not email or not password:
        return jsonify({"error": "Vui lòng điền đầy đủ username, email và mật khẩu"}), 400
    if len(password) < 4:
        return jsonify({"error": "Mật khẩu phải có ít nhất 4 ký tự"}), 400
    if '@' not in email or '.' not in email:
        return jsonify({"error": "Email không hợp lệ"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Kiểm tra trùng
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return jsonify({"error": "Username hoặc email đã tồn tại"}), 409

        pw_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, full_name, phone, address) VALUES (%s,%s,%s,%s,%s,%s)",
            (username, email, pw_hash, full_name or None, phone or None, address or None)
        )
        conn.commit()

        # Tự động đăng nhập sau khi đăng ký
        user_id = cursor.lastrowid
        session['user_id'] = user_id
        session['username'] = username
        session['role'] = 'USER'

        return jsonify({
            "message": "Đăng ký thành công!",
            "user": {"id": user_id, "username": username, "email": email, "full_name": full_name, "role": "USER"}
        }), 201

    except mysql.connector.Error as err:
        print(f"Register Error: {err}")
        return jsonify({"error": "Lỗi hệ thống"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# AUTH: ĐĂNG NHẬP
# POST /api/login
# Body: { username, password }
# =====================================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({"error": "Vui lòng nhập tài khoản và mật khẩu"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, username))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "Sai tài khoản hoặc mật khẩu"}), 401

        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']

        return jsonify({
            "message": "Đăng nhập thành công!",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "full_name": user['full_name'],
                "phone": user['phone'],
                "address": user['address'],
                "role": user['role']
            }
        }), 200

    except mysql.connector.Error as err:
        print(f"Login Error: {err}")
        return jsonify({"error": "Lỗi hệ thống"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# AUTH: ĐĂNG XUẤT
# POST /api/logout
# =====================================================
@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Đã đăng xuất"}), 200


# =====================================================
# AUTH: XEM PROFILE
# GET /api/profile
# =====================================================
@app.route('/api/profile', methods=['GET'])
def profile():
    if 'user_id' not in session:
        return jsonify({"logged_in": False}), 200

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, email, full_name, phone, address, role FROM users WHERE id = %s",
                        (session['user_id'],))
        user = cursor.fetchone()
        if not user:
            session.clear()
            return jsonify({"logged_in": False}), 200

        return jsonify({"logged_in": True, "user": user}), 200

    except mysql.connector.Error as err:
        print(f"Profile Error: {err}")
        return jsonify({"error": "Lỗi hệ thống"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CATEGORIES: LẤY DANH SÁCH DANH MỤC
# GET /api/categories
# =====================================================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, category_name FROM categories ORDER BY id")
        cats = cursor.fetchall()
        return jsonify(cats), 200
    except mysql.connector.Error as err:
        print(f"Categories Error: {err}")
        return jsonify({"error": "Không thể lấy danh mục"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# PRODUCTS: LẤY DANH SÁCH SẢN PHẨM
# GET /api/products
# GET /api/products?category_id=1
# GET /api/products?search=sofa
# GET /api/products?limit=8
# =====================================================
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search')
        limit = request.args.get('limit', type=int)

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

        return jsonify(decimal_to_float(products)), 200

    except mysql.connector.Error as err:
        print(f"Products Error: {err}")
        return jsonify({"error": "Không thể truy vấn sản phẩm"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# PRODUCTS: CHI TIẾT 1 SẢN PHẨM
# GET /api/products/<id>
# =====================================================
@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
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
            return jsonify({"error": "Không tìm thấy sản phẩm"}), 404

        # Lấy ảnh phụ
        cursor.execute("SELECT id, image_url AS url FROM product_images WHERE product_id = %s", (product_id,))
        images = cursor.fetchall()
        product['images'] = images

        return jsonify(decimal_to_float(product)), 200

    except mysql.connector.Error as err:
        print(f"Product Detail Error: {err}")
        return jsonify({"error": "Lỗi truy vấn"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CART: XEM GIỎ HÀNG
# GET /api/cart
# =====================================================
@app.route('/api/cart', methods=['GET'])
@login_required
def get_cart():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        cursor.execute("""
            SELECT ci.id AS item_id, ci.quantity,
                   p.id AS product_id, p.product_name, p.price, p.thumbnail_url, p.stock_quantity
            FROM cart c
            JOIN cart_items ci ON c.id = ci.cart_id
            JOIN products p ON ci.product_id = p.id
            WHERE c.user_id = %s
        """, (user_id,))
        items = cursor.fetchall()

        total = sum(item['price'] * item['quantity'] for item in items)

        return jsonify(decimal_to_float({"items": items, "total": float(total)})), 200

    except mysql.connector.Error as err:
        print(f"Cart Error: {err}")
        return jsonify({"error": "Lỗi truy vấn giỏ hàng"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CART: THÊM SẢN PHẨM
# POST /api/cart/add
# Body: { product_id, quantity? }
# =====================================================
@app.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id:
        return jsonify({"error": "Thiếu product_id"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        # Tìm hoặc tạo cart
        cursor.execute("SELECT id FROM cart WHERE user_id = %s", (user_id,))
        cart = cursor.fetchone()
        if not cart:
            cursor.execute("INSERT INTO cart (user_id) VALUES (%s)", (user_id,))
            conn.commit()
            cart_id = cursor.lastrowid
        else:
            cart_id = cart['id']

        # Kiểm tra đã có trong giỏ chưa
        cursor.execute("SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s",
                        (cart_id, product_id))
        existing = cursor.fetchone()

        if existing:
            new_qty = existing['quantity'] + quantity
            cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (new_qty, existing['id']))
        else:
            cursor.execute("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s,%s,%s)",
                            (cart_id, product_id, quantity))

        conn.commit()
        return jsonify({"message": "Đã thêm vào giỏ hàng"}), 200

    except mysql.connector.Error as err:
        print(f"Add to cart Error: {err}")
        return jsonify({"error": "Lỗi thêm giỏ hàng"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CART: CẬP NHẬT SỐ LƯỢNG
# PUT /api/cart/update
# Body: { item_id, quantity }
# =====================================================
@app.route('/api/cart/update', methods=['PUT'])
@login_required
def update_cart():
    data = request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity')

    if not item_id or quantity is None:
        return jsonify({"error": "Thiếu thông tin"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        # Xác minh item thuộc user
        cursor.execute("""
            SELECT ci.id FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.id
            WHERE ci.id = %s AND c.user_id = %s
        """, (item_id, user_id))

        if not cursor.fetchone():
            return jsonify({"error": "Không tìm thấy sản phẩm trong giỏ"}), 404

        if quantity <= 0:
            cursor.execute("DELETE FROM cart_items WHERE id = %s", (item_id,))
        else:
            cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (quantity, item_id))

        conn.commit()
        return jsonify({"message": "Đã cập nhật giỏ hàng"}), 200

    except mysql.connector.Error as err:
        print(f"Update cart Error: {err}")
        return jsonify({"error": "Lỗi cập nhật"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CART: XÓA SẢN PHẨM
# DELETE /api/cart/remove/<item_id>
# =====================================================
@app.route('/api/cart/remove/<int:item_id>', methods=['DELETE'])
@login_required
def remove_from_cart(item_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        cursor.execute("""
            SELECT ci.id FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.id
            WHERE ci.id = %s AND c.user_id = %s
        """, (item_id, user_id))

        if not cursor.fetchone():
            return jsonify({"error": "Không tìm thấy"}), 404

        cursor.execute("DELETE FROM cart_items WHERE id = %s", (item_id,))
        conn.commit()
        return jsonify({"message": "Đã xóa khỏi giỏ hàng"}), 200

    except mysql.connector.Error as err:
        print(f"Remove cart Error: {err}")
        return jsonify({"error": "Lỗi xóa"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# CART: MERGE (khi vừa login, gộp localStorage → server)
# POST /api/cart/merge
# Body: { items: [{ product_id, quantity }, ...] }
# =====================================================
@app.route('/api/cart/merge', methods=['POST'])
@login_required
def merge_cart():
    data = request.get_json()
    items = data.get('items', [])

    if not items:
        return jsonify({"message": "Không có gì để merge"}), 200

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        # Tìm hoặc tạo cart
        cursor.execute("SELECT id FROM cart WHERE user_id = %s", (user_id,))
        cart = cursor.fetchone()
        if not cart:
            cursor.execute("INSERT INTO cart (user_id) VALUES (%s)", (user_id,))
            conn.commit()
            cart_id = cursor.lastrowid
        else:
            cart_id = cart['id']

        for item in items:
            pid = item.get('product_id')
            qty = item.get('quantity', 1)
            if not pid:
                continue

            cursor.execute("SELECT id, quantity FROM cart_items WHERE cart_id = %s AND product_id = %s",
                            (cart_id, pid))
            existing = cursor.fetchone()
            if existing:
                new_qty = existing['quantity'] + qty
                cursor.execute("UPDATE cart_items SET quantity = %s WHERE id = %s", (new_qty, existing['id']))
            else:
                cursor.execute("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (%s,%s,%s)",
                                (cart_id, pid, qty))

        conn.commit()
        return jsonify({"message": "Đã gộp giỏ hàng thành công"}), 200

    except mysql.connector.Error as err:
        print(f"Merge cart Error: {err}")
        return jsonify({"error": "Lỗi gộp giỏ hàng"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# ORDERS: ĐẶT HÀNG
# POST /api/orders
# Body: { payment_method, shipping_address }
# =====================================================
@app.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    data = request.get_json()
    payment_method = data.get('payment_method')
    shipping_address = data.get('shipping_address', '').strip()

    if payment_method not in ('COD', 'BANK_TRANSFER'):
        return jsonify({"error": "Phương thức thanh toán không hợp lệ"}), 400
    if not shipping_address:
        return jsonify({"error": "Vui lòng nhập địa chỉ giao hàng"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

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
            return jsonify({"error": "Giỏ hàng trống"}), 400

        # Kiểm tra tồn kho
        for item in cart_items:
            if item['quantity'] > item['stock_quantity']:
                return jsonify({"error": f"Sản phẩm '{item['product_name']}' không đủ hàng (còn {item['stock_quantity']})"}), 400

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

        return jsonify({
            "message": "Đặt hàng thành công!",
            "order_id": order_id,
            "total": float(total)
        }), 201

    except mysql.connector.Error as err:
        if conn: conn.rollback()
        print(f"Order Error: {err}")
        return jsonify({"error": "Lỗi tạo đơn hàng"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# ORDERS: LỊCH SỬ ĐƠN HÀNG
# GET /api/orders
# =====================================================
@app.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        cursor.execute("""
            SELECT id, total_amount, payment_method, order_status, shipping_address, created_at
            FROM orders WHERE user_id = %s ORDER BY created_at DESC
        """, (user_id,))
        orders = cursor.fetchall()

        # Chuyển datetime thành string
        for order in orders:
            if order.get('created_at'):
                order['created_at'] = order['created_at'].strftime('%Y-%m-%d %H:%M:%S')

        return jsonify(decimal_to_float(orders)), 200

    except mysql.connector.Error as err:
        print(f"Orders Error: {err}")
        return jsonify({"error": "Lỗi truy vấn đơn hàng"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# ORDERS: CHI TIẾT 1 ĐƠN HÀNG
# GET /api/orders/<id>
# =====================================================
@app.route('/api/orders/<int:order_id>', methods=['GET'])
@login_required
def get_order_detail(order_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        user_id = session['user_id']

        cursor.execute("""
            SELECT * FROM orders WHERE id = %s AND user_id = %s
        """, (order_id, user_id))
        order = cursor.fetchone()

        if not order:
            return jsonify({"error": "Không tìm thấy đơn hàng"}), 404

        if order.get('created_at'):
            order['created_at'] = order['created_at'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute("""
            SELECT oi.*, p.product_name, p.thumbnail_url
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        order['items'] = items

        return jsonify(decimal_to_float(order)), 200

    except mysql.connector.Error as err:
        print(f"Order Detail Error: {err}")
        return jsonify({"error": "Lỗi truy vấn"}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()


# =====================================================
# KHỞI CHẠY
# =====================================================
if __name__ == '__main__':
    print("=" * 55)
    print("  LuxDecor API Server v2 đang chạy...")
    print("  Auth:       /api/register, /api/login, /api/logout")
    print("  Products:   /api/products, /api/products/<id>")
    print("  Categories: /api/categories")
    print("  Cart:       /api/cart, /api/cart/add, /api/cart/merge")
    print("  Orders:     /api/orders, /api/orders/<id>")
    print("=" * 55)
    app.run(debug=True, port=5000)
