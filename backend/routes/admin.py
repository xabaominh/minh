from flask import Blueprint, jsonify, request
from middleware.auth_middleware import role_required
from services.admin_service import get_dashboard_data, get_all_orders, update_order_status
from services.product_service import get_products, create_product, update_product, delete_product, get_next_sku


admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/api/admin/dashboard', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def dashboard():
    data, error = get_dashboard_data()
    if error:
        return jsonify({"error": error}), 500
    return jsonify(data), 200


@admin_bp.route('/api/admin/products', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_get_products():
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search')
    
    # allow fetching inactive products
    products, error = get_products(category_id=category_id, search=search, include_inactive=True)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(products), 200


@admin_bp.route('/api/admin/products', methods=['POST'])
@role_required('ADMIN', 'MANAGER')
def admin_create_product():
    data = request.json
    if not data or not data.get('product_name') or not data.get('sku') or not data.get('price'):
        return jsonify({"error": "Vui lòng nhập đầy đủ Tên, SKU và Giá"}), 400

    product_id, error = create_product(data)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"message": "Tạo sản phẩm thành công", "product_id": product_id}), 201


@admin_bp.route('/api/admin/products/<int:product_id>', methods=['PUT'])
@role_required('ADMIN', 'MANAGER')
def admin_update_product(product_id):
    data = request.json
    if not data:
        return jsonify({"error": "Không có dữ liệu"}), 400

    success, error = update_product(product_id, data)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"message": "Cập nhật thành công"}), 200


@admin_bp.route('/api/admin/products/<int:product_id>', methods=['DELETE'])
@role_required('ADMIN', 'MANAGER')
def admin_delete_product(product_id):
    success, error = delete_product(product_id)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"message": "Xóa sản phẩm thành công"}), 200


@admin_bp.route('/api/admin/orders', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_get_orders():
    status = request.args.get('status')
    orders, error = get_all_orders(status_filter=status)
    if error:
        return jsonify({"error": error}), 500
    return jsonify(orders), 200


@admin_bp.route('/api/admin/orders/<int:order_id>/status', methods=['PUT'])
@role_required('ADMIN', 'MANAGER')
def admin_update_order_status(order_id):
    data = request.json
    if not data or not data.get('status'):
        return jsonify({"error": "Vui lòng cung cấp trạng thái mới"}), 400

    success, error, status = update_order_status(order_id, data['status'])
    if error:
        return jsonify({"error": error}), status

    return jsonify({"message": "Cập nhật trạng thái thành công"}), 200


@admin_bp.route('/api/admin/products/next-sku', methods=['GET'])
@role_required('ADMIN', 'MANAGER')
def admin_get_next_sku():
    category_id = request.args.get('category_id', type=int)
    if not category_id:
        return jsonify({"error": "Thiếu category_id"}), 400
        
    next_sku, error = get_next_sku(category_id)
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify({"next_sku": next_sku}), 200

