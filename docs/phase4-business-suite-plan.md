# Phase 4 – Business Suite & Delegation Plan

## Goal
Enable agency/business workflows on Vairify by delivering owner authority controls, delegation, ChainPass-based employee onboarding, and legal/contract infrastructure. This phase assumes Phase 2 (booking/calendar) and Phase 3 (payments) foundations exist, so business availability and billing can hook into these new features.

---

## Workstream A – Owner Authority & Delegation

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| A1 | Supabase schema: `business_roles`, `business_permissions`, `delegation_contracts`, enforce single owner per business. | Backend | Migration + ERD |
| A2 | Business dashboard UI: owner view showing employees, delegated authorities, revocation actions, reason logs. | Web | Screenshots |
| A3 | Delegation wizard: select VAI member, choose granular permissions (“Remove employees”, “Edit profile”, “Toggle Available Now”), capture contract e-signature. | Web | Modal flow |
| A4 | Revocation + audit trail: owner can revoke at any time; log reason; notify delegate. Update RLS policies accordingly. | Backend | Log report |
| A5 | Permission enforcement middleware: wrap business actions (available now toggle, employee removal, profile edits) with permission checks. | Backend/Web | Unit tests |

**Testing:** unit + Playwright tests for delegation flows; manual QA for permission gating.

---

## Workstream B – Multi-Dashboard / Context Switching

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| B1 | “Switch context” component: personal vs business dashboards, remembers last context per device. | Web | Component spec |
| B2 | Route guards: restrict business routes unless in business context + user has owner/delegate permissions. | Web | PR |
| B3 | Shared widgets (Available Now, bookings, DateGuard) must display business-specific data when in business context. | Web | QA notes |

**Testing:** context switcher toggling between personal/business; ensure no data leakage.

---

## Workstream C – ChainPass Employee Onboarding & Composite VAIs

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| C1 | Coupon onboarding flow for employees (ties to Phase 2 calendar when scheduling training). Capture coupon code → validate business association. | Web | Flow mock |
| C2 | ChainPass embed: after coupon redeem, redirect to ChainPass composite-onboarding page (existing API). Handle status poll + success callback. | Web/Backend | Sequence diagram |
| C3 | Dual VAI storage: ensure `workIdentities` array receives `individualVAI`, `compositeVAI`, timestamps, status. Reactivate same composite if rehired. | Backend | Migration + tests |
| C4 | Business dashboard updates: show active/terminated employees, coupon status, ability to retract unused coupons. | Web | Screenshots |

**Testing:** simulate coupon issuance → employee onboarding → termination/rehire.

---

## Workstream D – Legal Contracts & Ownership Transfer

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| D1 | Contract service (e.g., PDF templates + Supabase storage). Support owner delegation contracts, ownership transfer agreements, business TOS. | Backend/Ops | Contract templates |
| D2 | Ownership transfer flow: owner initiates, facial verification, transfer fee (configurable), new owner accepts and signs. Ensure both VAIs updated. | Web/Backend | Flow doc |
| D3 | Business suspension rules: if owner VAI suspended or expired, auto-lock business and notify delegates/employees. | Backend | Cron/trigger |
| D4 | Legal runbooks: document how support/admin can view contracts, reverse transfers, audit changes. | Ops | Runbook |

**Testing:** simulate transfer, check logs, ensure business lock/unlock works.

---

## Workstream E – Admin & Support Tooling

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| E1 | Admin UI to view business accounts, owner status, coupon usage, delegation history. | Web | Admin page |
| E2 | Support actions: force revoke delegation, issue coupons, transfer ownership (with dual approval). | Backend/Web | Admin endpoints |
| E3 | Audit exports: deliver CSV/JSON logs for regulators (ownership changes, delegation events). | Backend | Export script |

---

## Workstream F – QA & Compliance

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| F1 | Expand Playwright suite to cover delegation, context switching, coupon redemption, ownership transfer. | QA | Tests |
| F2 | Security review: ensure RLS/permissions prevent cross-business data access. | Security | Checklist |
| F3 | Documentation updates: provider/agency FAQ, support SOPs. | Ops | Docs |

---

## Dependencies & Notes
1. Requires ChainPass API endpoints for composite VAI onboarding; coordinate with ChainPass team for test credentials.  
2. Payment handling for ownership transfer fees depends on Phase 3 payment infrastructure.  
3. Notification templates (email/SMS) must be reviewed by legal/comms before launch.  
4. Feature flags recommended (`FEATURE_BUSINESS_SUITE`) for staged rollout.  
5. Keep audit logs immutable (use Supabase storage or external logging service).

Once Workstreams A–F are implemented and tested, the Business Suite can go into beta with select agencies for feedback before wide release.


