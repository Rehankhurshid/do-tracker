# PostgreSQL Database Setup for OrderFlow

## Quick Setup Options

### Option 1: Vercel Postgres (Recommended for Vercel Deployment)
1. Go to your Vercel Dashboard
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database" → Select "Postgres"
5. Copy the connection string
6. Add to your Vercel environment variables as `DATABASE_URL`

### Option 2: Supabase (Free Tier Available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (free)
3. Go to Settings → Database
4. Copy the "Connection string" (URI)
5. Add to your `.env` file:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

### Option 3: Neon (Serverless Postgres)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project (free tier)
3. Copy the connection string from dashboard
4. Add to your `.env` file:
   ```
   DATABASE_URL="postgresql://[user]:[password]@[host]/[database]?sslmode=require"
   ```

### Option 4: Railway
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from Variables tab
4. Add to your `.env` file

## Environment Variables Setup

### For Vercel Deployment:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A random secret string (generate with `openssl rand -base64 32`)

### For Local Development:
Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/orderflow"
JWT_SECRET="your-secret-key-here"
```

## Database Migration

After setting up your PostgreSQL database:

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Create and apply migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

3. **For production (Vercel):**
   The build command will automatically run:
   ```bash
   prisma migrate deploy
   ```

## Seed Initial Data (Optional)

Create an admin user:
```bash
npm run seed
```

## Troubleshooting

### "Database connection error"
- Check if your DATABASE_URL is correct
- Ensure the database server is running
- Check if SSL is required (add `?sslmode=require` to the URL)

### "Migration failed"
- Make sure the database is empty for initial migration
- Or run `npx prisma migrate reset` to reset (WARNING: deletes all data)

### For Vercel deployment issues:
- Ensure DATABASE_URL is set in Vercel Environment Variables
- Check build logs in Vercel dashboard
- Make sure to use `prisma migrate deploy` not `prisma db push` in production

## Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

Example:
```
postgresql://myuser:mypassword@db.example.com:5432/orderflow?sslmode=require
```

## Quick Start with Supabase (Free)

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project (takes ~2 minutes)
3. Go to Settings → Database
4. Copy "Connection string" 
5. Add to Vercel Environment Variables
6. Deploy!

That's it! Your app will now use PostgreSQL.