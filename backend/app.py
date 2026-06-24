import sys
import os

# Thêm thư mục backend vào Python path
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, send_from_directory, abort
from flask_cors import CORS
from config import Config
from routes import register_routes

app = Flask(__name__)
app.secret_key = Config.SECRET_KEY
app.config.from_object(Config)
CORS(app, supports_credentials=True, origins=Config.CORS_ORIGINS)

# Đăng ký tất cả routes
register_routes(app)

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))


@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        abort(404)
    target = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(target):
        return send_from_directory(FRONTEND_DIR, path)
    abort(404)


if __name__ == '__main__':
    print("=" * 55)
    print("  LuxDecor API Server v3 — Restructured")
    print("  Auth:       /api/register, /api/login, /api/logout")
    print("  Products:   /api/products, /api/products/<id>")
    print("  Categories: /api/categories")
    print("  Cart:       /api/cart, /api/cart/add, /api/cart/merge")
    print("  Orders:     /api/orders, /api/orders/<id>")
    print("  Chat:       /api/chat, /api/admin/chat/conversations")
    print("  Frontend:   http://127.0.0.1:5000")
    print("=" * 55)
    app.run(debug=Config.DEBUG, port=5000)
