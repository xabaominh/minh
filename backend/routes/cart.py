from flask import Blueprint, request, session, jsonify
from middleware.auth_middleware import login_required
from services.cart_service import get_cart, add_item, update_item, remove_item, merge_cart

cart_bp = Blueprint('cart', __name__)


@cart_bp.route('/api/cart', methods=['GET'])
@login_required
def view_cart():
    data, error = get_cart(session['user_id'])
    if error:
        return jsonify({"error": error}), 500
    return jsonify(data), 200


@cart_bp.route('/api/cart/add', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    error, status = add_item(session['user_id'], product_id, quantity)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã thêm vào giỏ hàng"}), 200


@cart_bp.route('/api/cart/update', methods=['PUT'])
@login_required
def update_cart():
    data = request.get_json()
    item_id = data.get('item_id')
    quantity = data.get('quantity')

    error, status = update_item(session['user_id'], item_id, quantity)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã cập nhật giỏ hàng"}), 200


@cart_bp.route('/api/cart/remove/<int:item_id>', methods=['DELETE'])
@login_required
def remove_from_cart(item_id):
    error, status = remove_item(session['user_id'], item_id)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã xóa khỏi giỏ hàng"}), 200


@cart_bp.route('/api/cart/merge', methods=['POST'])
@login_required
def merge_local_cart():
    data = request.get_json()
    items = data.get('items', [])

    error, status = merge_cart(session['user_id'], items)
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã gộp giỏ hàng thành công"}), 200
