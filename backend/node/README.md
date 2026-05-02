# Retail Web App - Backend API

Đây là backend API cho hệ thống bán hàng, xây dựng bằng Node.js, Express và MongoDB.

## Tính năng

- Xác thực và phân quyền người dùng (guest, user, admin)
- Quản lý sản phẩm, giỏ hàng, đơn hàng
- Quản trị danh mục/thuộc tính/marketing
- Dashboard và báo cáo phân tích
- Gợi ý sản phẩm và phân tích luật kết hợp (Apriori, FP-Growth)

## Hướng dẫn chạy backend

1. Cài dependencies:
```bash
npm install
```

2. Tạo file `.env` (trong `backend/node`):
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_password
```

3. Chạy server:
```bash
npm start
```
hoặc
```bash
npm run dev
```

## Nhóm endpoint chính

### 1) Người dùng

- `POST /api/users/register`
- `POST /api/users/verify-otp`
- `POST /api/users/resend-otp`
- `POST /api/users/login`
- `GET /api/users/profile`
- `PUT /api/users/profile`
- `POST /api/users/forgot-password`
- `POST /api/users/reset-password`
- `POST /api/users/wishlist`
- `GET /api/users/wishlist`
- `DELETE /api/users/wishlist/:id`

### 2) Sản phẩm

- `GET /api/products`
- `GET /api/products/featured`
- `GET /api/products/counts-by-category`
- `GET /api/products/deal-hot`
- `GET /api/products/:id`
- `GET /api/products/:id/reviews`
- `GET /api/products/:id/related`
- `POST /api/products/:id/reviews`
- `DELETE /api/products/:productId/reviews/:reviewId`

### 3) Giỏ hàng

- `POST /api/cart/add`
- `GET /api/cart`
- `DELETE /api/cart/remove`
- `PUT /api/cart/update`
- `DELETE /api/cart/clear`
- `POST /api/cart/merge`

### 4) Đơn hàng

- `POST /api/orders`
- `GET /api/orders/myorders`
- `GET /api/orders/:id`
- `GET /api/orders/guest/:id/:email`

### 5) Quản trị

- `GET /api/admin/users`
- `GET /api/admin/products`
- `GET /api/admin/all-orders`
- `GET /api/admin/order/:id`
- `PUT /api/admin/order/:id`
- `GET /api/admin/orders-pending`
- `GET /api/admin/orders-processing`
- `GET /api/admin/orders-shipping`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/:id`
- `DELETE /api/admin/categories/:id`
- `GET /api/admin/attributes`
- `POST /api/admin/attributes`
- `PUT /api/admin/attributes/:id`
- `DELETE /api/admin/attributes/:id`
- `GET /api/admin/marketing/banners`
- `GET /api/admin/marketing/deal-hot`
- `GET /api/admin/marketing/discounts`
- `GET /api/admin/marketing/coupons`
- `GET /api/admin/settings/general`
- `PUT /api/admin/settings/general`
- `GET /api/admin/settings/payment`
- `PUT /api/admin/settings/payment`
- `GET /api/admin/settings/shipping`
- `PUT /api/admin/settings/shipping`
- `GET /api/admin/reports/frequently-bought-together`

### 6) Recommendation / Analytics / Metrics

- `GET /api/recommend/user` - Gợi ý theo Apriori (luồng user)
- `GET /api/recommend/admin` - Gợi ý theo FP-Growth (luồng admin)
- `POST /api/analytics/track`
- `GET /api/analytics/recommendations`
- `GET /api/analytics/popular`
- `GET /api/analytics/related/:productId`
- `POST /api/metrics/track/impression`
- `POST /api/metrics/track/click`
- `POST /api/metrics/track/add-to-cart`
- `POST /api/metrics/track/purchase`
- `GET /api/metrics/ctr`
- `GET /api/metrics/cart-rate`
- `GET /api/metrics/conversion-rate`
- `GET /api/metrics/cart-growth`
- `GET /api/metrics/all`

## Recommendation: cách hoạt động

- Hệ thống lấy dữ liệu đơn hàng, chuyển thành transactions.
- Thuật toán Apriori và FP-Growth được dùng cho các luồng khác nhau.
- Kết quả được cache để giảm thời gian phản hồi.
- Admin có endpoint riêng để xem frequent itemsets:
  - `GET /api/admin/reports/frequently-bought-together`
  - Có tham số `minSupport`, `limit`, `orderLimit`.

## Công nghệ backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- Bcrypt
- Nodemailer
- Apriori (`apriori`)
- FP-Growth (`node-fpgrowth`)
- Cache (`node-cache`)
