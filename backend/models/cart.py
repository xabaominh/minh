from utils.helpers import decimal_to_float


def serialize_cart_item(row):
    """Chuyển row cart item từ DB thành dict."""
    if not row:
        return None
    return decimal_to_float(row)


def calculate_total(items):
    """Tính tổng tiền giỏ hàng."""
    return sum(item['price'] * item['quantity'] for item in items)
