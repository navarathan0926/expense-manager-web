# Expense Manager Web — AI Development Guide

Standalone Next.js 16 frontend repository for the Expense Manager API.

The backend (`ExpenseManager.API`) is a **separate repository**. Use `API_DOC.md` from that repo as the source of truth for endpoint contracts.

## Stack

- **Next.js 16.2** (App Router) + **React 19**
- **TypeScript 5**, **Tailwind CSS 4**
- **axios** for HTTP, **lucide-react** for icons
- **react-hook-form** + **zod** available (not yet used everywhere)

> This Next.js version may differ from your training data. Check `node_modules/next/dist/docs/` for current APIs.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, AuthProvider wrapper
│   ├── page.tsx                # Landing (redirects via auth)
│   ├── (auth)/                 # Public: /login, /register
│   └── (dashboard)/            # Protected: /dashboard, /expenses, /categories, /users
├── lib/axios.ts                # API client — use this for all HTTP calls
├── providers/AuthProvider.tsx  # JWT auth, route guards, login/logout
└── types/index.ts              # TypeScript interfaces (keep synced with API DTOs)
```

## API Integration

### Proxy Setup

`next.config.ts` rewrites `/api/v1/*` → `${API_PROXY_TARGET}/api/v1/*`

`.env.local` (not committed):
```
API_PROXY_TARGET=https://localhost:7xxx
```

### Endpoint Paths (singular controller names)

| Feature | Method | Path |
|---------|--------|------|
| Register | POST | `/auth/register` |
| Login | POST | `/auth/login` |
| List expenses | GET | `/expense` |
| Create expense | POST | `/expense` |
| Delete expense | DELETE | `/expense/{id}` |
| List categories | GET | `/category` |
| Monthly summary | GET | `/reports/monthly-summary?year=&month=` |
| Category breakdown | GET | `/reports/category-breakdown?year=&month=` |
| Export CSV | GET | `/export/csv` |
| List users (admin) | GET | `/users` |

### Auth Flow

1. Login/register stores `token` + `user` in `localStorage`
2. `axios` interceptor adds `Authorization: Bearer {token}` header
3. `AuthProvider` redirects unauthenticated users to `/login`
4. Admin nav item shown when `user.role === 'admin'`

## Coding Conventions

### Components

- Interactive pages: `'use client'` directive at file top
- Use `useAuth()` hook for user/token — don't read localStorage directly in pages
- Use existing CSS utility classes from `globals.css`: `.btn`, `.btn-primary`, `.card`, `.input`, `.label`, `.modal-overlay`

### State & Data Fetching

- `useState` + `useEffect` for page-level data (current pattern)
- Fetch with `api.get/post/delete` from `@/lib/axios`
- Handle loading and error states in UI

### Types

Define interfaces in `src/types/index.ts`. Match backend DTO field names (camelCase in JSON).

When the backend API changes, update `src/types/index.ts` to match `API_DOC.md` in the backend repo, then fix consuming pages.

## Do NOT

- Call the backend URL directly — always use `/api/v1` via axios
- Store secrets in source code
- Add Redux or new state libraries without discussion
- Duplicate auth redirect logic outside `AuthProvider`
- Use Pages Router patterns — this is App Router only

## Running

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
npm run lint   # ESLint
```
