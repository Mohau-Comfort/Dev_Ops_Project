/**
 * @fileoverview Swagger/OpenAPI Configuration
 * @description OpenAPI 3.0 specification for the Authentication API.
 * Provides interactive documentation and testing capabilities.
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Acquisitions Dashboard API',
    version: '1.0.0',
    description: 'RESTful API for user authentication and management',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'User authentication operations',
    },
    {
      name: 'Users',
      description: 'User management operations',
    },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Root endpoint',
        description: 'Returns a welcome message',
        responses: {
          200: {
            description: 'Successful response',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: 'Hello from Acquisitions Service!',
                },
              },
            },
          },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns API health status and uptime',
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'OK',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                      example: '2024-01-15T10:30:00.000Z',
                    },
                    uptime: {
                      type: 'number',
                      example: 3600.123,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/sign-up': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user',
        description:
          'Creates a new user account and returns authentication token via HTTP-only cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SignUpRequest',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            headers: {
              'Set-Cookie': {
                description: 'HTTP-only cookie containing JWT token',
                schema: {
                  type: 'string',
                  example:
                    'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/',
                },
              },
            },
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/sign-in': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign in a user',
        description:
          'Authenticates a user and returns authentication token via HTTP-only cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SignInRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User signed in successfully',
            headers: {
              'Set-Cookie': {
                description: 'HTTP-only cookie containing JWT token',
                schema: {
                  type: 'string',
                  example:
                    'token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/',
                },
              },
            },
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse',
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        tags: ['Authentication'],
        summary: 'Sign out current user',
        description: 'Clears the authentication cookie and ends the session',
        security: [
          {
            cookieAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'User signed out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'User signed out successfully',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Returns the currently authenticated user information',
        security: [
          {
            cookieAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description:
          'Retrieves a list of all registered users with their basic information',
        security: [
          {
            cookieAuth: [],
          },
        ],
        responses: {
          200: {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UsersListResponse',
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Retrieves a single user by their unique identifier',
        security: [
          {
            cookieAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique user identifier',
            schema: {
              type: 'integer',
              minimum: 1,
              example: 1,
            },
          },
        ],
        responses: {
          200: {
            description: 'User retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SingleUserResponse',
                },
              },
            },
          },
          400: {
            description: 'Invalid ID format',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        description:
          'Updates an existing user. Users can only update their own profile. Only admins can change user roles.',
        security: [
          {
            cookieAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique user identifier',
            schema: {
              type: 'integer',
              minimum: 1,
              example: 1,
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SingleUserResponse',
                },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          403: {
            description:
              'Forbidden - Cannot update other users or change roles',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        description:
          'Deletes a user from the database. Users can delete their own account. Admins can delete any user.',
        security: [
          {
            cookieAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique user identifier',
            schema: {
              type: 'integer',
              minimum: 1,
              example: 1,
            },
          },
        ],
        responses: {
          200: {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SingleUserResponse',
                },
              },
            },
          },
          400: {
            description: 'Invalid ID format',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          401: {
            description: 'Not authenticated',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          403: {
            description: 'Forbidden - Cannot delete other users',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token stored in HTTP-only cookie',
      },
    },
    schemas: {
      SignUpRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            example: 'John Doe',
            description: 'User display name (2-255 characters)',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'john.doe@example.com',
            description: 'User email address',
          },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            example: 'SecurePassword123!',
            description: 'User password (8-128 characters)',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            default: 'user',
            example: 'user',
            description: 'User role (defaults to user)',
          },
        },
      },
      SignInRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'john.doe@example.com',
            description: 'User email address',
          },
          password: {
            type: 'string',
            minLength: 1,
            example: 'SecurePassword123!',
            description: 'User password',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
            description: 'User ID',
          },
          name: {
            type: 'string',
            example: 'John Doe',
            description: 'User display name',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
            description: 'User email address',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
            description: 'User role',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User registered successfully',
          },
          user: {
            $ref: '#/components/schemas/User',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'An error occurred',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Validation failed',
          },
          details: {
            type: 'string',
            example:
              'Email is required, Password must be at least 8 characters',
          },
        },
      },
      UsersListResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Users fetched successfully',
            description: 'Success message',
          },
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserDetails',
            },
            description: 'Array of user objects',
          },
          count: {
            type: 'integer',
            example: 10,
            description: 'Total number of users returned',
          },
        },
      },
      UserDetails: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
            description: 'Unique user identifier',
          },
          name: {
            type: 'string',
            example: 'John Doe',
            description: 'User display name',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com',
            description: 'User email address',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
            description: 'User role in the system',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
            description: 'Account creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00.000Z',
            description: 'Last update timestamp',
          },
        },
      },
      SingleUserResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'User fetched successfully',
            description: 'Success message',
          },
          user: {
            $ref: '#/components/schemas/UserDetails',
          },
        },
      },
      UpdateUserRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            example: 'Jane Doe',
            description: 'Updated display name (2-255 characters)',
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'jane.doe@example.com',
            description: 'Updated email address',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'admin',
            description: 'Updated user role (admin only)',
          },
        },
        description: 'At least one field must be provided',
      },
    },
  },
};
