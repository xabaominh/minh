def register_routes(app):
    """Đăng ký tất cả blueprint routes vào Flask app."""
    from .auth import auth_bp
    from .products import products_bp
    from .categories import categories_bp
    from .cart import cart_bp
    from .orders import orders_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(orders_bp)
