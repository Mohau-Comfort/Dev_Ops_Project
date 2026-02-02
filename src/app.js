/**
 * @fileoverview Express Application Configuration
 * @description Configures Express middleware stack and route handlers.
 * Implements security best practices using Helmet, CORS, and structured logging.
 */

import express from 'express';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from '#config/swagger.js';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';
import usersRoutes from '#routes/users.routes.js'; 
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

const app = express();

// Security middleware - sets various HTTP headers for protection
app.use(helmet());

// CORS middleware - enables cross-origin resource sharing with credentials
app.use(cors({
  origin: true,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// HTTP request logging - integrates Morgan with Winston logger
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

const { securitySchemes, ...publicComponents } =
  swaggerDocument.components || {};

const stripSecurity = pathItem => {
  const sanitized = {};
  for (const [method, operation] of Object.entries(pathItem)) {
    if (operation && typeof operation === 'object' && operation.security) {
      const { security, ...rest } = operation;
      sanitized[method] = rest;
    } else {
      sanitized[method] = operation;
    }
  }
  return sanitized;
};

const fullSwaggerDocument = {
  ...swaggerDocument,
  paths: Object.fromEntries(
    Object.entries(swaggerDocument.paths).map(([path, pathItem]) => [
      path,
      stripSecurity(pathItem),
    ])
  ),
  components: publicComponents,
};

const publicSwaggerDocument = {
  ...swaggerDocument,
  tags: swaggerDocument.tags?.filter(tag =>
    ['Authentication', 'Health'].includes(tag.name)
  ),
  paths: Object.fromEntries(
    Object.entries(swaggerDocument.paths)
      .filter(([path]) => {
        if (path.startsWith('/api/auth')) return true;
        if (path === '/health') return true;
        return false;
      })
      .map(([path, pathItem]) => [path, stripSecurity(pathItem)])
  ),
  components: publicComponents,
};

const isSwaggerAuthenticated = req => {
  const token = cookies.get(req, 'token');
  if (!token) return false;
  try {
    jwttoken.verify(token);
    return true;
  } catch {
    return false;
  }
};

const getSpecSignature = spec => {
  try {
    return JSON.stringify({
      paths: Object.keys(spec.paths || {}).sort(),
      tags: (spec.tags || []).map(tag => tag.name).sort(),
    });
  } catch {
    return null;
  }
};

app.get('/api-docs.json', (req, res) => {
  const spec = isSwaggerAuthenticated(req)
    ? fullSwaggerDocument
    : publicSwaggerDocument;
  res.status(200).json(spec);
});

app.get('/api-docs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = () => {
    const isAuthed = isSwaggerAuthenticated(req);
    const spec = isAuthed ? fullSwaggerDocument : publicSwaggerDocument;
    const payload = {
      authenticated: isAuthed,
      signature: getSpecSignature(spec),
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const interval = setInterval(send, 2000);
  send();

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.get('/api-docs-swagger.js', (req, res) => {
  res.type('application/javascript').send(`
    (function () {
      var lastSig = null;
      var badgeEl = null;
      var pendingSpec = null;
      var lastAuth = null;

      function ensureBadge() {
        if (badgeEl) return badgeEl;
        var container = document.querySelector('.topbar-wrapper');
        if (!container) return null;
        badgeEl = document.createElement('span');
        badgeEl.style.display = 'inline-block';
        badgeEl.style.marginLeft = '12px';
        badgeEl.style.padding = '4px 10px';
        badgeEl.style.borderRadius = '999px';
        badgeEl.style.fontSize = '12px';
        badgeEl.style.fontWeight = '600';
        badgeEl.style.border = '1px solid #e2e8f0';
        badgeEl.style.background = '#f8fafc';
        badgeEl.style.color = '#0f172a';
        badgeEl.textContent = 'Auth: Unknown';
        container.appendChild(badgeEl);
        return badgeEl;
      }

      function setBadge(isAuthed) {
        var el = ensureBadge();
        if (!el) return;
        if (isAuthed) {
          el.textContent = 'Auth: Signed in';
          el.style.background = '#dcfce7';
          el.style.borderColor = '#86efac';
          el.style.color = '#166534';
        } else {
          el.textContent = 'Auth: Signed out';
          el.style.background = '#fee2e2';
          el.style.borderColor = '#fecaca';
          el.style.color = '#991b1b';
        }
      }

      function applySpec(spec) {
        if (!window.ui || !window.ui.specActions) {
          pendingSpec = spec;
          return;
        }
        try {
          window.ui.specActions.updateSpec(JSON.stringify(spec));
        } catch (e) {
          try {
            window.ui.specActions.updateSpec(spec);
          } catch (e2) {}
        }
      }

      function updateSpecIfNeeded(signature) {
        if (!signature || signature === lastSig) return;
        lastSig = signature;
        fetch('/api-docs.json', { credentials: 'include' })
          .then(function (r) { return r.json(); })
          .then(function (spec) {
            applySpec(spec);
          })
          .catch(function () {});
      }

      function connectStream() {
        var es = new EventSource('/api-docs/stream');
        es.onmessage = function (evt) {
          try {
            var data = JSON.parse(evt.data || '{}');
            var isAuthed = !!data.authenticated;
            setBadge(isAuthed);
            if (lastAuth === null) {
              lastAuth = isAuthed;
            } else if (lastAuth !== isAuthed) {
              lastAuth = isAuthed;
              setTimeout(function () {
                window.location.reload();
              }, 200);
              return;
            }
            updateSpecIfNeeded(data.signature);
          } catch (e) {}
        };
        es.onerror = function () {
          try { es.close(); } catch (e) {}
          setTimeout(connectStream, 2000);
        };
      }

      setTimeout(function () {
        ensureBadge();
        connectStream();
      }, 0);

      setInterval(function () {
        if (pendingSpec && window.ui && window.ui.specActions) {
          var spec = pendingSpec;
          pendingSpec = null;
          applySpec(spec);
        }
      }, 300);
    })();
  `);
});

// Swagger API documentation - served before security middleware to avoid rate limiting static assets
// Enable credentials so HTTP-only auth cookies are sent with Swagger requests.
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: '/api-docs.json',
      withCredentials: true,
    },
    customJs: '/api-docs-swagger.js',
  })
);

/**
 * Health check endpoint - excluded from rate limiting for monitoring services
 * @route GET /health
 * @returns {Object} Health status with timestamp and uptime
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Apply Arcjet security middleware to all routes below this point
// This includes bot detection, attack prevention (shield), and role-based rate limiting
app.use(securityMiddleware);

/**
 * Root endpoint handler
 * @route GET /
 * @returns {string} HTML welcome page with API documentation link
 */
app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Acquisitions Dashboard API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 600px;
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; color: #4fc3f7; }
        p { font-size: 1.1rem; color: #b0bec5; margin-bottom: 2rem; line-height: 1.6; }
        .btn {
          display: inline-block;
          padding: 1rem 2rem;
          background: #4fc3f7;
          color: #1a1a2e;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .btn:hover { background: #81d4fa; transform: translateY(-2px); }
        .status { margin-top: 2rem; font-size: 0.9rem; color: #66bb6a; }
        .status::before { content: '●'; margin-right: 0.5rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Acquisitions Dashboard API</h1>
        <p>RESTful API service for user authentication and management. Explore the available endpoints and test the API using our interactive documentation.</p>
        <a href="/api-docs" class="btn">View API Documentation</a>
        <p class="status">Service is running</p>
      </div>
    </body>
    </html>
  `);
});

/**
 * API status endpoint
 * @route GET /api
 * @returns {string} API status message
 */
app.get('/api', (req, res) => {
  res.status(200).send('API is running');
});

// Authentication routes - protected by security middleware
app.use('/api/auth', authRoutes);

//User CRUD routes
app.use('/api/users', usersRoutes);
export default app;
