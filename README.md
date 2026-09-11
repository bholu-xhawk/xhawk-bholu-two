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

## FastAPI mock TODO API

The FastAPI service under `api/` also exposes an in-memory mock TODO API for frontend development while the real backend is unavailable. The existing `GET /health` endpoint remains unchanged and returns `{"status": "ok"}`.

### TODO endpoints

- `POST /todos` — create a TODO; body: `{ "title": "...", "completed": false, "description": "..." }`
- `GET /todos` — list all TODOs
- `GET /todos/{todo_id}` — fetch one TODO by numeric ID
- `PATCH /todos/{todo_id}` — update provided fields; body may include `{ "title", "completed", "description" }`
- `DELETE /todos/{todo_id}` — delete a TODO and return the deleted item

TODO objects include `id`, `title`, `completed`, and `description`. IDs are deterministic within the current process and the store is reset when the process restarts.

### Response envelope

TODO success responses use one consistent JSON envelope:

```json
{"success": true, "data": {}, "error": null}
```

Handled errors, including validation failures and missing TODOs, use the same top-level shape:

```json
{"success": false, "data": null, "error": {"code": "...", "message": "..."}}
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

