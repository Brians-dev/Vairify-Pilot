# PILOT COMPLETION - 4 REMAINING FEATURES
## Implementation Plan & Status

**Date:** December 2024  
**Goal:** Complete 4 independent, exportable feature modules with demo data

---

## ✅ FEATURE 1: PROFILE WIZARD - Client Role Support

### Status: **COMPLETE** ✅

### What Was Implemented:

**Role Detection:**
- ✅ Automatic role detection from sessionStorage (`vairify_role`)
- ✅ Fallback detection by checking `provider_profiles` table
- ✅ Defaults to 'client' if no provider profile exists

**Client Flow (3 Steps):**
1. ✅ **Language** - Language selection (shared component)
2. ✅ **Personal Info** - Bio + Photo (username NOT required for clients)
3. ✅ **Settings** - Privacy, notifications, profile visibility

**Provider Flow (5 Steps):**
1. ✅ **Language** - Language selection
2. ✅ **Personal Info** - Username (required) + Bio + Photo
3. ✅ **Appearance** - Physical attributes
4. ✅ **Services** - Database-driven services
5. ✅ **Pricing** - Included/Extra toggles

**Components Created:**
- ✅ `src/components/profile/ClientSettingsStep.tsx` - Client-specific settings
- ✅ Updated `src/pages/ProfileWizard.tsx` - Role-based step rendering
- ✅ Updated `src/components/profile/PersonalInfoStep.tsx` - Conditional username requirement

**Database Integration:**
- ✅ Clients save to `profiles` table
- ✅ Providers save to `provider_profiles` table
- ✅ Role-specific field mapping

**Design:**
- ✅ Preserves blue/gray theme
- ✅ Badges showing "Provider Account" vs "Client Account"
- ✅ Dynamic step indicators based on role

### Files Modified:
- `src/pages/ProfileWizard.tsx`
- `src/components/profile/PersonalInfoStep.tsx`
- `src/components/profile/ClientSettingsStep.tsx` (new)

### Export Requirements:
- ✅ Main component: `ProfileWizard.tsx`
- ✅ Step components: `LanguageStep.tsx`, `PersonalInfoStep.tsx`, `AppearanceStep.tsx`, `ServicesStep.tsx`, `PricingStep.tsx`, `ClientSettingsStep.tsx`
- ✅ Database: `service_categories`, `service_options`, `provider_service_pricing`, `profiles` tables
- ⏳ Demo data: Seed files needed
- ⏳ README: Standalone setup instructions needed

---

## ⏳ FEATURE 2: VAI CHECK - Manual Verification Fallback

### Status: **TO IMPLEMENT**

### Requirements:

**Manual Verification Flow:**
- ⏳ When facial recognition fails, show option for "Manual Review"
- ⏳ Owner initiates manual review → sends VAI photo + live selfie to other party
- ⏳ Recipient must be VAI-verified to review
- ⏳ Both parties consent with warnings showing failure reason:
  - System glitch
  - Can't verify (technical issue)
  - Failed check (face mismatch)
- ⏳ Add liability waiver to T&C
- ⏳ Update warning modals with failure details

**Database:**
- ⏳ Create `manual_verifications` table with fields:
  - `id` (UUID, primary key)
  - `session_id` (UUID, foreign key to `vai_check_sessions`)
  - `initiator_user_id` (UUID)
  - `reviewer_user_id` (UUID)
  - `failure_reason` (TEXT: 'system_glitch' | 'cant_verify' | 'failed_check')
  - `vai_photo_url` (TEXT)
  - `live_selfie_url` (TEXT)
  - `initiator_consent` (BOOLEAN)
  - `reviewer_consent` (BOOLEAN)
  - `initiator_consent_at` (TIMESTAMP)
  - `reviewer_consent_at` (TIMESTAMP)
  - `status` (TEXT: 'pending' | 'approved' | 'rejected')
  - `reviewer_decision` (TEXT: 'approved' | 'rejected' | NULL)
  - `reviewer_notes` (TEXT)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

**Audit Trail:**
- ⏳ Create `verification_audit_log` table:
  - `id` (UUID)
  - `verification_id` (UUID, foreign key)
  - `action` (TEXT: 'created' | 'consent_given' | 'reviewed' | 'approved' | 'rejected')
  - `user_id` (UUID)
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMP)

**Components Needed:**
- ⏳ `ManualVerificationRequest.tsx` - Initiate manual review
- ⏳ `ManualVerificationReview.tsx` - Review other party's photos
- ⏳ `ConsentModal.tsx` - Consent with failure reason warning
- ⏳ Update `FaceScanProvider.tsx` / `FaceScanLogin.tsx` - Add manual fallback option
- ⏳ Update `MutualProfileView.tsx` - Show manual verification status

**Edge Functions:**
- ⏳ `initiate-manual-verification` - Create manual verification request
- ⏳ `submit-manual-verification-review` - Submit review decision

**T&C Updates:**
- ⏳ Add liability waiver section for manual verification
- ⏳ Store consent tracking

### Implementation Steps:
1. Create database migration for `manual_verifications` and `verification_audit_log`
2. Create consent modal component with failure reason display
3. Update face verification components to show manual fallback
4. Create manual verification request flow
5. Create manual verification review flow
6. Add audit trail logging
7. Update T&C agreement text

### Export Requirements:
- Components: `ManualVerificationRequest.tsx`, `ManualVerificationReview.tsx`, `ConsentModal.tsx`
- Pages: Updated face scan components
- Database: Migration files + seed data
- Edge Functions: `initiate-manual-verification`, `submit-manual-verification-review`
- README: Standalone setup instructions

---

## ⏳ FEATURE 3: TRUEREVU - Backend Completion

### Status: **TO IMPLEMENT**

### Requirements:

**Fix Review Form Data Binding:**
- ⏳ Remove hardcoded TODOs in `ReviewForm.tsx`
- ⏳ Fix `encounter_id` - pull from actual encounter record
- ⏳ Fix `reviewed_user_id` - pull from encounter (provider/client ID)
- ⏳ Validate user has completed encounter before allowing review
- ⏳ Add mutual verification requirement check

**Encounter Creation:**
- ⏳ Create encounter when VAI Check session completes successfully
- ⏳ Link `vai_check_sessions` to `encounters` table
- ⏳ Set encounter status based on VAI Check result
- ⏳ Create encounter when both parties sign contract

**Review Display UI:**
- ⏳ Create `ReviewDisplay.tsx` component
- ⏳ Show ratings (punctuality, communication, respectfulness, attitude, accuracy)
- ⏳ Display review notes
- ⏳ Show reviewer profile (avatar, username)
- ⏳ Show review timestamp
- ⏳ Display on provider/client profiles
- ⏳ Add review aggregation (average ratings, total reviews)

**Mutual Verification Requirement:**
- ⏳ Check both parties have completed VAI verification
- ⏳ Check both parties have signed encounter agreement
- ⏳ Block review submission until mutual verification complete
- ⏳ Show verification status in review form

**Components Needed:**
- ⏳ `ReviewDisplay.tsx` - Display individual review
- ⏳ `ReviewList.tsx` - List all reviews for a user
- ⏳ `ReviewSummary.tsx` - Aggregated ratings display
- ⏳ Update `ReviewForm.tsx` - Fix data binding + add verification checks
- ⏳ Update `MutualProfileView.tsx` - Create encounter on completion
- ⏳ Update `Complete.tsx` (VAI Check) - Create encounter record

**Database:**
- ⏳ Ensure `encounters` table has correct foreign keys
- ⏳ Add `vai_check_session_id` to `encounters` table
- ⏳ Add `mutual_verification_complete` flag to `encounters`
- ⏳ Add indexes for review queries

**Edge Functions:**
- ⏳ `create-encounter-from-session` - Create encounter when VAI Check completes
- ⏳ `check-mutual-verification` - Verify both parties are verified

### Implementation Steps:
1. Fix `ReviewForm.tsx` data binding (remove TODOs)
2. Create encounter creation logic in VAI Check completion flow
3. Add mutual verification check function
4. Create `ReviewDisplay` component
5. Create `ReviewList` component
6. Create `ReviewSummary` component
7. Update encounter creation to link VAI Check sessions
8. Add review display to profiles

### Export Requirements:
- Components: `ReviewForm.tsx`, `ReviewDisplay.tsx`, `ReviewList.tsx`, `ReviewSummary.tsx`
- Pages: Updated VAI Check completion flow
- Database: Migration for encounter linking
- Edge Functions: `create-encounter-from-session`, `check-mutual-verification`
- README: Standalone setup instructions

---

## ⏳ FEATURE 4: REFERRALS - Email/SMS Sending

### Status: **TO IMPLEMENT**

### Requirements:

**Edge Functions:**
- ⏳ `send-referral-email` - Send email via Resend API
  - Placeholder API keys in `.env` (`RESEND_API_KEY`)
  - Test mode that logs emails instead of sending
  - Template with referral code, signup link, personal message
- ⏳ `send-referral-sms` - Send SMS via Twilio
  - Placeholder API keys in `.env` (reuse Twilio keys)
  - Test mode that logs SMS instead of sending
  - SMS template with referral code and signup link

**Fix Hardcoded VAI Codes:**
- ⏳ Remove hardcoded VAI codes in `InviteSMS.tsx`
- ⏳ Pull user's actual VAI from `vai_verifications` table
- ⏳ Pull referral code from `referral_codes` table
- ⏳ Use dynamic referral link generation

**Contact Picker Integration:**
- ⏳ Add Browser Contact Picker API to `InviteEmail.tsx` and `InviteSMS.tsx`
- ⏳ Fallback for browsers without Contact Picker support
- ⏳ Multi-select contacts
- ⏳ Extract email addresses and phone numbers
- ⏳ Pre-fill invitation form

**Fix Misleading Success Messages:**
- ⏳ Only show success if email/SMS actually sent
- ⏳ Show test mode indicator if in test mode
- ⏳ Show error messages if sending fails
- ⏳ Track invitation status in database

**Update Routing:**
- ⏳ Fix `ReferralEarningsCard.tsx` routing issues
- ⏳ Ensure all referral routes are correct
- ⏳ Add proper error handling

**Components Needed:**
- ⏳ Update `InviteEmail.tsx` - Add contact picker, fix VAI code, fix success messages
- ⏳ Update `InviteSMS.tsx` - Add contact picker, fix VAI code, fix success messages
- ⏳ Update `ReferralEarningsCard.tsx` - Fix routing
- ⏳ Create `ContactPickerButton.tsx` - Reusable contact picker component

**Database:**
- ⏳ Update `referral_invitations` table to track:
  - `sent_at` (TIMESTAMP)
  - `delivery_status` (TEXT: 'pending' | 'sent' | 'failed' | 'test_mode')
  - `delivery_error` (TEXT)
  - `test_mode` (BOOLEAN)

### Implementation Steps:
1. Create `send-referral-email` edge function
2. Create `send-referral-sms` edge function
3. Add contact picker API integration
4. Fix hardcoded VAI codes in invite components
5. Fix success/error message handling
6. Update referral invitation tracking
7. Fix routing in ReferralEarningsCard
8. Add test mode indicators

### Export Requirements:
- Components: `InviteEmail.tsx`, `InviteSMS.tsx`, `ContactPickerButton.tsx`, `ReferralEarningsCard.tsx`
- Edge Functions: `send-referral-email`, `send-referral-sms`
- Database: Updated `referral_invitations` table
- README: Standalone setup instructions with API key setup

---

## 📦 EXPORT STRUCTURE

Each feature should export as standalone module:

```
feature-name/
├── components/
│   └── [feature components]
├── pages/
│   └── [feature pages]
├── supabase/
│   ├── functions/
│   │   └── [edge functions]
│   └── migrations/
│       └── [database migrations]
├── demo/
│   └── [seed data files]
├── README.md
├── package.json
└── .env.example
```

**README Requirements:**
- Feature overview
- Setup instructions
- Database setup
- API key configuration
- Demo data loading
- Running standalone
- Integration with main app (optional)

---

## 🎨 DESIGN REQUIREMENTS

- ✅ Preserve existing blue/gray theme
- ✅ Rounded corners
- ✅ Consistent styling with current components
- ✅ Mobile-responsive
- ✅ Accessibility standards

---

## 🚀 TECH STACK

- React (TypeScript)
- Tailwind CSS
- Supabase (PostgreSQL)
- Supabase Edge Functions (Deno)
- Resend API (Email)
- Twilio API (SMS)
- Browser Contact Picker API

---

## 📋 IMPLEMENTATION PRIORITY

1. ✅ **PROFILE WIZARD** - Complete (client role support)
2. ⏳ **REFERRALS** - Email/SMS sending (blocking feature)
3. ⏳ **TRUEREVU** - Review system completion
4. ⏳ **VAI CHECK** - Manual verification fallback

---

**Last Updated:** December 2024  
**Status:** Profile Wizard Complete ✅ | 3 Features Remaining ⏳







