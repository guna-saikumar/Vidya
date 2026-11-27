# Vidya End-to-End Test Report & Product Roadmap

Date: 2026-11-27

## Scope

The app was cloned to `C:\Users\hp\OneDrive\Desktop\Vidya` and tested from a clean local
runtime using native PostgreSQL (Docker is not installed on the test machine).

- Main API: `http://127.0.0.1:4000`
- Student web: `http://127.0.0.1:5173`
- Admin web: `http://127.0.0.1:5175`
- Contact Us API: `http://127.0.0.1:4100`
- Student Expo web: `http://127.0.0.1:8081`

Demo accounts used:

- Student: `student@vidya.test` / `StudentDemo1!`
- Admin: `admin@vidya.test` / `AdminDemo1!`

## Static checks

| Command | Result |
|---|---|
| `pnpm typecheck` | 2/2 successful |
| `pnpm lint` | 1/1 successful, 39 warnings / 0 errors |
| `pnpm test` | 2/2 successful, 38 mobile + 42 API tests passing |
| `pnpm build` | 3/3 successful |
| `npm run typecheck --prefix contact-us/api` | clean |
| `npm run typecheck --prefix contact-us/mobile` | clean |
| `npm audit --prefix contact-us/api` | 0 vulnerabilities after pinning Fastify 5.12.8 |
| `npm audit --prefix contact-us/mobile` | 4 moderate advisories remain in the Expo CLI/fingerprint → glob/minimatch chain; a non-breaking fix is not available |
| PowerShell parser check on `contact-us/scripts/setup-db.ps1` | Clean |

## API matrix

63 requests were executed across:

- Student login, refresh, logout, `/me`, settings, profile, avatar, onboarding
- Curriculum, schools, notifications, progress and bookmarks
- Main support complaints
- Admin login, students, classes, subjects, notifications, broadcasting
- PDF upload, list, view, HTTP Range view, and delete
- Contact Us health, config, create, list, status update, validation and auth failures

Representative evidence is available in `vidya_api_matrix.out` from the test workspace.

## UI flows

### Student web

Landing → login → dashboard → curriculum → subject → chapter reader → bookmark →
section completion → notifications → profile → settings → support/contact were all
exercised in a real browser.

A bug was reproduced: the dashboard showed `0%` progress and `0 / 16` completed chapters
even though `GET /api/v1/students/me/progress` returned `overallPercent: 8` and a completed
chapter. Root cause: the web app read only `localStorage` and never hydrated from the API.

### Expo student web

Login → home → Learn → subject list → profile → notifications → Contact Us → grievance
submission all worked. A live ticket was created and returned a real server reference:
`VIDYA-2026-0002`.

### Admin web

Admin login and navigation worked, but the dashboard reproduced a confirmed API failure:
`GET /api/v1/admin/overview` returned HTTP 500 with `{"error":"Internal server error"}`.
There were two root causes: `StudentProfile.grade` is `TEXT`, while the query used
`COALESCE("grade", 0)` (text vs integer); and the recent-materials query selected
non-existent `class_id` / `byte_size` columns from `study_materials`, whose real columns are
`subject_id` and `file_size`. Both are fixed, with `classId` resolved through `Subject`.

### Contact Us

The Contact Us page and the standalone grievance flow were built by the contributor and
are well composed: category chips, pre-filled student metadata, ticket success state,
helpline panel, and “My Requests” history all behave correctly.

One gap remained: the student web page generated a local `TKT-...` number and stored
tickets only in `localStorage`, while the standalone Contact Us API was already available
on port 4100. This PR deliberately **keeps the contributor's UI** and connects it to the
existing API, adds a guarded public tracking endpoint, and refreshes live ticket status.

## Confirmed defects fixed in this PR

1. Admin overview 500 caused by the text/integer grade cast and incorrect `study_materials` column names.
2. Student web progress/bookmarks were cache-only; they now hydrate from the API and keep
   local data only as an offline fallback.
3. Web progress writes sent `sectionId: null`, which the API rejected; optional fields are
   now omitted when absent, and saved server data is merged back into the cache.
4. Web bookmarks were generated locally with fake IDs; they now use server bookmark IDs
   and deduplicate by chapter/section/type.
5. Student web Contact Us tickets were never sent to the backend; they now post to the
   standalone Contact Us API and show real `VIDYA-...` references.
6. Added `GET /api/v1/support/complaints/:ticketRef?email=...` so a student can track a
   ticket without an admin token, while still requiring the submitter's email.
7. `contact-us/scripts/setup-db.ps1` used the `?.` null-conditional operator, which fails
   on Windows PowerShell 5.1. It is now 5.1-compatible.
8. README, architecture, repo-structure, tech-stack, Dockerfile and docker-compose referenced
   old `apps/*`, `packages/*`, `frontend/`, and top-level `mobile-frontend/` paths. These are
   corrected to the current `student/`, `admin/`, `backend/`, and `contact-us/` layout.
9. `contact-us/api` pinned Fastify 5.12.8 to clear 1 high and 1 moderate advisory.

## Recommended features to make the app more competitive

The following are product recommendations, not claims that BYJU'S or any other product
uses this exact Vidya implementation.

### P0 — Learning quality and retention

1. **Adaptive practice and mastery levels.** BYJU'S emphasizes personalization: “Specially
   crafted for every type of learner” and learning at one's own speed. Vidya currently has
   textbook reading plus a small quiz, but no mastery model. Add per-concept skill levels
   (Not started / Familiar / Proficient / Mastered), adaptive question difficulty, and a
   mastery percentage on subject cards. Khan Academy publicly describes this exact
   mastery-based model: https://support.khanacademy.org/hc/en-us/articles/115002552631
2. **Spaced-repetition revision vault.** The current bookmark page is a static list. Add
   flashcards with `Again / Hard / Good / Easy` ratings and automatic review scheduling.
   Quizlet documents this learning-science approach:
   https://quizlet.com/features/spaced-repetition
3. **Instant doubt solving.** Add “Ask a doubt” with photo upload, subject selection, an
   AI-assisted first answer, and escalation to a teacher. Unacademy documents a similar
   photo-based doubt flow:
   https://unacademy.com/helpcenter/category/81000187743/article/81000389909
4. **Learning analytics for teachers/admins.** Add concept-level heatmaps, class mastery,
   time-on-task, and at-risk student alerts. This turns admin from a roster manager into a
   real academic command center.

### P1 — Engagement and habit formation

5. **Daily streak, XP and goal routines.** The landing copy mentions reading habits and
   progress, but the dashboard has no habit loop. Add a daily goal, streak calendar, XP,
   badges, and weekly review. Duolingo's public help center explains its weekly XP
   leaderboards and leagues: https://www.duolingo.com/help/leaderboards-and-league
6. **Optional class leaderboards.** Add consent-based weekly class rankings with privacy
   controls, so schools can run healthy competitions without exposing weak students.
7. **Bilingual explanations and audio read-aloud.** The app supports English/Telugu/Urdu
   mediums but chapter content is mainly static text. Add Telugu/English glossary tooltips,
   pronunciation audio, and read-aloud for accessibility. BYJU'S highlights rich visual
   aids and teacher-style explanation: https://byjus.com/byjus-the-learning-app

### P1 — Content and assessment

8. **Structured question bank and mock tests.** Add chapter-wise, mixed, and timed tests
   with negative marking options, solutions, and performance breakdowns.
9. **Interactive simulations and video lessons.** Add short concept videos, animations,
   and simulations for Science/Maths topics instead of only PDF/text chapters.
10. **Homework and assignment workflow.** Teachers assign a chapter/test with a due date;
    students see a task inbox; admins see submission status. The repo already has a tasks
    concept in the README but no complete workflow.

### P2 — Trust, communication and operations

11. **Parent progress reports.** Weekly email/WhatsApp-style summaries with attendance,
    study time, mastery, and teacher comments. This is a major differentiator for school
    apps in India.
12. **Offline-first PDF and lesson cache.** The web app already has partial local fallback;
    extend it to chapter content with clear “synced” status and conflict handling.
13. **Rich helpdesk SLA.** The contributor-built Contact Us module is a strong foundation.
    Next additions: SLA timers, attachments/screenshots, automated acknowledgement email,
    ticket assignment, and a public status timeline.
14. **Accessibility and performance.** Keyboard navigation, ARIA labels, lower-bandwidth
    image modes, and route-level code splitting. The app is aimed at rural and low-bandwidth
    students, so offline and low-data modes matter as much as visual polish.
15. **Security hardening.** Server-side rate limits on auth, password reset with verified
    school email/phone, refresh-token rotation monitoring, audit logs, and a clear privacy
    policy for student data.

## Suggested delivery order

1. Ship this bug-fix PR and verify fresh-install setup on another machine.
2. Build mastery + adaptive quiz (P0) because it creates real learning value.
3. Build spaced repetition onto the existing Bookmarks page.
4. Add doubt solving and teacher assignment workflows.
5. Add streaks/leaderboards only after learning outcomes are measurable, so gamification
   reinforces mastery instead of page views.
