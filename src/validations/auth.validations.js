/**
 * @fileoverview Authentication Validation Schemas
 * @description Zod schemas for validating authentication-related request data.
 * Enforces data integrity and security constraints on user input.
 */

import { z } from 'zod';

/**
 * Sign-up request validation schema
 * @description Validates new user registration data
 * @property {string} name - 2-255 characters, trimmed
 * @property {string} email - Valid email format, max 255 chars, lowercased
 * @property {string} password - 8-128 characters
 * @property {string} [role='user'] - Either 'user' or 'admin'
 */
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must be at most 255 characters long')
    .trim(),
  email: z
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters long')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long'),
  role: z.enum(['user', 'admin']).default('user'),
});

/**
 * Sign-in request validation schema
 * @description Validates user login credentials
 * @property {string} email - Valid email format, max 255 chars, lowercased
 * @property {string} password - At least 1 character (actual validation done by auth service)
 */
export const signInSchema = z.object({
  email: z
    .email('Invalid email address')
    .max(255, 'Email must be at most 255 characters long')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password must be at least 1 characters long'),
});
