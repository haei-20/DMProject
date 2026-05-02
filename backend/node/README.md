# Retail Web App - Backend API

This is the backend API for the Retail Web Application. It's built with Node.js, Express, and MongoDB.

## Features

- User authentication (login, register, password reset)
- User roles (guest, user, admin)
- Product management
- Shopping cart functionality (supports both registered users and guests)
- Order processing
- Product recommendations
- Admin dashboard and analytics

## API Endpoints

### User Endpoints
- POST /api/users/register - Register a new user
- POST /api/users/verify-otp - Verify account with OTP
- POST /api/users/resend-otp - Resend verification OTP
- POST /api/users/login - Login
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- POST /api/users/forgot-password - Request password reset
- POST /api/users/reset-password - Reset password
- POST /api/users/wishlist - Add product to wishlist
- GET /api/users/wishlist - Get wishlist
- DELETE /api/users/wishlist/:id - Remove product from wishlist

### Product Endpoints
- GET /api/products - Get all products
- GET /api/products/:id - Get product by ID

### Cart Endpoints
- POST /api/cart/add - Add product to cart (works for both users and guests)
- GET /api/cart - Get cart (works for both users and guests)
- PUT /api/cart/update - Update cart item
- DELETE /api/cart/remove - Remove item from cart
- DELETE /api/cart/clear - Clear cart
- POST /api/cart/merge - Merge guest cart into user cart

### Order Endpoints
- POST /api/orders - Create order (works for both users and guests)
- GET /api/orders/myorders - Get user's orders
- GET /api/orders/:id - Get order by ID
- GET /api/orders/guest/:id/:email - Get guest order

### Admin Endpoints
- GET /api/admin/users - Get all users
- GET /api/admin/users/:id - Get user by ID
- PUT /api/admin/users/:id - Update user
- DELETE /api/admin/users/:id - Delete user
- GET /api/admin/products - Get all products
- DELETE /api/admin/products/:id - Delete product
- GET /api/admin/orders - Get all orders
- PUT /api/admin/orders/:id - Update order status
- GET /api/admin/dashboard - Get dashboard statistics
- GET /api/admin/reports/sales - Get sales reports
- GET /api/admin/reports/top-products - Get top products
- GET /api/admin/reports/user-analytics - Get user analytics
- GET /api/admin/reports/frequently-bought-together - Get frequently bought together products

### Analytics Endpoints
- POST /api/analytics/track - Track user behavior
- GET /api/analytics/recommendations - Get personalized recommendations
- GET /api/analytics/popular - Get popular products
- GET /api/analytics/related/:productId - Get related products

### Metrics Endpoints
- POST /api/metrics/track/impression - Track recommendation impressions
- POST /api/metrics/track/click - Track recommendation clicks
- POST /api/metrics/track/add-to-cart - Track adding recommended products to cart
- POST /api/metrics/track/purchase - Track purchasing recommended products
- GET /api/metrics/ctr - Get Click-Through Rate (admin only)
- GET /api/metrics/cart-rate - Get cart addition rate (admin only)
- GET /api/metrics/conversion-rate - Get conversion rate (admin only)
- GET /api/metrics/cart-growth - Get cart growth metrics (admin only)
- GET /api/metrics/all - Get all recommendation metrics (admin only)

## Setup Instructions

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file based on the `.env.example` template
4. Start the server with `npm start` or `npm run dev` for development

## Environment Variables

The following environment variables need to be configured:

- PORT - Port number for the server (default: 5000)
- MONGO_URI - MongoDB connection string
- JWT_SECRET - Secret key for JWT token generation
- EMAIL_USER - Email for sending notifications
- EMAIL_PASS - Password for the email account

## Technologies Used

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email sending

## Tính năng đề xuất sản phẩm

Hệ thống đề xuất sản phẩm sử dụng hai thuật toán phân tích giỏ hàng:

### 1. Thuật toán Apriori

Thuật toán Apriori được sử dụng để phân tích các mẫu mua hàng và tìm ra các luật kết hợp giữa các sản phẩm. Thuật toán này hiệu quả trong việc tìm kiếm các sản phẩm thường được mua cùng nhau.

Các tham số chính:
- `minSupport`: Ngưỡng tối thiểu cho tỷ lệ xuất hiện của một mẫu trong tổng số giao dịch
- `minConfidence`: Độ tin cậy tối thiểu của một luật kết hợp

### 2. Thuật toán FP-Growth (Frequent Pattern Growth)

FP-Growth là thuật toán hiệu quả hơn Apriori trong việc tìm kiếm các mẫu mua hàng phổ biến, đặc biệt với tập dữ liệu lớn. Thuật toán này sử dụng cấu trúc dữ liệu FP-Tree để lưu trữ thông tin về các mẫu mua hàng.

## Các API đề xuất sản phẩm

### 1. Đề xuất sản phẩm trong giỏ hàng

```
GET /api/cart
```

API này trả về nội dung giỏ hàng cùng với các sản phẩm được đề xuất dựa trên các sản phẩm hiện có trong giỏ hàng. Các đề xuất được tạo bằng thuật toán Apriori.

### 2. Đề xuất sản phẩm cho trang chủ

```
GET /api/products/featured
```

API này trả về cả sản phẩm nổi bật và sản phẩm được đề xuất cá nhân hóa cho người dùng dựa trên lịch sử mua hàng của họ. Các đề xuất được tạo bằng thuật toán FP-Growth.

### 3. Đề xuất sản phẩm liên quan

```
GET /api/products/:id/related
```

API này trả về các sản phẩm liên quan đến một sản phẩm cụ thể, dựa trên phân tích các mẫu mua hàng.

### 4. Sản phẩm thường được mua cùng nhau (cho Admin)

```
GET /api/admin/reports/frequently-bought-together
```

API này trả về danh sách các nhóm sản phẩm thường được mua cùng nhau, giúp admin tạo các combo sản phẩm. Các tham số:
- `minSupport`: Ngưỡng tối thiểu (0-1)
- `limit`: Số lượng mẫu trả về

## Các chỉ số đo hiệu quả hệ thống đề xuất

Hệ thống theo dõi và đo lường hiệu quả của các đề xuất sản phẩm thông qua các chỉ số sau:

### 1. Click-Through Rate (CTR)

Tỷ lệ người dùng nhấp vào sản phẩm được đề xuất so với số lần hiển thị đề xuất.

```
CTR = (Số lượt click / Số lượt hiển thị) × 100%
```

Chỉ số này đo lường mức độ hấp dẫn của các đề xuất đối với người dùng.

### 2. Tỷ lệ thêm vào giỏ hàng

Tỷ lệ sản phẩm được đề xuất được thêm vào giỏ hàng so với số lần hiển thị.

```
Tỷ lệ thêm vào giỏ hàng = (Số lượt thêm vào giỏ / Số lượt hiển thị) × 100%
```

Chỉ số này đo lường khả năng chuyển đổi của đề xuất thành hành động mua hàng.

### 3. Tỷ lệ chuyển đổi

Tỷ lệ sản phẩm được đề xuất cuối cùng được mua so với số lần hiển thị.

```
Tỷ lệ chuyển đổi = (Số lượt mua / Số lượt hiển thị) × 100%
```

### 4. Tăng trưởng giỏ hàng

So sánh giá trị giỏ hàng trung bình trước và sau khi xem đề xuất.

```
Tăng trưởng giỏ hàng = ((Giá trị sau - Giá trị trước) / Giá trị trước) × 100%
```

Chỉ số này đo lường khả năng của hệ thống đề xuất trong việc tăng giá trị đơn hàng.

## Cách hoạt động

1. Hệ thống phân tích dữ liệu đơn hàng để tạo các giao dịch
2. Áp dụng thuật toán Apriori hoặc FP-Growth để tìm các mẫu mua hàng phổ biến
3. Kết quả được lưu vào cache để tối ưu hiệu suất
4. Dựa vào các mẫu này, hệ thống đề xuất sản phẩm phù hợp cho từng trường hợp
5. Theo dõi hiệu quả của các đề xuất thông qua các chỉ số CTR, tỷ lệ thêm vào giỏ hàng, tỷ lệ chuyển đổi và tăng trưởng giỏ hàng

## Cài đặt

Các thư viện cần thiết:
- `apriori`: Thư viện triển khai thuật toán Apriori
- `node-fpgrowth`: Thư viện triển khai thuật toán FP-Growth
- `node-cache`: Thư viện lưu cache để tối ưu hiệu suất

```bash
npm install apriori node-fpgrowth node-cache
```
