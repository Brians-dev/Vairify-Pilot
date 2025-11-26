# DateGuard Emergency SMS Notification Setup Guide

## Overview

This guide explains how to set up Twilio SMS notifications for DateGuard emergency alerts. The system sends SMS messages to guardians when:
- Panic button is pressed
- Session timer expires without check-in
- Decoy code is entered
- Manual emergency is triggered

## Features

✅ **Automatic SMS sending** to all active guardians  
✅ **Test mode** - logs messages instead of sending when keys not configured  
✅ **Timer expiry detection** - automatic emergency alerts when sessions expire  
✅ **Panic button integration** - immediate SMS on button press  
✅ **Multiple trigger types** - panic, timer, decoy code, missed check-in  
✅ **Location information** - includes GPS and address in SMS  
✅ **Grace period** - 5-minute window after expiry before triggering  

## Prerequisites

1. Twilio account (sign up at https://www.twilio.com/try-twilio)
2. Twilio phone number (trial account works for testing)
3. Access to Supabase Dashboard for environment variable configuration

## Setup Instructions

### Step 1: Get Twilio Credentials

1. **Sign up for Twilio:**
   - Go to https://www.twilio.com/try-twilio
   - Create a free trial account (includes $15.50 credit)

2. **Get Account SID and Auth Token:**
   - Log into Twilio Console: https://console.twilio.com
   - Your **Account SID** is visible on the dashboard
   - Click "Show" next to Auth Token to reveal your **Auth Token**

3. **Get Phone Number:**
   - Go to Phone Numbers > Manage > Buy a number
   - Or use the trial number provided (only works for verified numbers)
   - Copy the phone number in **E.164 format** (e.g., `+1234567890`)

### Step 2: Configure Supabase Environment Variables

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Go to **Project Settings** > **Edge Functions** > **Secrets**

2. **Add the following secrets:**
   ```
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```

   **Important:** 
   - Replace placeholder values with your actual Twilio credentials
   - Phone number must be in E.164 format (starts with `+`)
   - Secrets are case-sensitive

3. **Verify secrets are set:**
   - You should see all three secrets listed
   - Secrets are encrypted and only accessible to edge functions

### Step 3: Deploy Edge Functions

1. **Deploy the SMS function:**
   ```bash
   supabase functions deploy send-emergency-sms
   ```

2. **Deploy the emergency alert function:**
   ```bash
   supabase functions deploy send-emergency-alert
   ```

3. **Deploy the session checker function:**
   ```bash
   supabase functions deploy check-expired-sessions
   ```

4. **Or deploy all at once:**
   ```bash
   supabase functions deploy
   ```

### Step 4: Set Up Cron Job (Optional but Recommended)

The `check-expired-sessions` function should run periodically to detect expired sessions.

1. **Go to Supabase Dashboard:**
   - Navigate to **Database** > **Cron Jobs**

2. **Create a new cron job:**
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - SQL Command:
   ```sql
   SELECT cron.schedule(
     'check-expired-sessions',
     '*/5 * * * *',
     $$
     SELECT net.http_post(
       url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/check-expired-sessions',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer [YOUR-ANON-KEY]"}',
       body := '{}'::jsonb
     )::json;
     $$
   );
   ```

   **Replace:**
   - `[YOUR-PROJECT-REF]` with your Supabase project reference
   - `[YOUR-ANON-KEY]` with your Supabase anon key (found in Project Settings > API)

3. **Verify cron job:**
   - Go to Database > Cron Jobs
   - You should see `check-expired-sessions` scheduled
   - It will run every 5 minutes automatically

## Test Mode

When Twilio credentials are **not configured** or contain **placeholder values**, the system automatically enters **TEST MODE**:

✅ **What happens in Test Mode:**
- SMS messages are **logged** instead of sent
- Messages appear in Supabase Edge Function logs
- Test notifications are saved to `dateguard_messages` table
- No SMS charges are incurred

✅ **How to verify Test Mode:**
1. Check Supabase Dashboard > Edge Functions > Logs
2. Look for messages starting with `🧪 TEST MODE: SMS NOTIFICATION (NOT SENT)`
3. Check `dateguard_messages` table for test notifications

✅ **Exiting Test Mode:**
- Simply add real Twilio credentials as described in Step 2
- The system will automatically switch to production mode
- No code changes needed

## Integration Points

### Frontend Components

1. **`src/pages/dateguard/ActiveSession.tsx`**
   - Panic button calls `send-emergency-alert` function
   - Timer expiry automatically triggers emergency alert
   - Both send SMS to all guardians

2. **`src/pages/dateguard/GuardiansManagement.tsx`**
   - Manages guardian phone numbers
   - Only active guardians receive SMS alerts

### Backend Functions

1. **`send-emergency-sms/index.ts`**
   - Core SMS sending function
   - Handles Twilio API calls
   - Includes test mode logic

2. **`send-emergency-alert/index.ts`**
   - Main emergency alert handler
   - Creates emergency events
   - Calls SMS function for each guardian

3. **`check-expired-sessions/index.ts`**
   - Cron job to check for expired sessions
   - Triggers emergency alerts for missed check-ins
   - Updates session status

## SMS Message Format

Emergency SMS messages include:

```
🚨 EMERGENCY ALERT

[User Name] needs immediate assistance.

📍 Location: [Address or GPS]
🕐 Time: [Formatted timestamp]
👤 Guardian: [Guardian Name]

⚠️ This is a real emergency. Please check on them immediately.

If you cannot reach them, contact authorities.
Call 911 if this is life-threatening.

- Vairify DateGuard Emergency System
```

## Testing

### Test Emergency Alert

1. **Go to Active Session page:**
   - Navigate to `/dateguard/session/[session-id]`

2. **Press Panic Button:**
   - Click the red "PANIC 🚨" button
   - Emergency alert will be triggered
   - SMS sent to all active guardians

3. **Check Logs:**
   - Go to Supabase Dashboard > Edge Functions > Logs
   - Look for `send-emergency-sms` function logs
   - Verify SMS was sent (or logged in test mode)

### Test Timer Expiry

1. **Create a test session:**
   - Set duration to 1 minute for quick testing
   - Don't check in before timer expires

2. **Wait for timer to expire:**
   - Session should automatically trigger emergency
   - Or wait for cron job (up to 5 minutes)

3. **Verify emergency triggered:**
   - Check `emergency_events` table
   - Check `dateguard_messages` table
   - Verify SMS was sent to guardians

### Test Mode Verification

1. **Use placeholder credentials:**
   - Set `TWILIO_ACCOUNT_SID=test` in Supabase secrets
   - Or don't set credentials at all

2. **Trigger emergency:**
   - Press panic button or let timer expire

3. **Check logs:**
   - Should see `🧪 TEST MODE: SMS NOTIFICATION (NOT SENT)`
   - Full message content logged
   - No SMS actually sent

## Troubleshooting

### SMS Not Sending

1. **Check credentials:**
   - Verify all three secrets are set correctly
   - Check for typos in Account SID or Auth Token
   - Verify phone number is in E.164 format

2. **Check Twilio account:**
   - Ensure account is active (not suspended)
   - Verify phone number is active
   - Check account balance (trial accounts have limits)

3. **Check logs:**
   - Go to Supabase Dashboard > Edge Functions > Logs
   - Look for error messages
   - Check Twilio console for API errors

### Test Mode Not Working

1. **Check secret values:**
   - If any secret contains `placeholder`, `your_`, `xxx`, `test`, or `demo`, test mode activates
   - Remove placeholder values to exit test mode

2. **Verify function deployment:**
   - Ensure `send-emergency-sms` function is deployed
   - Check function is accessible

### Cron Job Not Running

1. **Verify cron job exists:**
   - Go to Database > Cron Jobs
   - Check `check-expired-sessions` is listed

2. **Check cron job syntax:**
   - Verify schedule is correct (`*/5 * * * *`)
   - Check SQL command is valid

3. **Check permissions:**
   - Ensure cron job has correct URL and auth token
   - Verify function is accessible

## Security Considerations

1. **Credentials Security:**
   - Never commit Twilio credentials to Git
   - Use Supabase secrets for all sensitive data
   - Rotate credentials regularly

2. **Rate Limiting:**
   - Twilio has rate limits (check your plan)
   - Consider implementing queue for high-volume scenarios

3. **Phone Number Validation:**
   - Validate guardian phone numbers on input
   - Ensure numbers are in correct format

4. **Error Handling:**
   - System continues even if SMS fails
   - Database notifications always created
   - Logs all errors for debugging

## Cost Considerations

- **Twilio Trial:** $15.50 free credit
- **SMS Pricing:** ~$0.0075 per SMS in US (varies by country)
- **Test Mode:** No charges (messages are logged, not sent)
- **Production:** Cost depends on number of guardians and alerts

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Check Twilio Console for API errors
3. Review this documentation
4. Contact development team

---

**Last Updated:** December 2024  
**Version:** 1.0.0

