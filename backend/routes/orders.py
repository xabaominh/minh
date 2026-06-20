from flask import Blueprint, request, session, jsonify
from middleware.auth_middleware import login_required
from services.order_service import create_order, get_user_orders, get_order_detail

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/api/orders', methods=['POST'])
@login_required
def place_order():
    data = request.get_json(silent=True) or {}
    payment_method = data.get('payment_method')
    shipping_address = data.get('shipping_address', '').strip()
    receiver_name = data.get('receiver_name', '').strip()
    receiver_phone = data.get('receiver_phone', '').strip()

    result, error, status = create_order(
        session['user_id'],
        payment_method,
        shipping_address,
        receiver_name,
        receiver_phone
    )
    if error:
        return jsonify({"error": error}), status

    return jsonify({
        "message": "Đặt hàng thành công!",
        "order_id": result['order_id'],
        "total": result['total']
    }), status


@orders_bp.route('/api/orders', methods=['GET'])
@login_required
def list_orders():
    orders, error = get_user_orders(session['user_id'])
    if error:
        return jsonify({"error": error}), 500
    return jsonify(orders), 200


@orders_bp.route('/api/orders/<int:order_id>', methods=['GET'])
@login_required
def order_detail(order_id):
    order, error = get_order_detail(session['user_id'], order_id)
    if error:
        status = 404 if "Không tìm thấy" in error else 500
        return jsonify({"error": error}), status
    return jsonify(order), 200
