# Full-stack Todo Application

This repository contains a React/Vite frontend, an Express/Mongoose API, and a small legacy FastAPI sample. The todo application uses the Node.js service and MongoDB stack; the Python/FastAPI files remain as sample functionality and are not the todo backend.

## Architecture

- `frontend/` — React app built with Vite. The root route renders the todo screen from `frontend/src/pages/Todos.jsx`; the original portfolio home remains available at `/portfolio` with the other portfolio routes unchanged.
- `frontend/src/api/todos.js` — the single browser fetch boundary for todo CRUD. It uses relative `/api/todos` URLs so the Vite development proxy can forward requests to Express.
- `node_api/` — Express API backed by Mongoose. It preserves the existing `/users` sample API and mounts todo persistence at `/api/todos`.
- `docker-compose.yml` — local MongoDB service exposed on `localhost:27017` with a persistent named volume.

Todos are shared and unauthenticated because this repository does not include an authentication or ownership model.

## Todo schema

`node_api/src/models/Todo.js` stores each todo with:

- `title` — required string, trimmed, and rejected when blank.
- `completed` — boolean, defaults to `false`.
- `dueDate` — optional deadline stored as a Mongo/Mongoose `Date`. API writes accept only date-only `YYYY-MM-DD` strings and normalize them to UTC midnight; older records may omit the field, and updates may set it to `null` to clear the deadline.
- `createdAt` and `updatedAt` — automatic Mongoose timestamps.

## Todo API contract

All errors return JSON in the shape `{ "error": "message" }`.

- `GET /api/todos` — list todos newest first.
- `POST /api/todos` — create a todo with body `{ "title": "Task", "completed": false, "dueDate": "2026-11-06" }`; `completed` and `dueDate` are optional.
- `PATCH /api/todos/:id` — update any mutable field with `{ "title": "New task" }`, `{ "completed": true }`, `{ "dueDate": "2026-12-25" }`, or a combined payload.
- `PATCH /api/todos/:id` with `{ "dueDate": null }` — explicitly clear a deadline.
- `DELETE /api/todos/:id` — delete a todo and return `204`.

Valid due dates round-trip in JSON as normalized ISO timestamps such as `"2026-11-06T00:00:00.000Z"`. Invalid Mongo IDs return `400`, blank or wrongly typed fields return `400`, malformed or impossible due dates return `400`, and valid IDs that do not match a record return `404`.

## Deadline behavior in the frontend

The todo screen includes date inputs for creating and editing deadlines. An incomplete todo is overdue only when its normalized `YYYY-MM-DD` due day is before the browser's current calendar day; due-today, future, completed, undated, and legacy records are not overdue.

Overdue todos receive contrast-safe red row treatment and a visible `Overdue` badge so the status does not rely on color alone. The `Show overdue only` checkbox filters the already-loaded collection on the client using the same overdue predicate as row styling; when the filter has no matches, the page shows a dedicated no-overdue message instead of the empty-list message.

## Local setup

Install JavaScript dependencies for both workspaces:

```bash
npm install --prefix node_api
npm install --prefix frontend
```

Start MongoDB:

```bash
docker-compose up -d mongo
```

Configure the Node API if needed:

```bash
cp node_api/.env.example node_api/.env
```

By default the Node API uses `MONGODB_URI=mongodb://localhost:27017/node_api` and listens on port `3000`.

Start the API and frontend in separate terminals:

```bash
npm start --prefix node_api
npm run dev --prefix frontend
```

Open the Vite development URL. Browser requests to `/api` are proxied to `http://localhost:3000`.

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

The Node API tests use `mongodb-memory-server`, so they do not require Docker.

## Legacy FastAPI sample

The legacy Python sample still exposes a simple hello-world API and tests.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q
```
