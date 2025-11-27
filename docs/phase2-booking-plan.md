# Phase 2 – Booking, Calendar & Vairidate Plan

## Scope Overview
Phase 2 delivers the full mutual-consent booking stack that ties provider availability, client booking (“Vairidate”), and the “Available Now” feature into the VAI-CHECK + DateGuard pipeline. The work is split into five workstreams that can progress in parallel once the shared Supabase schema is in place.

---

## Workstream A – Calendar Engine & Availability Rules

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| A1 | Supabase schema (`calendar_events`, `calendar_rules`, buffers, blackout dates). Include indexes for provider/time queries. | Backend | Migration + ERD |
| A2 | Calendar CRUD API / RPCs (`create_event`, `update_event`, `list_availability`). Enforce buffers and overlapping logic. | Backend | API docs |
| A3 | `CalendarView.tsx` + `CalendarSettings.tsx`: hook into Supabase queries, inline rule editor, buffer UI, timezone support. | Web | Screenshots |
| A4 | Availability validation service – ensures DateGuard + Vairidate requests respect buffers, prevents double booking when VAI-CHECK is active. | Backend | Unit tests |

**Testing:** unit tests for overlap detection; manual QA for timezone edges.

---

## Workstream B – Vairidate Booking Flow

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| B1 | Client booking UI (`VairidateFlow`, `VairidateRequest`): show provider calendar slots, handle time-zone conversions, capture intent message. | Web | PR + recording |
| B2 | Booking pipeline: request → provider accept/decline → auto-create VAI-CHECK session (pending provider verification). | Backend/Web | Sequence diagram |
| B3 | Booking status updates (`calendar_events` + `encounters` linkage). Auto-open DateGuard activation window after acceptance. | Backend | Migration updates |
| B4 | Notifications (email/push) for request, accept, decline, reminders 24h/1h. | Backend/DevOps | Notification templates |

**Testing:** run through client + provider flows, ensure VAI-CHECK auto-launch works.

---

## Workstream C – Available Now Context Selector

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| C1 | Define contexts (e.g., “Screened Only”, “Virtual Only”, “Duo Friendly”). Store in Supabase (`available_now_contexts`). | Backend | Migration + seed |
| C2 | Update `AvailableNow.tsx` + `AvailableNowToggle.tsx` to show context chips, enforce single selection, tie to calendar buffers. | Web | UI screenshot |
| C3 | Auto-expire logic: when booking accepted or VAI-CHECK active, clear Available Now. Add cron check. | Backend | Function log |

**Testing:** toggling contexts, verifying auto-expire when VAI-CHECK completes.

---

## Workstream D – Automations & Reminders

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| D1 | Reminder scheduler (Supabase cron/Edge): sends reminder 24h + 1h before event; reschedules if booking changes. | Backend | Cron config |
| D2 | “No-show / auto-release” job: if no VAI-CHECK contract signed by event start, free slot + notify participants. | Backend | Job spec |
| D3 | DateGuard auto-prompt: when booking accepted, prompt provider to activate DateGuard with pre-filled encounter info. | Web | Modal flow |

**Testing:** simulate bookings across the timeline; inspect notifications/logs.

---

## Workstream E – QA & Release Readiness

| Task | Details | Owner | Deliverable |
|------|---------|-------|-------------|
| E1 | Integrate calendar scenarios into Playwright suite (client request, provider accept, reminders, Available Now). | QA | Test scripts |
| E2 | Load test overlap logic (simulate 500 concurrent booking attempts). | QA/DevOps | k6 report |
| E3 | Documentation updates: provider FAQ, operations runbooks, support troubleshooting. | Ops | Docs |

---

## Dependencies & Notes
1. Phase 1 must be fully deployed to leverage VAI-CHECK encounter creation.  
2. Calendar schema changes should be coordinated with DateGuard team (shared tables).  
3. Notification templates rely on existing email/SMS providers; coordinate with marketing for copy.  
4. Feature flags recommended for Vairidate GA (e.g., `FEATURE_VAIRIDATE_BOOKING`).  
5. Ensure Supabase row-level security updated for new tables/endpoints.

Once Workstreams A–D land and QA signs off, Phase 2 can be released incrementally (e.g., soft launch Vairidate with early adopters while finalizing automations).


