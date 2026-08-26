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

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.


---

## Frontend E2E tests (Playwright)

The Vite portfolio frontend has Playwright smoke tests under `frontend/e2e/`. The tests start the app on `http://127.0.0.1:4174` using `frontend/playwright.config.js` and exercise public navbar routes without requiring API services, Docker, or seeded data.

### Install and run

Install frontend dependencies from the repository root:

```
npm install --prefix frontend
```

Before the first local or CI browser run, install Chromium if it is not already installed:

```
npm --prefix frontend exec playwright install chromium
```

Linux CI images may also need Playwright's system packages installed before Chromium can launch:

```
npm --prefix frontend exec playwright install-deps chromium
```

Run the frontend build and E2E suite:

```
npm run build --prefix frontend
npm run e2e --prefix frontend
```

### Adding tests

Add new Playwright specs as `*.spec.js` files under `frontend/e2e/`. Prefer user-facing selectors such as `page.getByRole(...)` and visible text assertions over CSS selectors so tests describe the behavior a visitor can observe and remain stable as markup changes.
