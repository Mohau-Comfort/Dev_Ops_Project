/**
 * @fileoverview Users Service Layer
 * @description Contains business logic and database operations for user management.
 * Provides data access abstraction between controllers and the database.
 * @module services/users
 */

import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';

/**
 * @typedef {Object} UserData
 * @property {number} id - Unique user identifier
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {string} role - User's role (user/admin)
 * @property {Date} createdAt - Account creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

import { eq } from 'drizzle-orm';

/**
 * Retrieves all users from the database
 * @async
 * @function getAllUsers
 * @returns {Promise<UserData[]>} Array of user objects with selected fields
 * @throws {Error} Database query errors are logged and re-thrown
 * @example
 * const users = await getAllUsers();
 * // Returns: [{ id: 1, name: 'John', email: 'john@example.com', ... }]
 */
export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
  } catch (error) {
    logger.error('Error fetching all users:', error);
    throw error;
  }
};

/**
 * Retrieves a single user by their ID
 * @async
 * @function getUserById
 * @param {number} id - The user's unique identifier
 * @returns {Promise<UserData|null>} User object if found, null otherwise
 * @throws {Error} Database query errors are logged and re-thrown
 * @example
 * const user = await getUserById(1);
 * // Returns: { id: 1, name: 'John', email: 'john@example.com', ... }
 */
export const getUserById = async id => {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id));

    return result[0] || null;
  } catch (error) {
    logger.error(`Error fetching user with id ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing user's information
 * @async
 * @function updateUser
 * @param {number} id - The user's unique identifier
 * @param {Object} updates - Object containing fields to update
 * @param {string} [updates.name] - Updated display name
 * @param {string} [updates.email] - Updated email address
 * @param {string} [updates.role] - Updated role (user/admin)
 * @returns {Promise<UserData>} Updated user object
 * @throws {Error} If user not found or database error occurs
 * @example
 * const updated = await updateUser(1, { name: 'Jane Doe' });
 */
export const updateUser = async (id, updates) => {
  try {
    const existingUser = await getUserById(id);
    if (!existingUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const result = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return result[0];
  } catch (error) {
    logger.error(`Error updating user with id ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a user from the database
 * @async
 * @function deleteUser
 * @param {number} id - The user's unique identifier
 * @returns {Promise<UserData>} Deleted user object
 * @throws {Error} If user not found or database error occurs
 * @example
 * const deleted = await deleteUser(1);
 */
export const deleteUser = async id => {
  try {
    const existingUser = await getUserById(id);
    if (!existingUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const result = await db.delete(users).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

    return result[0];
  } catch (error) {
    logger.error(`Error deleting user with id ${id}:`, error);
    throw error;
  }
};
