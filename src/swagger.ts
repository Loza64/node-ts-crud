import swaggerJsdoc from 'swagger-jsdoc';
import { buildSwaggerDefinitions } from './shared/swagger/schemas';

const isProd = process.env.NODE_ENV === 'production';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      version: 'v1.0.0',
      title: 'LexBridge API',
      description:
        'LexBridge is a seamless platform that connects clients with verified legal experts, offering secure communication, easy appointment booking, transparent pricing, and comprehensive legal services all in one place.',
    },
    servers: [{ url: '/' }],
    components: {
      schemas: buildSwaggerDefinitions(),
    },
  },
  apis: [
    isProd
      ? './build/modules/**/infrastructure/http/*.routes.js'
      : './src/modules/**/infrastructure/http/*.routes.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
