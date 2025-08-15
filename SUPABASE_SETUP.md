# Supabase Database Setup - Single Database for All Environments

This project uses **Supabase** as the single database for both local development and production. This ensures consistency and eliminates database synchronization issues.

## 🎯 Benefits of Single Database Approach

1. **No Data Sync Issues**: Same data available in development and production
2. **Real Testing**: Test with actual production data structure
3. **Simplified Setup**: One database to configure and maintain
4. **Cost Effective**: Supabase free tier is generous for development projects

## 📋 Environment Configuration

### Local Development (.env)

```env
# Direct connection for local development
DATABASE_URL="postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres"
```

### Production/Vercel (Environment Variables)

```env
# Pooler connection for serverless (Vercel)
DATABASE_URL="postgresql://postgres.zvszwrgquawnhitshifz:gz3E7EcJaP0aGXFp@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres"
```

## 🔑 Key Differences

| Environment | Connection Type | Port | Notes |
|------------|-----------------|------|-------|
| Local Dev | Direct | 5432 | Stable connection for development |
| Production | Pooler | 6543 | Connection pooling for serverless |

## 🚀 Setup Steps

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/Rehankhurshid/do-tracker.git
cd do-tracker/orderflow

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env and add your Supabase password
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Seed with initial data
npm run seed
```

### 3. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

## 🔧 Common Commands

```bash
# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma db push --force-reset

# Re-seed database
npm run seed

# Generate Prisma types
npx prisma generate
```

## 📊 Database Schema Management

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Push changes to database:
   ```bash
   npx prisma db push
   ```
3. Generate new client:
   ```bash
   npx prisma generate
   ```

### Creating Migrations (Optional)

For production, you might want to use migrations:

```bash
# Create a migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy
```

## 🌐 Vercel Deployment

### Environment Variables Required

1. Go to: https://vercel.com/rehankhurshids-projects/do-tracker/settings/environment-variables

2. Add these variables:

   - `DATABASE_URL`: Pooler connection string (port 6543)
   - `DIRECT_URL`: Direct connection string (port 5432)
   - `JWT_SECRET`: Your JWT secret
   - `NEXTAUTH_URL`: https://do-tracker.vercel.app
   - `NEXTAUTH_SECRET`: Your NextAuth secret

### Important Notes for Vercel

- **Must use pooler connection** for DATABASE_URL (port 6543)
- **Must include** `?pgbouncer=true` in the pooler URL
- **Use** `postgres.projectref` format (not `postgres:`)

## 🔒 Security Best Practices

1. **Never commit `.env` file** - It's gitignored for a reason
2. **Use different passwords** for development and production databases (optional)
3. **Regularly rotate database passwords**
4. **Enable RLS (Row Level Security)** in Supabase for additional security
5. **Use Supabase connection pooling** for production

## 🐛 Troubleshooting

### "Can't reach database server" Error

**For Local Development:**
- Check if password is correct in `.env`
- Ensure Supabase project is active (not paused)
- Try direct connection URL (port 5432)

**For Vercel:**
- Ensure using pooler URL (port 6543) with `?pgbouncer=true`
- Check environment variables in Vercel dashboard
- Verify Supabase project is in same region as Vercel deployment

### "Tenant or user not found" Error

This usually means:
- Incorrect password
- Wrong connection string format
- Using pooler format in local development (use direct instead)

### Database Connection Test

Visit these endpoints to test connection:
- Local: http://localhost:3000/api/test-db
- Production: https://do-tracker.vercel.app/api/test-db

## 📚 Resources

- [Supabase Dashboard](https://app.supabase.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Project Repository](https://github.com/Rehankhurshid/do-tracker)

## 💡 Tips

1. **Keep Supabase project active**: Free tier projects pause after 1 week of inactivity
2. **Use Prisma Studio**: Great for visualizing and editing data during development
3. **Monitor usage**: Check Supabase dashboard for connection and storage usage
4. **Backup regularly**: Use Supabase's backup features for important data