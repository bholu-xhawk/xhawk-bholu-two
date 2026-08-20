# FastAPI Hello World API

This repository contains two small FastAPI services, a React/Vite portfolio frontend, and a separate Express/MongoDB API.

## Python setup

- Create a virtual environment (optional but recommended)
- Install dependencies:

```
pip install -r requirements.txt
```

## Run the FastAPI server

Start the root FastAPI development server with uvicorn:

```
uvicorn app.main:app --reload
```

Visit http://127.0.0.1:8000/ to see the Hello World response. The second FastAPI app exposes `GET /health` from `api.app:app`.

## Run Python tests

Execute the Python test suite with pytest:

```
pytest -q
```

---

## Frontend

The portfolio frontend lives under `frontend/` and uses Vite.

### Install and run the frontend

- Install dependencies:
  - `npm install --prefix frontend`
- Run the development server:
  - `npm run dev --prefix frontend`
- Build the production bundle:
  - `npm run build --prefix frontend`

---

## End-to-end tests

Playwright E2E tests live in `frontend/e2e/` and are launched from the frontend workspace. The suite starts all required services automatically:

| Service | Test port | Playwright startup command |
| --- | --- | --- |
| Vite frontend | `4173` | `npm run dev -- --host 127.0.0.1 --port 4173` |
| FastAPI root app (`app.main:app`) | `8010` | `python -m uvicorn app.main:app --host 127.0.0.1 --port 8010` |
| FastAPI health app (`api.app:app`) | `8011` | `python -m uvicorn api.app:app --host 127.0.0.1 --port 8011` |
| Express API (`node_api/src/index.js`) | `3010` | `node frontend/e2e/support/node-api-memory-server.mjs` |

The Express API is run through `frontend/e2e/support/node-api-memory-server.mjs`. That wrapper starts a disposable `MongoMemoryServer`, passes its URI to the existing Node API process with `MONGODB_URI`, proxies the child logs, and stops both MongoDB and the child process when Playwright exits. The wrapper defaults MongoDB Memory Server to a MongoDB 7.0.14 Ubuntu 22.04 binary so it runs on modern OpenSSL environments. Docker MongoDB is not required for the E2E suite.

### E2E prerequisites

In a fresh checkout, install both JavaScript workspaces and the Playwright browser used by `frontend/playwright.config.js`:

```
npm install --prefix frontend
npm install --prefix node_api
npx --prefix frontend playwright install --with-deps chromium
```

Python dependencies must also be installed so Playwright can start the FastAPI apps with uvicorn.

### Run E2E tests

Headless run:

```
npm run test:e2e --prefix frontend
```

Interactive UI mode for debugging:

```
npm run test:e2e:ui --prefix frontend
```

The E2E suite covers portfolio route navigation, direct URL visits, the Contact form workflow, both FastAPI HTTP endpoints, and the Express User CRUD/error workflow against in-memory MongoDB.

---

## Node.js API with MongoDB (Mongoose)

A separate Node.js Express service is provided under `node_api/` with its own tests and a MongoDB-backed User API.

### MongoDB with docker-compose

- Start a local MongoDB instance using Docker:
  - `docker-compose up -d mongo`
- This exposes MongoDB on `localhost:27017` and persists data in a named volume.
- Docker is only needed for local/manual Node API runs that use a long-lived MongoDB instance; automated Node API tests and Playwright E2E tests use in-memory MongoDB.

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

