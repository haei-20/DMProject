const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Retail Web App API',
      version: '1.0.0',
      description: 'Tài liệu API được sinh tự động từ JSDoc trong các file routes',
      contact: {
        name: 'Developer Team',
        email: 'support@retail-web-app.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.retail-web-app.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Products',
        description: 'Product management',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Orders',
        description: 'Order management',
      },
      {
        name: 'Cart',
        description: 'Shopping cart management',
      },
      {
        name: 'Admin',
        description: 'Admin operations',
      },
      {
        name: 'Coupons',
        description: 'Coupon management',
      },
      {
        name: 'Newsletter',
        description: 'Newsletter subscription management',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reports',
      },
      {
        name: 'Dashboard',
        description: 'Admin dashboard data',
      },
      {
        name: 'Recommendations',
        description: 'Product recommendations',
      },
      {
        name: 'Metrics',
        description: 'Recommendation metrics and tracking',
      },
    ],
  },
  // Tự động quét JSDoc @swagger trong routes
  apis: ['./routes/*.js'],
};

const fullSwaggerSpec = swaggerJsdoc(swaggerOptions);

// Chỉ giữ các API phục vụ test thuật toán + logic recommendation
const ALGORITHM_DOC_PATHS = new Set([
  '/api/users/login',
  '/api/recommend/user',
  '/api/recommend/admin',
  '/api/cart',
  '/api/products/deal-hot',
  '/api/products/{id}/related',
  '/api/admin/reports/frequently-bought-together',
]);

const filteredPaths = Object.fromEntries(
  Object.entries(fullSwaggerSpec.paths || {}).filter(([pathKey]) =>
    ALGORITHM_DOC_PATHS.has(pathKey)
  )
);

const usedTags = new Set();
Object.values(filteredPaths).forEach((methods) => {
  Object.values(methods).forEach((op) => {
    (op.tags || []).forEach((tag) => usedTags.add(tag));
  });
});

const swaggerSpec = {
  ...fullSwaggerSpec,
  tags: (fullSwaggerSpec.tags || []).filter((tag) => usedTags.has(tag.name)),
  paths: filteredPaths,
};

function setupSwagger(app) {
  // Serve swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger documentation is available at /api-docs');
}

module.exports = setupSwagger; 