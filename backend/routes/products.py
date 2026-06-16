from flask import Blueprint, request, jsonify
from services.product_service import get_products, get_product_detail

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
