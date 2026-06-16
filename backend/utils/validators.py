def validate_email(email):
    """Kiểm tra email hợp lệ cơ bản."""
    if not email or not isinstance(email, str):
        return False
    return '@' in email and '.' in email


def validate_password(password):
    """Kiểm tra mật khẩu đủ dài."""
    if not password or not isinstance(password, str):
        return False
    return len(password) >= 4


def validate_required(data, fields):
    """
    Kiểm tra các trường bắt buộc có tồn tại và không rỗng.
    Trả về danh sách tên các trường bị thiếu.
    """
    missing = []
    if not data or not isinstance(data, dict):
        return fields

    for field in fields:
        value = data.get(field, '')
        if isinstance(value, str):
            value = value.strip()
        if not value:
            missing.append(field)
    return missing
