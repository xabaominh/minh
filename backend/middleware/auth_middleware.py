from functools import wraps
from flask import session, jsonify


def login_required(f):
    """Decorator kiểm tra người dùng đã đăng nhập chưa."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Vui lòng đăng nhập"}), 401
        return f(*args, **kwargs)
    return decorated


def role_required(*roles):
    """Decorator kiểm tra người dùng có role phù hợp."""
    allowed_roles = {role.upper() for role in roles}

    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({"error": "Vui lòng đăng nhập"}), 401

            current_role = session.get('role', 'USER').upper()
            if current_role not in allowed_roles:
                return jsonify({"error": "Bạn không có quyền truy cập"}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
