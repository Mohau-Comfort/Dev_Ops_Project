/**
 * @fileoverview Users Controller
 * @description Handles HTTP request/response logic for user-related operations.
 * Acts as an intermediary between routes and services layer.
 * @module controllers/users
 */

import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.services.js';
import { userIdSchema, updateUserSchema } from '#validations/users.validation.js';

/**
 * Fetches all users from the database
 * @async
 * @function fetchAllUsers
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with users array, message, and count
 * @throws {Error} Passes errors to Express error handling middleware
 */
export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching all users...');
    const allUsers = await getAllUsers();

    res.json({
      message: 'Users fetched successfully',
      users: allUsers,
      count: allUsers.length,
    });

  } catch (error) {
    logger.error(error);
    next(error);
  }
};

/**
 * Fetches a single user by their ID
 * @async
 * @function fetchUserById
 * @param {import('express').Request} req - Express request object with id param
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with user data
 * @throws {Error} Passes errors to Express error handling middleware
 */
export const fetchUserById = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors.map((e) => e.message).join(', '),
      });
    }

    const { id } = validation.data;
    logger.info(`Fetching user with id: ${id}`);

    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    res.json({
      message: 'User fetched successfully',
      user,
    });

  } catch (error) {
    logger.error(error);
    next(error);
  }
};

/**
 * Updates an existing user's information
 * @async
 * @function updateUser
 * @param {import('express').Request} req - Express request object with id param and body
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response with updated user data
 * @throws {Error} Passes errors to Express error handling middleware
 * @description
 * - Authenticated users can only update their own information
 * - Only admin users can change the role of any user
 */
export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);
    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: idValidation.error.errors.map((e) => e.message).join(', '),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: bodyValidation.error.errors.map((e) => e.message).join(', '),
      });
    }

    const { id } = idValidation.data;
    const updates = bodyValidation.data;
    const currentUser = req.user;

    // Check if user is trying to update someone else's profile
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      logger.warn(`User ${currentUser.id} attempted to update user ${id} without permission`);
      return res.status(403).json({
        message: 'You can only update your own profile',
      });
    }

    // Only admins can change roles
    if (updates.role && currentUser.role !== 'admin') {
      logger.warn(`User ${currentUser.id} attempted to change role without admin privileges`);
      return res.status(403).json({
        message: 'Only administrators can change user roles',
      });
    }

    logger.info(`Updating user with id: ${id}`);
    const updatedUser = await updateUserService(id, updates);

    res.json({
      message: 'User updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message,
      });
    }
    logger.error(error);
    next(error);
  }
};

/**
 * Deletes a user from the database
 * @async
 * @function deleteUser
 * @param {import('express').Request} req - Express request object with id param
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>} JSON response confirming deletion
 * @throws {Error} Passes errors to Express error handling middleware
 * @description Only admin users can delete other users
 */
export const deleteUser = async (req, res, next) => {
  try {
    const validation = userIdSchema.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors.map((e) => e.message).join(', '),
      });
    }

    const { id } = validation.data;
    const currentUser = req.user;

    // Only admins can delete users, or users can delete themselves
    if (currentUser.id !== id && currentUser.role !== 'admin') {
      logger.warn(`User ${currentUser.id} attempted to delete user ${id} without permission`);
      return res.status(403).json({
        message: 'You do not have permission to delete this user',
      });
    }

    logger.info(`Deleting user with id: ${id}`);
    const deletedUser = await deleteUserService(id);

    res.json({
      message: 'User deleted successfully',
      user: deletedUser,
    });

  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: error.message,
      });
    }
    logger.error(error);
    next(error);
  }
};
