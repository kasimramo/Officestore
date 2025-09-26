# Deprecated RLS Migration Files

⚠️ **WARNING: These files contain critical security vulnerabilities and should NOT be used**

## Issues with these files:

### 001_init_with_rls_DEPRECATED.sql & 002_rls_setup_DEPRECATED.sql
- **Critical**: Uses `FOR ALL` policies with only `orgId` checks
- **Impact**: Any user in an organization can:
  - Update/delete any request regardless of status
  - Make approval decisions without proper role checks
  - Modify catalogue items without procurement permissions
  - Access and modify any data within their organization

### 003_minimal_rls_DEPRECATED.sql
- **Critical**: Uses `USING (true)` which disables row-level security
- **Critical**: Hardcodes organization ID to all zeros
- **Impact**: Completely undermines multi-tenant security model

## Replacement
Use `DEV-Files/database/scripts/004_secure_rls_setup.sql` instead, which implements:
- Proper role-based access control
- Creator-only access for pending requests
- Approver-only access for approval decisions
- Admin/procurement-only access for system management
- Individual user access to their own credentials

## Migration Process
1. Backup existing data
2. Drop all existing RLS policies
3. Run 004_secure_rls_setup.sql
4. Test role-based access thoroughly
5. Update application context setting in middleware