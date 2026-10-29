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

No database, authentication, AI provider, background worker, or deployment
integration is configured. Add feature controllers, services, and persistence
when those features are introduced.

The health endpoint is not rate-limited. `/api/v1` uses an in-memory limit of
100 requests per 15 minutes per IP. This is a single-process setup; shared
rate-limit storage and proxy settings should be chosen when deployment is configured.
