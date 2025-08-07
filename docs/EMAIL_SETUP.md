# Email Setup Guide for DO Tracker

## Overview
DO Tracker uses **Resend** for sending transactional emails like password reset links. This guide will help you set up email functionality.

## Current Email Capabilities
✅ **Password Reset Emails** - Fully implemented and ready to use
❌ **Order Status Notifications** - Not yet implemented
❌ **Issue Alert Emails** - Not yet implemented

## Setup Instructions

### Step 1: Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (includes 100 emails/day)
3. Verify your email address

### Step 2: Get Your API Key
1. After logging in to Resend, go to the [API Keys page](https://resend.com/api-keys)
2. Create a new API key
3. Copy the API key (starts with `re_`)

### Step 3: Configure Environment Variables
Add these to your `.env` file:

```env
# Resend API Key
RESEND_API_KEY="re_your_actual_api_key_here"

# Email sender address
# For testing: Use the default Resend email
EMAIL_FROM="DO Tracker <onboarding@resend.dev>"

# For production: Use your verified domain
# EMAIL_FROM="DO Tracker <noreply@yourdomain.com>"
```

### Step 4: Verify Domain (For Production)
1. In Resend dashboard, go to [Domains](https://resend.com/domains)
2. Add your domain
3. Add the DNS records provided by Resend to your domain
4. Wait for verification (usually takes a few minutes)
5. Update `EMAIL_FROM` in `.env` to use your domain

## Testing Email Functionality

### Test Password Reset
1. Start your development server: `npm run dev`
2. Go to `/login`
3. Click "Forgot Password?"
4. Enter a registered email address
5. Check the email inbox (or Resend dashboard for sent emails)

### Troubleshooting

#### Emails not sending?
- Check if `RESEND_API_KEY` is set correctly in `.env`
- Verify the API key is active in Resend dashboard
- Check console logs for error messages
- Ensure you haven't exceeded the free tier limit (100 emails/day)

#### Email going to spam?
- Verify your domain with Resend
- Use a proper FROM address with your domain
- Ensure email content is not triggering spam filters

## Email Templates

Current email templates:
- **Password Reset Email** (`/src/lib/email.ts`)
  - Professional HTML template
  - Mobile responsive
  - 24-hour expiration notice
  - Clear call-to-action button

## API Usage

### Send Password Reset Email
```typescript
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

// Generate email HTML
const emailHtml = generatePasswordResetEmail(resetLink, username);

// Send email
const result = await sendEmail({
  to: userEmail,
  subject: 'Password Reset Request',
  html: emailHtml,
});
```

## Production Checklist

Before deploying to production:
- [ ] Get a Resend production API key
- [ ] Verify your domain with Resend
- [ ] Update `EMAIL_FROM` to use your domain
- [ ] Update `NEXTAUTH_URL` to your production URL
- [ ] Test email delivery in production environment
- [ ] Monitor email delivery rates in Resend dashboard

## Email Service Alternatives

If you prefer a different email service, you can easily switch by:
1. Installing the appropriate package (`nodemailer`, `@sendgrid/mail`, etc.)
2. Updating `/src/lib/email.ts` to use the new service
3. Updating environment variables

Popular alternatives:
- SendGrid
- Mailgun
- Amazon SES
- Postmark
- SMTP (using Nodemailer)

## Support

For Resend-specific issues:
- [Resend Documentation](https://resend.com/docs)
- [Resend Status Page](https://status.resend.com)

For DO Tracker email issues:
- Check `/src/lib/email.ts` for email implementation
- Check `/src/app/api/auth/request-reset/route.ts` for password reset logic