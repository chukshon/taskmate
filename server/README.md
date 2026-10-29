# Taskmate server

Express + TypeScript API foundation based on Tech With Emma's `nodejs-scaffolding`
skill. Uses ES modules and requires Node.js 22.13 or newer.

From this directory:

```bash
npm install
cp .env.example .env
npm run dev
```

The API defaults to `http://localhost:3001`. Check `GET /health` for
`{"status":"ok","service":"taskmate-server"}`. The frontend runs separately in
`client`; CORS allows `http://localhost:3000` by default. Set `CLIENT_ORIGIN` to
the frontend's exact origin if it changes. CORS controls browser access, not authentication.

## Commands

- `npm run dev`: restart the server when source files change.
- `npm run typecheck`: check application and test types.
- `npm run lint`: lint TypeScript files.
- `npm test`: run HTTP checks against temporary local servers.
- `npm run build`: type-check and bundle application code into `dist` with tsup.
- `npm start`: run the compiled server after building.

## Structure

Imports beginning with `@/` resolve to `server/src`, for example
`import { logger } from "@/utils/logger"`. Use aliases across folders and short
relative imports for neighboring files. TypeScript and the `tsx` development/test
runner read this mapping from `tsconfig.json`; tsup resolves and bundles local
aliases for production, so Node does not need a runtime alias loader. The client's
separate `@/` alias resolves to the `client` root.

- `src/app.ts`: Express app and middleware, separate from the listener for testing.
- `src/index.ts`: HTTP listener and graceful shutdown.
- `src/config`: validated environment settings.
- `src/routes`: HTTP routes, currently only the health endpoint.
- `src/middlewares`: API rate limiting, async handling, JSON errors, and unknown routes.
- `src/utils`: console-only Winston logger and application error classes.
- `src/routes/v1`: future feature routers mounted at `/api/v1`.
- `src/controllers`, `src/services`, `src/types`, `src/validators`: placeholders for future features.
- `test`: HTTP behavior checks.

Clerk session authentication is configured. No database, AI provider, background
worker, billing, or deployment integration is configured. Add feature services
and persistence when those features are introduced.

## Authentication

The API uses the same Clerk development application as the Next.js client.
Its keys are stored in the ignored `server/.env`. For another checkout, populate
the Clerk variables listed in `.env.example`. `CLERK_PUBLISHABLE_KEY` is the
standard server key name; `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is also accepted
because Clerk's accountless env pull preserves the frontend's name. Never use
`NEXT_PUBLIC_` for the secret key.

From `client`, refresh the server's keys without creating another application:

```bash
npx -y clerk@latest env pull --file ../server/.env
```

`GET /api/v1/auth/me` requires a Clerk session token in the Authorization header
(`Bearer <token>`). It returns the verified `userId` and `sessionId` in the normal
success envelope. Missing, invalid, expired, pending, or untrusted-origin sessions
return the standard JSON 401 error. The browser cannot select its user ID.

Clerk middleware reads/verifies sessions on API routes. Apply `requireSession`
before future authenticated controllers; middleware alone does not protect a
route. `/health` and CORS preflights remain public. Browser requests must originate
from `CLIENT_ORIGIN`, which is also the authorized party for Clerk session tokens.

Tests generate independent RSA keys and synthetic session tokens, so they never
need a real user's session or call Clerk to verify signatures.

The health endpoint is not rate-limited. `/api/v1` uses an in-memory limit of
100 requests per 15 minutes per IP. This is a single-process setup; shared
rate-limit storage and proxy settings should be chosen when deployment is configured.

## Request validation

Use `validateRequest` before a controller and read parsed values from
`res.locals.validated`. It validates the configured `body`, `params`, and `query`
sections together with Zod's `parseAsync`, preserving defaults, transformations,
and asynchronous refinements. Original request inputs are not modified.

```ts
import { z } from "zod";
import { validateRequest, type ValidatedHandler } from "@/middlewares/validateRequest.middleware";

const listSchema = {
  query: z.object({ page: z.coerce.number().int().positive().default(1) }),
};

const list: ValidatedHandler<typeof listSchema> = (_req, res) => {
  const { page } = res.locals.validated.query; // number
  res.json({ page });
};

// Add to the appropriate feature router when implementing the feature:
router.get("/items", validateRequest(listSchema), list);
```

Annotate separately declared controllers with `ValidatedHandler<typeof schema>`
to retain parsed output types. Keep validation middleware before the controller;
the type annotation alone does not run validation. The central error handler
returns HTTP 400 with `ERR_VALIDATION` and details such as `query.page`.

## API responses

Response types live in `src/types/api-response.ts`; runtime helpers live in
`src/utils/api-response.ts`.

```ts
import { getSuccessResponse } from "@/utils/api-response";

res.status(201).json(getSuccessResponse(createdItem, "Item created"));
// { success: true, message: "Item created", data: createdItem }
```

Throw application errors from controllers and services. The central error handler
formats errors consistently, using a required, typed `errorCode`:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "ERR_VALIDATION",
  "errors": [{ "field": "query.page", "message": "Page must be positive" }]
}
```

`errors` is omitted when there are no field-level validation details. When a
middleware needs to send an error directly, use
`getErrorResponse({ message, errorCode, errors })`. Keep the appropriate HTTP
status; the response helper only formats the JSON. HTTP 204 responses have no
body, and `/health` retains its small infrastructure response.
