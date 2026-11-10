# MatchTracker 2027.029

Private web build based on the supplied Build 028 project. It adds Supabase email/password sign-in and a per-user cloud save protected by PostgreSQL Row Level Security (RLS).

## Setup

1. Create `.env.local` beside `package.json` using `.env.example` as a template. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the Supabase project settings. The publishable key is intended for browser apps; never use a `secret` or `service_role` key here.
2. Run the SQL in `supabase/migrations/20261110000000_user_app_state.sql` in the Supabase SQL Editor.
3. In Supabase Authentication settings, disable public sign-ups. Invite the owner from Authentication → Users → Add user.
4. Run `npm install`, then `npm run dev` for local testing. Use `npm run build` to make a production build.
5. Add the two same `VITE_` values to the Vercel project environment variables and deploy this project.

The app copies its existing MatchTracker local-storage data to the signed-in user's private database record on first login. Ongoing writes save through the logged-in Supabase session. RLS allows a user to read or change only their own record.

