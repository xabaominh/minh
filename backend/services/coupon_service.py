from datetime import datetime
import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float


def validate_coupon(code, order_total):
    """
    Kiểm tra mã giảm giá.
    Trả về (coupon_dict, error_message, status_code).
    """
    code = (code or '').strip().upper()
    if not code:
        return None, "Vui lòng nhập mã giảm giá", 400

    order_total = float(order_total or 0)
    if order_total <= 0:
        return None, "Giỏ hàng trống", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, code, discount_amount, discount_type, min_order_amount,
                   valid_from, valid_until, usage_limit, used_count, is_active
            FROM coupons
            WHERE UPPER(code) = %s
            """,
            (code,)
        )
        coupon = cursor.fetchone()
        if not coupon or not coupon['is_active']:
            return None, "Mã giảm giá không hợp lệ", 404

        now = datetime.now()
        if coupon['valid_from'] and coupon['valid_from'] > now:
            return None, "Mã giảm giá chưa có hiệu lực", 400
        if coupon['valid_until'] and coupon['valid_until'] < now:
            return None, "Mã giảm giá đã hết hạn", 400
        if coupon['usage_limit'] is not None and coupon['used_count'] >= coupon['usage_limit']:
            return None, "Mã giảm giá đã hết lượt sử dụng", 400

        min_amount = float(coupon['min_order_amount'] or 0)
        if order_total < min_amount:
            return None, f"Đơn hàng tối thiểu {int(min_amount):,}đ để dùng mã này".replace(',', '.'), 400

        amount = float(coupon['discount_amount'])
        if coupon['discount_type'] == 'PERCENT':
            discount = round(order_total * amount / 100)
        else:
            discount = amount

        discount = min(discount, order_total)
        final_total = order_total - discount

        return decimal_to_float({
            'coupon_id': coupon['id'],
            'code': coupon['code'],
            'discount_amount': discount,
            'final_total': final_total,
            'order_total': order_total
        }), None, 200
    except mysql.connector.Error as err:
        print(f"Coupon Error: {err}")
        return None, "Không thể kiểm tra mã giảm giá", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def mark_coupon_used(coupon_id):
    """Tăng used_count sau khi đặt hàng thành công."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE coupons SET used_count = used_count + 1 WHERE id = %s",
            (coupon_id,)
        )
        conn.commit()
    except mysql.connector.Error as err:
        print(f"Mark Coupon Used Error: {err}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
