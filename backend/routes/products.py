from flask import Blueprint, request, jsonify, session
from middleware.auth_middleware import login_required
from services.product_service import get_products, get_product_detail
from services.review_service import (
    get_product_reviews,
    get_review_summary,
    can_user_review,
    create_review
)

products_bp = Blueprint('products', __name__)


@products_bp.route('/api/products', methods=['GET'])
def list_products():
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search')
    limit = request.args.get('limit', type=int)

    products, error = get_products(category_id=category_id, search=search, limit=limit)

    if error:
        return jsonify({"error": error}), 500

    return jsonify(products), 200


@products_bp.route('/api/products/<int:product_id>', methods=['GET'])
def product_detail(product_id):
    product, error = get_product_detail(product_id)

    if error:
        status = 404 if "Không tìm thấy" in error else 500
        return jsonify({"error": error}), status

    return jsonify(product), 200


@products_bp.route('/api/products/<int:product_id>/reviews', methods=['GET'])
def product_reviews(product_id):
    reviews, error = get_product_reviews(product_id)
    if error:
        return jsonify({"error": error}), 500
    summary, _ = get_review_summary(product_id)
    can_review = False
    review_message = None
    order_id = request.args.get('order_id', type=int)
    if session.get('user_id'):
        can_review, review_message = can_user_review(session['user_id'], product_id, order_id)
    else:
        review_message = "Đăng nhập để viết đánh giá sản phẩm"
    return jsonify({
        "reviews": reviews,
        "summary": summary,
        "can_review": can_review,
        "review_message": review_message
    }), 200


@products_bp.route('/api/products/<int:product_id>/reviews', methods=['POST'])
@login_required
def add_product_review(product_id):
    data = request.get_json(silent=True) or {}
    review, error, status = create_review(
        session['user_id'],
        product_id,
        data.get('rating'),
        data.get('comment', ''),
        data.get('order_id')
    )
    if error:
        return jsonify({"error": error}), status
    return jsonify({"message": "Đã gửi đánh giá", "review": review}), status
