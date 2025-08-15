# Vercel Deployment Guide for OrderFlow

## 📋 Environment Variables for Vercel

Go to: https://vercel.com/rehankhurshids-projects/do-tracker/settings/environment-variables

Add these environment variables:

### Required Variables:

```
DATABASE_URL
```
```
postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres
```

```
DIRECT_URL
```
```
postgresql://postgres:gz3E7EcJaP0aGXFp@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres
```

```
JWT_SECRET
```
```
hX5UjzACgQm9D596gAz8QM18oPMwVZUN2cfULBy/7fQ=
```

```
NEXTAUTH_URL
```
```
https://orderflow.vercel.app
```

```
NEXTAUTH_SECRET
```
```
hX5UjzACgQm9D596gAz8QM18oPMwVZUN2cfULBy/7fQ=
```

### Optional Variables (Email):

```
BREVO_API_KEY
```
(Leave empty or add your Brevo API key if you have email setup)

```
BREVO_SENDER_EMAIL
```
(Leave empty or add your sender email)

```
BREVO_SENDER_NAME
```
```
OrderFlow System
```

## 🚀 Deployment Steps

1. **Add Environment Variables in Vercel**
   - Go to: https://vercel.com/rehankhurshids-projects/do-tracker/settings/environment-variables
   - Add each variable above
   - Select all environments (Production, Preview, Development)
   - Click "Save"

2. **Trigger Deployment**
   Since we've already pushed to GitHub, Vercel should automatically deploy. If not:
   - Go to your Vercel dashboard
   - Click "Redeploy" 
   - Or run: `vercel --prod` from the command line

3. **Verify Database Connection**
   After deployment, check:
   - https://orderflow.vercel.app/api/health
   - This should return a success message if the database is connected

## 🔑 Default Login Credentials

After deployment, you can create users or use the seed script:

```bash
# Run locally to seed the production database
cd orderflow
npm run seed
```

Default credentials (if seeded):
```
Admin:          admin / admin123
Area Office:    area_user / area123
Project Office: project_user / project123
CISF:           cisf_user / cisf123
Road Sale:      road_user / road123
```

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## 🌐 Production URL

Your app will be available at:
- https://orderflow.vercel.app
- Or https://orderflow-[branch-name].vercel.app for preview deployments

## 📝 Notes

- We're using Supabase as the database provider
- The direct connection is being used (pooler connection needs configuration in Supabase dashboard)
- For better performance with Vercel, consider setting up the pooler connection in Supabase

## 🔧 Troubleshooting

If you see database connection errors:
1. Verify the password is correct in Supabase dashboard
2. Check if the database is accessible from Vercel's IP addresses
3. Consider using the pooler connection for better serverless performance

## ✅ Post-Deployment Checklist

- [ ] Environment variables added to Vercel
- [ ] Deployment successful
- [ ] Database connection verified (/api/health)
- [ ] Login page accessible
- [ ] Default users created (if needed)
- [ ] Test login functionality
- [ ] Change default passwords