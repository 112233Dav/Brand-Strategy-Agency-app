# Brand Strategy Agency

Next.js 16 App Router starter for the Brand Strategy Agency operating system.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase publishable key.
3. Run `npm run dev`.

The `/dashboard` route is protected by the Next.js 16 `proxy.ts` session refresh and an independent server-side `getClaims()` check. Sign-in, sign-up, sign-out, and the email confirmation callback use Supabase Auth.

Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in Vercel for the environments you use. Only the publishable key belongs in browser-visible configuration; never add a service-role key to client environment variables.

The dashboard shows the four strategy phases from *Brand Strategy 001*. The first detailed workspace to implement is Discovery & Research.
