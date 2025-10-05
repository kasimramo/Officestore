import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'http';
import { connectRedis } from './config/redis.js';
import { requireAuth } from './middleware/auth.js';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import { authRouter } from './routes/auth.js';
import { sitesRouter } from './routes/sites.js';
import { areasRouter } from './routes/areas.js';
import { categoriesRouter } from './routes/categories.js';
import { catalogueItemsRouter } from './routes/catalogueItems.js';
import endUsersRouter from './routes/endUsers.js';
import { rolesRouter } from './routes/roles.js';
import permissionsRouter from './routes/permissions.js';
import { setupVite, serveStatic, log } from './vite.js';

// ESM-safe path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file (ESM-safe)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Trust proxy for Railway deployment
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : undefined,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: isDevelopment ? true : (process.env.CLIENT_URL || true),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(isDevelopment ? 'dev' : 'combined'));

// Top-level debugging middleware (dev only)
if (isDevelopment) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      log(`Request: ${req.method} ${req.url}`);
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint alias for API consistency
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - MUST be before Vite middleware
log('Mounting API routes');

// Temporary open read endpoint to unblock Roles UI (no permission check; auth only)
app.get('/api/roles-open', requireAuth as any, async (req: any, res) => {
  try {
    const organizationId = req.user!.organizationId;
    if (!organizationId) {
      res.status(400).json({ success: false, error: { code: 'NO_ORGANIZATION', message: 'User must be associated with an organization' } });
      return;
    }
    const result: any = await db.execute(sql`
      SELECT
        r.id,
        r.name,
        r.description,
        r.scope,
        r.color,
        r.is_system,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT rp.permission_id) as permission_count,
        COUNT(DISTINCT ur.user_id) as user_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN user_roles ur ON r.id = ur.role_id
      WHERE r.organization_id = ${organizationId}::uuid
      GROUP BY r.id, r.name, r.description, r.scope, r.color, r.is_system, r.created_at, r.updated_at
      ORDER BY r.is_system DESC, r.name ASC
    `);
    const rows = Array.isArray(result) ? result : result.rows || [];
    res.json({ success: true, data: rows.map((role: any) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      color: role.color,
      isSystem: role.is_system,
      permissionCount: parseInt(role.permission_count),
      userCount: parseInt(role.user_count),
      createdAt: role.created_at,
      updatedAt: role.updated_at
    })) });
  } catch (error) {
    console.error('roles-open error', error);
    res.status(500).json({ success: false, error: { code: 'FETCH_ROLES_FAILED', message: 'Failed to fetch roles' } });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/areas', areasRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/catalogue', catalogueItemsRouter);
app.use('/api/end-users', endUsersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/permissions', permissionsRouter);
// Mount permissions under /api/users for frontend compatibility
app.use('/api/users', permissionsRouter);

// Catch-all for unmatched API routes - MUST be before static serving
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'API route not found'
    }
  });
});

// Global error handler for API routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only handle errors for API routes
  if (req.path.startsWith('/api')) {
    console.error(err.stack);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: isDevelopment ? err.message : 'Something went wrong'
      }
    });
  } else {
    next(err);
  }
});

async function startServer() {
  try {
    // Connect to Redis for session caching
    await connectRedis();
    log('Redis session caching enabled');

    // Create HTTP server
    const server = createServer(app);

    // Setup Vite or static serving based on environment
    if (isDevelopment) {
      log('Setting up Vite middleware for development');
      await setupVite(app, server);
    } else {
      log('Setting up static file serving for production');
      serveStatic(app);
    }

    server.listen(PORT, () => {
      log(`Server running on port ${PORT}`);
      log(`Health check: http://localhost:${PORT}/health`);
      log(`API routes: http://localhost:${PORT}/api`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (isDevelopment) {
        log(`Vite HMR enabled - changes will hot reload`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
