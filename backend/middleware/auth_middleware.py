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
