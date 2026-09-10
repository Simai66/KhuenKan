# Deployment status

Production URL: https://friend-debt-tracker.vercel.app

Vercel project: friend-debt-tracker (`prj_FxXYkwZdspJq2MLUJvCTaLHcVNmy`)
Supabase project: friend-debt-tracker (`teruzmbuiufdjajaatik`), Singapore, Free

All three SQL migrations have been applied. RLS is enabled on all seven public app tables. The private slip bucket is limited to 3 MB. Cron job friend-debt-reminders is active, scheduled every 15 minutes. Calling the reminder function succeeded with zero notifications on the empty database.

Vercel production builds passed. Public /login responds HTTP 200; unauthenticated /dashboard resolves to the login screen. Runtime error lookup returned no errors at verification time.

## Remaining setup

Supabase Authentication > URL Configuration must be set by the project owner because the connected tool does not expose Auth configuration updates:

Site URL: https://friend-debt-tracker.vercel.app
Redirect URLs: https://friend-debt-tracker.vercel.app/auth/callback

Email signup/confirmation, signed-in user flows, real Storage upload, and bank QR scanning have not been end-to-end verified. The deployment should not be described as fully tested. No bank verification gateway is connected; recipient confirmation is manual.

Source was deployed directly through the Vercel connector. No GitHub repository has been created or linked. Environment variables were supplied to the deployment; before any future independent redeploy, ensure the four variables from README are configured in Vercel Project Settings, preserving the encryption key. No secret is included in this archive.

## App name

Display name updated to คืนกัน, with the text แชร์บิล ดูยอด คืนเงิน. Existing project IDs and production URL remain the same.
