import sys
import os

# Thêm thư mục backend vào Python path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from config import Config
from routes import register_routes

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
app.config.from_object(Config)
CORS(app, supports_credentials=True)

# Đăng ký tất cả routes
register_routes(app)


if __name__ == '__main__':
    print("=" * 55)
    print("  LuxDecor API Server v3 — Restructured")
    print("  Auth:       /api/register, /api/login, /api/logout")
    print("  Products:   /api/products, /api/products/<id>")
    print("  Categories: /api/categories")
    print("  Cart:       /api/cart, /api/cart/add, /api/cart/merge")
    print("  Orders:     /api/orders, /api/orders/<id>")
    print("=" * 55)
    app.run(debug=Config.DEBUG, port=5000)
