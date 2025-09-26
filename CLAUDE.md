# OfficeStore - Claude Development Guidelines

## Project Information
- **Project Name**: OfficeStore (Pantry & Office Supplies Management System)
- **Development Server**: http://localhost:3002
- **Database**: PostgreSQL on Railway
- **Stack**: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, NextAuth.js

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
DEV-Files/
├── database/
│   └── scripts/           # All .cjs/.sql files for database operations
├── testing/               # Test files and testing utilities
├── development/
│   └── utilities/         # Helper scripts, CSV files, data utilities
└── documentation/         # ALL .md files except README.md
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

### Port Consistency
- **ALWAYS use port 3002** for development server
- Use `PORT=3002 npm run dev` to maintain consistency
- Kill other processes if needed: `npx kill-port 3000 3001 3003 3004 3005`

### Server Commands
```bash
# Start server on port 3002
PORT=3002 npm run dev

# Kill processes on other ports for consistency
npx kill-port 3000 3001 3003 3004 3005

# Check port usage
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
- Use Prisma migrations for schema changes
- Create manual scripts in `DEV-Files/database/scripts/` for production deployment
- All database operations logged for audit compliance

## Current Implementation Status

### ✅ Completed Features
- User authentication (NextAuth.js)
- Organization management with auto-generated slugs
- Site and area creation/management
- Dashboard with statistics and recent activity
- Catalogue item management
- Professional UI with Tailwind CSS
- Database schema with RLS policies
- Organization setup workflow

### 🔧 Architecture
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with Row-Level Security
- **Authentication**: NextAuth.js with credentials provider
- **Security**: Input validation, audit logging, rate limiting

## Development Workflow

1. Always check current server status: http://localhost:3002
2. Create all development files in appropriate `DEV-Files/` subdirectories
3. Use Prisma for database operations
4. Follow TypeScript best practices
5. Maintain audit logs for all operations
6. Test organization setup functionality regularly
7. Keep documentation in `DEV-Files/documentation/` only

## Important Notes

⚠️ **Never commit sensitive data**
⚠️ **All .md files except README.md must go in DEV-Files/documentation/**
⚠️ **Database scripts for production deployment must be in DEV-Files/database/scripts/**
⚠️ **Always use port 3002 for consistency**
⚠️ **Test changes in development environment before production**

---
*Last Updated: 2025-09-24*
*Development Server: http://localhost:3002*