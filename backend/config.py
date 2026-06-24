import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load biến môi trường từ .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))


class Config:
    """Cấu hình ứng dụng Flask."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'luxdecor_default_secret')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    CORS_ORIGINS = [
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ]


# Cấu hình kết nối MySQL
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASS', ''),
    'database': os.getenv('DB_NAME', 'furniture_shop')
}
