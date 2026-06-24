import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float


def get_product_reviews(product_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT r.id, r.rating, r.comment, r.created_at,
                   u.username, u.full_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.product_id = %s
            ORDER BY r.created_at DESC
            """,
            (product_id,)
        )
        rows = cursor.fetchall()
        for row in rows:
            if row.get('created_at') and hasattr(row['created_at'], 'strftime'):
                row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return decimal_to_float(rows), None
    except mysql.connector.Error as err:
        print(f"Reviews Error: {err}")
        return None, "Không thể tải đánh giá"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_review_summary(product_id):
    reviews, error = get_product_reviews(product_id)
    if error:
        return None, error
    if not reviews:
        return {'average': 0, 'count': 0}, None
    avg = sum(r['rating'] for r in reviews) / len(reviews)
    return {'average': round(avg, 1), 'count': len(reviews)}, None


def can_user_review(user_id, product_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id FROM reviews WHERE user_id = %s AND product_id = %s",
            (user_id, product_id)
        )
        if cursor.fetchone():
            return False, "Bạn đã đánh giá sản phẩm này"

        cursor.execute(
            """
            SELECT 1
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = %s AND oi.product_id = %s AND o.order_status = 'COMPLETED'
            LIMIT 1
            """,
            (user_id, product_id)
        )
        if not cursor.fetchone():
            return False, "Chỉ khách đã mua và nhận hàng mới được đánh giá"

        return True, None
    except mysql.connector.Error as err:
        print(f"Can Review Error: {err}")
        return False, "Không thể kiểm tra quyền đánh giá"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def create_review(user_id, product_id, rating, comment=''):
    rating = int(rating)
    if rating < 1 or rating > 5:
        return None, "Đánh giá từ 1 đến 5 sao", 400

    allowed, reason = can_user_review(user_id, product_id)
    if not allowed:
        return None, reason, 403

    comment = (comment or '').strip()
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (%s, %s, %s, %s)",
            (user_id, product_id, rating, comment or None)
        )
        review_id = cursor.lastrowid
        conn.commit()

        cursor.execute(
            """
            SELECT r.id, r.rating, r.comment, r.created_at,
                   u.username, u.full_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.id = %s
            """,
            (review_id,)
        )
        row = cursor.fetchone()
        if row.get('created_at') and hasattr(row['created_at'], 'strftime'):
            row['created_at'] = row['created_at'].strftime('%Y-%m-%d %H:%M')
        return decimal_to_float(row), None, 201
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Create Review Error: {err}")
        return None, "Không thể gửi đánh giá", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
