import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { connectRedis } from './config/redis.js';
import { authRouter } from './routes/auth.js';

// Load environment variables from root .env file
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

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
    ? process.env.CLIENT_URL
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

// Top-level debugging middleware
app.use((req, res, next) => {
  console.log(`🚀 Request: ${req.method} ${req.url}`);
  console.log(`🚀 Headers:`, req.headers);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
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

// TODO: Add other API routes here
// app.use('/api/organizations', organizationsRouter);
// app.use('/api/sites', sitesRouter);
// app.use('/api/areas', areasRouter);
// app.use('/api/catalogue', catalogueRouter);
// app.use('/api/requests', requestsRouter);

// Catch-all for unmatched API routes - MUST be last
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'API route not found'
    }
  });
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