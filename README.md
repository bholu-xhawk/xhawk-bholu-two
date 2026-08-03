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

## Playwright end-to-end tests

The browser and cross-service E2E suite is owned by the Vite frontend under `frontend/`. Playwright starts the Vite dev server automatically, drives Chromium through the React routes, and can also call the optional backend services when they are running.

### Install frontend test dependencies

```
npm install --prefix frontend
npm run playwright:install --prefix frontend
```

### Default frontend-only run

No backend services are required for the default run. The API checks probe their configured URLs and are skipped with a clear annotation when a service is not reachable.

```
npm test --prefix frontend
npm run test:e2e --prefix frontend
```

`npm test --prefix frontend` runs the Vite production build first and then the Playwright suite. `npm run test:e2e --prefix frontend` runs only the Playwright suite.

### Full backend E2E preconditions

Start each service in a separate terminal before running the same Playwright command:

```
uvicorn app.main:app --host 127.0.0.1 --port 8000
uvicorn api.app:app --host 127.0.0.1 --port 8001
docker-compose up -d mongo
npm install --prefix node_api
npm start --prefix node_api
```

The Node API requires MongoDB before it can listen. The Playwright config does not start the Node API automatically; it only calls the service when the configured URL is reachable.

### E2E environment variables

`frontend/playwright.config.js` reads these values:

- `PLAYWRIGHT_BASE_URL` — Vite app URL used by browser tests; defaults to `http://127.0.0.1:5173`.
- `VITE_PORT` — port used when Playwright starts Vite; defaults to `5173`.
- `FASTAPI_ROOT_URL` — FastAPI app from `app/main.py`; defaults to `http://127.0.0.1:8000` and expects `GET /` to return `{ "message": "Hello, World!" }`.
- `FASTAPI_HEALTH_URL` — FastAPI app from `api/app.py`; defaults to `http://127.0.0.1:8001` and expects `GET /health` to return `{ "status": "ok" }`.
- `NODE_API_URL` — Express/Mongoose API; defaults to `http://127.0.0.1:3000` and exercises the `/users` create/list/fetch/update/delete flow.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` — optional override for the Chromium executable when a local environment needs to use a specific installed browser.

Example full run with explicit URLs:

```
FASTAPI_ROOT_URL=http://127.0.0.1:8000 \
FASTAPI_HEALTH_URL=http://127.0.0.1:8001 \
NODE_API_URL=http://127.0.0.1:3000 \
npm run test:e2e --prefix frontend
```

