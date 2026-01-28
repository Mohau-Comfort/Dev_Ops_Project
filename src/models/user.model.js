/**
 * @fileoverview User Model Definition
 * @description Defines the users table schema using Drizzle ORM.
 * Implements core user entity with authentication and role-based access fields.
 */

import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table schema
 * @description Defines the structure for storing user account data.
 *
 * @property {number} id - Auto-incrementing primary key
 * @property {string} name - User's display name (max 255 characters)
 * @property {string} email - Unique email address for authentication
 * @property {string} password - Hashed password (never store plaintext)
 * @property {string} role - User role for access control (default: 'user')
 * @property {Date} createdAt - Timestamp of account creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
