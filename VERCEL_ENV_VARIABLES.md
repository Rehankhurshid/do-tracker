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
postgresql://postgres.zvszwrgquawnhitshifz:rqe0jmp5rcg0MPD%2Auph@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

```
DIRECT_URL
```

```
postgresql://postgres:rqe0jmp5rcg0MPD%2Auph@db.zvszwrgquawnhitshifz.supabase.co:5432/postgres?sslmode=require
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

2. **Deploy Again**

   ```bash
   vercel --prod
   ```

3. **Initialize Database** (After successful deployment)

   ```bash
   # Schema is automatically applied during build via prisma migrate deploy

   # Seed with initial users (POST request to your deployed app)
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

## 🎉 You're All Set!

Your Supabase database is configured and ready. Just add these environment variables to Vercel and deploy!

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
   - Ensure all 5 variables are set in Vercel
   - Check for typos in connection strings
   - Verify password is URL-encoded (`*` becomes `%2A`)

4. **Common Supabase-Vercel Issues**
   - Ensure DATABASE_URL uses port `6543` (not 5432) for pooled connection
   - Confirm `?pgbouncer=true&sslmode=require` is in DATABASE_URL
   - DIRECT_URL should use port `5432` for migrations
   - Check that Supabase project is not paused in dashboard

## 🔗 Supabase Connection Details

- **Pooled (DATABASE_URL)**: For app runtime - uses transaction pooler
- **Direct (DIRECT_URL)**: For migrations - direct database connection
- **SSL Required**: Both connections must include `sslmode=require`
- **Password Encoding**: Special characters must be URL-encoded
