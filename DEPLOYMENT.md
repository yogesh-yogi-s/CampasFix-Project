# CampusFix deployment guide

CampusFix is deployed as two services:

| Service | Host | Root directory | Build command | Start command |
| --- | --- | --- | --- | --- |
| Frontend | Vercel | `client` | `npm run build` | Vercel default |
| Backend API | Render Web Service | `server` | `npm ci` | `npm start` |

## 1. Configure Render (backend)

Open the Render service that serves `https://campasfix-project.onrender.com` and set:

- Root Directory: `server`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Node version: 18 or newer

Add these environment variables in Render. Keep all credentials private and do not add them to Git.

```text
NODE_ENV=production
CLIENT_ORIGIN=https://YOUR-VERCEL-PRODUCTION-DOMAIN.vercel.app
JWT_SECRET=<a-long-random-secret>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

If you use a custom Vercel domain too, list both allowed origins separated by commas:

```text
CLIENT_ORIGIN=https://YOUR-VERCEL-PRODUCTION-DOMAIN.vercel.app,https://www.your-domain.example
```

Do not set `PORT` on Render; the server uses the port Render provides.

After saving, redeploy the Render service and open:

```text
https://campasfix-project.onrender.com/api/health
```

It must return JSON with `"status":"OK"`.

## 2. Configure Vercel (frontend)

In the Vercel project whose Root Directory is `client`, set these Production environment variables:

```text
NEXT_PUBLIC_API_URL=https://campasfix-project.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://campasfix-project.onrender.com
NEXT_PUBLIC_UPLOADS_URL=https://campasfix-project.onrender.com
```

Use the same variables for Preview if you test preview deployments. The `NEXT_PUBLIC_` variables are compiled into the Next.js build, so redeploy Vercel after changing them.

## 3. Verify the full flow

1. In the published site, open DevTools > Network.
2. Register a new user.
3. The request URL must be `https://campasfix-project.onrender.com/api/auth/register`.
4. A successful registration returns `201`; an existing email returns a normal validation response, not a `404`.

The browser error about `startTime` is from a browser extension or injected script. It is separate from the registration failure; test once in an Incognito window with extensions disabled if it remains after the API request succeeds.
