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

### 🔥 CRITICAL: .js/.tsx FILE CONFLICT ISSUE

**⚠️ NEVER CREATE .js FILES IN `client/src/` DIRECTORIES**

**Problem:**
- Vite loads `.js` files with higher priority than `.tsx` files
- When both `Component.js` and `Component.tsx` exist, Vite loads `.js` breaking UI rendering
- Tailwind CSS classes in `.tsx` files are ignored, causing broken layouts
- This breaks the entire application UI and is hard to debug

**Permanent Prevention:**
1. ✅ **`.gitignore` blocks all `.js` files in `client/src/`** (except config files)
2. ✅ **Cleanup script runs before `npm run dev` and `npm run build`**
3. ✅ **Script location**: `DEV-Files/development/utilities/cleanup-js-files.cjs`
4. ✅ **Automatic**: No manual intervention needed

**If UI breaks (navigation overlapping, no styling):**
```bash
# Run cleanup manually
npm run cleanup:js

# Or directly
node DEV-Files/development/utilities/cleanup-js-files.cjs

# Then restart dev server
npm run dev
```

**Source Files Location Rules:**
- ✅ **Client source**: `client/src/**/*.tsx` (TypeScript React)
- ✅ **Server source**: `server/**/*.ts` (TypeScript)
- ✅ **Config files**: `*.config.js` (JavaScript configs are OK)
- ❌ **NEVER**: `client/src/**/*.js` (breaks Vite module resolution)

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

### 🔥 CRITICAL: Tailwind CSS Configuration Requirements

**⚠️ IF UI LOADS WITH NO STYLING (overlapping navigation, no spacing):**

This indicates Tailwind is NOT being processed by Vite. Common symptoms:
- Navigation shows: "ProductWorkflowsSecurityPricingSign inCreate Organization" all mashed together
- No spacing, colors, or layout
- HTML structure loads but looks completely broken

**Root Cause: Missing or incorrect Tailwind/PostCSS/Vite configuration**

**REQUIRED FILES (all must exist and be correctly configured):**

1. **`client/postcss.config.cjs`** - PostCSS configuration
   ```javascript
   module.exports = {
     plugins: {
       tailwindcss: { config: './client/tailwind.config.js' },
       autoprefixer: {},
     },
   }
   ```

2. **`client/tailwind.config.js`** - Tailwind configuration with correct content paths
   ```javascript
   export default {
     content: [
       './client/index.html',
       './client/src/**/*.{js,ts,jsx,tsx}',
       // Also include from root perspective for monorepo:
       './index.html',
       './src/**/*.{js,ts,jsx,tsx}',
     ],
     theme: { extend: {} },
     plugins: [],
   }
   ```

3. **`vite.config.ts`** - Vite must explicitly wire PostCSS plugins
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from 'tailwindcss'
   import autoprefixer from 'autoprefixer'

   export default defineConfig({
     plugins: [react()],
     css: {
       postcss: {
         plugins: [
           tailwindcss({ config: './client/tailwind.config.js' }),
           autoprefixer,
         ],
       },
     },
     // ... rest of config
   })
   ```

4. **`client/src/styles.css`** - Must import Tailwind directives
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. **`client/src/main.tsx`** - Must import styles
   ```typescript
   import './styles.css'
   ```

**Validation Steps (CRITICAL - Always verify):**

```bash
# 1. Check if Tailwind is being processed (DEV mode)
curl http://localhost:3001/src/styles.css

# ❌ BAD (Tailwind NOT processing):
# Returns: @tailwind base; @tailwind components; @tailwind utilities;

# ✅ GOOD (Tailwind IS processing):
# Returns: Compiled CSS with .bg-white, .text-slate-900, etc.

# 2. Check build output size (PRODUCTION)
npm run build
# ✅ CSS should be ~35-40 kB (includes Tailwind utilities)
# ❌ CSS ~4-5 kB means Tailwind not included

# 3. Verify content paths resolve correctly
npx tailwindcss --help
# Check if paths in config match actual file locations
```

**Debugging Steps:**

1. **Check PostCSS is loaded:**
   ```bash
   # In browser console after loading page:
   # View source of http://localhost:3001/src/styles.css
   # Should see compiled CSS, NOT @tailwind directives
   ```

2. **Verify Vite config:**
   ```typescript
   // vite.config.ts MUST explicitly include PostCSS plugins
   // Don't rely on implicit loading - be explicit!
   css: {
     postcss: {
       plugins: [tailwindcss(...), autoprefixer]
     }
   }
   ```

3. **Check content paths from repo root:**
   ```javascript
   // tailwind.config.js
   // Paths must work when run from project root
   content: [
     './client/index.html',          // ✅ Correct
     './client/src/**/*.tsx',        // ✅ Correct
     'client/src/**/*.tsx',          // ❌ Missing ./
     '../client/src/**/*.tsx',       // ❌ Wrong relative path
   ]
   ```

**Common Mistakes:**
- ❌ Assuming Tailwind auto-configures (it doesn't in single-server architecture)
- ❌ Only checking file existence, not actual CSS processing
- ❌ Incorrect content paths in tailwind.config.js
- ❌ Missing explicit PostCSS plugin wiring in vite.config.ts
- ❌ Not validating CSS endpoint output during development

**Remember:** File existence ≠ Working configuration. Always verify the build toolchain is actually processing Tailwind by checking the CSS endpoint output!

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