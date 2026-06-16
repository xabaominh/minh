// Sự kiện kích hoạt ngay khi trình duyệt dựng xong khung HTML
document.addEventListener("DOMContentLoaded", () => {
    fetchProductsFromAPI();
});

// Hàm dùng Fetch kỹ thuật Async/Await để gọi API từ Backend Python
async function fetchProductsFromAPI() {
    const productListContainer = document.getElementById("product-list");
    
    try {
        // 1. Gửi yêu cầu "lấy dữ liệu" tới link API của Server Python
        const response = await fetch("http://127.0.0.1:5000/api/products");
        
        if (!response.ok) {
            throw new Error("Không phản hồi từ API Server Backend");
        }
        
        // 2. Chuyển chuỗi văn bản JSON nhận được thành mảng Object của JavaScript
        const products = await response.json();
        
        // Xóa sạch nội dung chữ "Đang kết nối API..." ban đầu
        productListContainer.innerHTML = "";
        
        // Kiểm tra nếu database trống
        if (products.length === 0) {
            productListContainer.innerHTML = '<div class="loading">Kho hàng hiện tại đang trống.</div>';
            return;
        }

        // 3. Vòng lặp duyệt qua từng dòng sản phẩm lấy được từ MySQL
        products.forEach(product => {
            // Định dạng số tiền (Ví dụ: 2500000 thành 2.500.000 ₫)
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);
            
            // Tự động dựng bộ khung HTML khớp với dữ liệu từng sản phẩm
            const cardHTML = `
                <div class="product-card">
                    <img class="product-image" src="${product.image_url}" alt="${product.name}">
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-category"> ${product.category} </div>
                        <div class="product-price">${formattedPrice}</div>
                        
                    </div>
                </div>
            `;
            
            // Bắn đoạn mã HTML vừa dựng vào bên trong chiếc hộp "product-list"
            productListContainer.innerHTML += cardHTML;
        });

    } catch (error) {
        console.error("Lỗi Fetch:", error);
        productListContainer.innerHTML = `<div class="loading" style="color: red;">Không thể tải sản phẩm. Lỗi: ${error.message}</div>`;
    }
}