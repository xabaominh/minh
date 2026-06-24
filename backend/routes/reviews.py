from flask import Blueprint, jsonify, request, session
from middleware.auth_middleware import login_required
from services.review_service import get_product_review_data, save_product_review

reviews_bp = Blueprint('reviews', __name__)


@reviews_bp.route('/api/products/<int:product_id>/reviews', methods=['GET'])
def list_product_reviews(product_id):
    review_data, error = get_product_review_data(product_id, user_id=session.get('user_id'))
    if error:
        return jsonify({'error': error}), 500
    return jsonify(review_data), 200


@reviews_bp.route('/api/products/<int:product_id>/reviews', methods=['POST'])
@login_required
def submit_product_review(product_id):
    data = request.get_json(silent=True) or {}
    rating = data.get('rating')
    comment = data.get('comment', '')

    result, error, status = save_product_review(session['user_id'], product_id, rating, comment)
    if error:
        return jsonify({'error': error}), status

    return jsonify({
        'message': 'Đã lưu đánh giá',
        'review': result['review'],
        'summary': result['summary'],
        'reviews': result['reviews'],
        'user_review': result['user_review'],
        'can_review': result['can_review'],
    }), status
