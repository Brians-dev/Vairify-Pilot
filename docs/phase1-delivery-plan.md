# Phase 1 Delivery Plan – Identity & VAI-CHECK Core

This breaks down the four Phase‑1 tracks (ChainPass integration, VAI-CHECK backend, manual verification, and verification QA) into clear engineering tasks with owners, dependencies, deliverables, and test criteria.

---

## 1. ChainPass Integration & Session Handling

| Task | Details | Owner | Deliverable |
| --- | --- | --- | --- |
| 1.1 Normalize signup session data flow | Ensure `signup_sessions` captures email, phone, referral, coupon, existing VAI flags, ChainPass response payloads. Add schema comments + cleanup cron. | Backend | Migration + Supabase checklist |
| 1.2 Registration UX updates | `Registration.tsx` + `VerifyOTP.tsx`: enforce phone/email OTP toggle, surface errors from Supabase functions, persist `signup_session_id`. | Web | PR w/ screenshots |
| 1.3 ChainPass redirect resilience | `Success.tsx`, `VAICallback.tsx`: retry logic, state machine for existing vs new VAI, user messaging. Add console logging. | Web | QA checklist |
| 1.4 ChainPass webhook + polling | Review `receive-vai-verification` edge function, ensure `session_id` updates `signup_sessions`. Add status dashboard entry. | Backend | Function diff + docs |
| 1.5 Observability | Configure Supabase log drains / Slack alerts for chainpass failures + OTP failures. | DevOps | Alert rules |

**Testing**
- Manual end-to-end: new user (email OTP → ChainPass) and existing VAI (skip ChainPass)  
- Simulate webhook delay; ensure polling handles timeouts gracefully.

---

## 2. VAI-CHECK Backend Automation

| Task | Details | Owner | Deliverable |
| --- | --- | --- | --- |
| 2.1 Deploy new functions | `verify-face-match`, `create-encounter`, `submit-review` → Supabase deploy with env vars (`LOVABLE_API_KEY`, Twilio keys). | Backend | Deployment notes |
| 2.2 Session lifecycle | Add cron/scheduler function to expire stale `vai_check_sessions`, clean orphaned manual-review states. | Backend | Supabase function + docs |
| 2.3 Encounter integrity | Ensure `create-encounter` updates `encounters` + `vai_check_sessions.encounter_id`, disable duplicates, log errors. | Backend | Unit tests |
| 2.4 Logging & metrics | Add `console.log` traces (session_id, user_id), enable Supabase log automation. Create Grafana/Metabase panel for VAI-CHECK funnel. | DevOps | Dashboard link |
| 2.5 Frontend hook-up | Ensure FE pages call new functions (already wired) – add error states + toasts for failure cases. | Web | QA signoff |

**Testing**
- Mock Lovable AI success/failure responses.  
- Encounter creation: both parties verify → check `encounters` row + DateGuard windows.  
- Submit review: verify mutual-completion guard and VAI numbers stored.

---

## 3. Manual Verification UX & Admin Hooks

| Task | Details | Owner | Deliverable |
| --- | --- | --- | --- |
| 3.1 Manual request flow polish | `ManualVerificationRequestFlow.tsx`: progress indicator, ability to re-try auto scan, audit log confirmation. | Web | Updated UI |
| 3.2 Reviewer inbox | Create page/notification for pending manual reviews (`/vai-check/manual-review/:sessionId`). Integrate push/email (optional for Phase‑1). | Web | Route + QA |
| 3.3 Admin oversight | Update `VAISessionsAdmin.tsx` to filter manual statuses, show audit log, allow force-approve/deny. | Web | Screenshots |
| 3.4 Notifications | Supabase function to email/push reviewer when manual request arrives (use existing mail service). | Backend | Function code |
| 3.5 Documentation | Update runbook describing when to use manual fallback, expected SLA, data retention. | Ops | Confluence/MD page |

**Testing**
- Simulate auto failure → request manual review → reviewer approves → QR unlocks.  
- Rejection path sends toast + blocks session (with descriptive message).  
- Admin view displays session timeline.

---

## 4. Verification QA (Apps / Playwright)

| Task | Details | Owner | Deliverable |
| --- | --- | --- | --- |
| 4.1 Test data harness | Seed Supabase with mock users (provider/client) + ChainPass flags. Provide `.env.test`. | QA | Seed script |
| 4.2 Playwright suites | Cover: new signup, existing VAI skip, provider VAI-CHECK flow, client scan, manual review, encounter creation, review submission. | QA | Playwright tests |
| 4.3 Device/camera mocks | Implement Playwright fixtures to fake camera frames for FaceScanner. | QA | Fixture util |
| 4.4 CI integration | Add `apps/playwright` run to pipeline with Supabase test project. | DevOps | CI config |
| 4.5 Reporting | Publish HTML report + attach to PRs. | QA | Report artifact |

---

## Handoff Checklist
- [ ] Run `supabase db push`, deploy edge functions, update env variables.  
- [ ] Execute Playwright suite; attach report.  
- [ ] Update README / release notes describing new requirements (Lovable API key, Twilio, etc.).  
- [ ] Inform support team about manual verification workflows.  
- [ ] Schedule post‑deploy monitoring for 48h (ChainPass + VAI-CHECK metrics).

Let me know when you’re ready to start execution; I can turn each section into detailed tickets with acceptance criteria.***


