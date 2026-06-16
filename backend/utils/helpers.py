from decimal import Decimal


def decimal_to_float(obj):
    """Chuyển đổi Decimal thành float để JSON serialize được."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj
