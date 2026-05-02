# How to Run the Retail Web Application

This application consists of a React frontend and Node.js backend. Follow these steps to run both parts of the application.

## Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend/node
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the backend server:
   ```
   npm run dev
   ```

   This will start the Node.js server at http://localhost:5000.

## Frontend Setup

1. Open a new terminal window

2. Navigate to the frontend directory:
   ```
   cd retail-web-app/frontend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the frontend development server:
   ```
   npm run install:all
   npm start
   ```

   This will start the React application at http://localhost:3000.

## Testing the Connection

1. After both servers are running, open your browser and navigate to http://localhost:3000

2. You should see the homepage with an API Connection Status card at the top.

3. If the connection is successful, you'll see a green success message.

4. If there's an error connecting to the backend, you'll see a red error message with troubleshooting suggestions.

## Troubleshooting

If you encounter connection issues:

1. Make sure both the frontend and backend servers are running.

2. Check that the backend server is running on port 5000 and the frontend on port 3000.

3. If you've modified the backend port, update the API URL in the following files:
   - `frontend/src/services/api.js`
   - `frontend/src/components/ApiStatus.js`
   - `frontend/src/components/ApiConnectionTest.js`

4. Ensure that CORS is properly configured in the backend (it should be already set up in `server.js`).

5. Check the browser console and terminal for any error messages.

## API Documentation

The backend API includes Swagger documentation which can be accessed at:
http://localhost:5000/api-docs 