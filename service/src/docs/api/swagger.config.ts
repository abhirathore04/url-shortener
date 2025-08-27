/**
 * Swagger API Documentation Configuration
 * Learning: OpenAPI 3.0 specification for professional API documentation
 */

import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URL Shortener API',
      version: '1.0.0',
      description: `
# URL Shortener API

A production-grade URL shortener service built with Node.js, Express, and TypeScript.

## Features

- 🔗 **URL Shortening**: Convert long URLs into short, shareable links
- 📊 **Analytics**: Track clicks and usage statistics  
- 🎯 **Custom Aliases**: Create branded short links
- ⚡ **High Performance**: Sub-100ms response times
- 🛡️ **Security**: Comprehensive input validation and rate limiting
- 📈 **Scalable**: Architecture supporting millions of requests

## Base62 Encoding

This service uses Base62 encoding to generate short codes, supporting 62^6 = 56+ billion unique URLs.

## Rate Limiting

- **API Endpoints**: 100 requests per 15 minutes per IP
- **Redirects**: 60 requests per minute per IP

## Authentication

Currently, the API is open for public use. Authentication will be added in future versions.

## Support

For issues or questions, please contact the development team.
      `,
      contact: {
        name: 'API Support',
        email: 'support@urlshortener.dev',
        url: 'https://github.com/your-username/url-shortener'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.urlshortener.dev',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        CreateUrlRequest: {
          type: 'object',
          required: ['url'],
          properties: {
            url: {
              type: 'string',
              format: 'uri',
              description: 'The original URL to shorten',
              example: 'https://www.example.com/very/long/url/that/needs/shortening',
              maxLength: 2048
            },
            customAlias: {
              type: 'string',
              description: 'Custom alias for the short URL (optional)',
              example: 'my-custom-link',
              minLength: 3,
              maxLength: 50,
              pattern: '^[a-zA-Z0-9-_]+$'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Expiration date for the short URL (optional)',
              example: '2025-12-31T23:59:59.000Z'
            },
            description: {
              type: 'string',
              description: 'Description for the short URL (optional)',
              example: 'My awesome website',
              maxLength: 255
            }
          }
        },
        CreateUrlResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Short URL created successfully'
            },
            data: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  description: 'Unique identifier for the URL',
                  example: 1
                },
                shortCode: {
                  type: 'string',
                  description: 'Generated short code',
                  example: 'abc123'
                },
                shortUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'Complete short URL',
                  example: 'http://localhost:3000/abc123'
                },
                originalUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'Original URL',
                  example: 'https://www.example.com/very/long/url'
                },
                customAlias: {
                  type: 'string',
                  nullable: true,
                  description: 'Custom alias if provided',
                  example: 'my-custom-link'
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation timestamp',
                  example: '2025-08-25T07:39:39.086Z'
                },
                expiresAt: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'Expiration timestamp',
                  example: '2025-12-31T23:59:59.000Z'
                }
              }
            },
            meta: {
              $ref: '#/components/schemas/ResponseMeta'
            }
          }
        },
        UrlAnalyticsResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Analytics retrieved successfully'
            },
            data: {
              type: 'object',
              properties: {
                shortCode: {
                  type: 'string',
                  description: 'Short code',
                  example: 'abc123'
                },
                originalUrl: {
                  type: 'string',
                  format: 'uri',
                  description: 'Original URL',
                  example: 'https://www.example.com'
                },
                totalClicks: {
                  type: 'integer',
                  description: 'Total number of clicks',
                  example: 42
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Creation timestamp',
                  example: '2025-08-25T07:39:39.086Z'
                },
                lastAccessed: {
                  type: 'string',
                  format: 'date-time',
                  nullable: true,
                  description: 'Last access timestamp',
                  example: '2025-08-25T08:30:15.123Z'
                }
              }
            },
            meta: {
              $ref: '#/components/schemas/ResponseMeta'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Service is healthy'
            },
            data: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  example: 'healthy'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2025-08-25T07:39:39.086Z'
                },
                version: {
                  type: 'string',
                  example: '1.0.0'
                },
                environment: {
                  type: 'string',
                  example: 'production'
                },
                uptime: {
                  type: 'number',
                  description: 'Server uptime in seconds',
                  example: 3600.5
                },
                database: {
                  type: 'string',
                  example: 'connected'
                }
              }
            },
            meta: {
              $ref: '#/components/schemas/ResponseMeta'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'An error occurred'
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                details: {
                  type: 'string',
                  example: 'Please check the provided data'
                }
              }
            },
            meta: {
              $ref: '#/components/schemas/ResponseMeta'
            }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'url'
            },
            message: {
              type: 'string',
              example: 'URL is required'
            }
          }
        },
        ResponseMeta: {
          type: 'object',
          properties: {
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
              example: '2025-08-25T07:39:39.086Z'
            },
            requestId: {
              type: 'string',
              description: 'Unique request identifier for tracing',
              example: '406d903e-524e-4f2a-982b-b8811965f573'
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/ErrorResponse'
                  },
                  {
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          errors: {
                            type: 'array',
                            items: {
                              $ref: '#/components/schemas/ValidationError'
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Short URL not found',
                error: {
                  code: 'URL_NOT_FOUND',
                  details: 'The requested short URL does not exist'
                },
                meta: {
                  timestamp: '2025-08-25T07:39:39.086Z',
                  requestId: '406d903e-524e-4f2a-982b-b8811965f573'
                }
              }
            }
          }
        },
        RateLimit: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Too many requests, please try again later',
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  details: 'You have exceeded the maximum number of requests allowed'
                },
                meta: {
                  timestamp: '2025-08-25T07:39:39.086Z',
                  requestId: 'rate-limited'
                }
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'An unexpected error occurred',
                error: {
                  code: 'INTERNAL_ERROR'
                },
                meta: {
                  timestamp: '2025-08-25T07:39:39.086Z',
                  requestId: '406d903e-524e-4f2a-982b-b8811965f573'
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'URLs',
        description: 'URL shortening and management operations'
      },
      {
        name: 'Analytics',
        description: 'Usage statistics and analytics'
      },
      {
        name: 'Health',
        description: 'Service health and monitoring'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/api/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI setup
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'URL Shortener API Documentation'
  }));

  // JSON endpoint for API specification
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 Swagger documentation available at: /api/docs');
};

export default specs;
