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

## Mock CRUD API

The Python FastAPI app also exposes a mock-only CRUD resource at `/mock-items` for frontend development and tests. This data is stored in memory inside the FastAPI process, so it resets whenever the server restarts. It is intentionally separate from the Node.js MongoDB-backed `/users` API documented below.

### Endpoints

- `POST /mock-items` — create a mock item
- `GET /mock-items` — list mock items
- `GET /mock-items/{item_id}` — fetch one mock item
- `PUT /mock-items/{item_id}` — replace one mock item
- `DELETE /mock-items/{item_id}` — delete one mock item

### Example create request

```json
{
  "name": "Draft post",
  "description": "Homepage card",
  "status": "draft"
}
```

Successful `POST /mock-items` response (`201 Created`):

```json
{
  "id": 1,
  "name": "Draft post",
  "description": "Homepage card",
  "status": "draft"
}
```

### Example list response

Successful `GET /mock-items` response:

```json
[
  {
    "id": 1,
    "name": "Draft post",
    "description": "Homepage card",
    "status": "draft"
  }
]
```

### Example read response

Successful `GET /mock-items/1` response:

```json
{
  "id": 1,
  "name": "Draft post",
  "description": "Homepage card",
  "status": "draft"
}
```

### Example update request

```json
{
  "name": "Published post",
  "description": "Homepage card",
  "status": "published"
}
```

Successful `PUT /mock-items/1` response:

```json
{
  "id": 1,
  "name": "Published post",
  "description": "Homepage card",
  "status": "published"
}
```

### Example delete response

Successful `DELETE /mock-items/1` response:

```json
{
  "message": "Mock item deleted",
  "id": 1
}
```

### Example not found response

Unknown or deleted mock items return `404 Not Found`:

```json
{
  "detail": "Mock item not found"
}
```

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

