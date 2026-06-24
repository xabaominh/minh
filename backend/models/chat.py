def serialize_conversation(row, extra=None):
    """Chuyển row hội thoại từ DB thành dict."""
    if not row:
        return None
    conv = dict(row)
    if conv.get('created_at') and hasattr(conv['created_at'], 'strftime'):
        conv['created_at'] = conv['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    if conv.get('last_message_at') and hasattr(conv['last_message_at'], 'strftime'):
        conv['last_message_at'] = conv['last_message_at'].strftime('%Y-%m-%d %H:%M:%S')
    if extra:
        conv.update(extra)
    return conv


def serialize_message(row):
    """Chuyển row tin nhắn từ DB thành dict."""
    if not row:
        return None
    msg = dict(row)
    if msg.get('created_at') and hasattr(msg['created_at'], 'strftime'):
        msg['created_at'] = msg['created_at'].strftime('%Y-%m-%d %H:%M:%S')
    msg['is_read'] = bool(msg.get('is_read'))
    msg['is_mine'] = bool(msg.pop('is_mine', False))
    return msg
