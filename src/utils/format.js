/**
 * @fileoverview Formatting Utility Module
 * @description Provides helper functions for data formatting operations.
 * Handles validation error transformation for API responses.
 */

/**
 * Formats Zod validation errors into a readable string
 * @param {Object} errors - Zod validation error object
 * @param {Array} [errors.issues] - Array of validation issues
 * @returns {string} Formatted error message(s)
 * @example
 * // Returns "Name is required, Email is invalid"
 * formatValidationErrors({ issues: [{ message: 'Name is required' }, { message: 'Email is invalid' }] })
 */
export const formatValidationErrors = (errors) => {
  if (!errors || !errors.issues) return 'Validation failed';

  if (Array.isArray(errors.issues)) return errors.issues.map((issue) => issue.message).join(', ');

  return JSON.stringify(errors);
};
