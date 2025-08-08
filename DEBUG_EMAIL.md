# Email Debugging Guide

## Current Issue: Emails not sending when creating new users

### Possible Causes:

1. **Resend Test Account Limitations**
   - Your Resend account is in test mode
   - Can ONLY send emails to: `rehan@activeset.co`
   - Cannot send to variations like: `rehan+admin@activeset.co`
   - Cannot send to any other email addresses

2. **How to Fix:**

### Option 1: Use the Exact Email (Quick Fix)
When creating a user with "Send Invite":
- Use email: `rehan@activeset.co` (exactly)
- NOT `rehan+admin@activeset.co`
- NOT `rehanadmin@activeset.co`

### Option 2: Verify Your Domain (Permanent Fix)
1. Go to [Resend Domains](https://resend.com/domains)
2. Add `activeset.co` domain
3. Add DNS records to your domain provider
4. Wait for verification
5. Once verified, you can send to ANY email

### Option 3: Upgrade Resend Account
1. Upgrade from free/test tier
2. Removes email restrictions
3. Can send to any email address

## Testing Email Functionality

### Local Test:
```bash
# Start dev server
npm run dev

# In another terminal, test email
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "rehan@activeset.co", "testType": "welcome"}'
```

### Production Test:
```bash
curl -X POST https://do-tracker.vercel.app/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "rehan@activeset.co", "testType": "welcome"}'
```

## Check Vercel Environment Variables

Make sure these are set in Vercel:
- `RESEND_API_KEY` = re_EyEgkWQm_Jm17qQsZJdVrNyFwyvrzCXEq
- `EMAIL_FROM` = DO Tracker <onboarding@resend.dev>

## Monitor Email Logs

1. Go to [Resend Dashboard](https://resend.com/emails)
2. Check "Emails" section for sent/failed emails
3. Look for error messages

## Current Configuration:
- **From**: DO Tracker <onboarding@resend.dev>
- **API Key**: Configured ✓
- **Allowed Recipients**: ONLY rehan@activeset.co (test mode)

## Solution Summary:
**The email IS being sent, but Resend is blocking it because:**
- You're likely using an email variation (rehan+admin@activeset.co)
- Or a completely different email
- Test accounts can ONLY send to the registered email: rehan@activeset.co

**To receive emails, use EXACTLY: rehan@activeset.co**