# Retail Web Application

A modern e-commerce web application with React frontend and Node.js backend.

## Features

- User authentication and authorization with JWT
- Product browsing, filtering, and search
- Shopping cart and wishlist functionality
- Order processing and tracking
- Admin dashboard for product, order, and user management
- Real-time API status monitoring
- Responsive design for all devices

## Tech Stack

### Frontend
- React 19
- Redux Toolkit and RTK Query
- React Router
- Bootstrap 5
- Recharts for analytics visualization

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Swagger for API documentation

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```
git clone <repository-url>
cd DMProject
```

2. Install all dependencies:
```
npm run install:all
```

3. Set up environment variables:
   - Create a `.env` file in the `backend/node` directory with the following:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the development servers:
```
npm start
```

This will start both frontend and backend servers concurrently:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Swagger documentation: http://localhost:5000/api-docs

## API Integration

The frontend communicates with the backend through RESTful API endpoints. Key integrations include:

- Authentication (login, register, profile management)
- Products (listing, details, search, filtering)
- Cart operations (add, update, remove items)
- Order processing (checkout, history, status)
- Admin operations (product/user management, analytics)

## Optimizations

This project implements several optimizations:

- RTK Query for efficient API data fetching and caching
- Lazy loading for components and routes
- Responsive image optimization
- API status monitoring
- Error boundaries for fault tolerance

## Project Structure

```
retail-web-app/
├── backend/
│   └── node/
│       ├── config/
│       ├── controllers/
│       ├── middlewares/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── server.js
│       └── ...
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── ...
│   └── ...
└── package.json
``` 