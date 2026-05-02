# Retail Web Application

Ứng dụng thương mại điện tử với frontend React và backend Node.js/Express, tích hợp phân tích hành vi mua sắm bằng luật kết hợp (Apriori, FP-Growth).

## Tính năng chính

- Đăng ký, đăng nhập, xác thực người dùng bằng JWT
- Quản lý sản phẩm, danh mục, thuộc tính, đơn hàng
- Giỏ hàng và wishlist (hỗ trợ cả người dùng khách)
- Trang quản trị với thống kê và báo cáo
- Gợi ý sản phẩm và phân tích sản phẩm thường mua cùng nhau
- Giao diện responsive cho desktop và mobile

## Công nghệ sử dụng

### Frontend
- React
- Redux Toolkit + RTK Query
- React Router
- Bootstrap
- Recharts

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT
- Swagger

## Hướng dẫn chạy dự án

### Yêu cầu
- Node.js (khuyến nghị >= 16)
- MongoDB (local hoặc cloud)

### Cài đặt
1. Clone mã nguồn:
```bash
git clone <repository-url>
cd DMProject
```

2. Cài toàn bộ dependencies:
```bash
npm run install:all
```

3. Tạo file `backend/node/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Chạy cả frontend + backend:
```bash
npm start
```

### Địa chỉ chạy mặc định
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Swagger: `http://localhost:5000/api-docs`

## API recommendation đang dùng

- `GET /api/recommend/user`: gợi ý cho luồng người dùng
- `GET /api/recommend/admin`: gợi ý cho luồng admin
- `GET /api/products/deal-hot`: danh sách sản phẩm Deal Hot
- `GET /api/admin/reports/frequently-bought-together`: báo cáo frequent itemsets cho admin

## Cấu trúc thư mục

```text
DMProject/
├── backend/node/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
└── package.json
```