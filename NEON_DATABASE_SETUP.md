# Neon Database Setup for OrderFlow

## 🚀 Quick Setup Guide

### Step 1: Create Neon Account & Database

1. Go to https://neon.tech and sign up (free)
2. Click "Create a project"
3. Choose:
   - Project name: `orderflow-db` (or your preference)
   - Region: Choose closest to your users
   - Database name: `orderflow` (or leave as default)
4. Click "Create project"

### Step 2: Get Your Connection String

After creating the project, Neon will show you a connection string. It looks like:
```
postgresql://username:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```

### Step 3: Update Prisma Schema for PostgreSQL

Since Neon uses PostgreSQL, update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 4: Environment Variables for Vercel

Copy these exact environment variables to Vercel:

```env
# Database - Replace with your actual Neon connection string
DATABASE_URL="postgresql://[username]:[password]@[endpoint].neon.tech/[database]?sslmode=require"

# Example (DO NOT USE - this is just format reference):
# DATABASE_URL="postgresql://orderflow_owner:AbCdEf123456@ep-cool-forest-123456.us-east-2.aws.neon.tech/orderflow?sslmode=require"

# NextAuth Configuration
NEXTAUTH_URL="https://do-tracker.vercel.app"
# Or if using custom domain:
# NEXTAUTH_URL="https://yourdomain.com"

# Generate secure secret (run in terminal: openssl rand -base64 32)
NEXTAUTH_SECRET="your-32-character-secret-here"
# Example: NEXTAUTH_SECRET="k3yB0ard/C4t+M0us3=R4nd0m/Str1ng/32ch4r5"

# Generate another secure secret for JWT
JWT_SECRET="your-different-32-character-secret-here"
# Example: JWT_SECRET="4n0th3r/R4nd0m+Str1ng=F0r/JWT/T0k3n5/32"
```

## 📝 Complete .env.production Example

Create a `.env.production` file locally (don't commit this!):

```env
# Neon Database
DATABASE_URL="postgresql://orderflow_owner:YOUR_PASSWORD@ep-YOUR-ENDPOINT.us-east-2.aws.neon.tech/orderflow?sslmode=require"

# Production URL (update after Vercel gives you URL)
NEXTAUTH_URL="https://do-tracker.vercel.app"

# Security Secrets (MUST be different in production!)
NEXTAUTH_SECRET="GENERATE_WITH_OPENSSL_RAND_BASE64_32"
JWT_SECRET="DIFFERENT_SECRET_ALSO_32_CHARS_LONG"
```

## 🔐 Generate Secure Secrets

Run these commands in your terminal:

```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For JWT_SECRET (run again for different value)
openssl rand -base64 32
```

## 🛠️ Neon-Specific Features

### Connection Pooling (Recommended for Serverless)

Neon provides a pooled connection string for better performance with serverless:

1. In Neon dashboard, go to your project
2. Click on "Connection Details"
3. Toggle "Pooled connection" ON
4. Use the pooled connection string for DATABASE_URL

Pooled URL format:
```
postgresql://username:password@ep-xxxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

### Direct vs Pooled Connections

- **Direct**: `ep-xxxxx.region.aws.neon.tech` (for migrations)
- **Pooled**: `ep-xxxxx-pooler.region.aws.neon.tech` (for application)

For Prisma, you might need both:
```env
# For the application (pooled)
DATABASE_URL="postgresql://user:pass@ep-xxxxx-pooler.region.aws.neon.tech/db?sslmode=require"

# For migrations (direct) - Only if needed
DIRECT_URL="postgresql://user:pass@ep-xxxxx.region.aws.neon.tech/db?sslmode=require"
```

## 📋 Vercel Deployment Steps

1. **Add Environment Variables in Vercel:**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add each variable one by one
   - Select all environments (Production, Preview, Development)

2. **Update Build Command in Vercel:**
   ```
   prisma generate && prisma db push && next build
   ```

3. **Deploy:**
   - Vercel will automatically redeploy when you add environment variables
   - Check build logs for any errors

## 🗄️ Database Migration Commands

After setting up Neon, run these commands locally:

```bash
# Install dependencies
npm install

# Set up your local .env with Neon DATABASE_URL
echo 'DATABASE_URL="your-neon-connection-string"' > .env

# Generate Prisma Client
npx prisma generate

# Push schema to Neon database
npx prisma db push

# Seed the database with initial data
npx prisma db seed

# Open Prisma Studio to view your data
npx prisma studio
```

## ⚠️ Important Notes

1. **SSL Required**: Always use `?sslmode=require` in your connection string
2. **Free Tier Limits**: 
   - 3 GB storage
   - 1 compute unit
   - Perfect for development and small production apps
3. **Branching**: Neon supports database branching for testing
4. **Auto-suspend**: Database suspends after 5 minutes of inactivity (auto-wakes on connection)

## 🔍 Troubleshooting

### Connection Timeout
- Use pooled connection string
- Check if IP is allowlisted (Neon allows all IPs by default)

### SSL Error
- Ensure `?sslmode=require` is in connection string
- For local development, you might need `?sslmode=require&connect_timeout=300`

### Schema Push Fails
- Use direct connection (not pooled) for migrations
- Check Neon dashboard for database status

## 📊 Monitoring

1. **Neon Dashboard**: Monitor usage, connections, and queries
2. **Vercel Functions**: Check function logs for database errors
3. **Prisma Logs**: Enable logging in production for debugging

## 🎯 Final Checklist

- [ ] Created Neon account and database
- [ ] Copied connection string (pooled version)
- [ ] Updated prisma schema to use PostgreSQL
- [ ] Generated secure NEXTAUTH_SECRET (32+ chars)
- [ ] Generated secure JWT_SECRET (32+ chars)
- [ ] Added all env variables to Vercel
- [ ] Deployed to Vercel
- [ ] Run `prisma db push` to create tables
- [ ] Run `prisma db seed` to add initial users
- [ ] Test login with default credentials
- [ ] Change default passwords immediately

## 🔑 Default Users After Seeding

```
Admin:          admin / admin123
Area Office:    area_user / area123
Project Office: project_user / project123
Road Sale:      road_user / road123
```

**⚠️ CHANGE THESE PASSWORDS IMMEDIATELY IN PRODUCTION!**

---

## Quick Copy-Paste for Vercel

```
DATABASE_URL=
NEXTAUTH_URL=https://do-tracker.vercel.app
NEXTAUTH_SECRET=
JWT_SECRET=
```

Just fill in the values and paste into Vercel's environment variables section!