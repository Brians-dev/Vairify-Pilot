# Splash Page Integration Guide

## API Endpoints

### 1. Reserve a Spot
`POST /functions/v1/reserve-spot`

Request
```json
{
  "full_name": "John Smith",
  "email": "john@example.com",
  "phone": "+15551234567",
  "hear_about_us": "Instagram",
  "role": "provider",
  "tier_reserved": "founding_council"
}
```

Response
```json
{
  "success": true,
  "spot_number": 247,
  "tier": "founding_council",
  "tier_name": "Founding Council",
  "tier_emoji": "🔥",
  "vairify_coupon": "VF-FC-A7K9M2",
  "chainpass_coupon": "CP-FC-B8L0N3",
  "vairify_benefit": "Vairify Premium FREE forever",
  "chainpass_benefit": "ChainPass V.A.I. FREE first year",
  "message": "🔥 You're #247 in Founding Council! Check your email for your exclusive codes."
}
```

### 2. Get Tier Availability
`GET /functions/v1/tier-availability`

Response
```json
{
  "founding_council": { "total": 1000, "remaining": 753 },
  "first_movers": { "total": 2000, "remaining": 2000 },
  "early_access": { "total": 7000, "remaining": 7000 }
}
```

### 3. Validate Coupon
`POST /functions/v1/validate-coupon`

Request
```json
{
  "coupon_code": "VF-FC-A7K9M2"
}
```

Response
```json
{
  "valid": true,
  "type": "vairify_premium",
  "tier": "founding_council",
  "discount_percent": 100,
  "discount_duration": "forever",
  "message": "100% off Vairify Premium (forever)"
}
```

## Form Requirements
- Full name (required)
- Email (required, unique)
- Phone (optional)
- How did you hear about us? (dropdown/text)
- Role selection: provider / client (required)
- Tier selection based on availability counters

## Success Screen
After the API returns success, display:
- Spot number
- Tier name & emoji
- Message from response
- Note that coupons will be emailed and usable during the 24h launch window.

## Notes
- Coupon codes expire 24 hours after launch.
- ChainPass coupons apply to the first-year V.A.I. fee only.
- Store the entire API response if you need to show confirmation later.

