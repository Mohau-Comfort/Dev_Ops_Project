/**
 * @fileoverview HTTP Server Configuration
 * @description Configures and starts the Express HTTP server.
 */

import app from './app.js';

/**
 * Server port configuration
 * @constant {number} PORT - Defaults to 3000 if not specified in environment
 */
const PORT = process.env.PORT || 3000;

/**
 * Start the HTTP server
 * Listens on the configured port and logs the server URL
 */
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
