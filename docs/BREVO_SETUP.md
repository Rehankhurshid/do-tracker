# Brevo Email Setup Guide

This guide will help you set up Brevo (formerly SendinBlue) for sending emails from the DO Tracker application.

## Why Brevo?

- **Free Tier**: 300 emails/day (vs Resend's 100/day)
- **No Domain Verification Required**: Can send from any email immediately in test mode
- **Transactional Email API**: Reliable delivery for important system emails
- **Good Deliverability**: Well-established email service provider

## Setup Steps

### 1. Create a Brevo Account

1. Go to [https://www.brevo.com](https://www.brevo.com)
2. Click "Sign up free"
3. Complete the registration process
4. Verify your email address

### 2. Get Your API Key

1. Log in to your Brevo dashboard
2. Navigate to **Settings** → **SMTP & API**
3. Click on **API Keys** tab
4. Click **Generate a new API key**
5. Name it (e.g., "DO Tracker")
6. Copy the API key (starts with `xkeysib-`)

### 3. Set Up a Sender

1. Go to **Settings** → **Senders & IP**
2. Click **Add a Sender**
3. Fill in:
   - **From Name**: DO Tracker
   - **From Email**: noreply@yourdomain.com (or any email you want)
4. Click **Save**

> **Note**: For production, you should verify your domain for better deliverability. But for testing, any email works.

### 4. Configure Environment Variables

Update your `.env` or `.env.local` file:

```env
# Brevo Configuration
BREVO_API_KEY="xkeysib-your-actual-api-key-here"
BREVO_SENDER_EMAIL="noreply@yourdomain.com"
BREVO_SENDER_NAME="DO Tracker"

# Optional
BREVO_REPLY_TO_EMAIL="support@yourdomain.com"
BREVO_REPLY_TO_NAME="DO Tracker Support"
```

### 5. Test Email Sending

You can test the email functionality by:

1. Creating a new user in the Admin panel
2. Using the password reset feature
3. Creating a new delivery order (if notifications are enabled)

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**: Make sure you copied the entire API key including the `xkeysib-` prefix

2. **"Sender not found"**: Ensure the sender email in your environment variables matches one configured in Brevo

3. **"Email not delivered"**: Check your Brevo dashboard for:
   - Email logs (under **Transactional** → **Email Activity**)
   - Any bounces or blocks
   - Your daily sending limit

### Brevo Dashboard Features

- **Email Activity**: View all sent emails and their status
- **Statistics**: Track open rates, click rates, etc.
- **Templates**: Create reusable email templates (optional)
- **Webhooks**: Set up real-time notifications for email events (optional)

## Production Recommendations

1. **Verify Your Domain**: Improves deliverability
   - Go to **Settings** → **Senders & IP** → **Domains**
   - Add your domain and follow DNS setup instructions

2. **Set Up SPF/DKIM**: Further improves deliverability
   - Brevo provides the necessary DNS records

3. **Monitor Your Reputation**: Keep an eye on:
   - Bounce rates (should be < 5%)
   - Complaint rates (should be < 0.1%)
   - Engagement rates

4. **Use Dedicated IP** (Optional): For high-volume sending
   - Available in paid plans

## API Limits

### Free Plan
- 300 emails/day
- No credit card required
- Full API access

### Paid Plans
- Start at $25/month
- 20,000+ emails/month
- Advanced features like:
  - Dedicated IP
  - Advanced statistics
  - Priority support

## Support

- Brevo Documentation: [https://developers.brevo.com](https://developers.brevo.com)
- API Reference: [https://developers.brevo.com/reference](https://developers.brevo.com/reference)
- Support: Available through dashboard chat or email