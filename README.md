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

## Node.js API with mock User CRUD

A separate Node.js Express service is provided under `node_api/` with its own tests and mock in-memory User CRUD responses for testing and prototyping. The `/users` data is stored in the Node process only, resets when the process restarts, and does not require MongoDB.

### Install and run the Node API

- Install dependencies:
  - `npm install --prefix node_api`
- Run the server (defaults to port 3000):
  - `npm start --prefix node_api`
- Run in dev mode with hot reload:
  - `npm run dev --prefix node_api`

### Run Node API tests

- Run the Jest/Supertest suite:
  - `npm test --prefix node_api`

### User API endpoints

- `GET /users` — list all mock users
- `GET /users/:id` — fetch a mock user by generated string id
- `POST /users` — create a mock user; body: `{ name, email }`
- `PATCH /users/:id` — update a mock user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a mock user

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

