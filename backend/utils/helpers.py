from decimal import Decimal


def effective_price(price, discount_price=None):
    """Giá bán thực tế: dùng discount_price nếu hợp lệ và nhỏ hơn price."""
    price = float(price or 0)
    if discount_price is None:
        return price
    discount = float(discount_price)
    if discount > 0 and discount < price:
        return discount
    return price


def decimal_to_float(obj):
    """Chuyển đổi Decimal thành float để JSON serialize được."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj
