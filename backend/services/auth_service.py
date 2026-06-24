import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from models.user import serialize_user
from utils.validators import validate_email, validate_password, validate_phone


def _serialize_address(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "receiver_name": row.get("receiver_name"),
        "phone": row.get("phone"),
        "address_line": row.get("address_line"),
        "is_default": bool(row.get("is_default"))
    }


def register_user(data):
    """
    Đăng ký tài khoản mới.
    Trả về (user_dict, error_message, status_code).
    """
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()
    address = data.get('address', '').strip()

    # Validate
    if not username or not email or not password:
        return None, "Vui lòng điền đầy đủ username, email và mật khẩu", 400
    if not validate_password(password):
        return None, "Mật khẩu phải có ít nhất 4 ký tự", 400
    if not validate_email(email):
        return None, "Email không hợp lệ", 400
    if not validate_phone(phone):
        return None, "Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Kiểm tra trùng
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            return None, "Username hoặc email đã tồn tại", 409

        # Tạo user
        pw_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, full_name, phone) VALUES (%s,%s,%s,%s,%s)",
            (username, email, pw_hash, full_name or None, phone or None)
        )
        user_id = cursor.lastrowid
        
        # Thêm địa chỉ
        if address:
            cursor.execute(
                "INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, is_default) VALUES (%s,%s,%s,%s,%s)",
                (user_id, full_name or username, phone or '', address, True)
            )
            
        conn.commit()

        user = {
            "id": user_id,
            "username": username,
            "email": email,
            "full_name": full_name,
            "role": "USER"
        }
        return user, None, 201

    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Register Error: {err}")
        return None, "Lỗi hệ thống", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_user_addresses(user_id):
    """Lấy toàn bộ địa chỉ giao hàng của user, địa chỉ mặc định đứng đầu."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, receiver_name, phone, address_line, is_default
            FROM user_addresses
            WHERE user_id = %s
            ORDER BY is_default DESC, id DESC
            """,
            (user_id,)
        )
        return [_serialize_address(row) for row in cursor.fetchall()], None
    except mysql.connector.Error as err:
        print(f"Addresses Error: {err}")
        return None, "Không thể lấy danh sách địa chỉ"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def add_user_address(user_id, data):
    """Thêm địa chỉ mới, có thể đặt làm mặc định."""
    receiver_name = data.get('receiver_name', '').strip()
    phone = data.get('phone', '').strip()
    address_line = data.get('address_line', '').strip()
    is_default = bool(data.get('is_default', False))

    if not address_line:
        return None, "Vui lòng nhập địa chỉ giao hàng", 400
    if not validate_phone(phone):
        return None, "Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT COUNT(*) AS count FROM user_addresses WHERE user_id = %s", (user_id,))
        has_no_address = cursor.fetchone()['count'] == 0
        should_be_default = is_default or has_no_address

        if should_be_default:
            cursor.execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = %s", (user_id,))

        cursor.execute(
            """
            INSERT INTO user_addresses (user_id, receiver_name, phone, address_line, is_default)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, receiver_name or "Người nhận", phone, address_line, should_be_default)
        )
        address_id = cursor.lastrowid
        conn.commit()

        cursor.execute(
            """
            SELECT id, receiver_name, phone, address_line, is_default
            FROM user_addresses
            WHERE id = %s AND user_id = %s
            """,
            (address_id, user_id)
        )
        return _serialize_address(cursor.fetchone()), None, 201
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Add Address Error: {err}")
        return None, "Không thể thêm địa chỉ", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_user_address(user_id, address_id, data):
    """Cập nhật một địa chỉ thuộc về user."""
    receiver_name = data.get('receiver_name', '').strip()
    phone = data.get('phone', '').strip()
    address_line = data.get('address_line', '').strip()
    is_default = bool(data.get('is_default', False))

    if not address_line:
        return None, "Vui lòng nhập địa chỉ giao hàng", 400
    if not validate_phone(phone):
        return None, "Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id FROM user_addresses WHERE id = %s AND user_id = %s",
            (address_id, user_id)
        )
        if not cursor.fetchone():
            return None, "Không tìm thấy địa chỉ", 404

        if is_default:
            cursor.execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = %s", (user_id,))

        cursor.execute(
            """
            UPDATE user_addresses
            SET receiver_name = %s, phone = %s, address_line = %s, is_default = %s
            WHERE id = %s AND user_id = %s
            """,
            (receiver_name or "Người nhận", phone, address_line, is_default, address_id, user_id)
        )
        conn.commit()

        cursor.execute(
            """
            SELECT id, receiver_name, phone, address_line, is_default
            FROM user_addresses
            WHERE id = %s AND user_id = %s
            """,
            (address_id, user_id)
        )
        return _serialize_address(cursor.fetchone()), None, 200
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Update Address Error: {err}")
        return None, "Không thể cập nhật địa chỉ", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_profile(user_id, data):
    """Cập nhật thông tin cơ bản của tài khoản."""
    full_name = data.get('full_name', '').strip()
    phone = data.get('phone', '').strip()

    if phone and not validate_phone(phone):
        return None, "Số điện thoại phải gồm đúng 10 chữ số, bắt đầu bằng 0 (vd: 0901234567)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return None, "Không tìm thấy tài khoản", 404

        cursor.execute(
            "UPDATE users SET full_name = %s, phone = %s WHERE id = %s",
            (full_name or None, phone or None, user_id)
        )
        conn.commit()
        return get_profile(user_id), None, 200
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Update Profile Error: {err}")
        return None, "Không thể cập nhật thông tin tài khoản", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def change_password(user_id, data):
    """Đổi mật khẩu tài khoản."""
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not current_password or not new_password or not confirm_password:
        return None, "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới", 400
    if new_password != confirm_password:
        return None, "Mật khẩu mới và xác nhận mật khẩu không khớp", 400
    if not validate_password(new_password):
        return None, "Mật khẩu mới phải có ít nhất 4 ký tự", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return None, "Không tìm thấy tài khoản", 404
        if not check_password_hash(user['password_hash'], current_password):
            return None, "Mật khẩu hiện tại không đúng", 400

        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (generate_password_hash(new_password), user_id)
        )
        conn.commit()
        return {"message": "Đã đổi mật khẩu thành công"}, None, 200
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Change Password Error: {err}")
        return None, "Không thể đổi mật khẩu", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def set_default_address(user_id, address_id):
    """Đặt một địa chỉ của user làm mặc định."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id FROM user_addresses WHERE id = %s AND user_id = %s",
            (address_id, user_id)
        )
        if not cursor.fetchone():
            return "Không tìm thấy địa chỉ", 404

        cursor.execute("UPDATE user_addresses SET is_default = FALSE WHERE user_id = %s", (user_id,))
        cursor.execute(
            "UPDATE user_addresses SET is_default = TRUE WHERE id = %s AND user_id = %s",
            (address_id, user_id)
        )
        conn.commit()
        return None, 200
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Set Default Address Error: {err}")
        return "Không thể đặt địa chỉ mặc định", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def login_user(data):
    """
    Đăng nhập.
    Trả về (user_dict, error_message, status_code).
    """
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return None, "Vui lòng nhập tài khoản và mật khẩu", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, username))
        user = cursor.fetchone()

        if not user or not check_password_hash(user['password_hash'], password):
            return None, "Sai tài khoản hoặc mật khẩu", 401

        return serialize_user(user), None, 200

    except mysql.connector.Error as err:
        print(f"Login Error: {err}")
        return None, "Lỗi hệ thống", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_profile(user_id):
    """
    Lấy thông tin profile theo user_id.
    Trả về user_dict hoặc None.
    """
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, a.address_line AS address
            FROM users u
            LEFT JOIN user_addresses a ON u.id = a.user_id AND a.is_default = TRUE
            WHERE u.id = %s
            """,
            (user_id,)
        )
        user = cursor.fetchone()
        return user
    except mysql.connector.Error as err:
        print(f"Profile Error: {err}")
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
