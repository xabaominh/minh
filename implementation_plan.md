# Tái Cấu Trúc Frontend & Backend — LuxDecor

## Bối cảnh

Dự án LuxDecor hiện gồm 5 file phẳng ở thư mục gốc. Cần tái cấu trúc thành kiến trúc chuyên nghiệp:
- **Frontend**: SPA shell + dynamic views/components + ES modules + CSS modules
- **Backend**: Flask phân lớp Routes → Services → Models

---

## Cấu trúc mục tiêu hoàn chỉnh

```
duanweb/
│
├── frontend/
│   ├── index.html                        # SPA shell
│   │
│   ├── views/
│   │   ├── home.html                     # Trang chủ
│   │   ├── collection.html               # Bộ sưu tập
│   │   └── orders.html                   # Lịch sử đơn hàng
│   │
│   ├── components/
│   │   ├── header.html                   # Header + nav
│   │   ├── footer.html                   # Footer
│   │   ├── cartModal.html                # Modal giỏ hàng
│   │   ├── authModal.html                # Modal đăng nhập/đăng ký
│   │   ├── checkoutModal.html            # Modal thanh toán
│   │   └── productModal.html             # Modal chi tiết sản phẩm
│   │
│   ├── css/
│   │   ├── main.css                      # @import tất cả (entry point)
│   │   ├── variables.css                 # :root, CSS reset, base styles
│   │   ├── layout.css                    # Body, container, responsive base
│   │   ├── animations.css                # @keyframes, scroll reveal, transitions
│   │   │
│   │   ├── components/
│   │   │   ├── header.css                # #header, nav, search box, user menu
│   │   │   ├── footer.css                # #footer, social links, columns
│   │   │   ├── modal.css                 # Auth modal, product modal, overlay
│   │   │   ├── cart.css                  # Cart modal, cart items, checkout
│   │   │   ├── buttons.css               # .shop-now-btn, .add-to-cart-btn, .retry-btn
│   │   │   └── notifications.css         # Toast notifications
│   │   │
│   │   └── pages/
│   │       ├── home.css                  # Banner, products grid, categories, features
│   │       ├── collection.css            # Sidebar, filters, collection grid
│   │       └── orders.css                # Order cards, order history
│   │
│   └── js/
│       ├── main.js                       # Entry point — khởi tạo app
│       ├── router.js                     # SPA routing, load views/components
│       ├── state.js                      # Global state (cart, user, products)
│       └── modules/
│           ├── auth.js                   # Đăng nhập/đăng ký/logout
│           ├── cart.js                   # Giỏ hàng CRUD + sync server
│           ├── products.js               # Load/filter/search sản phẩm
│           └── orders.js                 # Load đơn hàng + checkout
│
├── backend/
│   ├── app.py                            # Flask entry + CORS + blueprint register
│   ├── config.py                         # Config loader từ .env
│   ├── database.py                       # get_db() connection helper
│   ├── requirements.txt                  # Dependencies
│   ├── .env                              # Biến môi trường
│   │
│   ├── routes/
│   │   ├── __init__.py                   # Register all blueprints
│   │   ├── auth.py                       # /api/register, login, logout, profile
│   │   ├── products.py                   # /api/products, /api/products/<id>
│   │   ├── cart.py                       # /api/cart, add, update, remove, merge
│   │   ├── orders.py                     # /api/orders (GET+POST), /api/orders/<id>
│   │   └── categories.py                 # /api/categories
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py               # register_user, login_user, get_profile
│   │   ├── cart_service.py               # get_cart, add_item, update_qty, remove, merge
│   │   ├── order_service.py              # create_order, get_orders, get_order_detail
│   │   └── product_service.py            # get_products, get_detail, get_categories
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                       # User serialization
│   │   ├── product.py                    # Product serialization
│   │   ├── cart.py                       # Cart/CartItem serialization
│   │   └── order.py                      # Order/OrderItem serialization
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── auth_middleware.py            # login_required decorator
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── helpers.py                    # decimal_to_float
│   │   ├── validators.py                 # validate_email, validate_password
│   │   └── response.py                   # success_response(), error_response()
│   │
│   ├── static/
│   │   └── uploads/
│   │
│   └── migrations/
│       ├── schema.sql                    # CREATE TABLE
│       └── seed.sql                      # INSERT dữ liệu mẫu
│
├── erd.mwb
└── README.md
```

---

## Proposed Changes — BACKEND

### Core

#### [NEW] backend/.env
Biến môi trường: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `SECRET_KEY`, `FLASK_DEBUG`.

#### [NEW] backend/config.py
Load `.env` qua `python-dotenv`, export class `Config` với `SECRET_KEY`, `db_config` dict.

#### [NEW] backend/database.py
Hàm `get_db()` trả về MySQL connection. Tách từ server.py L15-23.

#### [NEW] backend/app.py
Khởi tạo Flask, CORS, register blueprints, chạy server. ~20 dòng.

#### [NEW] backend/requirements.txt
`flask`, `flask-cors`, `mysql-connector-python`, `python-dotenv`.

---

### Middleware

#### [NEW] backend/middleware/auth_middleware.py
Decorator `login_required` — tách từ server.py L29-35.

---

### Utils

#### [NEW] backend/utils/helpers.py
`decimal_to_float()` — tách từ server.py L39-46.

#### [NEW] backend/utils/validators.py
`validate_email()`, `validate_password()`, `validate_required()` — trích từ validation logic rải rác trong server.py.

#### [NEW] backend/utils/response.py
`success_response(data, message, status)`, `error_response(message, status)` — wrapper chuẩn hóa API response.

---

### Models

#### [NEW] backend/models/user.py
`serialize_user(row)` — loại bỏ `password_hash`, trả dict sạch.

#### [NEW] backend/models/product.py
`serialize_product(row)`, `serialize_product_detail(row, images)`.

#### [NEW] backend/models/cart.py
`serialize_cart_item(row)`, `calculate_total(items)`.

#### [NEW] backend/models/order.py
`serialize_order(row)`, `serialize_order_detail(row, items)`.

---

### Services (business logic)

#### [NEW] backend/services/auth_service.py
Tách từ server.py L54-203:
- `register_user(data)` — validate → check duplicate → hash → insert → auto-login
- `login_user(data)` — validate → query → check hash → set session
- `get_profile(user_id)` — query user by ID

#### [NEW] backend/services/product_service.py
Tách từ server.py L210-318:
- `get_categories()` — query all categories
- `get_products(category_id, search, limit)` — query with filters
- `get_product_detail(product_id)` — query product + images

#### [NEW] backend/services/cart_service.py
Tách từ server.py L325-550:
- `get_cart(user_id)` — query cart items + total
- `add_item(user_id, product_id, quantity)` — find/create cart → add/update item
- `update_item(user_id, item_id, quantity)` — verify ownership → update/delete
- `remove_item(user_id, item_id)` — verify → delete
- `merge_cart(user_id, items)` — bulk add from localStorage

#### [NEW] backend/services/order_service.py
Tách từ server.py L558-716:
- `create_order(user_id, payment_method, shipping_address)` — validate stock → create order → items → deduct stock → clear cart
- `get_user_orders(user_id)` — query orders list
- `get_order_detail(user_id, order_id)` — query order + items

---

### Routes (thin HTTP layer)

#### [NEW] backend/routes/__init__.py
```python
def register_routes(app):
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
```

#### [NEW] backend/routes/auth.py
Blueprint `auth_bp`: 4 endpoints → gọi `auth_service`.

#### [NEW] backend/routes/products.py
Blueprint `products_bp`: 2 endpoints → gọi `product_service`.

#### [NEW] backend/routes/categories.py
Blueprint `categories_bp`: 1 endpoint → gọi `product_service.get_categories()`.

#### [NEW] backend/routes/cart.py
Blueprint `cart_bp`: 5 endpoints → gọi `cart_service`. Tất cả dùng `@login_required`.

#### [NEW] backend/routes/orders.py
Blueprint `orders_bp`: 3 endpoints → gọi `order_service`. Tất cả dùng `@login_required`.

---

### Database

#### [NEW] backend/migrations/schema.sql
Tách `CREATE TABLE` từ database.sql L1-113 (8 bảng: users, categories, products, product_images, cart, cart_items, orders, order_items).

#### [NEW] backend/migrations/seed.sql
Tách `INSERT` + `SELECT` từ database.sql L115-188 (users mẫu, 5 categories, 20 products, product_images).

---

## Proposed Changes — FRONTEND CSS

### CSS Modules — Tách style.css (2583 dòng)

Mapping từ sections hiện tại trong style.css:

#### [NEW] frontend/css/main.css
Entry point — chỉ chứa `@import`:
```css
@import 'variables.css';
@import 'layout.css';
@import 'animations.css';
@import 'components/header.css';
@import 'components/footer.css';
@import 'components/buttons.css';
@import 'components/modal.css';
@import 'components/cart.css';
@import 'components/notifications.css';
@import 'pages/home.css';
@import 'pages/collection.css';
@import 'pages/orders.css';
```

#### [NEW] frontend/css/variables.css
Tách Section 1 (L23-79): `:root` variables, `*` reset, `html`, `body`, `a`, `ul`, `img` base styles.

#### [NEW] frontend/css/layout.css
Tách Section 15 (L1437-1498) legacy layout + loading spinner (Section 2, L82-114) + responsive base rules.

#### [NEW] frontend/css/animations.css
Tách: `@keyframes spin` (L112), `@keyframes fadeInUp` (L392), `@keyframes fadeInDown` (L2000), Section 13 scroll reveal (L1252-1262).

#### [NEW] frontend/css/components/header.css
Tách Section 3 (L116-273): `#header`, `.danhSachMenu`, `.cum-logo`, `.cum-giua`, `.cum-phai`, `.search-box`, `.giohang-btn`, `.cart-badge`, `.mobile-menu-btn`.
\+ Section 16 user menu (L1959-2045): `.user-menu-wrapper`, `.user-dropdown`.
\+ Responsive header rules từ Section 14 (L1271-1301).

#### [NEW] frontend/css/components/footer.css
Tách Section 9 (L846-940): `#footer`, `.footer-top`, `.footer-logo`, `.cot-footer`, `.social-links`, `.footer-bottom`.
\+ Responsive footer từ Section 14 (L1388-1393).

#### [NEW] frontend/css/components/buttons.css
Tách: `.shop-now-btn` (L360-390), `.add-to-cart-btn` (L574-596), `.retry-btn` (L478-498), `.view-all-btn` (L433-450), `.filter-price-btn` (L1670-1691), `.auth-submit-btn` (L2194-2224), `.checkout-confirm-btn` (L2226-2235).

#### [NEW] frontend/css/components/modal.css
Tách: `.overlay` (L943-957), Section 17 auth modal (L2047-2249), Section 20 product modal (L2349-2583).
\+ Responsive modal từ Section 19 (L2333-2347).

#### [NEW] frontend/css/components/cart.css
Tách Section 10 (L959-1181): `.cart-modal`, `.cart-content`, `.cart-header`, `.cart-items`, `.cart-item`, `.cart-footer`, `.checkout-btn`, `.checkout-summary` (L2237-2249).
\+ Responsive cart từ Section 14 (L1396-1398).

#### [NEW] frontend/css/components/notifications.css
Tách Section 12 (L1216-1250): `#notificationArea`, `.notification`, `.notification.show`, color variants.
\+ Responsive notifications (L1400-1408).

#### [NEW] frontend/css/pages/home.css
Tách: Section 4 banner (L275-401), Section 5 products (L403-596), Section 6 categories (L598-672), Section 7 features (L674-756), Section 8 newsletter (L758-844).
\+ Responsive home từ Section 14 (L1303-1434).

#### [NEW] frontend/css/pages/collection.css
Tách Section 16 (L1501-1957): `.trang-bo-suu-tap`, `.tieu-de-trang`, `.khung-chinh-collection`, sidebar (`.thanh-danh-muc-doc`, `#menu-trai`), filters (`.price-filter`, `.sort-select`), content area (`.khu-vuc-hien-thi`, `.luoi-san-pham`), product cards (`.the-san-pham-doc`).
\+ Responsive collection (L1899-1957).

#### [NEW] frontend/css/pages/orders.css
Tách Section 18 (L2251-2331): `.orders-container`, `.order-card`, `.order-card-header`, `.order-status-badge`, `.order-card-body`, `.order-card-footer`.

---

## Proposed Changes — FRONTEND JavaScript

### JS Modules — Tách script.js (1142 dòng)

#### [NEW] frontend/js/state.js
Global state object + API_BASE constant. ~15 dòng.
```js
export const API_BASE = 'http://127.0.0.1:5000/api';
export const state = {
  cart: JSON.parse(localStorage.getItem('luxdecor_cart') || '[]'),
  allProducts: [],
  allCategories: [],
  currentCategoryId: '',
  currentSearch: '',
  currentView: 'home',
  currentUser: null
};
```

#### [NEW] frontend/js/router.js
Tách từ script.js L556-606:
- `loadComponent(slotId, path)` — fetch HTML → inject vào DOM
- `switchView(viewName, filterCategoryId)` — load view + update nav active
- `setupNavigation()` — gắn click events cho `.nav-link`

#### [NEW] frontend/js/modules/auth.js
Tách từ script.js L54-230:
- `checkAuth()`, `updateAuthUI()`, `setupAuth()`
- `openAuthModal()`, `closeAuthModal()`
- Login/Register submit handlers, logout, user dropdown

#### [NEW] frontend/js/modules/cart.js
Tách từ script.js L232-500:
- `mergeLocalCart()`, `syncCartFromServer()`
- `addToCart()`, `removeFromCart()`, `changeQuantity()`
- `updateCartUI()`, `renderCartItems()`
- `openCart()`, `closeCart()`
- `handleCheckout()`, `setupCheckout()`, `openCheckoutModal()`, `closeCheckoutModal()`

#### [NEW] frontend/js/modules/products.js
Tách từ script.js L608-1041:
- `loadCategoriesData()`, `renderCategoryButtons()`
- `loadProducts()`, `loadAllProducts()`
- `applyFilters()`, `renderCollectionProducts()`, `resetFilters()`
- `setupSearch()`, `setupSorting()`, `setupPriceFilter()`
- `openProductModal()`, `closeProductModal()`
- `changeMainImage()`, `changeModalQty()`, `addToCartFromModal()`

#### [NEW] frontend/js/modules/orders.js
Tách từ script.js L504-551:
- `loadOrders()` — fetch + render order cards

#### [NEW] frontend/js/main.js
Entry point ~40 dòng:
```js
import { ... } from './router.js';
import { ... } from './modules/auth.js';
import { ... } from './modules/cart.js';
import { ... } from './modules/products.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Load components
  await Promise.all([
    loadComponent('header-slot', 'components/header.html'),
    loadComponent('footer-slot', 'components/footer.html'),
    loadComponent('cart-modal-slot', 'components/cartModal.html'),
    loadComponent('auth-modal-slot', 'components/authModal.html'),
    loadComponent('checkout-modal-slot', 'components/checkoutModal.html'),
    loadComponent('product-modal-slot', 'components/productModal.html'),
  ]);
  // 2. Load default view + init
  await switchView('home');
  await checkAuth();
  await loadCategoriesData();
  renderCategoryButtons();
  loadProducts();
  loadAllProducts();
  // 3. Setup events
  setupNavigation();
  setupAuth();
  setupCart();
  setupSearch();
  setupSorting();
  setupPriceFilter();
  setupScrollEffects();
  setupMobileMenu();
  setupSidebarToggle();
  updateCartUI();
});
```

---

## Proposed Changes — FRONTEND HTML

#### [NEW] frontend/index.html
SPA shell — chứa `<head>` (meta, CSS imports), `<body>` với placeholder slots cho components/views, loading spinner, notification area, back-to-top, overlay. Link tới `css/main.css` và `js/main.js` (type="module").

#### [NEW] frontend/views/home.html
Trích từ index.html L78-147: banner, sản phẩm nổi bật, danh mục, tính năng. Chỉ chứa HTML fragment.

#### [NEW] frontend/views/collection.html
Trích từ index.html L152-219: sidebar + toolbar + lưới sản phẩm.

#### [NEW] frontend/views/orders.html
Trích từ index.html L224-238: container lịch sử đơn hàng.

#### [NEW] frontend/components/header.html
Trích từ index.html L24-72: `<header>` với nav, logo, search, cart, user menu.

#### [NEW] frontend/components/footer.html
Trích từ index.html L242-285: `<footer>` với columns và social links.

#### [NEW] frontend/components/cartModal.html
Trích từ index.html L295-314: cart modal markup.

#### [NEW] frontend/components/authModal.html
Trích từ index.html L319-379: login/register modal markup.

#### [NEW] frontend/components/checkoutModal.html
Trích từ index.html L384-409: checkout modal markup.

#### [NEW] frontend/components/productModal.html
Trích từ index.html L414-424: product detail modal markup.

---

## Proposed Changes — DOCUMENTATION

#### [NEW] README.md
- Mô tả dự án
- Hướng dẫn cài đặt (MySQL, Python, dependencies)
- Cấu hình `.env`
- Chạy backend: `cd backend && python app.py`
- Mở frontend: serve `frontend/` hoặc mở `index.html`
- Danh sách API endpoints

#### [DELETE] walkthrough.md
Thông tin lỗi thời, thay bằng README.md.

---

## Tổng kết: File cũ → Files mới

| File cũ | Số dòng | Tách thành | Số file mới |
|---------|---------|-----------|-------------|
| `index.html` | 431 | 1 shell + 3 views + 6 components | **10 files** |
| `style.css` | 2583 | 1 main + 3 base + 6 components + 3 pages | **13 files** |
| `script.js` | 1142 | 1 main + 1 router + 1 state + 4 modules | **7 files** |
| `server.py` | 732 | app + config + db + 5 routes + 4 services + 4 models + middleware + 3 utils | **20 files** |
| `database.sql` | 188 | schema + seed | **2 files** |
| **Tổng** | **5076 dòng** | | **~52 files** |

---

## Thứ tự thực hiện

1. **Backend** — config, database, utils, middleware, models, services, routes, app.py
2. **Database** — schema.sql + seed.sql
3. **Frontend CSS** — variables → layout → animations → components → pages → main.css
4. **Frontend JS** — state → router → modules → main.js
5. **Frontend HTML** — index.html shell → components → views
6. **Documentation** — README.md
7. **Verification** — Chạy test toàn bộ
8. **Cleanup** — Archive/xóa file cũ

---

## Verification Plan

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Test endpoints:
curl http://127.0.0.1:5000/api/categories
curl http://127.0.0.1:5000/api/products
curl http://127.0.0.1:5000/api/products?category_id=1
curl http://127.0.0.1:5000/api/products/1
```

### Frontend
- Serve `frontend/` qua local server (hoặc Flask serve static)
- Kiểm tra: Components load đúng (header, footer, modals)
- Kiểm tra: Views chuyển mượt (Home ↔ Collection ↔ Orders)
- Kiểm tra: Tìm kiếm, lọc, sắp xếp hoạt động
- Kiểm tra: Đăng ký, đăng nhập, đăng xuất
- Kiểm tra: Giỏ hàng, thanh toán, lịch sử đơn hàng
- Kiểm tra: Modal chi tiết sản phẩm
- Kiểm tra: Responsive trên mobile
