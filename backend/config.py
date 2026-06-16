import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load biến môi trường từ .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))


class Config:
    """Cấu hình ứng dụng Flask."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'luxdecor_default_secret')
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'


# Cấu hình kết nối MySQL
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASS', ''),
    'database': os.getenv('DB_NAME', 'furniture_shop')
}
