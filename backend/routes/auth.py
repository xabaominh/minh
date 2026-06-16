from flask import Blueprint, request, session, jsonify
from services.auth_service import register_user, login_user, get_profile

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    user, error, status = register_user(data)

    if error:
        return jsonify({"error": error}), status

    # Tự động đăng nhập sau khi đăng ký
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = user.get('role', 'USER')

    return jsonify({"message": "Đăng ký thành công!", "user": user}), status


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Dữ liệu không hợp lệ"}), 400

    user, error, status = login_user(data)

    if error:
        return jsonify({"error": error}), status

    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = user.get('role', 'USER')

    return jsonify({"message": "Đăng nhập thành công!", "user": user}), status


@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Đã đăng xuất"}), 200


@auth_bp.route('/api/profile', methods=['GET'])
def profile():
    if 'user_id' not in session:
        return jsonify({"logged_in": False}), 200

    user = get_profile(session['user_id'])
    if not user:
        session.clear()
        return jsonify({"logged_in": False}), 200

    return jsonify({"logged_in": True, "user": user}), 200
