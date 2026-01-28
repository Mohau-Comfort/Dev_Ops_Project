/**
 * @fileoverview Cookie Utility Module
 * @description Provides helper methods for HTTP cookie operations.
 * Ensures consistent cookie handling with secure defaults.
 */

/**
 * Cookie utility object for HTTP cookie operations
 * @namespace cookies
 */
export const cookies = {
  /**
   * Sets a cookie on the response
   * @param {Object} res - Express response object
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} [options={}] - Additional cookie options (overrides defaults)
   */
  set: (res, name, value, options = {}) => {
    res.cookie(name, value, { ...cookies.getOptions(), ...options });
  },

  /**
   * Clears a cookie from the response
   * @param {Object} res - Express response object
   * @param {string} name - Cookie name to clear
   * @param {Object} [options={}] - Additional cookie options
   */
  clear: (res, name, options = {}) => {
    res.clearCookie(name, { ...cookies.getOptions(), ...options });
  },

  /**
   * Retrieves a cookie value from the request
   * @param {Object} req - Express request object
   * @param {string} name - Cookie name to retrieve
   * @returns {string|undefined} Cookie value or undefined if not found
   */
  get: (req, name) => {
    return req.cookies[name];
  },
};
