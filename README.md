# Brand Strategy Agency

Next.js 16 App Router foundation for the Brand Strategy Agency operating system.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and provide the project's Supabase publishable key.
3. Run `npm run dev`.

The `/dashboard` route is protected by the Next.js 16 `proxy.ts` session refresh and an independent server-side `getClaims()` check. Sign-in, sign-up, sign-out, and the email confirmation callback use Supabase Auth.

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in Vercel for the environments you use. Only the publishable key belongs in browser-visible configuration; never add a service-role key to client environment variables.

The dashboard supports agency setup, client creation, and strategy project creation. Each project has navigation for the four phases. Discovery & Research supports stakeholder audits, competitor analysis, and audience profiles, with records stored as structured project research.

Database changes are in `supabase/migrations`. They enable row-level security on every tenant table and provide a first-owner bootstrap function. Configure Supabase Auth's site URL as the Vercel production URL and allow `/auth/callback` on that URL plus `http://localhost:3000/auth/callback` for local development.

