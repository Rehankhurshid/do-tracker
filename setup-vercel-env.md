# Setting Up Vercel Environment Variables

## Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/rehankhurshids-projects/orderflow
2. Click on "Settings" tab
3. Navigate to "Environment Variables"
4. Add these variables:

```bash
DATABASE_URL = "postgresql://[your-neon-connection-string]"
NEXTAUTH_URL = "https://orderflow.vercel.app"
NEXTAUTH_SECRET = "[generate with: openssl rand -base64 32]"
JWT_SECRET = "[generate with: openssl rand -base64 32]"
```

## Option 2: Via Vercel CLI

Run these commands in your terminal:

```bash
# Add DATABASE_URL (replace with your Neon connection string)
vercel env add DATABASE_URL production

# Add NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# Enter: https://orderflow.vercel.app

# Add NEXTAUTH_SECRET (generate first)
openssl rand -base64 32
vercel env add NEXTAUTH_SECRET production
# Paste the generated secret

# Add JWT_SECRET (generate first)
openssl rand -base64 32
vercel env add JWT_SECRET production
# Paste the generated secret
```

## Quick Commands to Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET (run again for different value)
openssl rand -base64 32
```

## Example Values (DO NOT USE THESE - Generate Your Own!)

```
DATABASE_URL = "postgresql://orderflow_owner:abc123xyz@ep-cool-forest-123456-pooler.us-east-2.aws.neon.tech/orderflow?sslmode=require"
NEXTAUTH_URL = "https://orderflow.vercel.app"
NEXTAUTH_SECRET = "k3yB0ard/C4t+M0us3=R4nd0m/Str1ng/32ch4r5"
JWT_SECRET = "4n0th3r/R4nd0m+Str1ng=F0r/JWT/T0k3n5/32"
```

## After Adding Environment Variables

Deploy again:
```bash
vercel --prod
```

## Verify Deployment

Your app should be available at:
- Production: https://orderflow.vercel.app
- Or check: https://vercel.com/rehankhurshids-projects/orderflow

## Initialize Database After Deployment

Once deployed with environment variables:

```bash
# Pull the production environment variables
vercel env pull .env.production.local

# Push schema to production database
npx prisma db push

# Seed with initial data
npx prisma db seed
```