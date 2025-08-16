# Vercel Environment Variables for DO Tracker

## 🚀 Your Database is Ready!

Your Supabase database "DO Tracker" has been configured. Here are the exact environment variables to add in Vercel:

## 📋 Copy These to Vercel Dashboard

Go to: https://vercel.com/rehankhurshids-projects/orderflow/settings/environment-variables

Add these environment variables:

```
DATABASE_URL
```

```
postgresql://postgres.zvszwrgquawnhitshifz:rqe0jmp5rcg0MPD%2Auph@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

```
NEXTAUTH_URL
```

```
https://do-tracker.vercel.app
```

```
NEXTAUTH_SECRET
```

```
uoSNKy1evZ0pHxRpwwvc04dphdNocVRqpjjAK2Cn6HI=
```

```
JWT_SECRET
```

```
Ziqt6maze3C/Ju0RajDN+ueKLX2y1OPE8RfDy7Joqss=
```

## 📝 Supabase Database Details

- **Project Name**: DO Tracker
- **Project ID**: zvszwrgquawnhitshifz
- **Database**: postgres
- **Region**: ap-southeast-1 (Singapore)
- **PostgreSQL Version**: 17
- **Connection Type**: Transaction Pooler (for better serverless performance)
- **Project URL**: https://zvszwrgquawnhitshifz.supabase.co

## 🔧 Steps to Deploy

1. **Add Environment Variables in Vercel**
   - Go to your Vercel project settings
   - Click on "Environment Variables"
   - Add each variable above (copy-paste exactly)
   - Select all environments (Production, Preview, Development)

2. **Deploy Again & Clear Cache**

   ```bash
   # Clear Vercel cache and redeploy
   vercel --prod --force
   ```

   **⚠️ IMPORTANT**: If still getting `prisma db push` errors:
   1. Go to Vercel Dashboard → Project Settings → General
   2. Check if there's a custom "Build Command" set
   3. If yes, **remove it** or set it to: `prisma generate && next build`
   4. Redeploy after clearing the custom command

3. **Initialize Database** (After successful deployment)

   ```bash
   # Verify environment variables are loaded correctly
   curl https://do-tracker.vercel.app/api/health

   # Should return: {"ok": true, "db": "timestamp"}
   # If not, check Vercel environment variable configuration

   # Apply database schema at runtime (if needed)
   curl -X POST https://do-tracker.vercel.app/api/debug/migrate

   # Seed with initial users
   curl -X POST https://do-tracker.vercel.app/api/seed \
     -H "Content-Type: application/json" \
     -d '{"secret":"Ziqt6maze3C/Ju0RajDN+ueKLX2y1OPE8RfDy7Joqss="}'
   ```

## ✅ Verification

After deployment, your app will be available at:

- https://do-tracker.vercel.app

## 🔑 Default Login Credentials (After Seeding)

```
Admin:          admin / admin123
Area Office:    area_user / area123
Project Office: project_user / project123
Road Sale:      road_user / road123
```

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## � **Prisma Best Practices for Vercel**

### ✅ **Current Implementation**

- **Consistent Client Generation**: `prisma generate` runs before build
- **Explicit Strategy**: Build-time generation ensures schema compatibility
- **Environment Separation**: Build vs Runtime database handling

### 📚 **Additional Recommendations**

1. **Always run `prisma generate` before build** ✅ (Already implemented)
2. **Use explicit environment variable validation**
3. **Consider `prisma-multi-tenant` for complex deployments**
4. **Monitor Prisma community forums for deployment patterns**
5. **Test DATABASE_URL format thoroughly before deployment**

### 🔧 **Environment Variable Best Practices**

- **Explicit Loading**: Verify all env vars are available at runtime
- **URL Encoding**: Always encode special characters (`*` → `%2A`)
- **Connection Testing**: Use health endpoints to verify connectivity
- **Fallback Strategies**: Have backup connection methods ready

## 🔍 Debugging Steps

If you encounter issues after deployment:

1. **Check Database Connection**

   ```
   GET https://do-tracker.vercel.app/api/health
   ```

   Should return: `{"ok": true, "db": "timestamp"}`

2. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Functions tab
   - Look for any database connection errors

3. **Verify Environment Variables**
   - Ensure all 4 variables are set in Vercel
   - Check for typos in connection strings
   - Verify password is URL-encoded (`*` becomes `%2A`)

4. **Common Supabase-Vercel Issues & Solutions**
   - **Build Strategy**: Skip database operations during build (`prisma generate && next build`)
   - **Runtime Handling**: Database schema operations handled at runtime
   - **Consistent Generation**: Always run `prisma generate` before build
   - **Environment Validation**: Verify DATABASE_URL format and accessibility
   - **Connection Pooling**: Use pooler for serverless compatibility
   - **Multi-tenancy**: Consider `prisma-multi-tenant` for complex deployments
   - **Documentation**: Reference Prisma docs and community forums for troubleshooting

## 🔗 Supabase Connection Details

- **Pooled (DATABASE_URL)**: For app runtime - uses transaction pooler
- **Direct (DIRECT_URL)**: For migrations - direct database connection
- **SSL Required**: Both connections must include `sslmode=require`
- **Password Encoding**: Special characters must be URL-encoded
