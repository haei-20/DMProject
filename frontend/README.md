# Frontend - Retail Web App

Frontend được xây dựng bằng React, dùng Redux Toolkit + RTK Query để gọi API backend.

## Yêu cầu

- Node.js (khuyến nghị >= 16)
- Backend đang chạy tại `http://localhost:5000`

## Cài đặt và chạy

Trong thư mục `frontend`, chạy:

```bash
npm install
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`.

## Script thường dùng

### `npm start`
- Chạy frontend ở chế độ development.
- Tự động reload khi chỉnh sửa code.

### `npm test`
- Chạy test ở chế độ watch (nếu có test).

### `npm run build`
- Build bản production vào thư mục `build/`.

## Biến môi trường (nếu cần)

Bạn có thể cấu hình API URL bằng biến:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Nếu không khai báo, frontend sẽ dùng mặc định `http://localhost:5000/api`.

## Luồng API chính đang sử dụng

- Auth, users, products, cart, orders
- Recommendation:
  - `GET /api/recommend/user`
  - `GET /api/recommend/admin`
- Deal Hot:
  - `GET /api/products/deal-hot`
- Frequent itemsets cho admin:
  - `GET /api/admin/reports/frequently-bought-together`
