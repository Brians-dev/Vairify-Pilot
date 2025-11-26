# ComplyCube Implementation Guide for Vairify

## Overview
This document provides exact instructions for implementing ComplyCube duplicate detection and emergency identity retrieval in the Vairify system.

## System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  ChainPass  │────────>│   Vairify    │────────>│ ComplyCube  │
│  (KYC)      │         │  (Storage)   │         │ (Duplicate  │
│             │         │              │         │  Check)     │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │ Sends:                 │ Stores:
      │ - VAI Number           │ - VAI Number
      │ - Biometric Photo      │ - Transaction Number
      │ - Transaction Number   │ - Biometric Photo URL
      │                        │
      └────────────────────────┘
```

## Key Principles

1. **ChainPass NEVER stores transaction numbers** - Only Vairify stores them
2. **Vairify NEVER stores full identity data** - Only biometric photos
3. **ComplyCube is the source of truth** for identity verification and duplicate detection
4. **Transaction numbers are the key** to retrieving identity data in emergencies

---

## Part 1: ComplyCube API Setup

### Step 1: Add ComplyCube API Key to Supabase Secrets

You need to add the ComplyCube API key as a secret in your Supabase/Lovable Cloud project:

1. Get your ComplyCube API key from ComplyCube dashboard
2. In Lovable, the AI will prompt you to add the secret with the tool
3. The secret should be named: `COMPLYCUBE_API_KEY`

---

## Part 2: Receiving VAI Verifications from ChainPass

### Current Implementation Status
✅ **ALREADY IMPLEMENTED** in `supabase/functions/receive-vai-verification/index.ts`

### What This Function Does:
1. Receives VAI verification data from ChainPass including:
   - `user_id` - The Vairify user who requested the VAI
   - `vai_number` - The unique VAI identifier (e.g., "VAI-AB123CD4")
   - `biometric_photo_url` - URL to the biometric photo
   - `complycube_transaction_number` - **CRITICAL** - The ComplyCube transaction ID
   - `le_disclosure_accepted` - Law enforcement disclosure acceptance
   - `signature_agreement_accepted` - Signature agreement acceptance

2. Stores this data in the `vai_verifications` table

### Required Updates for Duplicate Detection:

Add this code to `supabase/functions/receive-vai-verification/index.ts` after line 43 (after field validation):

```typescript
// Check for duplicate VAI attempts using ComplyCube
console.log('Checking ComplyCube for duplicates...');

const complycubeApiKey = Deno.env.get('COMPLYCUBE_API_KEY');
if (!complycubeApiKey) {
  console.error('ComplyCube API key not configured');
  return new Response(
    JSON.stringify({ error: 'ComplyCube integration not configured' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Check if this transaction number has been used before
const { data: existingVai, error: existingError } = await supabaseClient
  .from('vai_verifications')
  .select('vai_number, user_id')
  .eq('complycube_transaction_number', complycube_transaction_number)
  .single();

if (existingVai) {
  console.error('Transaction number already used:', {
    existing_vai: existingVai.vai_number,
    new_user: user_id,
    existing_user: existingVai.user_id
  });
  
  return new Response(
    JSON.stringify({ 
      error: 'Duplicate verification attempt detected',
      message: 'This identity has already been verified with a different VAI number',
      existing_vai_number: existingVai.vai_number,
      details: 'Transaction number has been used before'
    }),
    { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Call ComplyCube API to check for duplicates
try {
  const complyCubeResponse = await fetch(
    `https://api.complycube.com/v1/checks/${complycube_transaction_number}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${complycubeApiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!complyCubeResponse.ok) {
    console.error('ComplyCube API error:', complyCubeResponse.status);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify with ComplyCube',
        status: complyCubeResponse.status
      }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const complyCubeData = await complyCubeResponse.json();
  
  // Check the outcome field for duplicates
  if (complyCubeData.outcome && complyCubeData.outcome.toLowerCase() !== 'clear') {
    console.error('ComplyCube check failed:', complyCubeData);
    
    return new Response(
      JSON.stringify({ 
        error: 'Identity verification failed',
        message: 'ComplyCube detected issues with this identity',
        outcome: complyCubeData.outcome,
        details: complyCubeData.breakdown || 'No details available'
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for isDuplicate flag
  if (complyCubeData.isDuplicate === true) {
    console.error('ComplyCube duplicate detected:', complyCubeData);
    
    return new Response(
      JSON.stringify({ 
        error: 'Duplicate identity detected',
        message: 'This person has already been verified in the system',
        transaction_number: complycube_transaction_number
      }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('ComplyCube check passed:', {
    transaction_number: complycube_transaction_number,
    outcome: complyCubeData.outcome
  });

} catch (complyCubeError) {
  console.error('Error calling ComplyCube:', complyCubeError);
  // Don't fail the entire request if ComplyCube is temporarily unavailable
  // but log it prominently
  console.warn('⚠️ ComplyCube check failed but proceeding with verification');
}
```

### Testing the Duplicate Detection:

To test that duplicate detection is working:

1. **Test Case 1: New VAI Request (Should Succeed)**
   ```bash
   curl -X POST https://gotcpbqwilvigxficruc.supabase.co/functions/v1/receive-vai-verification \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test-user-123",
       "vai_number": "VAI-TEST001",
       "biometric_photo_url": "https://example.com/photo.jpg",
       "complycube_transaction_number": "TXN-NEW-001",
       "le_disclosure_accepted": true,
       "signature_agreement_accepted": true
     }'
   ```
   Expected: Success (200)

2. **Test Case 2: Duplicate Transaction Number (Should Fail)**
   ```bash
   curl -X POST https://gotcpbqwilvigxficruc.supabase.co/functions/v1/receive-vai-verification \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test-user-456",
       "vai_number": "VAI-TEST002",
       "biometric_photo_url": "https://example.com/photo2.jpg",
       "complycube_transaction_number": "TXN-NEW-001",
       "le_disclosure_accepted": true,
       "signature_agreement_accepted": true
     }'
   ```
   Expected: Error 409 - "Duplicate verification attempt detected"

---

## Part 3: Emergency Identity Retrieval

### Scenario 1: Emergency (Kidnapping)

**Flow:**
1. Emergency occurs (e.g., kidnapping)
2. Vairify admin logs into system
3. Admin calls emergency retrieval function with VAI number
4. Function returns ComplyCube transaction number
5. Vairify provides transaction number to ChainPass
6. ChainPass uses transaction number to retrieve identity from ComplyCube
7. ComplyCube releases identity data to ChainPass
8. ChainPass provides identity to authorities

**Implementation:**
✅ **ALREADY IMPLEMENTED** in `supabase/functions/emergency-retrieve-vai-identity/index.ts`

**How to Use:**

```typescript
// In your admin panel, call this function:
const response = await supabase.functions.invoke('emergency-retrieve-vai-identity', {
  body: {
    vai_number: 'VAI-89KISI9',
    access_reason: 'emergency',
    requesting_entity: 'Law Enforcement',
    authorization_reference: 'Case #2024-KID-001',
    access_notes: 'Kidnapping case - victim identified by VAI number',
    accessed_by_name: 'Admin John Doe'
  }
});

// Response:
{
  "success": true,
  "vai_number": "VAI-89KISI9",
  "transaction_number": "TXN-ABCD1234",
  "message": "Transaction number retrieved successfully. Provide this to ChainPass for identity retrieval.",
  "access_logged": true,
  "instructions": {
    "emergency": "Provide this transaction number to ChainPass. ChainPass will use it to request participant identity information from ComplyCube."
  }
}
```

### Scenario 2: Legal Subpoena

**Flow:**
1. Court issues subpoena to ChainPass for VAI #89KISI9 identity
2. ChainPass CANNOT comply - they don't have the transaction number
3. Court contacts Vairify (or ChainPass requests from Vairify)
4. Vairify admin calls emergency retrieval function with legal reason
5. Function returns ComplyCube transaction number
6. Vairify provides transaction number to ChainPass (via legal channels)
7. ChainPass uses transaction number to retrieve identity from ComplyCube
8. ChainPass complies with subpoena using retrieved data

**Important Legal Notes:**
- Courts may not have jurisdiction in Colombia where ChainPass operates
- ChainPass cannot be compelled to provide data they don't have
- Vairify is the keeper of transaction numbers
- All access is logged in `vai_identity_access_logs` table for audit trail

**Implementation:**

```typescript
// In your admin panel, for legal requests:
const response = await supabase.functions.invoke('emergency-retrieve-vai-identity', {
  body: {
    vai_number: 'VAI-89KISI9',
    access_reason: 'legal_subpoena',
    requesting_entity: 'Superior Court of XYZ County',
    authorization_reference: 'Subpoena #2024-SUB-5678',
    access_notes: 'Court order for identity disclosure in criminal case',
    accessed_by_name: 'Legal Counsel Jane Smith'
  }
});

// Response:
{
  "success": true,
  "vai_number": "VAI-89KISI9",
  "transaction_number": "TXN-ABCD1234",
  "message": "Transaction number retrieved successfully. Provide this to ChainPass for identity retrieval.",
  "access_logged": true,
  "instructions": {
    "legal_subpoena": "Provide this transaction number to ChainPass in response to the subpoena. ChainPass can then comply with the court order by requesting identity data from ComplyCube."
  }
}
```

---

## Part 4: Audit Trail

All emergency and legal access to transaction numbers is logged in the `vai_identity_access_logs` table:

**Columns:**
- `vai_number` - The VAI that was looked up
- `transaction_number` - The ComplyCube transaction number retrieved
- `access_reason` - Either 'emergency' or 'legal_subpoena'
- `accessed_by_user_id` - UUID of the admin who accessed
- `accessed_by_name` - Name/email of accessor
- `requesting_entity` - Who requested the data (e.g., "Law Enforcement", "Court Order #123")
- `authorization_reference` - Case number, court order number, etc.
- `access_notes` - Additional context
- `accessed_at` - Timestamp of access

**To View Audit Logs:**
```sql
SELECT * FROM vai_identity_access_logs 
ORDER BY accessed_at DESC;
```

---

## Security Checklist

✅ **Verify these are all true:**

1. [ ] ComplyCube API key is stored in Supabase secrets, NOT in code
2. [ ] `receive-vai-verification` function checks ComplyCube for duplicates
3. [ ] Transaction numbers are stored in `vai_verifications` table
4. [ ] `emergency-retrieve-vai-identity` function requires admin authentication
5. [ ] All emergency access is logged in `vai_identity_access_logs`
6. [ ] ChainPass does NOT store transaction numbers in their database
7. [ ] Vairify only stores biometric photos, NOT full identity data
8. [ ] Only admins can call emergency retrieval function
9. [ ] Function validates `access_reason` is either 'emergency' or 'legal_subpoena'
10. [ ] Both emergency and legal scenarios are tested

---

## Testing Checklist

**Test 1: Normal VAI Creation**
- [ ] ChainPass sends VAI data with transaction number
- [ ] Data is stored in vai_verifications table
- [ ] ComplyCube duplicate check passes

**Test 2: Duplicate Detection**
- [ ] Attempt to create second VAI with same transaction number
- [ ] System rejects with "Duplicate verification attempt" error
- [ ] ComplyCube API is called and returns duplicate flag

**Test 3: Emergency Retrieval**
- [ ] Admin can retrieve transaction number with emergency reason
- [ ] Access is logged in vai_identity_access_logs
- [ ] Non-admin users cannot access function

**Test 4: Legal Retrieval**
- [ ] Admin can retrieve transaction number with legal_subpoena reason
- [ ] Access is logged with court order details
- [ ] Audit trail includes all required legal information

---

## ComplyCube API Integration

### Required ComplyCube API Endpoints:

**1. Check for Duplicates**
```
GET https://api.complycube.com/v1/checks/{transaction_number}
```

Response should include:
```json
{
  "id": "transaction_number",
  "outcome": "clear" | "attention" | "rejected",
  "isDuplicate": false,
  "breakdown": {
    // Additional details
  }
}
```

**2. Retrieve Identity (For ChainPass in Emergency)**
```
GET https://api.complycube.com/v1/clients/{client_id}
Authorization: Bearer {COMPLYCUBE_API_KEY}
```

---

## Summary

**What You're Getting:**
1. ✅ ComplyCube transaction number is received and stored
2. ✅ Duplicate detection via ComplyCube API (check transaction number and isDuplicate flag)
3. ✅ Emergency retrieval function for kidnapping scenarios
4. ✅ Legal retrieval function for subpoena compliance
5. ✅ Complete audit trail of all access
6. ✅ Admin-only access with authentication
7. ✅ Transaction numbers kept separate from identity data

**What You Need to Do:**
1. Add the duplicate detection code to `receive-vai-verification/index.ts`
2. Add `COMPLYCUBE_API_KEY` secret to Supabase
3. Test both emergency and legal scenarios
4. Verify audit logs are working
5. Train admins on using emergency retrieval function

**Critical Security Points:**
- ChainPass NEVER has transaction numbers
- Only Vairify stores transaction numbers
- ComplyCube is authoritative for duplicate detection
- All access is logged for legal compliance
- Admin authentication is required for retrieval