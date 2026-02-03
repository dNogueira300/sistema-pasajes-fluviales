# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

River boat ticket sales management system (Sistema de Gestión de Ventas de Pasajes Fluviales) for Alto Impacto Travel in Iquitos, Peru. Full-stack Next.js 16 app with PostgreSQL via Prisma ORM.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate && next build --turbopack
npm start            # Production server (port 3000)
npm run lint         # ESLint with Next.js config
npm run db:seed      # Seed database (tsx prisma/seed.ts)
npx prisma migrate dev   # Run migrations in development
npx prisma studio        # Visual database browser
```

## Environment Variables

Requires `.env` with: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. See `.env.example`.

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript strict + Tailwind CSS 4 + Prisma 6 + PostgreSQL + NextAuth.js (JWT, Credentials provider)

**Path alias:** `@/*` maps to `./src/*`

### Data flow pattern

```
Page/Component → Custom Hook (src/hooks/) → fetch to API Route (src/app/api/) → Server Action (src/lib/actions/) → Prisma → PostgreSQL
```

- **API routes** (`src/app/api/`): REST endpoints, one directory per domain (ventas, clientes, rutas, embarcaciones, etc.)
- **Server actions** (`src/lib/actions/`): Business logic and database queries, called by API routes
- **Custom hooks** (`src/hooks/`): Client-side data fetching and state, one per domain (use-ventas.ts, use-clientes.ts, etc.)
- **Components** (`src/components/`): Organized by domain subdirectory, matching the hooks and API structure

### Authentication & Authorization

- NextAuth.js with JWT strategy, 1-hour session timeout
- Two roles: `ADMINISTRADOR` (full access + dashboard analytics) and `VENDEDOR` (sales and reports only)
- `src/middleware.ts` protects `/dashboard` routes with role-based redirects
- Auth config in `src/lib/auth.ts`

### Database Schema

10 Prisma models in `prisma/schema.prisma`. Key models: `User`, `Cliente`, `Venta`, `Ruta`, `Embarcacion`, `EmbarcacionRuta`, `PuertoEmbarque`, `Anulacion`, `ContadorVentas`, `Configuracion`.

- Sale numbers use `YYMMDD###` format via `ContadorVentas`
- Financial fields use `Decimal` type
- Hybrid payments stored as JSON in `metodosPago` field
- `EmbarcacionRuta` links vessels to routes with schedule arrays (`horasSalida[]`, `diasOperacion[]`)

### Key Business Modules

- **Sales (ventas):** Multi-step form, real-time seat availability, single/hybrid payments, receipt generation (A4 PDF, thermal ticket, JPG)
- **Cancellations (anulaciones):** Requires reason, liberates seats, tracks refunds
- **Reports (reportes):** Filterable by date/route/vessel/vendor, exports to PDF and Excel
- **Dashboard:** Admin-only KPIs, charts (Recharts + Chart.js), sales trends

### Receipt/Document Generation

PDF and image generation runs client-side using jsPDF, pdfmake, and html2canvas. Utilities in `src/lib/utils/` (ticket-utils.ts, comprobante-utils.ts).

## Conventions

- All UI text is in Spanish
- Client components use `"use client"` directive; server components are default
- Form validation: React Hook Form + Zod on client, Zod on server API routes
- No global state library; state managed via hooks and NextAuth session context
- DNI is 8 digits, unique per client; vessel capacity 10-200; route prices S/0-S/1000
