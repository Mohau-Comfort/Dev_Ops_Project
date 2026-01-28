/**
 * @fileoverview Authentication Middleware
 * @description Middleware functions for protecting routes and verifying user authentication.
 * Handles JWT token validation and user session management.
 */

import logger from '#config/logger.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';
import { findUserById } from '#services/auth.service.js';

/**
 * Authentication middleware to protect routes
 * Verifies JWT token from cookies and attaches user to request
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = cookies.get(req, 'token');

    if (!token) {
      logger.info('Authentication failed: no token provided');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwttoken.verify(token);
    } catch {
      logger.info('Authentication failed: invalid token');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Find user by ID from token
    const user = await findUserById(decoded.id);

    if (!user) {
      logger.info(
        `Authentication failed: user not found for ID: ${decoded.id}`
      );
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication middleware error', error);
    next(error);
  }
};

/**
 * Authorization middleware to restrict access by role
 * Must be used after authenticate middleware
 * @param {...string} roles - Allowed roles for the route
 * @returns {Function} Express middleware function
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.info('Authorization failed: no user on request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      logger.info(
        `Authorization failed: user role '${req.user.role}' not in allowed roles: ${roles.join(', ')}`
      );
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
