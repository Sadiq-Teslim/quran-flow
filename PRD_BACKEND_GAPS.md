# QuranFlow PRD Backend Gaps

This file tracks PRD features against the current backend API surface.

- Docs UI: `https://quran-flow.onrender.com/api/docs`
- OpenAPI: `https://quran-flow.onrender.com/api/openapi.json`
- Last checked: 2026-05-11

## Endpoint Groups Already Wired In Frontend

- Auth: signup, login, refresh, logout, 2FA enable/confirm/disable
- Users: current user, profile basics, stats, onboarding status/save/complete
- Quran: chapters, chapter detail, verse by id/reference, search, log reading, today's reading
- Education: modules, module detail, complete module, education progress
- Habits: track, streak, history, consistency score
- Reflections: create, list, by verse, get, update, delete
- Accountability: request partner, partners, accept/end partner, check-ins, respond, check-in history
- Notifications: list, mark read, mark all read, settings
- Personalization: generate plan, recommend content, fallback check-in
- Analytics: overview, retention, weekly consistency, verses read
- Anonymous auth: `POST /api/v1/auth/anonymous`
- Education stages: `GET /api/v1/education/stages`
- Family:
  - `GET /api/v1/family`
  - `POST /api/v1/family`
  - `GET /api/v1/family/{family_id}/dashboard`
  - `GET /api/v1/family/{family_id}/members`
  - `POST /api/v1/family/{family_id}/invite`
- New Muslim: `GET /api/v1/new-muslim/guided-content`
- Quran reading history: `GET /api/v1/quran/reading-history`
- Verse localizations: `GET /api/v1/quran/verses/{verse_id}/localizations`
- Tajweed:
  - `GET /api/v1/tajweed/lessons`
  - `GET /api/v1/tajweed/my-feedback`
  - `POST /api/v1/tajweed/feedback`
- Re-entry: `POST /api/v1/habits/re-entry`
- One-shot personalization: `POST /api/v1/personalization/personalize`

## Newly Discovered Endpoint Status

The newly discovered endpoints from 2026-05-11 have now been wired into frontend services and basic UI surfaces.

Known backend/runtime issue:

- `GET /api/v1/tajweed/lessons` now returns lesson data.
- `GET /api/v1/tajweed/my-feedback` still returned `500 Internal Server Error` during verification with a fresh anonymous token. The Tajweed screen now treats that as an empty feedback list until the backend endpoint is fixed.

## Updated PRD Coverage Notes

### Offline-First System

Still no clear backend support for:

- Offline sync queue
- Batch upload for offline reading logs/reflections/habit events
- Conflict resolution
- Last-sync cursor or versioning

### Family & Children Mode

Now partially covered by family endpoints for groups, invites, members, and dashboard.

Still missing or unclear:

- Dedicated child profile creation/management
- Kids-mode content progression
- Gamified rewards/badges
- Parent controls beyond invite/dashboard
- Family goal update endpoint beyond initial `shared_daily_verse_target`

### New Muslim Experience

Now partially covered by `GET /api/v1/new-muslim/guided-content`.

Still missing or unclear:

- Persisted new-Muslim step progression/checklist
- Confidence/help prompts
- Dedicated simplified content preferences

### Tajweed System

Now partially covered by lessons and feedback endpoints.

Still missing or unclear:

- Raw audio upload endpoint. Current feedback accepts `audio_url`.
- Real recitation assessment pipeline. Current feedback accepts optional score/notes.
- Audio reference/reciter endpoint
- Detailed tajweed rule taxonomy

### YarnGPT Localization Layer

Now partially covered by verse localizations.

Still missing or unclear:

- YarnGPT generation endpoint
- Preferred localization language controls
- Coverage guarantees for Yoruba, Igbo, and Hausa
- Reviewer/source metadata beyond `review_status`

### Anonymous Usage Mode

Now partially covered by `POST /api/v1/auth/anonymous`.

Still missing or unclear:

- Anonymous-to-account migration endpoint
- Toggle anonymous mode for existing accounts

### Re-entry System

Now partially covered by `POST /api/v1/habits/re-entry`.

Still missing or unclear:

- Automatic inactivity trigger visibility/configuration
- Re-entry history endpoint
- Client-safe reason catalog endpoint

### Scholarship & Trust Layer

Partially covered by verse fields like `tafsir_scholar` and localization `review_status`.

Still missing or unclear:

- Source bibliography endpoint
- Scholar reviewer metadata endpoint
- Content verification status endpoint across all content types
- Audit/version history for educational or tafsir content

### Community Safety

Still no clear backend support for:

- Report user/content endpoint
- Moderation queue endpoint
- Block/mute user endpoint
- Community safety status/policy endpoint

### Notification Delivery Infrastructure

Partially covered by notification list/read/settings.

Still missing or unclear:

- Device push token registration
- Notification preference granularity by type
- Schedule preview endpoint
- Missed-session trigger configuration endpoint

### Social System Beyond Partner Matching

Partially covered by accountability partner/check-in endpoints.

Still missing or unclear:

- Full matching preferences
- Gender/privacy controls for matching
- Partner discovery/match suggestions
- Community/group endpoints
- Shared reflection or social feed endpoints

### Gamification / Identity Formation

Still no clear backend support for:

- Identity milestones
- Badges/rewards
- Achievement history
- Reinforcement events

## Backend Data Gaps Observed

- `GET /api/v1/education/modules` previously returned an empty array during integration testing, so the frontend still falls back to local learning fixtures when modules are not seeded.
- Several protected endpoints require an authenticated backend account before they can be fully exercised from the UI.

## Recommended Next Build Order

1. Fix `GET /api/v1/tajweed/my-feedback`.
2. Seed education modules and verify personalization recommendations return useful data.
3. Add offline batch sync for reading logs, reflections, and habit tracking.
4. Add push token registration and richer notification preferences.
5. Add child profile/kids-mode progression endpoints.
6. Add Tajweed audio upload and assessment endpoints.
7. Add localized explanation/YarnGPT generation with verified-source metadata.
