# Supabase Connection Options

## For Vercel Deployment

Use the **Transaction Pooler** connection string for serverless environments like Vercel:

### Option 1: Transaction Pooler (Recommended for Vercel)
```
postgresql://postgres.zvszwrgquawnhitshifz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Option 2: Direct Connection
```
postgresql://postgres:[YOUR-PASSWORD]@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres
```

### Option 3: Session Pooler
```
postgresql://postgres.zvszwrgquawnhitshifz:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

## Important for Vercel:

1. **Use Pooler Connection**: Vercel functions are serverless and create many connections. Use the pooler to avoid connection limits.

2. **Add these to Vercel Environment Variables**:
   - Go to Supabase Dashboard → Settings → Database
   - Look for "Connection Pooling" section
   - Copy the "Transaction" mode connection string
   - It should look like: `postgresql://postgres.zvszwrgquawnhitshifz:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

3. **Update your DATABASE_URL in Vercel** to use the pooler connection string

## Prisma Configuration for Pooling

If using the pooler, you might need to add this to your schema.prisma:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

Where:
- `DATABASE_URL` = Pooler connection string (for the app)
- `DIRECT_URL` = Direct connection string (for migrations only)