/**
 * @fileoverview Arcjet Security Configuration
 * @description Configures Arcjet for application security including bot detection,
 * attack prevention (shield), and base rate limiting.
 * @see https://docs.arcjet.com for configuration options
 */

import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

/**
 * Arcjet client instance with security rules
 * - Shield: Protects against common attacks (SQL injection, XSS, etc.)
 * - Bot Detection: Blocks malicious bots while allowing legitimate crawlers
 * - Rate Limiting: Base rate limit applied to all requests (extended per-role in middleware)
 */
const aj = arcjet({
  // Site key from https://app.arcjet.com - stored in environment variable for security
  key: process.env.ARCJET_KEY,
  characteristics: ['ip.src'], // Track requests by source IP address
  rules: [
    // Shield protects against common web attacks (SQL injection, XSS, etc.)
    shield({ mode: 'LIVE' }),

    // Bot detection - blocks automated traffic except for legitimate services
    detectBot({
      mode: 'LIVE', // Use "DRY_RUN" to log only without blocking
      allow: [
        'CATEGORY:SEARCH_ENGINE', // Allow search engine crawlers (Google, Bing, etc.)
        'CATEGORY:PREVIEW', // Allow link preview generators (Slack, Discord, etc.)
        'CATEGORY:MONITOR', // Allow uptime monitoring services
      ],
    }),

    // Base rate limit - acts as a safety net; role-specific limits applied in middleware
    slidingWindow({
      mode: 'LIVE',
      interval: '1m', // 1 minute window
      max: 1000, // Maximum requests per window (high limit as middleware handles role-based limits)
    }),
  ],
});

export default aj;
