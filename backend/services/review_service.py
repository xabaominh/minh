import mysql.connector
from database import get_db
from utils.helpers import decimal_to_float


def _fetch_review_summary(cursor, product_id):
    cursor.execute(
        """
        SELECT COUNT(*) AS review_count, COALESCE(AVG(rating), 0) AS average_rating
        FROM reviews
        WHERE product_id = %s
        """,
        (product_id,)
    )
    row = cursor.fetchone() or {}
    return {
        'review_count': int(row.get('review_count', 0) or 0),
        'average_rating': float(row.get('average_rating') or 0),
    }


def can_user_review_product(cursor, user_id, product_id):
    cursor.execute(
        """
        SELECT 1
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = %s
          AND o.order_status = 'COMPLETED'
          AND oi.product_id = %s
        LIMIT 1
        """,
        (user_id, product_id)
    )
    return cursor.fetchone() is not None


def get_product_review_data(product_id, user_id=None):
    """Lấy thống kê và danh sách review của một sản phẩm."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        summary = _fetch_review_summary(cursor, product_id)

        cursor.execute(
            """
            SELECT r.id, r.user_id, r.product_id, r.rating, r.comment, r.created_at,
                   u.username, u.full_name
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = %s
            ORDER BY r.created_at DESC, r.id DESC
            """,
            (product_id,)
        )
        reviews = cursor.fetchall() or []

        user_review = None
        can_review = False
        if user_id:
            cursor.execute(
                """
                SELECT id, user_id, product_id, rating, comment, created_at
                FROM reviews
                WHERE user_id = %s AND product_id = %s
                ORDER BY created_at DESC, id DESC
                LIMIT 1
                """,
                (user_id, product_id)
            )
            user_review = cursor.fetchone()
            can_review = can_user_review_product(cursor, user_id, product_id)

        return {
            'summary': summary,
            'reviews': decimal_to_float(reviews),
            'user_review': decimal_to_float(user_review) if user_review else None,
            'can_review': can_review,
        }, None

    except mysql.connector.Error as err:
        print(f"Review Service Error: {err}")
        return None, "Không thể tải đánh giá"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def save_product_review(user_id, product_id, rating, comment=''):
    """Tạo hoặc cập nhật đánh giá sản phẩm của người dùng."""
    if rating is None:
        return None, "Vui lòng chọn số sao", 400

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return None, "Đánh giá không hợp lệ", 400

    if rating < 1 or rating > 5:
        return None, "Đánh giá phải từ 1 đến 5 sao", 400

    comment = (comment or '').strip()
    if len(comment) > 1000:
        return None, "Bình luận quá dài", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        if not can_user_review_product(cursor, user_id, product_id):
            return None, "Bạn chỉ có thể đánh giá khi đơn hàng đã hoàn tất và đã nhận hàng", 403

        cursor.execute(
            """
            SELECT id
            FROM reviews
            WHERE user_id = %s AND product_id = %s
            LIMIT 1
            """,
            (user_id, product_id)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                UPDATE reviews
                SET rating = %s, comment = %s
                WHERE id = %s
                """,
                (rating, comment, existing['id'])
            )
            review_id = existing['id']
        else:
            cursor.execute(
                """
                INSERT INTO reviews (user_id, product_id, rating, comment)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, product_id, rating, comment)
            )
            review_id = cursor.lastrowid

        conn.commit()

        cursor.execute(
            """
            SELECT id, user_id, product_id, rating, comment, created_at
            FROM reviews
            WHERE id = %s
            """,
            (review_id,)
        )
        review = cursor.fetchone()

        summary, summary_error = get_product_review_data(product_id, user_id=user_id)
        if summary_error:
            return None, summary_error, 500

        return {
            'review': decimal_to_float(review),
            'summary': summary.get('summary', {}),
            'reviews': summary.get('reviews', []),
            'user_review': summary.get('user_review'),
            'can_review': summary.get('can_review', False),
        }, None, 201 if not existing else 200

    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Save Review Error: {err}")
        return None, "Không thể lưu đánh giá", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
