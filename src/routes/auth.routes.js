/**
 * @fileoverview Authentication Routes
 * @description Defines API endpoints for user authentication operations.
 * Handles sign-up, sign-in, and sign-out workflows.
 */

import {
  signup,
  signin,
  signout,
  getCurrentUser,
} from '#controllers/auth.controller.js';
import { authenticate } from '#middleware/auth.middleware.js';
import express from 'express';

const router = express.Router();

/**
 * @route POST /api/auth/sign-up
 * @description Register a new user account
 * @access Public
 */
router.post('/sign-up', signup);

/**
 * @route POST /api/auth/sign-in
 * @description Authenticate user and create session
 * @access Public
 */
router.post('/sign-in', signin);

/**
 * @route POST /api/auth/sign-out
 * @description Terminate user session and clear credentials
 * @access Private
 */
router.post('/sign-out', authenticate, signout);

/**
 * @route GET /api/auth/me
 * @description Get currently authenticated user
 * @access Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router;
