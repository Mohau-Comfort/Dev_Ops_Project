/**
 * @fileoverview Authentication Service
 * @description Business logic for user authentication operations.
 * Handles password hashing, user creation, and database interactions.
 */

import bcrypt from 'bcrypt';
import logger from '#config/logger.js';
import { db } from '#config/db.js';
import { eq } from 'drizzle-orm';
import { users } from '#models/users.js';

/** @constant {number} SALT_ROUNDS - bcrypt salt rounds for password hashing */
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt
 * @async
 * @param {string} password - Plaintext password to hash
 * @returns {Promise<string>} Hashed password
 * @throws {Error} If hashing fails
 */
export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Error hashing');
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
    const existingUser = db.select().from(users).where(eq(users.email)).limit(1);
    if (existingUser.length > 0) throw new Error('User with this email already exists');

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
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });

    logger.info(`User created with email: ${email} created successfully`);
    return newUser;
  } catch (error) {
    logger.error(`Error creating user:', ${error}`);
    throw Error;
  }
};
