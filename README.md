# FastAPI Hello World API and Node Books API

This repository contains a small Python FastAPI service and a separate Node.js Express service. The books feature used by the Vite frontend lives in `node_api/` and persists data in MongoDB with Mongoose.

## Python API

### Setup

```sh
pip install -r requirements.txt
```

### Run the server

```sh
uvicorn app.main:app --reload
```

Visit http://127.0.0.1:8000/ to see the FastAPI Hello World response.

### Run tests

```sh
pytest -q
```

## Node.js API with MongoDB (Mongoose)

The Node.js Express service under `node_api/` exposes the Hello World endpoint, the existing users API, and the MongoDB-backed books API consumed by the sibling Vite frontend.

### MongoDB with docker-compose

Start a local MongoDB instance from this repository root:

```sh
docker-compose up -d mongo
```

This exposes MongoDB on `localhost:27017` and persists data in a named volume. You can also provide `MONGODB_URI` for another MongoDB instance.

### Environment variables

Copy `node_api/.env.example` to `.env` and adjust as needed:

```sh
cp node_api/.env.example node_api/.env
```

- `MONGODB_URI` defaults to `mongodb://localhost:27017/node_api`.
- `CORS_ORIGINS` is an optional comma-separated list of browser origins allowed to call this API. It defaults to `http://localhost:5173,http://127.0.0.1:5173` for local Vite development.

### Install and run the Node API

```sh
npm install --prefix node_api
npm start --prefix node_api
```

Visit http://127.0.0.1:3000/ to see the Node Hello World response. You can override the port by setting the `PORT` environment variable.

### Books API endpoints

- `GET /books` — list books as `{ id, name, authors, starred }`; default rows are seeded only when the collection is empty.
- `PATCH /books/:id/starred` — update starred status; body: `{ "starred": boolean }`.

### User API endpoints

- `GET /users` — list all users
- `GET /users/:id` — fetch a user by id
- `POST /users` — create a user; body: `{ name, email }`
- `PATCH /users/:id` — update a user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a user

### Run Node API tests

The tests use an in-memory MongoDB server and do not require Docker:

```sh
npm test --prefix node_api
```

## Running with the sibling Vite frontend

From this repository, start MongoDB and the Node backend:

```sh
docker-compose up -d mongo
npm install --prefix node_api
npm start --prefix node_api
```

From the sibling `xhawk-bholu` repository, start the frontend:

```sh
npm install --prefix apps/web
npm run dev --prefix apps/web
```

The frontend defaults to the Node backend at `http://127.0.0.1:3000`. Set `VITE_BOOKS_API_URL` in the frontend environment only if the backend is running somewhere else.
