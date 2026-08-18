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

---

## Frontend (Vite + React)

The React frontend lives under `frontend/` and uses Vite for local development and production builds.

### Install frontend dependencies

```bash
npm install --prefix frontend
```

### Run the Vite dev server

```bash
npm run dev --prefix frontend
```

The dev server is configured for http://127.0.0.1:5173/ so local development and browser tests use the same host and port.

### Build and preview

```bash
npm run build --prefix frontend
npm run preview --prefix frontend
```

### Run frontend unit/component tests

```bash
npm test --prefix frontend -- --runInBand
```

Jest runs the React route/component tests in `jsdom` with React Testing Library.

### Run frontend E2E tests

Install the Chromium browser once, then run Playwright:

```bash
npm exec --prefix frontend playwright install chromium
npm run test:e2e --prefix frontend
```

Playwright starts the Vite dev server automatically and exercises the app in Chromium.

### Frontend CI

The workflow in `.github/workflows/frontend.yml` installs frontend dependencies, builds the Vite app, runs Jest, installs Chromium, and runs Playwright for pushes and pull requests.

### User API endpoints

- `GET /users` — list all users
- `GET /users/:id` — fetch a user by id
- `POST /users` — create a user; body: `{ name, email }`
- `PATCH /users/:id` — update a user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a user

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

