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

### Mock user post API endpoints

The `user-posts` endpoints return deterministic mock responses and do not require MongoDB persistence.

#### `POST /user-posts`

Creates an example user post from `{ userId, title, content }` and returns `201`:

```json
{
  "id": "post-created",
  "userId": "user-9",
  "title": "New post",
  "content": "Created from a request.",
  "createdAt": "2024-02-01T00:00:00.000Z",
  "updatedAt": "2024-02-01T00:00:00.000Z"
}
```

#### `GET /user-posts`

Lists mock posts. Add `?userId=user-1` to filter the list for one user:

```json
[
  {
    "id": "post-1",
    "userId": "user-1",
    "title": "First mock user post",
    "content": "This is an example mocked user post.",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### `GET /user-posts/:id`

Returns one known mock post:

```json
{
  "id": "post-2",
  "userId": "user-2",
  "title": "Second mock user post",
  "content": "Another example mocked user post.",
  "createdAt": "2024-01-02T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

#### `PATCH /user-posts/:id`

Accepts any subset of `{ userId, title, content }` and returns a mocked updated post:

```json
{
  "id": "post-1",
  "userId": "user-1",
  "title": "Updated title",
  "content": "Updated content.",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-02-02T00:00:00.000Z"
}
```

#### `DELETE /user-posts/:id`

Returns a mocked deletion response:

```json
{
  "message": "user post deleted",
  "post": {
    "id": "post-3",
    "userId": "user-1",
    "title": "User one follow-up",
    "content": "A second mocked post for the same user.",
    "createdAt": "2024-01-03T00:00:00.000Z",
    "updatedAt": "2024-01-03T00:00:00.000Z"
  }
}
```

Validation and not-found failures return consistent error responses such as `{ "error": "not found" }`.

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

