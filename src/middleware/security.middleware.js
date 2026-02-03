/**
 * @fileoverview Security Middleware using Arcjet
 * @description Implements role-based rate limiting and request protection.
 * Uses Arcjet for bot detection, attack prevention, and sliding window rate limiting.
 */

import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

/**
 * Rate limit configuration per user role
 * These are industry-standard limits for API rate limiting:
 * - Guest: Limited access for unauthenticated users
 * - User: Standard access for authenticated users
 * - Admin: Elevated access for administrative operations
 */
const RATE_LIMITS = {
  guest: {
    max: 100,
    interval: '1m',
    message: 'Guest rate limit exceeded. Please sign in for higher limits.',
  },
  user: {
    max: 500,
    interval: '1m',
    message: 'Rate limit exceeded. Please slow down.',
  },
  admin: {
    max: 1000,
    interval: '1m',
    message: 'Admin rate limit exceeded. Please slow down.',
  },
};

/**
 * Security middleware that applies Arcjet protection to incoming requests
 * Provides role-based rate limiting with different thresholds per user type
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const securityMiddleware = async (req, res, next) => {
  try {
    // Determine user role from authenticated user or default to guest
    const role = req.user?.role || 'guest';

    // Get rate limit config for the user's role, fallback to guest limits
    const config = RATE_LIMITS[role] || RATE_LIMITS.guest;

    // Create Arcjet client with role-specific rate limiting rule
    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: config.interval,
        max: config.max,
        name: `${role}-rate-limit`,
      })
    );

    // Execute Arcjet protection check
    const decision = await client.protect(req);

    // Handle bot detection - block automated malicious traffic
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason.toString(),
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated bot traffic is not allowed.',
      });
    }

    // Handle shield protection - block common web attacks (SQL injection, XSS, etc.)
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield blocked suspicious request', {
        ip: req.ip,
        path: req.path,
        reason: decision.reason.toString(),
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy.',
      });
    }

    // Handle rate limiting - prevent abuse by limiting request frequency
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        role,
        limit: config.max,
      });
      return res.status(429).json({
        error: 'Too Many Requests',
        message: config.message,
      });
    }

    // Request passed all security checks - proceed to next middleware
    next();
  } catch (error) {
    // Log error and return generic error response to avoid leaking internal details
    logger.error('Arcjet security middleware error', {
      error: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong with security middleware.',
    });
  }
};

export default securityMiddleware;
