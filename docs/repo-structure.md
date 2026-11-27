## Repo Structure

```
vidya-learning-app/
│
├── student/
│   ├── mobile-frontend/          # Expo / React Native student app (Classes 6–10)
│   │   ├── src/
│   │   │   ├── screens/          # Dashboard, Learn, Profile, Notifications, etc.
│   │   │   ├── components/       # UI components
│   │   │   ├── api-client/       # Typed client calling backend REST endpoints
│   │   │   ├── services/         # Auth, curriculum, progress, notifications
│   │   │   ├── store/            # Redux Toolkit slices
│   │   │   └── hooks/            # Reusable hooks
│   │   └── test/                 # Test suites
│   │
│   └── web-frontend/             # Student Web Portal (Vite, React, CSS Modules)
│       ├── src/pages/            # Landing, Login, Dashboard, Courses, Contact, etc.
│       ├── src/components/       # Layouts and shared widgets
│       ├── src/hooks/            # useAuth, useProfile
│       ├── src/services/         # API services, progress cache, support service
│       └── public/               # Logos and static assets
│
├── admin/
│   ├── web-frontend/             # Admin web portal (Vite, React)
│   └── mobile-frontend/          # Admin Expo app
│
├── backend/                      # Unified NestJS v11 + Fastify API & database
│   ├── src/modules/              # Feature modules
│   ├── src/auth/                 # Auth, JWT issuance, roles & guards
│   ├── src/db/                   # PostgreSQL database service
│   ├── db/                       # Migrations and seed data
│   ├── benchmarks/               # k6 load testing suite
│   ├── postman/                  # Postman API collections
│   └── scripts/                  # Local startup and helper scripts
│
├── contact-us/                   # Standalone Complaints & Helpdesk module
│   ├── api/                      # NestJS + Fastify API and Swagger docs
│   ├── mobile/                   # Expo grievance UI
│   ├── db/                       # schema.sql for contact_tickets
│   └── scripts/                  # setup-db.ps1 and helper scripts
│
├── docs/                         # Project documentation
│
└── README.md
```
