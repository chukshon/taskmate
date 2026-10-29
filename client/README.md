# Taskmate client

Next.js frontend with shadcn/ui and Clerk authentication. Application API logic
lives in the separate Express server.

## Run locally

The current checkout has temporary Clerk development keys in the ignored
`.env.local`, created by Clerk CLI. Never commit that file or `.clerk/`.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Signed-out visitors to `/` are redirected to
`/sign-in`. `/sign-in` and `/sign-up` host Clerk's prebuilt screens; the profile
menu provides account management and sign-out. The signed-in home page has a
**Check API connection** button. Start the Express server separately in `server`
on port 3001 before using it.

Set `NEXT_PUBLIC_API_URL` when the API uses a different origin. Set the server's
`CLIENT_ORIGIN` to the frontend's exact origin as well; this controls CORS and
Clerk's allowed token origins. See `.env.example` for the non-secret configuration
and required variable names. The `CLERK_SECRET_KEY` is used only by server-side
Next.js authentication; it must never be exposed through a `NEXT_PUBLIC_` variable.

## Clerk application

Both applications use the same temporary development instance. Express verifies
the session token obtained by `useAuth().getToken()` and sent as a Bearer token;
Next.js does not proxy the application API.

To claim the temporary application later, run from this `client` directory:

```bash
npx -y clerk@latest auth login
```

After claiming or rotating keys, refresh the server's ignored environment file
from this same directory so both apps stay connected to the same application:

```bash
npx -y clerk@latest env pull --file ../server/.env
```

Restart both development servers after changing keys. Do not run `init` separately
in `server`, because that could configure a different application. Temporary
development keys are not production credentials. No billing, user database sync,
or webhooks are configured in this stage.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Adding components

```bash
npx shadcn@latest add button
```
