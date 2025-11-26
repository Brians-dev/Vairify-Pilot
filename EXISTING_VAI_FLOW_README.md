# Existing VAI Number Flow - Integration with ChainPass

## Feature Description

Allows users with existing VAI numbers from other platforms to use them in Vairify. The system checks VAI requirements via ChainPass API and routes users accordingly based on their VAI status.

## Flow Overview

1. **User checks "I have a VAI number from another platform"** on registration form
2. **User enters their VAI number**
3. **System calls ChainPass `/check-vai-requirements` API** with VAI number
4. **Response determines routing:**
   - **Fully Qualified** → Skip ChainPass, go directly to profile setup
   - **Missing Requirements** → Redirect to ChainPass completion (LE disclosure + signature only)
   - **Invalid** → Full ChainPass VAI creation flow

## Database Changes

### Migration: `20251205000007_add_existing_vai_fields.sql`

Adds to `signup_sessions` table:
- `has_existing_vai` (BOOLEAN)
- `existing_vai_number` (VARCHAR)
- `chainpass_response` (JSONB) - Full API response
- `vai_status` (ENUM: 'fully_qualified', 'missing_requirements', 'invalid', 'pending_check')
- `payment_expiration` (TIMESTAMP)
- `requirements_status` (JSONB) - Requirements status object

## Components

### Pages
- `Registration.tsx` - Updated with existing VAI checkbox and input field
- `VerifyOTP.tsx` - Updated to handle existing VAI flow
- `VAICallback.tsx` - Updated to handle existing VAI linking

### Edge Functions
- `check-vai-requirements/index.ts` - Calls ChainPass API to check VAI status

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Function**:
   ```bash
   supabase functions deploy check-vai-requirements
   ```

3. **Environment Variables**:
   ```env
   CHAINPASS_API_URL=https://api.chainpass.com
   CHAINPASS_API_KEY=your_chainpass_api_key
   ```

4. **ChainPass Configuration**:
   - Ensure ChainPass API endpoint `/check-vai-requirements` is available
   - Endpoint should accept: `{ vai_number: string }`
   - Endpoint should return:
     ```json
     {
       "status": "fully_qualified" | "missing_requirements" | "invalid",
       "fully_qualified": boolean,
       "missing_requirements": string[],
       "payment_expiration": "ISO_DATE_STRING",
       "requirements_status": {
         "le_disclosure": boolean,
         "signature": boolean,
         "payment": boolean,
         "kyc": boolean
       }
     }
     ```

## User Flow

### Scenario 1: Fully Qualified VAI
1. User checks "I have a VAI number"
2. Enters VAI number
3. Submits registration
4. System calls ChainPass API
5. Response: `status: "fully_qualified"`
6. User verifies email (OTP)
7. System links existing VAI to account
8. User redirected to profile setup (skips ChainPass)

### Scenario 2: Missing Requirements
1. User checks "I have a VAI number"
2. Enters VAI number
3. Submits registration
4. System calls ChainPass API
5. Response: `status: "missing_requirements"`, `missing_requirements: ["le_disclosure", "signature"]`
6. User redirected to ChainPass completion page:
   - URL: `https://chainpass.com/complete-requirements?session_id={session_id}&vai={vai_number}`
   - Only shows LE disclosure + signature steps
7. User completes requirements
8. Returns to Vairify callback
9. System links VAI and continues to profile

### Scenario 3: Invalid VAI
1. User checks "I have a VAI number"
2. Enters VAI number
3. Submits registration
4. System calls ChainPass API
5. Response: `status: "invalid"`
6. User proceeds with normal new VAI creation flow
7. Redirected to full ChainPass VAI creation

## API Integration

### ChainPass Endpoint: `/check-vai-requirements`

**Request:**
```json
{
  "vai_number": "ABC1234"
}
```

**Response (Fully Qualified):**
```json
{
  "status": "fully_qualified",
  "fully_qualified": true,
  "missing_requirements": [],
  "payment_expiration": "2026-12-31T23:59:59Z",
  "requirements_status": {
    "le_disclosure": true,
    "signature": true,
    "payment": true,
    "kyc": true
  }
}
```

**Response (Missing Requirements):**
```json
{
  "status": "missing_requirements",
  "fully_qualified": false,
  "missing_requirements": ["le_disclosure", "signature"],
  "payment_expiration": "2026-12-31T23:59:59Z",
  "requirements_status": {
    "le_disclosure": false,
    "signature": false,
    "payment": true,
    "kyc": true
  }
}
```

**Response (Invalid):**
```json
{
  "status": "invalid",
  "fully_qualified": false,
  "valid": false
}
```

## Session Storage

The following data is stored in `sessionStorage` during the flow:
- `vai_status` - Status from ChainPass
- `existing_vai_number` - User's VAI number
- `signup_session_id` - Session ID for tracking
- `vairify_user` - Form data

## Test Scenarios

### Test 1: Fully Qualified VAI
1. Register with existing VAI checkbox checked
2. Enter valid VAI number
3. Verify ChainPass API called
4. Verify response stored in session
5. Verify email OTP sent
6. Verify VAI linked after OTP verification
7. Verify redirect to profile setup (not ChainPass)

### Test 2: Missing Requirements
1. Register with existing VAI
2. Enter VAI with missing requirements
3. Verify redirect to ChainPass completion URL
4. Verify session_id and vai passed in URL
5. Complete requirements in ChainPass
6. Return to Vairify callback
7. Verify VAI linked and profile setup continues

### Test 3: Invalid VAI
1. Register with existing VAI
2. Enter invalid/non-existent VAI
3. Verify proceeds to normal VAI creation flow
4. Verify redirects to full ChainPass signup

## Security

- VAI numbers validated before API call
- Session data encrypted in database
- API keys stored as environment variables
- Session expiration enforced (30 minutes)
- Invalid VAI numbers don't expose user data

## Future Enhancements

- VAI number format validation per platform
- Support for multiple VAI platforms
- VAI number lookup/verification UI
- Automatic VAI status refresh
- Payment expiration reminders







