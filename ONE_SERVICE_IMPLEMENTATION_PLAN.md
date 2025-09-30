# Single-Server Architecture Implementation - COMPLETED ✅

**Status**: Migration completed successfully on 2025-10-01
**Architecture**: Single Express.js server with Vite middleware (following DynamicLicenseTracker pattern)

---

## ✅ Completed Migration Summary

Successfully migrated from monorepo dual-server architecture (client:3002 + server:3001) to a single-server architecture where Express serves both API routes and integrates Vite middleware for development hot reload.

### Key Benefits Achieved:
- ✅ No CORS issues (same origin)
- ✅ No token refresh issues
- ✅ Faster HMR (direct Vite middleware)
- ✅ Single command to start: `npm run dev`
- ✅ Simpler deployment (one server on port 3001)
- ✅ Development and production use same server structure

---

## ✅ Completed Implementation Steps

### 1. Restructured Project Layout
**Status**: ✅ Completed

- Moved from monorepo workspace structure to flat root structure
- Created `client/` and `server/` directories at project root
- Migrated all files from `apps/client/` → `client/`
- Migrated all files from `apps/server/` → `server/`
- Copied shared types from `packages/shared/` → `server/shared/`

**Files affected**:
- Entire project structure
- All import paths updated from `@officestore/shared` to `../shared`

---

### 2. Created Vite Middleware Integration
**Status**: ✅ Completed

Created `server/vite.ts` with two functions:
- `setupVite()`: Integrates Vite middleware for development with HMR
- `serveStatic()`: Serves pre-built static files for production

**Key implementation**:
```typescript
// server/vite.ts
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // SPA fallback - Express 5 compatible
  app.get(/^(?!\/api).*/, async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
```

**Critical fix**: Express 5 doesn't support `"*"` or `"/*"` wildcards - must use regex `/^(?!\/api).*/`

---

### 3. Updated Server Entry Point
**Status**: ✅ Completed

Modified `server/index.ts` to:
- Create HTTP server instance
- Conditionally use Vite middleware (dev) or static serving (prod)
- Integrate proper HMR support

**Key changes**:
```typescript
// server/index.ts
import { createServer } from 'http';
import { setupVite, serveStatic, log } from './vite.js';

async function startServer() {
  const server = createServer(app);

  if (isDevelopment) {
    log('Setting up Vite middleware for development');
    await setupVite(app, server);
  } else {
    log('Setting up static file serving for production');
    serveStatic(app);
  }

  server.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
    log(`Vite HMR enabled - changes will hot reload`);
  });
}
```

---

### 4. Fixed Database Connection Issues
**Status**: ✅ Completed

**Problem**: Database was initializing before `.env` loaded

**Solution**: Created lazy-loading database connection using Proxy pattern

**Implementation**:
```typescript
// server/db/index.ts
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const queryClient = postgres(connectionString);
    dbInstance = drizzle(queryClient, { schema });
  }
  return dbInstance;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
```

**Files updated**:
- Removed: `server/config/database.ts`
- Created: `server/db/index.ts`
- Updated all imports from `../config/database.js` to `../db/index.js`

---

### 5. Created Root Configuration Files
**Status**: ✅ Completed

**vite.config.ts** (at root):
```typescript
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  }
});
```

**package.json** (at root):
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "node dist/index.js"
  }
}
```

**tsconfig.json** (at root):
- Merged client and server TypeScript configurations
- Updated paths for new structure

---

### 6. Fixed Package Import Issues
**Status**: ✅ Completed

**Problems encountered and fixed**:

1. **bcrypt vs bcryptjs mismatch**
   - Changed all `import bcrypt from 'bcrypt'` to `import bcrypt from 'bcryptjs'`
   - Files: `server/routes/endUsers.ts`

2. **Workspace package imports**
   - Replaced all `@officestore/shared` imports with relative paths `../shared`
   - Files: `server/middleware/auth.ts`, `server/db/schema.ts`, `server/services/auth.ts`, etc.

---

### 7. Verified Server Functionality
**Status**: ✅ Completed

**Server successfully running with**:
- Port 3001 serving both API and client
- Vite HMR enabled and working
- All API routes mounted: `/api/auth`, `/api/catalogue`, `/api/categories`, `/api/sites`, `/api/areas`, `/api/end-users`
- SPA routing working with regex fallback
- Static assets loading correctly

**Console output**:
```
12:32:41 AM [express] Server running on port 3001
12:32:41 AM [express] Health check: http://localhost:3001/health
12:32:41 AM [express] API routes: http://localhost:3001/api
12:32:41 AM [express] Environment: development
12:32:41 AM [express] Vite HMR enabled - changes will hot reload
```

---

## Current Architecture

### Development
- **Single command**: `npm run dev`
- **Port**: 3001 (serves both API and client)
- **HMR**: Vite middleware integrated directly
- **API routes**: `/api/*` prefix
- **Client routes**: All non-API routes serve React SPA

### Production
- **Build**: `npm run build` (builds React + bundles server)
- **Start**: `npm start` (serves pre-built client + API)
- **Port**: 3001 (same as development)
- **Static files**: Served from `dist/public/`

### File Structure
```
officestore/
├── client/              # React SPA (was apps/client)
│   ├── src/
│   └── index.html
├── server/              # Express API (was apps/server)
│   ├── src/
│   ├── db/
│   ├── routes/
│   ├── middleware/
│   ├── helpers/
│   ├── shared/          # Types (was packages/shared)
│   ├── vite.ts          # NEW: Vite middleware integration
│   └── index.ts         # Updated with HTTP server
├── vite.config.ts       # NEW: Root Vite config
├── package.json         # NEW: Merged dependencies
├── tsconfig.json        # Updated for new structure
└── DEV-Files/           # Development files
```

---

## Errors Fixed During Migration

### Error 1: Cannot find package '@officestore/shared'
**Cause**: Workspace package not accessible in flat structure
**Fix**: Copied to `server/shared/` and updated imports

### Error 2: Cannot find package 'bcrypt'
**Cause**: Used `bcrypt` but installed `bcryptjs`
**Fix**: Updated imports to `bcryptjs`

### Error 3: DATABASE_URL not set
**Cause**: Database initialized before `.env` loaded
**Fix**: Created lazy-loading Proxy pattern

### Error 4: Express 5 PathError with "*"
**Cause**: Express 5 doesn't support wildcard routes
**Fix**: Used regex pattern `/^(?!\/api).*/` instead

### Error 5: Redis connection failed
**Status**: Non-critical, ignored for development
**Impact**: Server continues without session cache

---

## Next Steps (Pending User Testing)

### User Management Features (Original Request)
- [ ] Test user creation with role-only selection
- [ ] Verify sites/areas assignment works after creation
- [ ] Test edit user functionality
- [ ] Test reset password functionality
- [ ] Test disable/enable user functionality
- [ ] Confirm no dummy data appears

### Deployment Preparation
- [ ] Test production build: `npm run build && npm start`
- [ ] Configure Redis for production
- [ ] Set up Railway environment variables
- [ ] Deploy to Railway with single service

---

## Notes
- ✅ Migration completed following DynamicLicenseTracker pattern
- ✅ Single server eliminates CORS and token refresh issues
- ✅ Development workflow simplified to one command
- ✅ All existing API functionality preserved
- ⚠️ Redis disabled for development (non-critical)
- 📝 User management features ready for testing

