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

## Frontend (React + Vite)

The React frontend lives under `frontend/`.

### Install dependencies

```
npm ci --prefix frontend
```

### Run the dev server

```
npm run dev --prefix frontend
```

### Unit tests (Jest + Testing Library)

Run unit tests for the frontend with Jest:

```
npm run test:unit --prefix frontend
```

Notes:
- Jest is configured with `babel-jest` and `@babel/preset-react` to transform JSX/ESM.
- The test environment is `jsdom` and Testing Library matchers are enabled via `setupTests.js`.

### End-to-end (E2E) tests (Playwright)

Playwright is configured in `frontend/playwright.config.js` with an example spec at `frontend/e2e/example.spec.example.js`. The example is not executed by default.

To run E2E tests locally or in CI:
1. Install dependencies and Playwright browsers
   ```
   npm ci --prefix frontend
   npx playwright install
   ```
2. Enable the example test by renaming the file to `example.spec.js` (or add your own `*.spec.js`):
   ```
   mv frontend/e2e/example.spec.example.js frontend/e2e/example.spec.js
   ```
3. Run the tests:
   ```
   npm run test:e2e --prefix frontend
   ```

Playwright will start the Vite dev server on `http://localhost:5173` if it is not already running (`reuseExistingServer: true`).

> CI note: Playwright browser binaries are not installed by default. Ensure `npx playwright install` (optionally with `--with-deps` in containers) runs before executing E2E tests.

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

