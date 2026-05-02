const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Retail Web App API',
      version: '1.0.0',
      description: 'API documentation for Retail Web Application',
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
    paths: {
      '/api/products/featured': {
        get: {
          tags: ['Products', 'Recommendations'],
          summary: 'Get featured products with personalized recommendations',
          description: 'Returns featured products and personalized recommendations for homepage',
          parameters: [
            {
              in: 'query',
              name: 'limit',
              schema: {
                type: 'integer'
              },
              description: 'Number of products to return'
            }
          ],
          responses: {
            200: {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      featuredProducts: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      recommendedProducts: {
                        type: 'array',
                        items: {
                          type: 'object'
                        }
                      },
                      success: {
                        type: 'boolean'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/products/{id}/related': {
        get: {
          tags: ['Products', 'Recommendations'],
          summary: 'Get related products',
          description: 'Returns products related to the specified product',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: {
                type: 'string'
              },
              description: 'Product ID'
            },
            {
              in: 'query',
              name: 'limit',
              schema: {
                type: 'integer'
              },
              description: 'Number of products to return'
            }
          ],
          responses: {
            200: {
              description: 'Successful operation'
            }
          }
        }
      },
      '/api/cart': {
        get: {
          tags: ['Cart', 'Recommendations'],
          summary: 'Get cart contents with recommendations',
          description: 'Returns cart contents and product recommendations based on cart items',
          parameters: [
            {
              in: 'query',
              name: 'sessionId',
              schema: {
                type: 'string'
              },
              description: 'Session ID for guest cart'
            }
          ],
          responses: {
            200: {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                        example: 'Giỏ hàng trống',
                        description: 'Message indicating cart status (only when cart is empty)'
                      },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['product', 'quantity', '_id'],
                          properties: {
                            product: {
                              type: 'object',
                              description: 'Product details (fully populated with name, price, image, etc.)'
                            },
                            quantity: {
                              type: 'integer',
                              minimum: 1,
                              example: 1,
                              description: 'Quantity of item in cart (only present when items exist)'
                            },
                            _id: {
                              type: 'string',
                              description: 'Cart item MongoDB ID'
                            }
                          }
                        },
                        description: 'Items in the cart (empty array if cart is empty)'
                      },
                      recommendations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          description: 'Recommended product based on cart items using association rules'
                        },
                        description: 'Product recommendations (empty array if cart is empty or no rules match)'
                      },
                      sessionId: {
                        type: 'string',
                        description: 'Session ID (only present for guest carts, absent for authenticated users)'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/admin/reports/frequently-bought-together': {
        get: {
          tags: ['Admin', 'Recommendations'],
          summary: 'Get frequently bought together products',
          description: 'Returns products that are frequently bought together for creating combos',
          security: [
            {
              BearerAuth: []
            }
          ],
          parameters: [
            {
              in: 'query',
              name: 'minSupport',
              schema: {
                type: 'number'
              },
              description: 'Minimum support threshold (0-1)'
            },
            {
              in: 'query',
              name: 'limit',
              schema: {
                type: 'integer'
              },
              description: 'Number of patterns to return'
            }
          ],
          responses: {
            200: {
              description: 'Successful operation'
            },
            401: {
              description: 'Unauthorized'
            },
            403: {
              description: 'Forbidden - Not an admin'
            }
          }
        }
      },
      '/api/metrics/track/impression': {
        post: {
          tags: ['Metrics'],
          summary: 'Track recommendation impressions',
          description: 'Records when recommendation products are displayed to users',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'productIds'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['cart', 'homepage', 'related', 'admin'],
                      description: 'Type of recommendation'
                    },
                    productIds: {
                      type: 'array',
                      items: {
                        type: 'string'
                      },
                      description: 'IDs of products displayed'
                    },
                    userId: {
                      type: 'string',
                      description: 'User ID if authenticated'
                    },
                    sessionId: {
                      type: 'string',
                      description: 'Session ID for guest users'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Impression tracked successfully'
            },
            400: {
              description: 'Invalid request data'
            }
          }
        }
      },
      '/api/metrics/track/click': {
        post: {
          tags: ['Metrics'],
          summary: 'Track recommendation clicks',
          description: 'Records when a user clicks on a recommended product',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['type', 'productId'],
                  properties: {
                    type: {
                      type: 'string',
                      enum: ['cart', 'homepage', 'related', 'admin'],
                      description: 'Type of recommendation'
                    },
                    productId: {
                      type: 'string',
                      description: 'ID of product clicked'
                    },
                    userId: {
                      type: 'string',
                      description: 'User ID if authenticated'
                    },
                    sessionId: {
                      type: 'string',
                      description: 'Session ID for guest users'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Click tracked successfully'
            },
            400: {
              description: 'Invalid request data'
            }
          }
        }
      },
      '/api/metrics/ctr': {
        get: {
          tags: ['Metrics', 'Admin'],
          summary: 'Get Click-Through Rate (CTR)',
          description: 'Returns CTR metrics for recommendation types',
          security: [
            {
              BearerAuth: []
            }
          ],
          parameters: [
            {
              in: 'query',
              name: 'type',
              required: true,
              schema: {
                type: 'string',
                enum: ['cart', 'homepage', 'related', 'admin']
              },
              description: 'Type of recommendation'
            },
            {
              in: 'query',
              name: 'startDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'Start date for metrics (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'endDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'End date for metrics (YYYY-MM-DD)'
            }
          ],
          responses: {
            200: {
              description: 'CTR metrics retrieved successfully'
            },
            401: {
              description: 'Unauthorized'
            },
            403: {
              description: 'Forbidden - Not an admin'
            }
          }
        }
      },
      '/api/metrics/cart-growth': {
        get: {
          tags: ['Metrics', 'Admin'],
          summary: 'Get cart growth metrics',
          description: 'Returns metrics about cart growth before and after recommendations',
          security: [
            {
              BearerAuth: []
            }
          ],
          parameters: [
            {
              in: 'query',
              name: 'startDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'Start date for metrics (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'endDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'End date for metrics (YYYY-MM-DD)'
            }
          ],
          responses: {
            200: {
              description: 'Cart growth metrics retrieved successfully'
            },
            401: {
              description: 'Unauthorized'
            },
            403: {
              description: 'Forbidden - Not an admin'
            }
          }
        }
      },
      '/api/metrics/all': {
        get: {
          tags: ['Metrics', 'Admin'],
          summary: 'Get all recommendation metrics',
          description: 'Returns comprehensive metrics about recommendation system performance',
          security: [
            {
              BearerAuth: []
            }
          ],
          parameters: [
            {
              in: 'query',
              name: 'startDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'Start date for metrics (YYYY-MM-DD)'
            },
            {
              in: 'query',
              name: 'endDate',
              schema: {
                type: 'string',
                format: 'date'
              },
              description: 'End date for metrics (YYYY-MM-DD)'
            }
          ],
          responses: {
            200: {
              description: 'All metrics retrieved successfully'
            },
            401: {
              description: 'Unauthorized'
            },
            403: {
              description: 'Forbidden - Not an admin'
            }
          }
        }
      }
    }
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

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