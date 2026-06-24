from flask import Blueprint, request, jsonify
from middleware.auth_middleware import login_required
from services.coupon_service import validate_coupon

coupons_bp = Blueprint('coupons', __name__)


@coupons_bp.route('/api/coupons/validate', methods=['POST'])
@login_required
def validate_coupon_route():
    data = request.get_json(silent=True) or {}
    code = data.get('code', '')
    order_total = data.get('order_total', 0)

    result, error, status = validate_coupon(code, order_total)
    if error:
        return jsonify({"error": error}), status
    return jsonify(result), status
