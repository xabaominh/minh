import mysql.connector
from database import get_db
from models.chat import serialize_conversation, serialize_message


def _get_conversation_by_id(cursor, conversation_id):
    cursor.execute("""
        SELECT c.*, u.username, u.full_name, u.email
        FROM chat_conversations c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = %s
    """, (conversation_id,))
    return cursor.fetchone()


def _verify_customer_access(cursor, conversation_id, user_id):
    cursor.execute(
        "SELECT id FROM chat_conversations WHERE id = %s AND user_id = %s",
        (conversation_id, user_id)
    )
    return cursor.fetchone()


def get_or_create_conversation(user_id):
    """Lấy hoặc tạo hội thoại OPEN cho khách hàng."""
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT * FROM chat_conversations
            WHERE user_id = %s AND status = 'OPEN'
            ORDER BY last_message_at DESC, id DESC
            LIMIT 1
        """, (user_id,))
        conv = cursor.fetchone()

        if not conv:
            cursor.execute("""
                INSERT INTO chat_conversations (user_id, subject, status)
                VALUES (%s, 'Hỗ trợ khách hàng', 'OPEN')
            """, (user_id,))
            conn.commit()
            conv_id = cursor.lastrowid
            conv = _get_conversation_by_id(cursor, conv_id)

        messages, err = _fetch_messages(cursor, conv['id'], user_id, is_admin=False)
        if err:
            return None, None, err

        conn.commit()
        return serialize_conversation(conv), messages, None
    except mysql.connector.Error as err:
        print(f"Chat get_or_create Error: {err}")
        return None, None, "Không thể tải hội thoại"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def _fetch_messages(cursor, conversation_id, viewer_id, is_admin=False, since_id=None):
    query = """
        SELECT m.*, u.username, u.full_name, u.role AS sender_role,
               (m.sender_id = %s) AS is_mine
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = %s
    """
    params = [viewer_id, conversation_id]

    if since_id:
        query += " AND m.id > %s"
        params.append(since_id)

    query += " ORDER BY m.created_at ASC, m.id ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    if is_admin:
        cursor.execute("""
            UPDATE chat_messages SET is_read = TRUE
            WHERE conversation_id = %s AND sender_id != %s AND is_read = FALSE
        """, (conversation_id, viewer_id))
    else:
        cursor.execute("""
            UPDATE chat_messages SET is_read = TRUE
            WHERE conversation_id = %s
              AND sender_id != %s
              AND is_read = FALSE
        """, (conversation_id, viewer_id))

    return [serialize_message(r) for r in rows], None


def get_customer_messages(user_id, since_id=None):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id FROM chat_conversations
            WHERE user_id = %s AND status = 'OPEN'
            ORDER BY last_message_at DESC, id DESC
            LIMIT 1
        """, (user_id,))
        conv = cursor.fetchone()
        if not conv:
            return [], 0, None

        messages, err = _fetch_messages(cursor, conv['id'], user_id, since_id=since_id)
        if err:
            return None, 0, err

        cursor.execute("""
            SELECT COUNT(*) AS cnt FROM chat_messages
            WHERE conversation_id = %s AND sender_id != %s AND is_read = FALSE
        """, (conv['id'], user_id))
        unread = cursor.fetchone()['cnt']
        conn.commit()

        return messages, unread, None
    except mysql.connector.Error as err:
        print(f"Chat messages Error: {err}")
        return None, 0, "Không thể tải tin nhắn"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def send_customer_message(user_id, body):
    body = (body or '').strip()
    if not body:
        return None, "Nội dung tin nhắn không được để trống", 400
    if len(body) > 2000:
        return None, "Tin nhắn quá dài (tối đa 2000 ký tự)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id FROM chat_conversations
            WHERE user_id = %s AND status = 'OPEN'
            ORDER BY last_message_at DESC, id DESC
            LIMIT 1
        """, (user_id,))
        conv = cursor.fetchone()

        if not conv:
            cursor.execute("""
                INSERT INTO chat_conversations (user_id, subject, status)
                VALUES (%s, 'Hỗ trợ khách hàng', 'OPEN')
            """, (user_id,))
            conv_id = cursor.lastrowid
        else:
            conv_id = conv['id']

        cursor.execute("""
            INSERT INTO chat_messages (conversation_id, sender_id, body)
            VALUES (%s, %s, %s)
        """, (conv_id, user_id, body))
        msg_id = cursor.lastrowid

        cursor.execute("""
            UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (conv_id,))
        conn.commit()

        cursor.execute("""
            SELECT m.*, u.username, u.full_name, u.role AS sender_role,
                   TRUE AS is_mine
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = %s
        """, (msg_id,))
        return serialize_message(cursor.fetchone()), None, 201
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Chat send Error: {err}")
        return None, "Không thể gửi tin nhắn", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_customer_unread_count(user_id):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT COUNT(*) AS cnt
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE c.user_id = %s AND c.status = 'OPEN'
              AND m.sender_id != %s AND m.is_read = FALSE
        """, (user_id, user_id))
        return cursor.fetchone()['cnt'], None
    except mysql.connector.Error as err:
        print(f"Chat unread Error: {err}")
        return 0, "Không thể đếm tin nhắn chưa đọc"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_admin_conversations(status=None):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT c.*, u.username, u.full_name, u.email,
                   (SELECT body FROM chat_messages
                    WHERE conversation_id = c.id
                    ORDER BY created_at DESC, id DESC LIMIT 1) AS last_message,
                   (SELECT COUNT(*) FROM chat_messages
                    WHERE conversation_id = c.id AND is_read = FALSE
                      AND sender_id = c.user_id) AS unread_count
            FROM chat_conversations c
            JOIN users u ON c.user_id = u.id
        """
        params = []
        if status:
            query += " WHERE c.status = %s"
            params.append(status.upper())
        query += " ORDER BY c.last_message_at DESC, c.id DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [serialize_conversation(r, {
            'last_message': r.get('last_message'),
            'unread_count': r.get('unread_count', 0)
        }) for r in rows], None
    except mysql.connector.Error as err:
        print(f"Admin chat list Error: {err}")
        return None, "Không thể tải danh sách hội thoại"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_admin_conversation_detail(conversation_id, admin_id, since_id=None):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        conv = _get_conversation_by_id(cursor, conversation_id)
        if not conv:
            return None, None, "Không tìm thấy hội thoại", 404

        messages, err = _fetch_messages(cursor, conversation_id, admin_id, is_admin=True, since_id=since_id)
        if err:
            return None, None, err, 500

        conn.commit()
        return serialize_conversation(conv), messages, None, 200
    except mysql.connector.Error as err:
        print(f"Admin chat detail Error: {err}")
        return None, None, "Không thể tải hội thoại", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def send_admin_message(conversation_id, admin_id, body):
    body = (body or '').strip()
    if not body:
        return None, "Nội dung tin nhắn không được để trống", 400
    if len(body) > 2000:
        return None, "Tin nhắn quá dài (tối đa 2000 ký tự)", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        conv = _get_conversation_by_id(cursor, conversation_id)
        if not conv:
            return None, "Không tìm thấy hội thoại", 404

        if conv['status'] == 'CLOSED':
            return None, "Hội thoại đã đóng", 400

        cursor.execute("""
            INSERT INTO chat_messages (conversation_id, sender_id, body)
            VALUES (%s, %s, %s)
        """, (conversation_id, admin_id, body))
        msg_id = cursor.lastrowid

        cursor.execute("""
            UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (conversation_id,))
        conn.commit()

        cursor.execute("""
            SELECT m.*, u.username, u.full_name, u.role AS sender_role,
                   TRUE AS is_mine
            FROM chat_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.id = %s
        """, (msg_id,))
        return serialize_message(cursor.fetchone()), None, 201
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Admin chat send Error: {err}")
        return None, "Không thể gửi tin nhắn", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def update_conversation_status(conversation_id, status):
    status = (status or '').upper()
    if status not in ('OPEN', 'CLOSED'):
        return "Trạng thái không hợp lệ", 400

    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE chat_conversations SET status = %s WHERE id = %s",
            (status, conversation_id)
        )
        if cursor.rowcount == 0:
            return "Không tìm thấy hội thoại", 404
        conn.commit()
        return None, 200
    except mysql.connector.Error as err:
        if conn:
            conn.rollback()
        print(f"Chat status Error: {err}")
        return "Không thể cập nhật trạng thái", 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def get_admin_unread_count():
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT COUNT(*) AS cnt
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            JOIN users u ON m.sender_id = u.id
            WHERE c.status = 'OPEN' AND u.role = 'USER' AND m.is_read = FALSE
        """)
        return cursor.fetchone()['cnt'], None
    except mysql.connector.Error as err:
        print(f"Admin unread Error: {err}")
        return 0, "Không thể đếm tin nhắn chưa đọc"
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
