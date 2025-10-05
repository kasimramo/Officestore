import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectRedis } from './config/redis.js';
import { authRouter } from './routes/auth.js';
import { sitesRouter } from './routes/sites.js';
import { areasRouter } from './routes/areas.js';
import { categoriesRouter } from './routes/categories.js';
import { catalogueItemsRouter } from './routes/catalogueItems.js';
import endUsersRouter from './routes/endUsers.js';

// ESM-safe path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env file (ESM-safe)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway deployment
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CLIENT_URL || true)
    : 'http://localhost:3002',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Top-level debugging middleware (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`🚀 Request: ${req.method} ${req.url}`);
    console.log(`🚀 Headers:`, req.headers);
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

// Authentication routes
console.log('Mounting auth router at /api/auth');
console.log('authRouter defined:', !!authRouter);
console.log('authRouter type:', typeof authRouter);

// Add middleware to debug /api/auth requests
app.use('/api/auth', (req, res, next) => {
  console.log(`🔍 Debugging /api/auth request: ${req.method} ${req.path}`);
  console.log(`🔍 Full URL: ${req.originalUrl}`);
  next();
});

app.use('/api/auth', authRouter);

// Sites and Areas routes
app.use('/api/sites', sitesRouter);
app.use('/api/areas', areasRouter);

// Categories and Catalogue routes
app.use('/api/categories', categoriesRouter);
app.use('/api/catalogue', catalogueItemsRouter);

// End Users routes
app.use('/api/end-users', endUsersRouter);

// TODO: Add other API routes here
// app.use('/api/organizations', organizationsRouter);
// app.use('/api/requests', requestsRouter);

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

// Static assets for client (served by the API service)
// Point two levels up to apps/, then into client/dist
const clientDistPath = path.resolve(__dirname, '../../client/dist');

// Serve static assets with long-term caching
app.use(express.static(clientDistPath, { maxAge: '1y', immutable: true }));

// SPA fallback for non-API routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    next();
  }
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message
    }
  });
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found'
    }
  });
});

async function startServer() {
  try {
    // Connect to Redis for session caching
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Redis session caching enabled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();