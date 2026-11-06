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
- `dueDate` — nullable date, defaults to `null`. Requests use an exact `YYYY-MM-DD` calendar date; responses return Mongoose's ISO date string, for example `2026-02-14T00:00:00.000Z`.
- `createdAt` and `updatedAt` — automatic Mongoose timestamps.

## Todo API contract

All errors return JSON in the shape `{ "error": "message" }`.

- `GET /api/todos` — list todos newest first.
- `POST /api/todos` — create a todo with body `{ "title": "Task", "completed": false, "dueDate": "2026-02-14" }`; `completed` and `dueDate` are optional.
- `PATCH /api/todos/:id` — update any mutable field with `{ "title": "New task" }`, `{ "completed": true }`, `{ "dueDate": "2026-03-01" }`, or a combination.
- `PATCH /api/todos/:id` with `{ "dueDate": null }` — clear an existing due date.
- `DELETE /api/todos/:id` — delete a todo and return `204`.

Invalid Mongo IDs return `400`, blank or wrongly typed fields return `400`, malformed or impossible `dueDate` values return `400`, and valid IDs that do not match a record return `404`.

## Due dates and overdue filtering

The frontend exposes optional due-date controls on create and edit forms. A todo is overdue only when it is incomplete and its stored date key is earlier than the browser's current local calendar date. Todos remain non-overdue for the entire due day, completed todos are never shown as overdue, and due dates do not change the existing newest-first ordering.

The todo page includes an All/Overdue filter. Filtering is client-side, uses the same overdue rule as the row styling and label, preserves the original list order, and shows a filter-specific empty state when no todos are currently overdue.

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
