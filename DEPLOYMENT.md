# OrderFlow Deployment Guide

## 🚀 Deploying to Vercel

### Prerequisites
- A GitHub account
- A Vercel account (sign up at https://vercel.com)
- A production database (PostgreSQL recommended)

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Add the remote and push your code:

```bash
git add .
git commit -m "Initial commit - OrderFlow application"
git remote add origin https://github.com/YOUR_USERNAME/orderflow.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Production Database

You'll need a production PostgreSQL database. Recommended options:

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string

#### Option B: Supabase
1. Create a project at https://supabase.com
2. Go to Settings → Database
3. Copy the connection string

#### Option C: Neon
1. Create a database at https://neon.tech
2. Copy the connection string

### Step 3: Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `.` (leave as is)
   - Build Command: `prisma generate && prisma db push && next build`
   - Output Directory: `.next` (leave as is)

### Step 4: Set Environment Variables

In Vercel project settings, add these environment variables:

```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="generate-using-openssl-rand-base64-32"
JWT_SECRET="generate-using-openssl-rand-base64-32"
```

To generate secrets, run:
```bash
openssl rand -base64 32
```

### Step 5: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be live at `https://your-app.vercel.app`

### Step 6: Initialize Database

After deployment, you need to seed the database with initial data:

1. Install Vercel CLI: `npm i -g vercel`
2. Link to your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Run seed locally against production DB:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

## 🔐 Default Login Credentials

After seeding, use these credentials:

- **Admin**: `admin` / `admin123`
- **Area Office**: `area_user` / `area123`
- **Project Office**: `project_user` / `project123`
- **Road Sale**: `road_user` / `road123`

**⚠️ IMPORTANT**: Change these passwords immediately after first login!

## 🔄 Updating the Application

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically detect the push and redeploy.

## 🛠️ Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correctly formatted
- Check if your database allows connections from Vercel IPs
- For Supabase: Enable "Allow direct connections" in settings

### Build Failures
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set correctly

### Prisma Issues
- If schema changes aren't reflected: `prisma generate && prisma db push`
- For migration issues: Consider using `prisma migrate deploy` in production

## 📊 Monitoring

1. **Vercel Analytics**: Enable in project settings for performance monitoring
2. **Database Monitoring**: Use your database provider's dashboard
3. **Error Tracking**: Consider adding Sentry for error monitoring

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique secrets for NEXTAUTH_SECRET and JWT_SECRET
- [ ] Enable 2FA on GitHub and Vercel accounts
- [ ] Review and restrict database access
- [ ] Set up proper CORS policies if needed
- [ ] Regular security updates for dependencies

## 📝 Post-Deployment Tasks

1. **Test all features**:
   - Login with each role
   - Create and process delivery orders
   - Report and resolve issues
   - Check mobile responsiveness

2. **Configure domain** (optional):
   - Add custom domain in Vercel settings
   - Update NEXTAUTH_URL environment variable

3. **Set up backups**:
   - Enable automatic backups in your database provider
   - Consider implementing data export functionality

## 🆘 Support

For issues or questions:
- Check Vercel documentation: https://vercel.com/docs
- Review Next.js deployment guide: https://nextjs.org/docs/deployment
- Database-specific guides for your provider

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host/db |
| NEXTAUTH_URL | Your app's URL | https://orderflow.vercel.app |
| NEXTAUTH_SECRET | Secret for NextAuth | 32+ character random string |
| JWT_SECRET | Secret for JWT tokens | 32+ character random string |

## Quick Commands

```bash
# Generate secrets
openssl rand -base64 32

# Update Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```