# E2E Test Setup Instructions

## Quick Start

1. **Install Playwright:**
   ```bash
   cd vairify-production-2e0722ea-main
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Run tests:**
   ```bash
   npm run test:e2e
   ```

## Test Files Created

✅ **`playwright.config.ts`** - Playwright configuration
✅ **`e2e/auth.spec.ts`** - Authentication tests
✅ **`e2e/vai-check.spec.ts`** - VAI-CHECK tests
✅ **`e2e/dateguard.spec.ts`** - DateGuard tests
✅ **`e2e/security.spec.ts`** - Security vulnerability tests

## What the Tests Check

### Authentication (`auth.spec.ts`)
- Registration flow
- Login with email/password
- Protected routes require authentication
- Universal OTP vulnerability check

### VAI-CHECK (`vai-check.spec.ts`)
- VAI-CHECK intro page loads
- Provider can start VAI-CHECK
- Face scan screen appears
- QR code generation
- Testing bypass detection

### DateGuard (`dateguard.spec.ts`)
- DateGuard page loads
- Guardian management
- Safety codes setup
- Session activation
- Test emergency mode

### Security (`security.spec.ts`)
- No auth bypasses on login page
- Universal OTP does not work
- Protected pages require auth
- Testing bypasses in VAI-CHECK
- Commented-out auth checks

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### With UI (Recommended for first run)
```bash
npm run test:e2e:ui
```

### In Headed Mode (See browser)
```bash
npm run test:e2e:headed
```

### Specific Test File
```bash
npx playwright test e2e/security.spec.ts
```

### View Report
```bash
npm run test:e2e:report
```

## Expected Results

The tests are designed to:
1. **Establish a baseline** - Show current state of the application
2. **Detect security issues** - Find testing bypasses and vulnerabilities
3. **Verify functionality** - Check that critical flows work
4. **Be resilient** - Won't fail if test accounts don't exist

## Test Results Location

- Screenshots: `test-results/`
- HTML Report: `playwright-report/`

## Next Steps

After running tests:
1. Review the test results
2. Fix any security issues found
3. Re-run tests to verify fixes
4. Add more tests as needed

## Troubleshooting

### Tests fail to start
- Make sure dev server can start: `npm run dev`
- Check port 5173 is available

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running

### Can't find elements
- Tests use flexible selectors
- Check screenshots in `test-results/` to see what page looks like


