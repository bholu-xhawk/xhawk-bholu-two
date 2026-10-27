# Full-stack Todo Application

This repository contains a React/Vite todo frontend, a database-free Express TODO API, and a small legacy FastAPI sample. The todo application uses the Node.js service under `node_api/`; the Python/FastAPI files remain sample functionality and are not the todo backend.

## Architecture

- `frontend/` — React app built with Vite. The root route renders the todo screen from `frontend/src/pages/Todos.jsx`; the original portfolio home remains available at `/portfolio` with the other portfolio routes unchanged.
- `frontend/src/api/todos.js` — the browser fetch boundary for todo CRUD. It uses relative `/api/todos` URLs so the Vite development proxy can forward requests to Express.
- `node_api/` — Express API for Patch TODO. It stores records in process memory only and mounts todo CRUD at `/api/todos`.

Todos are shared and unauthenticated because this repository does not include authentication or ownership. There is no MongoDB, Docker, or other database requirement for the Node API.

## Volatile storage contract

`node_api/src/store/todos.js` keeps todos in memory for the lifetime of the running Node process. The store starts empty, records disappear when the API process restarts, and tests reset the store before each case.

Each todo response contains:

- `_id` — opaque server-generated ID string.
- `title` — required trimmed string.
- `completed` — boolean, defaulting to `false`.
- `createdAt` — ISO timestamp set when the todo is created.
- `updatedAt` — ISO timestamp refreshed whenever the todo changes.

List responses are ordered newest-created first. Delete succeeds with `204 No Content`.

## Todo API contract

All error responses are JSON in the shape `{ "error": "message" }`.

| Method and path | Success | Notes |
| --- | --- | --- |
| `GET /` | `200` | Service metadata for Patch TODO. |
| `GET /api/todos` | `200` | List todos newest first. |
| `GET /api/todos/:id` | `200` | Retrieve one todo. |
| `POST /api/todos` | `201` | Create with `{ "title": "Task", "completed": false }`; `completed` is optional. |
| `PATCH /api/todos/:id` | `200` | Update `title`, `completed`, or both. |
| `DELETE /api/todos/:id` | `204` | Delete one todo. |

Malformed JSON, non-object bodies, blank titles, wrong field types, unsupported fields, empty patches, and malformed IDs return `400`. Well-formed IDs that do not match a record return `404`. Unmatched routes also return JSON `404` responses.

## Local setup

Install JavaScript dependencies for both workspaces:

```bash
npm install --prefix node_api
npm install --prefix frontend
```

Start the API and frontend in separate terminals:

```bash
npm start --prefix node_api
npm run dev --prefix frontend
```

The Node API listens on port `3000` by default. Set `PORT` to choose a different port:

```bash
PORT=4000 npm start --prefix node_api
```

Open the Vite development URL. Browser requests to `/api` are proxied to `http://localhost:3000`.

## Runnable API examples

With the API running on port `3000`:

```bash
# Service metadata
curl -s http://localhost:3000/

# List todos
curl -s http://localhost:3000/api/todos

# Create a todo
curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Write README examples"}'

# Retrieve, patch, and delete using an ID returned from create
TODO_ID="paste-created-_id-here"

curl -s http://localhost:3000/api/todos/$TODO_ID

curl -s -X PATCH http://localhost:3000/api/todos/$TODO_ID \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'

curl -i -X DELETE http://localhost:3000/api/todos/$TODO_ID

# Malformed requests return JSON errors
curl -s -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":""}'
```

Restarting `npm start --prefix node_api` restores an empty todo list because storage is process-local.

## Build and tests

From the repository root:

```bash
npm run build
npm test
```

Equivalent workspace commands:

```bash
npm run build --prefix frontend
npm test --prefix node_api -- --runInBand
npm test --prefix frontend -- --run
```

The Node API tests use Jest and Supertest only; they do not start or download a database.

## Legacy FastAPI sample

The legacy Python sample still exposes a simple hello-world API and tests.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q
```
