# Full-stack Todo Demo

This repository contains a small Python FastAPI app, a MongoDB-backed Node/Express API, and a React/Vite frontend. The active Todo feature uses the Express API in `node_api/` and the Vite app in `frontend/`.

## Python FastAPI app

Install dependencies and run the existing smoke tests:

```sh
pip install -r requirements.txt
pytest -q
```

Start the FastAPI development server:

```sh
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/` for the Hello World response.

## Node.js API with MongoDB

The Express API exposes an authenticated Todo REST resource at `/api/todos` and the existing User API at `/users`.

### MongoDB with docker-compose

Start a local MongoDB instance using Docker:

```sh
docker-compose up -d mongo
```

This exposes MongoDB on `localhost:27017` and persists data in a named volume.

### Environment variables

Copy the example environment file and adjust as needed:

```sh
cp node_api/.env.example node_api/.env
```

Defaults:

- `MONGODB_URI=mongodb://localhost:27017/node_api`
- `PORT=3000`
- `CORS_ORIGIN=http://localhost:5173`
- `AUTH_TOKEN_SECRET=replace-me-in-production`

If running the API in a container on the same docker network, use `mongodb://mongo:27017/node_api`.

### Install, run, and test the Node API

```sh
npm install --prefix node_api
npm start --prefix node_api
npm test --prefix node_api
```

Create a user with `POST /users` to receive an `authToken`, then send `Authorization: Bearer <authToken>` with each Todo request. Todo records are scoped to the authenticated user.

Todo endpoints:

- `GET /api/todos` — list the authenticated user's todos
- `POST /api/todos` — create a todo for the authenticated user with `{ "title": "..." }`
- `PATCH /api/todos/:id` — update completion with `{ "completed": true }`
- `DELETE /api/todos/:id` — delete a todo

## React/Vite frontend

Install dependencies and start the web app:

```sh
npm install --prefix frontend
npm run dev --prefix frontend
```

The frontend defaults to `http://localhost:3000/api` for Todo API calls. Override it with `VITE_API_BASE_URL` at build/dev time or `window.__API_BASE_URL__` in tests/local customizations. When calling authenticated Todo endpoints, provide the bearer token with `window.__AUTH_TOKEN__` or store it in `localStorage.authToken`.

Run frontend checks:

```sh
npm test --prefix frontend
npm run build --prefix frontend
```
