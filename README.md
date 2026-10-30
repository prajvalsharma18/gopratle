# GoPratle-Demo

GoPratle connects event hosts with event professionals. This project includes a Next.js landing page and four-step requirement wizard, plus a separate Express API that validates and saves requirement submissions to MongoDB.

## Architecture

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS. The app stays at the repository root.
- **Backend:** Node.js ES modules and Express in `backend/`, with Mongoose for persistence, Zod for request validation, Helmet security headers, and per-IP submission limits.
- **Submission flow:** the wizard adapts category details and preference prompts for planners, performers, and crew. It sends only the selected category's details to `POST /api/requirements`; the API validates the payload independently, saves it, and returns the saved MongoDB ID. The public requirements page displays saved planner, performer, and crew records and supports text and category filtering.

```text
app/                         Next.js pages and global styles
components/                  Landing page and requirement wizard components
lib/requirements-api.ts      Frontend API client
backend/src/config/          Environment and MongoDB connection
backend/src/models/          Mongoose document model
backend/src/validators/      Zod request schemas
backend/src/controllers/     API handlers
backend/src/routes/          Express API routes
backend/src/middleware/      JSON error handling
backend/tests/               API and optional MongoDB integration tests
```

## Deployment status

The app is not deployed yet, so there are no verified public frontend, backend, or GitHub URLs to list. The workspace currently has no Git remote configured. Connect or clone the assignment's GitHub repository before importing it into a hosting provider.

## Production deployment

The intended setup is Vercel for the frontend, Render for the Node API, and MongoDB Atlas. The checked-in [Render Blueprint](render.yaml) configures the backend root directory, production install/start commands, and `/api/health` readiness check. It leaves `MONGODB_URI` and `FRONTEND_ORIGIN` for secure entry in the Render dashboard. Render supports a service `rootDir`, build/start commands, health checks, and prompted `sync: false` values in a Blueprint ([Blueprint specification](https://render.com/docs/blueprint-spec)).

### MongoDB Atlas

1. Create or select an Atlas cluster and the `gopratle` database.
2. Create a dedicated application database user. Grant `readWrite` on the `gopratle` database only; do not use an Atlas project owner or `atlasAdmin` application credential. Atlas supports database users scoped to specific cluster/database privileges ([database user documentation](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)).
3. In Network Access, allow only the backend host's outbound IP ranges where possible. Render shows a service's outbound ranges in its dashboard; default ranges can be shared by services in the same region. Dedicated Render outbound IPs are available on eligible paid plans ([Render outbound IP documentation](https://render.com/docs/outbound-ip-addresses), [dedicated IP documentation](https://render.com/docs/dedicated-ips)).
4. Add the Atlas connection string as `MONGODB_URI` in Render's private environment settings. Never put it in the frontend, a public environment variable, or this repository.
5. Production startup requires `MONGODB_URI` and one or more HTTPS `FRONTEND_ORIGIN` values. The backend uses `MONGODB_DB_NAME` when set, otherwise the database path from `MONGODB_URI`, then `gopratle` if neither specifies a database. Render's proxy hop count defaults to `1`; override `TRUST_PROXY_HOPS` only when the hosting proxy topology differs.
6. If the hosting provider cannot supply egress ranges that Atlas can allowlist, `0.0.0.0/0` permits inbound connections from anywhere. Atlas warns this broadens exposure; use it only if the owner explicitly accepts that risk and has strong unique credentials. Prefer allowlisted ranges or dedicated egress addresses ([Atlas IP access list documentation](https://www.mongodb.com/docs/atlas/security/ip-access-list/)).

### Render backend

1. Connect the GitHub repository to Render and create a Blueprint from `render.yaml` at the repository root.
2. Confirm the service root is `backend/`; the Blueprint uses `npm ci --omit=dev`, `npm start`, and `/api/health`. Render supplies `PORT`; the API reads it at startup and binds its HTTP listener.
3. Enter `MONGODB_URI` and the exact deployed frontend origin in `FRONTEND_ORIGIN` (scheme and host, without a path). Set `NODE_ENV` to `production` as configured in the Blueprint.
4. Add the Render service's outbound CIDR ranges to Atlas Network Access, then wait for `GET /api/health` to return `200` with `database.connected: true`. A `503` means the service is not ready for submissions; Render's HTTP health checks require a 2xx or 3xx response ([health check documentation](https://render.com/docs/health-checks)).

### Vercel frontend

1. Import the GitHub repository into Vercel. Keep the project Root Directory at the repository root (`.`); Next.js is auto-detected and its production build command is `npm run build`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend's public origin only (no `/api` path). The helper strips trailing slashes and a trailing `/api` before appending the endpoint path.
3. Configure the variable for Production and any Preview environments you intend to use. Because `NEXT_PUBLIC_` values are included in the browser build, this variable must contain only the public API origin. Do not add `MONGODB_URI` or database credentials to Vercel.
4. After both public origins are known, set Render's `FRONTEND_ORIGIN` to the exact Vercel origin and redeploy/restart the backend; redeploy the frontend after changing its API URL. Vercel documents Git repository imports, root directory selection, and environment variables in its [Git deployment guide](https://vercel.com/docs/git) and [environment variable guide](https://vercel.com/docs/environment-variables).

No production deployment has been performed from this workspace: it has no GitHub remote, Vercel/Render credentials, or verified production database. Do not mark either hosting service healthy until the database-backed health check returns `200`.

## Prerequisites

- Node.js 22 or 24 (`>=22 <25`), both supported LTS lines for this deployment configuration.
- npm.
- A MongoDB Atlas cluster or another MongoDB server reachable by the backend.

## Configure MongoDB and environment files

1. In MongoDB Atlas, create a database user, allow your development IP in Network Access, and copy the application's connection string. Replace its database name with `gopratle` and keep the credentials private.
2. Create the backend environment file from the example:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

3. Set `MONGODB_URI` in `backend/.env` to the private connection string. `PORT`, `FRONTEND_ORIGIN`, and `NODE_ENV` have development defaults in the example.
4. Create the frontend environment file:

   ```powershell
   Copy-Item .env.example .env.local
   ```

5. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` in `.env.local` for local development. Restart Next.js after changing frontend environment variables.

Both actual environment files are ignored by Git. The checked-in examples contain placeholders only.

| Application | Variable | Purpose |
| --- | --- | --- |
| Backend | `MONGODB_URI` | Required private connection string for the app database. |
| Backend | `MONGODB_DB_NAME` | Optional explicit database name. Defaults to the URI path, then `gopratle` when the URI has no path. |
| Backend | `FRONTEND_ORIGIN` | Exact allowed browser origin; use the deployed Vercel origin in production. |
| Backend | `PORT` | HTTP port; Render supplies it automatically. Locally defaults to `4000`. |
| Backend | `NODE_ENV` | Use `production` on Render. |
| Backend | `TRUST_PROXY_HOPS` | Optional integer. Defaults to `1` in production for Render's proxy and `0` in development; set to match the actual trusted proxy chain. |
| Backend tests | `MONGODB_TEST_URI` | Optional URI for a separate database whose name includes `test`. Never use production data. |
| Frontend | `NEXT_PUBLIC_API_BASE_URL` | Public backend origin only; HTTPS is required in production. Never put database credentials here. |

## Run locally

Install the frontend dependencies once from the repository root:

```powershell
npm install
```

Install the separate backend dependencies:

```powershell
cd backend
npm install
```

Run each app in its own terminal. From the repository root:

```powershell
npm run dev
```

From the `backend/` directory:

```powershell
npm run dev
```

The frontend is available at `http://localhost:3000`; the API defaults to `http://localhost:4000`. The API process starts even if MongoDB is temporarily unreachable, reports that state through its health endpoint, and retries the database connection. Create requests return `503` until MongoDB is ready.

## API

### `GET /api/health`

Returns API and database readiness. It returns `200` when MongoDB is connected and `503` when the API is running but database-dependent requests cannot be served.

### `POST /api/requirements`

Accepts JSON with common event information, exactly one category's details, and shared preferences. It returns `201` only after MongoDB confirms the save.

Example planner request:

```json
{
  "event": {
    "name": "Summer team celebration",
    "type": "Corporate Event",
    "startDate": "2027-05-01",
    "endDate": "2027-05-02",
    "location": "Bengaluru",
    "venue": "The Garden Hall"
  },
  "category": "planner",
  "categoryDetails": {
    "budget": 2500,
    "expectedAttendees": 120,
    "services": ["Venue Coordination", "Catering"]
  },
  "preferences": {
    "budgetFlexibility": "Flexible",
    "style": "Relaxed garden party",
    "additionalRequirements": "Please include an accessible seating area."
  }
}
```

Successful response:

```json
{
  "success": true,
  "message": "Requirement submitted successfully",
  "data": {
    "id": "MongoDB document ID",
    "category": "planner",
    "status": "submitted",
    "createdAt": "2027-01-01T00:00:00.000Z"
  }
}
```

To verify a real save, use the returned `data.id` in MongoDB Atlas Data Explorer. The default Mongoose collection is `requirements` in the database selected by `MONGODB_URI`; filter on `_id` using `ObjectId("<returned-id>")`.

Validation errors return `400` with a safe message and field-level details. Malformed JSON returns `400`; unavailable MongoDB returns `503`. `GET /api/requirements/search` can filter records by `q` and/or `category` (`planner`, `performer`, or `crew`), and returns up to 100 newest matches. This endpoint is public, so do not store private or sensitive information in requirement fields.

## Validation

The backend requires non-empty event name, event type, start date, location, and a supported category (`planner`, `performer`, or `crew`). Dates must be real calendar dates and an end date cannot precede the start. Each category has a strict, separate detail schema; numbers must be JSON numbers within defined bounds, not numeric strings. Optional preferences may be omitted or left empty. Unknown or category-mismatched fields are rejected. Request bodies are limited to 32 KB.

## Checks and tests

From the repository root:

```powershell
npm run lint
npm run typecheck
npm run build
```

Backend validation, route, malformed-body, database-unavailable, and model-save contract tests:

```powershell
cd backend
npm test
```

The MongoDB persistence integration test is skipped unless `MONGODB_TEST_URI` is explicitly set. It requires a separate test database whose name contains `test` (for example `gopratle_test`); it creates and then deletes only its own test document. In PowerShell, set the variable before running tests:

```powershell
$env:MONGODB_TEST_URI = "your_separate_test_database_connection_string"
npm test
```

Never point `MONGODB_TEST_URI` at production data.

The persistence test submits planner, performer, and crew examples with a unique run ID, fetches each saved document by its returned ID, checks its event/category/preferences/status/timestamps, and removes only those three records. The test refuses a database name without a `test` segment. Ordinary route tests use a stub model for response behavior and do not count as persistence verification.

