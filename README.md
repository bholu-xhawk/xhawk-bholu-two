# FastAPI Hello World API

This is a minimal FastAPI application with a Hello World endpoint and a simple file-backed Todo service, plus a React frontend.

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

### Todo App (FastAPI)

A simple Todo API is implemented in `app/main.py` with JSON-file persistence.

- Endpoints:
  - `GET /todos` — list todos
  - `POST /todos` — create; body: `{ "title": "Buy milk" }`
  - `PATCH /todos/{id}` — update; body may include `{ "title": "...", "completed": true }`
  - `DELETE /todos/{id}` — delete
- Persistence file path can be changed by setting the `TODO_FILE` environment variable. Default is `app/todos.json`.
- CORS is enabled for `http://localhost:5173` and `http://127.0.0.1:5173` to allow the Vite frontend to call the API.

### Frontend (Vite React)

A Todos page is available at `/todos` when running the Vite dev server.

- Start the dev server:

```
npm run dev --prefix frontend
```

By default, the frontend calls the API at `http://127.0.0.1:8000`.

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

