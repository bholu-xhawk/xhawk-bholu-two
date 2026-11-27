# Full-stack Todo Application

This repository contains a React/Vite frontend, an Express/Mongoose Node API, and a small legacy FastAPI sample. The todo screen is intentionally backed by a deterministic mocked GET endpoint, while MongoDB remains only for the separate `/users` sample API.

## Architecture

- `frontend/` — React app built with Vite. The root route renders the read-only todo screen from `frontend/src/pages/Todos.jsx`; the original portfolio home remains available at `/portfolio` with the other portfolio routes unchanged.
- `frontend/src/api/todos.js` — the browser fetch boundary for todos. It only performs `GET /api/todos` and relies on the Vite development proxy for local API requests.
- `node_api/` — Express API. It mounts the mocked todo endpoint at `/api/todos` and preserves the existing MongoDB-backed `/users` sample API.
- `docker-compose.yml` — local MongoDB service for the users sample. Todos do not connect to MongoDB and do not have a Mongoose model.

## Mocked todo API contract

`GET /api/todos` returns `200` with the same ordered JSON array on every request:

```json
[
  {
    "id": "mock-todo-1",
    "title": "Review the mocked todo endpoint",
    "completed": true
  },
  {
    "id": "mock-todo-2",
    "title": "Render read-only todo rows",
    "completed": false
  },
  {
    "id": "mock-todo-3",
    "title": "Keep the users sample backed by MongoDB",
    "completed": false
  }
]
```

Todo mutation methods are not supported. `POST /api/todos`, `PATCH /api/todos/:id`, and `DELETE /api/todos/:id` are intentionally unrouted and return Express 404 responses.

## Read-only todo UI

The root page loads the mocked todos once, then displays each title with a completed or incomplete status badge. It includes loading, empty, and error states, but no controls for creating, editing, toggling, or deleting todos.

## Local setup

Install JavaScript dependencies for both workspaces:

```bash
npm install --prefix node_api
npm install --prefix frontend
```

Start the Node API and frontend in separate terminals:

```bash
npm start --prefix node_api
npm run dev --prefix frontend
```

Open the Vite development URL. Browser requests to `/api` are proxied to `http://localhost:3000`.

MongoDB is only needed when exercising the users sample API:

```bash
docker-compose up -d mongo
cp node_api/.env.example node_api/.env
```

By default the Node API uses `MONGODB_URI=mongodb://localhost:27017/node_api` for users and listens on port `3000`.

## Build and tests

From the repository root:

```bash
npm run build
npm test
```

Useful focused commands:

```bash
npm test --prefix node_api -- --runInBand test/todos.test.js
npm test --prefix frontend -- --run src/pages/Todos.test.jsx
npm run build --prefix frontend
```

The todo API tests are database-free. The users API tests still use `mongodb-memory-server`, so they do not require Docker.

## Legacy FastAPI sample

The legacy Python sample still exposes a simple hello-world API and tests.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q
```
