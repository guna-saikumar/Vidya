## Vidya Architecture

The repository is organized around a shared backend with separate client applications:

```
vidya-learning-app/
│
├── student/
│   ├── mobile-frontend/   # Expo / React Native student app
│   └── web-frontend/      # Student web portal (React, Vite, CSS Modules)
│
├── admin/
│   ├── mobile-frontend/   # Admin Expo app
│   └── web-frontend/      # Admin web portal (React, Vite)
│
├── backend/               # NestJS v11 + Fastify v5 API
│   ├── db/                # PostgreSQL migrations and seeds
│   └── scripts/           # Local startup helpers
│
├── contact-us/            # Standalone Complaints & Helpdesk module
│   ├── api/               # NestJS + Fastify API (`/api/v1/support`)
│   ├── mobile/            # Expo grievance UI
│   └── db/                # `contact_tickets` schema
│
├── docs/
│
└── README.md
```

- **Student clients:** `student/mobile-frontend/` and `student/web-frontend/` consume the main API under `/api/v1`.
- **Admin clients:** `admin/mobile-frontend/` and `admin/web-frontend/` consume admin routes under `/api/v1/admin`.
- **Backend:** `backend/` uses NestJS with `@nestjs/platform-fastify`, Fastify v5, Swagger, JWT auth, Zod validation, raw `pg` SQL, and PostgreSQL.
- **Contact Us:** `contact-us/` is independently installable and uses its own PostgreSQL database/role. The student web portal submits tickets to it via `VITE_CONTACT_API_BASE_URL` (default `http://localhost:4100`).

See `docs/tech-stack.md` for the locked project stack and `docs/repo-structure.md` for the directory details.
