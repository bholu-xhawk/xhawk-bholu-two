# FastAPI Hello World API

This is a minimal FastAPI application with a single endpoint and a basic test.

## Setup

- Create a virtual environment (optional but recommended)
- Install dependencies:

```
pip install -r requirements.txt
```

## Run the server

Start the development server with uvicorn:

```
uvicorn app.main:app --reload
```

Visit http://127.0.0.1:8000/ to see the Hello World response.

## Run tests

Execute the test suite with pytest:

```
pytest -q
```

---

## Node.js API with MongoDB (Mongoose)

A separate Node.js Express service is provided under `node_api/` with its own tests and a MongoDB-backed User API.

### MongoDB with docker-compose

- Start a local MongoDB instance using Docker:
  - `docker-compose up -d mongo`
- This exposes MongoDB on `localhost:27017` and persists data in a named volume.

### Environment variables

- Copy `node_api/.env.example` to `.env` and adjust as needed:
  - `cp node_api/.env.example node_api/.env`
- By default the app will use `MONGODB_URI=mongodb://localhost:27017/node_api`.
- If running the API in a container on the same docker network, use `mongodb://mongo:27017/node_api`.

### Install and run the Node API

- Install dependencies:
  - `npm install --prefix node_api`
- Run the server (defaults to port 3000):
  - `npm start --prefix node_api`
- Run in dev mode with hot reload:
  - `npm run dev --prefix node_api`

### Run Node API tests

- The tests use an in-memory MongoDB server and do not require Docker:
  - `npm test --prefix node_api`

### User API endpoints

- `GET /users` — list all users
- `GET /users/:id` — fetch a user by id
- `POST /users` — create a user; body: `{ name, email }`
- `PATCH /users/:id` — update a user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a user

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

---

## Browser end-to-end tests

A Playwright suite lives under `e2e/`. It starts the real local services and covers the current integration points: React route navigation, the client-only Contact form, FastAPI health, and Node/Mongo user CRUD.

### Prerequisites

- Docker is recommended for local runs so the global setup can start MongoDB from `docker-compose.yml`. If Docker Compose is unavailable, the suite falls back to an isolated `mongodb-memory-server` MongoDB process.
- Ports `5173`, `8000`, `3000`, and `27017` must be free.
- Install the Python, frontend, Node API, and E2E dependencies before running the suite:

```
pip install -r requirements.txt
npm install --prefix frontend
npm install --prefix node_api
npm install --prefix e2e
npm run install:browsers --prefix e2e
```

### Run the suite

From the repository root:

```
npm test --prefix e2e
```

Playwright global setup starts MongoDB with `docker compose up -d mongo`, falls back to `docker-compose` if needed, and then falls back to an isolated MongoDB binary when Docker is not available. The Playwright config then starts:

- FastAPI on `http://127.0.0.1:8000` with `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- the Express API on `http://127.0.0.1:3000` with `MONGODB_URI=mongodb://127.0.0.1:27017/node_api_e2e`
- the Vite frontend on `http://127.0.0.1:5173`

If MongoDB is already running, set `E2E_USE_EXISTING_MONGO=1` to skip Docker Compose startup while still waiting for `127.0.0.1:27017` to accept connections.

Useful Playwright modes:

```
npm run test:headed --prefix e2e
npm run test:ui --prefix e2e
```

After a run, open `e2e/playwright-report/index.html` to inspect the HTML report. Traces, screenshots, and videos are retained for failed/retried tests according to `e2e/playwright.config.js`.

On Linux machines where Chromium is installed but required shared libraries or fonts are missing, `npm test --prefix e2e` provisions those runtime files under the ignored `e2e/.browser-deps/` directory instead of writing to system locations.

### CI

`.github/workflows/e2e.yml` runs this suite on pushes and pull requests. GitHub Actions supplies MongoDB as a service container and sets `E2E_USE_EXISTING_MONGO=1`, so the test run does not invoke Docker Compose in CI.

### Adding tests

Add future specs under `e2e/tests/`. Prefer user-facing selectors such as roles, labels, placeholders, and visible text. When the frontend gains backend-backed UI flows, add browser-visible assertions for those flows and reduce direct API-only coverage where appropriate.

