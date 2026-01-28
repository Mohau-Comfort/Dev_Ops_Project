/**
 * @fileoverview Authentication Controller
 * @description Handles HTTP request/response logic for authentication endpoints.
 * Validates input, delegates to services, and formats responses.
 */

import logger from '#config/logger.js';
import { createUser } from '#services/auth.service.js';
import { formatValidationErrors } from '#utils/format.js';
import { jwttoken } from '#utils/jwt.js';
import { signUpSchema } from '#validations/auth.validation.js';
import { cookies } from '#utils/cookies.js';

/**
 * Handles user registration
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user data
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.name - User's display name
 * @param {string} req.body.password - User's password
 * @param {string} [req.body.role] - User's role (defaults to 'user')
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object} JSON response with user data or error
 */
export const signup = async (req, res, next) => {
  try {
    // Validate request body against schema
    const validationResult = signUpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationErrors(validationResult.error),
      });
    }

    const { email, name, password, role } = validationResult.data;

    // Create user in database
    const user = await createUser({ name, email, password, role });

    // Generate JWT and set as HTTP-only cookie
    const token = jwttoken.sign({ id: user.id, email: user.email, role: user.role });
    cookies.set(res, 'token', token);

    logger.info(`User signed up with email: ${email}`);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Signup error', error);

    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: 'Email already exists' });
    }

    next(error);
  }
};
