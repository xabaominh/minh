import mysql.connector
from config import db_config


def get_db():
    """Tạo và trả về một kết nối MySQL mới."""
    return mysql.connector.connect(**db_config)
