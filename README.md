# Todo App

This repository contains a small full-stack Todo app. The primary app is a React/Vite frontend backed by a Node.js Express API that persists todos in MongoDB with Mongoose.

There are also minimal Python FastAPI hello-world examples in `app/` and `api/`; they are not the Todo API.

## Services

- `frontend/` — React/Vite Todo UI.
- `node_api/` — Express API with MongoDB-backed `users` and `todos` routes.
- `docker-compose.yml` — local MongoDB service for development.

## Run MongoDB

Start the local MongoDB service:

```bash
docker-compose up -d mongo
```

MongoDB is exposed on `localhost:27017` and persisted in the `mongo-data` volume.

## Run the Node API

Install dependencies:

```bash
npm install --prefix node_api
```

Copy the example environment file if you want to customize the database URI:

```bash
cp node_api/.env.example node_api/.env
```

By default the API uses:

```bash
MONGODB_URI=mongodb://localhost:27017/node_api
```

Start the API on port `3000`:

```bash
npm start --prefix node_api
```

For hot reload during development:

```bash
npm run dev --prefix node_api
```

Visit `http://localhost:3000/` for the health-style hello response.

## Todo API endpoints

All Todo endpoints are served by the Node API under `http://localhost:3000`.

- `GET /todos` — list todos newest first.
- `GET /todos/:id` — fetch a todo by MongoDB ObjectId.
- `POST /todos` — create a todo; body: `{ "title": "Buy milk", "description": "Optional details" }`.
- `PATCH /todos/:id` — partially update a todo; body may include `{ "title", "description", "completed" }`.
- `DELETE /todos/:id` — delete a todo.

Todo JSON includes `_id`, `title`, `description`, `completed`, `createdAt`, and `updatedAt`.

The existing User API remains available at `/users`.

## Run the frontend

Install dependencies:

```bash
npm install --prefix frontend
```

Optionally configure the API base URL for the browser app:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

If `VITE_API_BASE_URL` is not set, the frontend defaults to `http://localhost:3000`.

Start the Vite dev server:

```bash
npm run dev --prefix frontend
```

Open the Vite URL in your browser, then create, edit, complete, delete, and refresh todos to confirm the UI reflects persisted backend state.

## Tests and checks

Run the Todo API integration tests with an in-memory MongoDB server:

```bash
npm test --prefix node_api -- --runTestsByPath test/todos.test.js
```

Run all Node API tests:

```bash
npm test --prefix node_api
```

Build the frontend:

```bash
npm run build --prefix frontend
```

Optional syntax checks for the new backend files:

```bash
node --check node_api/src/app.js
node --check node_api/src/models/Todo.js
node --check node_api/src/routes/todos.js
```

## Python hello-world examples

The minimal FastAPI examples can still be run independently:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
pytest -q
```

They are retained as examples only; use the Node API for Todo functionality.

