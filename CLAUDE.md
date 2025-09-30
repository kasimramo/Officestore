# OfficeStore - Claude Development Guidelines

## Project Information
- **Project Name**: OfficeStore (Pantry & Office Supplies Management System)
- **Single Server**: http://localhost:3001 (serves both API and built React client)
- **Database**: PostgreSQL on Railway
- **Stack**: Single Express.js server + built React SPA + Drizzle ORM + TypeScript + Tailwind CSS

## 🏗️ **Current Architecture (Single Server with Vite Middleware)**
- **Architecture**: Single Express.js server with integrated Vite middleware for development
- **Structure**: Flat root structure with `client/` and `server/` directories
- **Frontend**: React SPA with Vite HMR directly integrated into Express (no separate dev server)
- **Backend**: Express.js 5 + Drizzle ORM + postgres-js + Redis
- **Authentication**: JWT access + refresh tokens + Redis session cache
- **Development**: Vite middleware serves client with HMR on port 3001
- **Production**: Express serves pre-built static files from same port 3001
- **Deployment**: One server on port 3001 handles everything (following DynamicLicenseTracker pattern)

## Development Guidelines

### 🚨 CRITICAL FILE ORGANIZATION RULES

**ALL development files must be created under `DEV-Files/` structure**

1. **NEVER create development files in root or tracked directories**
2. **🚨 CRITICAL: ALL .md files (except README.md) MUST be created in `DEV-Files/documentation/` folder**
3. **🚨 NO .md documentation files in project root - they will be deployed to production**
4. **Use proper subfolder organization within DEV-Files/**
5. **All scripts should reference new file locations**

### Required Directory Structure

```
officestore/
├── client/              # Vite + React SPA (at root)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   └── index.html
├── server/              # Express.js API server (at root)
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts     # Lazy-loading DB connection
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── catalogueItems.ts
│   │   ├── categories.ts
│   │   ├── sites.ts
│   │   ├── areas.ts
│   │   └── endUsers.ts
│   ├── middleware/
│   ├── helpers/
│   ├── shared/          # Shared types (from packages/shared)
│   ├── vite.ts          # Vite middleware integration
│   └── index.ts         # Main server entry point
├── vite.config.ts       # Root Vite configuration
├── package.json         # Root package.json with merged dependencies
├── tsconfig.json        # Root TypeScript configuration
└── DEV-Files/
    ├── database/
    │   └── scripts/      # All .cjs/.sql files for database operations
    ├── testing/          # Test files and testing utilities
    ├── development/
    │   └── utilities/    # Helper scripts, CSV files, data utilities
    └── documentation/    # ALL .md files except README.md
```

### File Path Requirements

- **Server files**: All in `server/` directory (no more `apps/server/`)
- **Client files**: All in `client/` directory (no more `apps/client/`)
- **Shared types**: Located in `server/shared/` (no more workspace packages)
- **Database schema**: `server/db/schema.ts`
- **Database connection**: `server/db/index.ts` (lazy-loading with Proxy pattern)
- **Database scripts**: Use `DEV-Files/database/scripts/` for all .cjs/.sql files
  - You have access only to dev database
  - For production DB create scripts for manual offline application
- **Test files**: Use appropriate `DEV-Files/testing/` subfolders
- **Utilities**: Use `DEV-Files/development/utilities/` for helper scripts/data
- **Documentation**: All planning docs, SEO strategies, and internal docs go in `DEV-Files/documentation/`

### Security Benefits

✅ **Production Deployment Security**:
- No sensitive internal documentation exposed in production
- Environment variables and credentials secured
- Database scripts with credentials not publicly accessible
- Test files and development tools secured from production environment
- SEO strategies and internal planning documents kept confidential

## Development Server Management

### Single Server Architecture with Vite Middleware
- **Development Server**: http://localhost:3001 (Express.js with Vite middleware for HMR)
- **Production Server**: http://localhost:3001 (same Express server serving pre-built static files)
- **Architecture**: Single server for both development AND production (no separate client server)

### 🚨 MANDATORY DEV SERVER COMMANDS (NO TRIAL & ERROR)

**NEW ARCHITECTURE:**
- **Development**: Single server on port 3001 with Vite middleware for hot reload
- **Production**: Same server on port 3001 serving pre-built static files
- **No more dual-server setup!**

**ALWAYS use these exact commands:**

```bash
# DEVELOPMENT (single server with Vite HMR)
npm run dev                  # Starts Express server with Vite middleware on :3001

# PRODUCTION (single server with static files)
npm run build                # Builds React app + bundles server
npm start                    # Starts Express server serving pre-built files on :3001

# KILL PROCESSES (if port busy)
npx kill-port 3001 3002 3000 3003 3004 3005

# Note: No more workspace commands - flat structure now
```

**✅ NEW ARCHITECTURE BENEFITS:**
- ✅ Single port (3001) for everything
- ✅ No CORS issues
- ✅ No token refresh issues
- ✅ Faster HMR with integrated Vite
- ✅ Simpler development workflow

## Enterprise Deployment Notes

### Critical Security & Compliance Features
- **Data Preservation**: Only disable no delete ensures no data loss for audit compliance
- **Role-Based Access**: Read-only mode for disabled clients maintains security boundaries
- **Audit Trail**: Complete history preservation for enterprise accountability

### Multi-Tenant Architecture
- Row-Level Security (RLS) implementation
- Organization-based data isolation
- Role-based permissions (ADMIN, PROCUREMENT, APPROVER_L1, APPROVER_L2, STAFF)

## Database Information

### Connection Details
- **Provider**: PostgreSQL
- **Host**: Railway (nozomi.proxy.rlwy.net:47611)
- **Database**: railway
- **Environment**: Development database access only

### Schema Management
- Use Drizzle ORM migrations for schema changes
- Database schema maintained in `server/db/schema.ts`
- Database connection in `server/db/index.ts` (lazy-loading with Proxy pattern)
- Create manual scripts in `DEV-Files/database/scripts/` for production deployment
- All database operations logged for audit compliance

## Implementation Status (Rebuild Phase)

### 🎯 **Target Features (From Legacy)**
- User authentication with JWT tokens
- Organization management with auto-generated slugs
- Site and area creation/management
- Dashboard with statistics and recent activity
- Catalogue item management
- Professional UI with Radix + Tailwind CSS
- Database schema with RLS policies
- Organization setup workflow
- Request workflow (submit → approve → fulfill)

### 🏗️ **Single Server Architecture Stack**
- **Server**: Express.js 5 with Vite middleware (development) or static serving (production)
- **Frontend**: React SPA with integrated Vite HMR
- **API Routes**: `/api/auth`, `/api/catalogue`, `/api/categories`, `/api/sites`, `/api/areas`, `/api/end-users`
- **SPA Fallback**: Regex pattern `/^(?!\/api).*/` serves React app for client routing (Express 5 compatible)
- **Database**: PostgreSQL with lazy-loading connection (Proxy pattern)
- **Authentication**: JWT access + refresh tokens + Redis session cache
- **Caching**: Redis for session management and API caching (optional in development)
- **Build**: Single `npm run build` command (no monorepo tools)
- **Static Serving**: Express serves built React app from `dist/public/` in production

## Development Workflow (Single Server with Vite Middleware)

1. **Development**: `npm run dev` (starts single server on port 3001 with Vite HMR)
2. **Production Build**: `npm run build` (builds React + bundles server)
3. **Production**: `npm start` (starts single server on port 3001 serving pre-built files)
4. **API Development**: Work in `server/` with Express routes
5. **Frontend Development**: Work in `client/` with React components
6. **Database**: Use Drizzle ORM with lazy-loading connection (`server/db/index.ts`)
7. **Vite Integration**: Handled by `server/vite.ts` middleware
8. **Keep Documentation**: All .md files in `DEV-Files/documentation/` only
9. **Performance Target**: <100ms API response times

## Important Notes

⚠️ **Never commit sensitive data**
⚠️ **All .md files except README.md must go in DEV-Files/documentation/**
⚠️ **Database scripts for production deployment must be in DEV-Files/database/scripts/**
⚠️ **Single server architecture: port 3001 for both development and production**
⚠️ **Use lazy-loading database connection to avoid loading before .env**
⚠️ **Express 5: Use regex patterns, NOT "*" or "/*" wildcards**
⚠️ **Test changes in development environment before production**

---
*Last Updated: 2025-10-01*
*Architecture: Single Express.js Server with Vite Middleware (Flat Structure)*
*Development: http://localhost:3001 (Express + Vite HMR)*
*Production: http://localhost:3001 (Express + Pre-built Static Files)*
*Pattern: Following DynamicLicenseTracker single-server architecture*