/**
 * @fileoverview User Validation Schemas
 * @description Zod schemas for validating user-related request data.
 * Enforces data integrity and security constraints on user input.
 */

import { z } from 'zod';

/**
 * User ID parameter validation schema
 * @description Validates that the request contains a properly formatted user ID
 * @property {number} id - Positive integer user identifier
 */
export const userIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a valid number')
    .transform(val => parseInt(val, 10))
    .refine(val => val > 0, 'ID must be a positive integer'),
});

/**
 * Update user request validation schema
 * @description Validates user update data with optional fields
 * @property {string} [name] - 2-255 characters, trimmed
 * @property {string} [email] - Valid email format, max 255 chars, lowercased
 * @property {string} [role] - Either 'user' or 'admin'
 */
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(255, 'Name must be at most 255 characters long')
      .trim()
      .optional(),
    email: z
      .string()
      .email('Invalid email address')
      .max(255, 'Email must be at most 255 characters long')
      .toLowerCase()
      .trim()
      .optional(),
    role: z
      .enum(['user', 'admin'], { message: 'Role must be either user or admin' })
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
