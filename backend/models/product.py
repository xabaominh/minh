from utils.helpers import decimal_to_float


def serialize_product(row):
    """Chuyển row từ DB thành dict sản phẩm."""
    if not row:
        return None
    return decimal_to_float(row)


def serialize_product_detail(row, images=None):
    """Chuyển row sản phẩm chi tiết + ảnh phụ."""
    if not row:
        return None
    product = decimal_to_float(row)
    product['images'] = images or []
    return product
