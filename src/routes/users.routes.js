/**
 * @fileoverview Users Routes Configuration
 * @description Defines RESTful API routes for user management operations.
 * All routes are prefixed with /api/users in the main application.
 * @module routes/users
 */

import {
  fetchAllUsers,
  fetchUserById,
  updateUser,
  deleteUser,
} from '#controllers/users.controller.js';
import express from 'express';

const router = express.Router();

/**
 * @route GET /api/users
 * @description Retrieves all users from the database
 * @access Protected - Requires authentication
 * @returns {Object} JSON response with users array and count
 */
router.get('/', fetchAllUsers);

/**
 * @route GET /api/users/:id
 * @description Retrieves a single user by their ID
 * @param {string} id - User's unique identifier
 * @access Protected - Requires authentication
 * @returns {Object} JSON response with user data
 */
router.get('/:id', fetchUserById);

/**
 * @route PUT /api/users/:id
 * @description Updates an existing user's information
 * @param {string} id - User's unique identifier
 * @access Protected - Requires authentication (own profile) or Admin
 * @returns {Object} JSON response with updated user data
 */
router.put('/:id', updateUser);

/**
 * @route DELETE /api/users/:id
 * @description Removes a user from the database
 * @param {string} id - User's unique identifier
 * @access Protected - Requires authentication (own account) or Admin
 * @returns {Object} JSON response confirming deletion
 */
router.delete('/:id', deleteUser);

export default router;