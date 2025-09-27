# OfficeStore - Claude Development Guidelines

## Project Information
- **Project Name**: OfficeStore (Pantry & Office Supplies Management System)
- **Development Server**: http://localhost:3002 (client) + http://localhost:3001 (API server)
- **Database**: PostgreSQL on Railway
- **Stack**: Vite React SPA + Express.js API + Drizzle ORM + TypeScript + Tailwind CSS

## 🏗️ **New Architecture (Monorepo)**
- **Workspace Structure**: pnpm workspaces with apps/ and packages/
- **Frontend**: Vite + React 19 + React Router 7 + TanStack Query
- **Backend**: Express.js 5 + Drizzle ORM + postgres-js + Redis
- **Authentication**: JWT access + refresh tokens + Redis session cache
- **UI Components**: Radix UI + Tailwind CSS for enterprise-grade interface

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
├── apps/
│   ├── client/           # Vite + React SPA
│   └── server/           # Express.js API server
├── packages/
│   ├── shared/           # Types, schemas, utils
│   ├── ui/              # Reusable UI components
│   └── config/          # Shared config (ESLint, TS, etc.)
├── tools/
│   ├── database/        # Migration & seed scripts
│   └── codegen/         # API client generation
└── DEV-Files/
    ├── database/
    │   └── scripts/      # All .cjs/.sql files for database operations
    ├── testing/          # Test files and testing utilities
    ├── development/
    │   └── utilities/    # Helper scripts, CSV files, data utilities
    └── documentation/    # ALL .md files except README.md
```

### File Path Requirements

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

### Port Consistency (Monorepo)
- **API Server**: http://localhost:3001 (Express.js)
- **Client SPA**: http://localhost:3002 (Vite dev server)
- Use `pnpm dev` from root to start both servers concurrently

### Server Commands
```bash
# Start both client and server (from root)
pnpm dev

# Start individual services
pnpm --filter client dev    # Client on :3002
pnpm --filter server dev    # Server on :3001

# Kill processes if needed
npx kill-port 3001 3002 3000 3003 3004 3005

# Check port usage
netstat -ano | findstr :3001
netstat -ano | findstr :3002
```

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
- Database schema maintained in `apps/server/src/db/schema.ts`
- Migration files in `tools/database/migrations/`
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

### 🏗️ **New Architecture Stack**
- **Frontend**: Vite + React 19 + React Router 7 + TanStack Query
- **Backend**: Express.js 5 + Drizzle ORM + postgres-js
- **Database**: PostgreSQL with Row-Level Security (existing schema)
- **Authentication**: JWT access + refresh tokens + Redis session cache
- **Caching**: Redis for session management and API caching
- **UI**: Radix UI primitives + Tailwind CSS
- **Build**: Turborepo for monorepo orchestration
- **Testing**: Vitest + Playwright + MSW

## Development Workflow (Monorepo)

1. **Start Development**: `pnpm dev` (starts both client:3002 and server:3001)
2. **API Development**: Work in `apps/server/` with Express routes
3. **Frontend Development**: Work in `apps/client/` with React components
4. **Shared Code**: Use `packages/shared/` for types, schemas, utils
5. **Database**: Use Drizzle ORM with existing PostgreSQL schema
6. **Keep Documentation**: All .md files in `DEV-Files/documentation/` only
7. **Performance Target**: <100ms API response times

## Important Notes

⚠️ **Never commit sensitive data**
⚠️ **All .md files except README.md must go in DEV-Files/documentation/**
⚠️ **Database scripts for production deployment must be in DEV-Files/database/scripts/**
⚠️ **Always use port 3002 for consistency**
⚠️ **Test changes in development environment before production**

---
*Last Updated: 2025-09-27*
*Client SPA: http://localhost:3002*
*API Server: http://localhost:3001*
*Architecture: Vite + React SPA + Express.js API (Monorepo)*