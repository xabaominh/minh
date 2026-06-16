def serialize_user(row):
    """Chuyển row từ DB thành dict user (loại bỏ password_hash)."""
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "email": row["email"],
        "full_name": row.get("full_name"),
        "phone": row.get("phone"),
        "address": row.get("address"),
        "role": row.get("role", "USER")
    }
