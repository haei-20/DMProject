const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");

// Cấu hình swagger
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Retail Store API",
      version: "1.0.0",
      description: "API documentation for the retail store system",
    },
    servers: [{ url: "http://localhost:5000" }],
  },
  apis: ["./routes/*.js"], // Quét tất cả file trong thư mục routes
};

// Khởi tạo Swagger docs
const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUI, swaggerSpec };
