from flask import Blueprint, request, session, jsonify
from middleware.auth_middleware import login_required
from services.auth_service import (
    register_user,
    login_user,
    get_profile,
    get_user_addresses,
    add_user_address,
    set_default_address,
    delete_user_address,
    update_profile,
    change_password
)

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


@auth_bp.route('/api/addresses', methods=['GET'])
@login_required
def addresses():
    items, error = get_user_addresses(session['user_id'])
    if error:
        return jsonify({"error": error}), 500
    return jsonify(items), 200


@auth_bp.route('/api/addresses', methods=['POST'])
@login_required
def create_address():
    data = request.get_json(silent=True) or {}
    address, error, status = add_user_address(session['user_id'], data)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã lưu địa chỉ", "address": address}), status


@auth_bp.route('/api/addresses/<int:address_id>/default', methods=['PUT'])
@login_required
def make_default_address(address_id):
    error, status = set_default_address(session['user_id'], address_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã đặt làm địa chỉ mặc định"}), 200


@auth_bp.route('/api/addresses/<int:address_id>', methods=['DELETE'])
@login_required
def remove_address(address_id):
    error, status = delete_user_address(session['user_id'], address_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã xóa địa chỉ"}), 200


@auth_bp.route('/api/profile', methods=['PUT'])
@login_required
def update_profile_route():
    data = request.get_json(silent=True) or {}
    user, error, status = update_profile(session['user_id'], data)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã cập nhật thông tin", "user": user}), status


@auth_bp.route('/api/profile/password', methods=['PUT'])
@login_required
def change_password_route():
    data = request.get_json(silent=True) or {}
    error, status = change_password(session['user_id'], data)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã đổi mật khẩu"}), status
