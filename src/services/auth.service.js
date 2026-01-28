/**
 * @fileoverview Authentication Service
 * @description Business logic for user authentication operations.
 * Handles password hashing, user creation, and database interactions.
 */

import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';

/** @constant {number} SALT_ROUNDS - bcrypt salt rounds for password hashing */
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt
 * @async
 * @param {string} password - Plaintext password to hash
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If hashing fails
 */
export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing');
  }
};

/**
 * Compares a plaintext password with a hashed password
 * @async
 * @param {string} password - Plaintext password to compare
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 * @throws {Error} If comparison fails
 */
export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new Error('Error comparing password');
  }
};

/**
 * Finds a user by their email address
 * @async
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object if found, null otherwise
 * @throws {Error} If database operation fails
 */
export const findUserByEmail = async email => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  } catch (error) {
    logger.error(`Error finding user by email: ${error}`);
    throw new Error('Error finding user');
  }
};

/**
 * Finds a user by their ID
 * @async
 * @param {number} id - User ID to search for
 * @returns {Promise<Object|null>} User object (without password) if found, null otherwise
 * @throws {Error} If database operation fails
 */
export const findUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  } catch (error) {
    logger.error(`Error finding user by ID: ${error}`);
    throw new Error('Error finding user');
  }
};

/**
 * Creates a new user in the database
 * @async
 * @param {Object} userData - User data object
 * @param {string} userData.name - User's display name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's plaintext password (will be hashed)
 * @param {string} userData.role - User's role
 * @returns {Promise<Object>} Created user object (without password)
 * @throws {Error} If email already exists or database operation fails
 */
export const createUser = async ({ name, email, password, role }) => {
  try {
    // Check for existing user with same email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    const password_hash = await hashPassword(password);

    // Insert user and return safe fields (excluding password)
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: password_hash,
        role,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    logger.info(`User created with email: ${email} created successfully`);
    return newUser;
  } catch (error) {
    logger.error(`Error creating user: ${error}`);
    throw error;
  }
};
