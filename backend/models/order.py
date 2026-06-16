from utils.helpers import decimal_to_float


def serialize_order(row):
    """Chuyển row đơn hàng từ DB thành dict."""
    if not row:
        return None
    order = decimal_to_float(row)
    # Chuyển datetime thành string
    if order.get('created_at') and hasattr(order['created_at'], 'strftime'):
        order['created_at'] = order['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    return order


def serialize_order_detail(row, items=None):
    """Chuyển row đơn hàng chi tiết + danh sách items."""
    if not row:
        return None
    order = serialize_order(row)
    order['items'] = decimal_to_float(items or [])
    return order
