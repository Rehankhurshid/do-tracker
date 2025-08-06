# Vercel Environment Variables for DO Tracker

## 🚀 Your Database is Ready!

Your Neon database "DO Tracker" has been found and configured. Here are the exact environment variables to add in Vercel:

## 📋 Copy These to Vercel Dashboard

Go to: https://vercel.com/rehankhurshids-projects/orderflow/settings/environment-variables

Add these four environment variables:

```
DATABASE_URL
```
```
postgresql://neondb_owner:npg_a08oluKeMfQs@ep-plain-frog-a1ovordx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
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
uoSNKy1evZ0pHxRpwwvc04dphdNocVRqpjjAK2Cn6HI=
```

```
JWT_SECRET
```
```
Ziqt6maze3C/Ju0RajDN+ueKLX2y1OPE8RfDy7Joqss=
```

## 📝 Neon Database Details

- **Project Name**: DO Tracker
- **Project ID**: cold-field-37034169
- **Database**: neondb
- **Region**: ap-southeast-1 (Singapore)
- **PostgreSQL Version**: 17
- **Connection Type**: Pooled (for better serverless performance)

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
   # Push schema to Neon database
   npx prisma db push
   
   # Seed with initial users
   npx prisma db seed
   ```

## ✅ Verification

After deployment, your app will be available at:
- https://orderflow.vercel.app
- Or check your custom domain if you set one

## 🔑 Default Login Credentials (After Seeding)

```
Admin:          admin / admin123
Area Office:    area_user / area123
Project Office: project_user / project123
Road Sale:      road_user / road123
```

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## 🎉 You're All Set!

Your Neon database is configured and ready. Just add these environment variables to Vercel and deploy!