/**
 * @fileoverview JWT Utility Module
 * @description Provides JSON Web Token signing and verification functionality.
 * Centralizes JWT operations for consistent token handling across the application.
 */

import jwt from 'jsonwebtoken';
import { logger } from '#config/logger.js';

/** @constant {string} JWT_SECRET - Secret key for signing tokens */
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-please-change-in-production';

/** @constant {string} JWT_EXPIRES_IN - Token expiration duration */
const JWT_EXPIRES_IN = '1d';

/**
 * JWT utility object for token operations
 * @namespace jwttoken
 */
export const jwttoken = {
  /**
   * Signs a payload to create a JWT
   * @param {Object} payload - Data to encode in the token
   * @param {number} payload.id - User ID
   * @param {string} payload.email - User email
   * @param {string} payload.role - User role
   * @returns {string} Signed JWT string
   * @throws {Error} If token signing fails
   */
  sign: (payload) => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      logger.error('Failed to authenticate token:', error);
      throw new Error('Failed to authenticate token');
    }
  },

  /**
   * Verifies and decodes a JWT
   * @param {string} token - JWT string to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verify: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.error('Failed to authenticate token:', error);
      throw new Error('Failed to authenticate token');
    }
  },
};
