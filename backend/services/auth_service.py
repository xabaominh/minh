import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db
from models.user import serialize_user
from utils.validators import validate_email, validate_password, validate_required


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
