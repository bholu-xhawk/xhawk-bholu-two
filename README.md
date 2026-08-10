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

### Book API endpoints

Books have `title`, `author`, and `price` fields. `title` and `author` are required strings, and `price` is a required non-negative number.

- `GET /books?page=1&limit=20` — list books newest first. `page` defaults to `1`; `limit` defaults to `20` and is capped at `100`.
- `POST /books` — create a book; body: `{ "title": "Dune", "author": "Frank Herbert", "price": 9.5 }`
- `PATCH /books/:id` — update a book; body may include `{ title, author, price }`
- `DELETE /books/:id` — delete a book

Paginated list responses use this shape:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0
}
```

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

## React frontend

The Vite/React frontend includes a `/books` page for browsing, adding, editing, deleting, and paging through books 20 at a time.

- Install dependencies: `npm install --prefix frontend`
- Start the dev server: `npm run dev --prefix frontend`
- Build for production: `npm run build --prefix frontend`

The frontend calls the Node API at `http://localhost:3000` by default. Set `VITE_API_BASE_URL` before starting or building the frontend to point at a different API origin:

```
VITE_API_BASE_URL=http://localhost:3000 npm run dev --prefix frontend
```

