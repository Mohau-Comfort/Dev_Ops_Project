/**
 * @fileoverview Winston Logger Configuration
 * @description Configures application-wide logging with Winston.
 * Supports file-based logging for production and console output for development.
 */

import winston from 'winston';

/**
 * Winston logger instance
 * @description Centralized logger with JSON formatting and multiple transports.
 * Log level can be configured via LOG_LEVEL environment variable.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'acquisitions-project' },
  transports: [
    // Error logs - captures error level and above
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Combined logs - captures all log levels
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Development environment - add colorized console output for easier debugging
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
