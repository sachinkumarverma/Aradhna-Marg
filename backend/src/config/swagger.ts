export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aradhna Marg API',
      version: '1.0.0',
      description: 'API documentation for the production-grade Aradhna Marg.',
      contact: {
        name: 'API Support',
        url: 'https://bhajanplatform.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Future endpoints will be documented here
};
