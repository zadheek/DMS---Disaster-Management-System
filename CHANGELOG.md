# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed — Codebase Audit Round 1
- components/map/LeafletMap.jsx: Guard Leaflet initialization against stale DOM refs and async unmount race that caused Map container not found runtime errors.
- `schemas/alert.schema.js`: Added `"OTHER"` to AlertType enum — was missing, causing all OTHER-type alert submissions to fail Zod validation with 400.
- `app/api/roads/route.js`: Replaced `NextResponse.json()` with `Response.json()` to match response style used by every other API route.
- `app/api/donations/route.js`: Always include `_count: { select: { pledges: true } }` in donation drives response regardless of `includeInactive` flag — previously public-facing drives lacked pledge count.
- `app/api/missing/route.js`: Added `take: 5000` cap to CSV export `findMany` to prevent memory exhaustion on large datasets.
- `app/api/volunteers/route.js`: Added `take: 5000` cap to CSV export `findMany` to prevent memory exhaustion on large datasets.
- `app/api/camps/[id]/checkin/route.js`: Socket `update:campOccupancy` now emits minimal payload `{ id, currentOccupancy, capacity }` instead of full camp object + checkIn record.
- `app/admin/camps/page.js`: Fixed socket handler using `updated.campId` (was undefined) — corrected to `updated.id` to match new minimal payload.
- `app/checkin/page.js`: Removed unused `Suspense` import.

### Added
- `lib/pagination.js`: New shared `parsePagination(searchParams, defaultLimit)` utility — extracts common pagination parsing logic used across 5+ API routes.
- `app/api/chat/messages/route.js`: New public GET endpoint `/api/chat/messages?conversationId=&conversationToken=` — authenticated by conversation token, returns all non-unsent messages. Prevents conversation ID enumeration by returning uniform 401 for both not-found and wrong-token cases.
- `schemas/chat.schema.js`: Added `ChatGetMessagesSchema` for the new messages endpoint.
- `app/chat/page.js`: Admin replies now visible in public chat — page polls server every 5 seconds for new messages and renders admin messages left-aligned (indigo bubble, labelled "Admin") and public messages right-aligned (blue bubble).

### Performance
- `prisma/schema.prisma`: Added 4 missing database indexes:
  - `CampCheckIn.@@index([campId])` — checkin lookups by camp
  - `DonationPledge.@@index([driveId])` — pledge lookups by drive
  - `FlagReport.@@index([targetId, targetType])` — flag lookups by target
  - `FlagReport.@@index([reviewed, createdAt])` — unreviewed flag queue ordering
### Security
- `app/api/missing/route.js` and `app/api/missing/[id]/route.js`: Strip `idNumber`, `reporterName`, `reporterPhone` from `new:missingPerson` and `update:missingPerson` Socket.io events before broadcasting to all clients. Admin room (`to("admin")`) still receives the full record.
- `app/api/camps/[id]/checkin/route.js`: Replaced sequential read-then-write with a Prisma interactive transaction. Capacity check now uses an atomic `updateMany` with `WHERE currentOccupancy < capacity`, eliminating the TOCTOU race that could allow over-capacity check-ins under concurrent requests.
- `docker-compose.yml`: `NEXTAUTH_SECRET` now uses `${NEXTAUTH_SECRET:?...}` bash operator — Docker Compose will refuse to start if the variable is unset or empty. Removed unnecessary `web: service_started` dependency from `db_migrate` (migration only needs the DB healthy, not the web container running).
- `server.js`: `join:admin` `getToken` call now passes an explicit `cookies` object parsed from `socket.handshake.headers.cookie`. Removes reliance on next-auth's internal fallback parsing of the raw handshake object, which differs from a Node `IncomingMessage` shape and can silently fail on some next-auth patch versions.

### UI / UX
- Form Accessibility: Added `id` and `htmlFor` attributes to associate labels with inputs across Alert, Missing Person, Road Alert, and Volunteer forms.
- Missing Persons: Added explicit `aria-label` for search input for screen readers.
- `components/shared/LocationAssist.jsx`: Removed conflicting `aria-labelledby` property on search input, keeping `aria-label`.
- `components/shared/LocationAssist.jsx`: Increased touch targets (>=44px) for search and "Use My Location" buttons to improve mobile accessibility. Added explicit `aria-label` and `aria-labelledby` properties for screen reader accessibility on inputs and buttons.
- `app/alerts/page.js`: Fixed critical bug where `LocationAssist` was not updating the `location` form field after selecting an address.

### Security
- `server.js`: `join:admin` socket event now verifies the caller's NextAuth JWT via `getToken` before joining the admin room. Unauthenticated or non-ADMIN sockets are silently rejected.
- `docker-compose.yml`: Replaced hardcoded `postgres/postgres` DB credentials with required env vars (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) using fail-fast `${VAR:?error}` syntax — Compose refuses to start if any are unset or empty. `DATABASE_URL` in `web` and `db_migrate` services updated to interpolate those vars. Removed host port binding (`5432:5432`) for the `db` service so PostgreSQL is only reachable inside the Docker network, not from the host. Healthcheck `pg_isready` now references `$$POSTGRES_USER` (container-side env var) instead of hardcoded `postgres`.
- `app/api/camps/[id]/checkin/route.js`: GET check-ins list is now ADMIN-only (returns 401 for unauthenticated/public requests).
- `app/api/volunteers/route.js` and `app/api/volunteers/[id]/route.js`: Public GET responses no longer expose `email` or `phone`. ADMIN sessions receive full records.
- `app/api/missing/route.js` and `app/api/missing/[id]/route.js`: Public GET responses no longer expose `idNumber`, `reporterName`, or `reporterPhone`. ADMIN sessions receive full records.
- `docker-compose.yml`: Removed `NEXTAUTH_SECRET` fallback `changeme` from both `web` and `db_migrate` services — a valid secret must now be provided explicitly or the service will reject startup.

### Fixed
- `app/admin/broadcast/page.js`: Fixed duplicate broadcast on publish by removing the local prepend from `handlePublish` and keeping the `broadcast:message` socket handler as the single source of truth.
- `app/api/broadcast/[id]/route.js`: DELETE now permanently removes broadcasts so deleted items do not reappear as inactive after refetch. PUT and DELETE both emit a consistent `broadcasts:updated` payload for cross-page sync.
- `app/admin/page.js`: Admin dashboard now joins the admin socket room and refreshes stats when new public submissions arrive, keeping summary cards aligned with the live feed.

### Changed
- `components/admin/LiveFeed.jsx`: Reworked Live Feed into a real admin intake panel. It now hydrates recent persisted public submissions on load (alerts, missing persons, road alerts, volunteers), labels the panel clearly, and appends realtime `admin:newSubmission` events without duplicates.
- Rewrote `.github/copilot-instructions.md` to match current real project state: replaced old aspirational/incorrect content (wrong branding, stale stack bullets, undocumented limitations) with a 16-section structured onboarding guide covering system concept, runtime architecture, stack-by-layer rationale, folder/feature map, full 12-model data model, complete API route table, request/data flow walkthroughs, real-time event flow, security model, Docker/deployment/seed setup, known limitations, design system, code style, and contributor rules.

### Fixed
- `prisma/schema.prisma`: Added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to fix Prisma client crash on Alpine Linux (OpenSSL 3.x mismatch caused database operations to fail in Docker).
- `Dockerfile`: Added shared base stage from `node:20-alpine` with `openssl` and `libc6-compat` available in both builder and runner stages.
- `app/page.js`: Added Admin Panel link in footer so coordinators can reach `/admin/login` from the public landing page.
- `app/checkin/page.js`: Added missing `Suspense` import — page was crashing during client hydration because `CheckInPage` used `<Suspense>` without importing it from React.
- `components/public/DonateModal.jsx`: Removed `motion-fade-up` class from `<DialogContent>` — conflicted with Radix Dialog's built-in enter/exit CSS animations, causing unreliable open/close behavior.
- `components/shared/Providers.jsx`: Removed `BroadcastBanner` from global Providers — banner was rendering site-wide on all pages.
- `app/page.js`: Added `BroadcastBanner` to home page only — broadcasts now appear on landing page only.
- `app/chat/page.js`: Added phone length validation in Start Conversation form — phone shorter than 7 characters now shows inline error instead of silently failing on first message send.

## [Unreleased - prev]
### Fixed
- Restored app route JSON response helper in custom server.js to resolve 500 errors for API routes like /api/roads and /api/broadcast
- Added missing PWA manifest.json and landing page content at /

## [1.0.0] — 2026-04-26

### Added

#### Foundation
- Next.js 15 App Router (JavaScript), Tailwind CSS dark theme, Plus Jakarta Sans font
- PostgreSQL database with Prisma ORM — 11 models: User, MissingPerson, Alert, RoadAlert, ReliefCamp, CampCheckIn, Volunteer, DonationDrive, FlagReport, AdminLog, Broadcast
- Socket.io real-time communication via custom `server.js`
- NextAuth.js v4 authentication with ADMIN/PUBLIC roles, JWT sessions (8h expiry)
- `@serwist/next` PWA configuration with service worker

#### API Routes (24 endpoints)
- `GET/POST /api/missing` — missing persons list and report submission
- `GET/PUT/DELETE /api/missing/[id]` — single missing person management
- `POST /api/missing/[id]/flag` — public flag submission
- `GET/POST /api/alerts` — disaster alerts list and report submission
- `GET/PUT/DELETE /api/alerts/[id]` — single alert management
- `POST /api/alerts/[id]/flag` — public flag submission
- `GET/POST /api/roads` — road alerts list and report submission
- `GET/PUT/DELETE /api/roads/[id]` — single road alert management
- `POST /api/roads/[id]/flag` — public flag submission
- `GET/POST /api/camps` — relief camps list and creation
- `GET/PUT/DELETE /api/camps/[id]` — single camp management
- `POST /api/camps/[id]/checkin` — QR-based camp check-in
- `GET /api/camps/[id]/qr` — QR code data for camp
- `GET/POST /api/volunteers` — volunteer list and self-registration; `?format=csv` export
- `PUT /api/volunteers/[id]` — update volunteer status
- `GET/POST /api/donations` — donation drives list and creation
- `GET/PUT/DELETE /api/donations/[id]` — single donation drive management
- `GET/POST /api/flags` — flag reports list and creation
- `PUT /api/flags/[id]/review` — admin flag review
- `GET/POST /api/broadcast` — emergency broadcasts
- `PUT/DELETE /api/broadcast/[id]` — broadcast management
- `GET /api/admin/stats` — aggregated dashboard statistics
- `GET /api/admin/logs` — admin audit log with pagination
- `POST /api/upload` — authenticated file upload (image)
- All routes: Zod validation, pagination (`?page=&limit=`, max 100), try/catch, `{ success, data/error }` response envelope

#### Security
- Magic bytes validation on file uploads (server-side MIME check, no extension trust)
- CSV injection sanitization — formula prefix neutralization on all exported fields
- Bounded pagination — max 100 records per request
- HTTP security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Session `user.id` propagation for full audit trail
- Auth check on upload endpoint

#### Business Logic
- Auto-escalation: 3+ alerts of same type within ~500m radius in last 6h → CRITICAL severity + `alert:escalated` Socket.io emit
- Alert expiry: `node-cron` hourly job marks ACTIVE alerts older than 48h as EXPIRED
- Flag threshold: `flagCount >= 3` adds item to admin review queue with visual highlight; no auto-removal
- Camp QR codes: UUID stored in `ReliefCamp.qrCode`, encodes `/checkin?camp={qrCode}`
- Audit logging: every admin action (approve, reject, resolve, delete, deploy, broadcast) writes to `AdminLog` via `logAdminAction()`
- CSV export for volunteers and missing persons lists