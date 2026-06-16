from flask import Blueprint, jsonify
from services.product_service import get_categories

categories_bp = Blueprint('categories', __name__)


@categories_bp.route('/api/categories', methods=['GET'])
def list_categories():
    cats, error = get_categories()

    if error:
        return jsonify({"error": error}), 500

    return jsonify(cats), 200
