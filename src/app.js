/**
 * @fileoverview Express Application Configuration
 * @description Configures Express middleware stack and route handlers.
 * Implements security best practices using Helmet, CORS, and structured logging.
 */

import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '#config/swagger.js';
import authRoutes from '#routes/auth.routes.js';

const app = express();

// Security middleware - sets various HTTP headers for protection
app.use(helmet());

// CORS middleware - enables cross-origin resource sharing
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// HTTP request logging - integrates Morgan with Winston logger
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

/**
 * Root endpoint handler
 * @route GET /
 * @returns {string} Welcome message
 */
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.status(200).send('Hello from Acquisitions Service!');
});

app.get('/health', (req, res) => {
  res
    .status(200)
    .json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
});

app.get('/api', (req, res) => {
  res.status(200).send('API is running');
});

app.use('/api/auth', authRoutes);

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default app;
