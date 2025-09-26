# Pantry & Office Supplies Management App - Refer the app as OfficeStore

A secure, multi-tenant web application for managing pantry and office supplies with approval workflows, inventory tracking, and comprehensive audit trails.

## 🚀 Features

### Core Features
- **Multi-tenant Architecture**: Secure organization isolation with row-level security (RLS)
- **Role-based Access Control**: Admin, Procurement, Approver L1/L2, and Staff roles
- **Catalogue Management**: Price-free item catalog with site-specific overrides
- **Request & Approval Workflows**: Configurable approval chains based on policies
- **Audit Trails**: Comprehensive logging of all actions and decisions
- **Real-time Analytics**: Track consumption patterns and optimize inventory

### Security Features
- **Row-Level Security (RLS)**: Database-level tenant isolation
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Protection against abuse and brute force attacks
- **Audit Logging**: Immutable record of all system activities
- **Secure Authentication**: NextAuth.js with multiple providers
- **CSRF Protection**: Built-in protection against cross-site request forgery

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL, Prisma ORM
- **Database**: PostgreSQL (Railway) with Row-Level Security
- **Authentication**: NextAuth.js with multiple providers
- **Validation**: Zod for runtime type checking
- **Styling**: Tailwind CSS with custom design system
- **Security**: Argon2 password hashing, RLS policies, rate limiting

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL database (Railway recommended)
- Redis (for rate limiting and caching)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pantry-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   # Database (Railway PostgreSQL)
   DATABASE_URL="postgresql://..."

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"

   # Optional: Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Optional: Redis for rate limiting
   REDIS_URL="redis://localhost:6379"

   # Optional: hCaptcha for signup protection
   HCAPTCHA_SITE_KEY="your-hcaptcha-site-key"
   HCAPTCHA_SECRET="your-hcaptcha-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Apply database schema and RLS policies
   npm run db:push

   # Run the RLS setup script
   psql $DATABASE_URL -f prisma/migrations/001_init_with_rls.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

### Core Entities
- **Organizations**: Multi-tenant isolation
- **Users**: Authentication and user management
- **Memberships**: User-organization relationships with roles
- **Sites**: Physical locations within organizations
- **Areas**: Specific areas within sites (Pantry, HK, Other)

### Catalogue Management
- **CatalogueItems**: Price-free item definitions
- **CatalogueSiteOverrides**: Site-specific inventory parameters
- **CatalogueVersions**: Change tracking and audit trail

### Request Management
- **Requests**: Supply requests with approval workflow
- **RequestItems**: Individual items within requests
- **ApprovalDecisions**: Approval/rejection decisions
- **Attachments**: Photo and document attachments

### Audit & Compliance
- **UserAgreements**: Terms acceptance tracking
- **AuditLogs**: Comprehensive system activity logs
- **ReceivingLogs**: Delivery confirmation tracking

## 🔐 Security Model

### Row-Level Security (RLS)
All tenant-scoped tables implement RLS policies that automatically filter data based on:
- Current organization context
- User role permissions
- Request ownership rules

### Authentication & Authorization
- NextAuth.js with email/password and OAuth providers
- Role-based access control (RBAC)
- Session-based authentication with secure cookies
- Password hashing with Argon2id

### Input Validation
- Zod schemas for all API endpoints
- Server-side validation for all user inputs
- Type-safe database operations with Prisma

## 📊 Role Permissions

| Feature | STAFF | APPROVER_L1 | APPROVER_L2 | PROCUREMENT | ADMIN |
|---------|-------|-------------|-------------|-------------|-------|
| Create Requests | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Own Requests | ✅ | ✅ | ✅ | ✅ | ✅ |
| View All Requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve Requests | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Catalogue | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ❌ | ✅ |
| Organization Settings | ❌ | ❌ | ❌ | ❌ | ✅ |

## 🚀 Deployment

### Railway Deployment

1. **Connect to Railway**
   ```bash
   railway login
   railway link
   ```

2. **Set up PostgreSQL service**
   ```bash
   railway add postgresql
   ```

3. **Configure environment variables**
   Set all required environment variables in Railway dashboard

4. **Deploy**
   ```bash
   railway deploy
   ```

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Database Tests (RLS Verification)
```bash
npm run test:db
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Authenticate user
- `POST /api/auth/signout` - End user session

### Organization Management
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization

### Catalogue Management
- `GET /api/catalogue` - List catalogue items
- `POST /api/catalogue` - Create new catalogue item
- `PUT /api/catalogue/[id]` - Update catalogue item

### Request Management
- `GET /api/requests` - List requests
- `POST /api/requests` - Create new request
- `GET /api/requests/[id]` - Get request details
- `POST /api/requests/[id]/approve` - Approve/reject request

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Security

For security issues, please email security@pantryapp.com instead of using the issue tracker.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email support@pantryapp.com
- Check the documentation wiki

---

Built with ❤️ for secure supply chain management