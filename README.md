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

A separate Node.js Express service is provided under `node_api/` with its own tests and MongoDB-backed User and Book APIs.

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

- The tests use an in-memory MongoDB server and do not require Docker. The npm script pins a MongoDB 7.x memory-server binary for Debian-compatible local runs:
  - `npm test --prefix node_api`
- To focus on the Book and User APIs:
  - `npm test --prefix node_api -- books.test.js users.test.js`

### User API endpoints

- `GET /users` — list all users
- `GET /users/:id` — fetch a user by id
- `POST /users` — create a user; body: `{ name, email }`
- `PATCH /users/:id` — update a user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a user

### Book API endpoints

`GET /books` seeds a default starter library when the collection is empty, then returns books sorted by title and author.

- `GET /books` — list books, seeding defaults on an empty collection
- `GET /books/:id` — fetch one book by MongoDB ObjectId
- `POST /books` — create a book
- `PATCH /books/:id` — update any editable book fields
- `DELETE /books/:id` — delete one book
- `POST /books/bulk-delete` — delete multiple selected books

Create and update requests accept these fields:

```json
{
  "title": "Kindred",
  "author": "Octavia E. Butler",
  "genre": "Science Fiction",
  "description": "A time-travel novel that confronts the brutality of slavery.",
  "imageUrl": "https://example.com/kindred.jpg",
  "year": 1979,
  "status": "finished",
  "rating": 5
}
```

`title` and `author` are required when creating a book. `status` must be one of `to-read`, `reading`, or `finished`; `rating` must be between 0 and 5 when provided. `description` and `imageUrl` are optional, and the frontend details page renders a placeholder when no usable image is available.

Bulk delete requests use an `ids` array:

```json
{ "ids": ["64f000000000000000000001", "64f000000000000000000002"] }
```

The response reports how many existing books were deleted and which valid ids were not found:

```json
{ "deletedCount": 1, "notFoundIds": ["64f000000000000000000002"] }
```

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

---

## Frontend

The React/Vite frontend lives in `frontend/` and includes `/booklist` and `/booklist/:id` routes for browsing, creating, editing, selecting, deleting, and viewing books.

### Frontend API base URL

The frontend calls the Node API at `http://localhost:3000` by default. Set `VITE_API_BASE_URL` when running against another origin:

```
VITE_API_BASE_URL=http://127.0.0.1:3000 npm run dev --prefix frontend
```

### Workspace commands

From the repository root, the final build/test gate is:

- `npm run build`
- `npm test`
- Optional browser flow: `npm run test:e2e`

### Frontend commands

- Install dependencies:
  - `npm install --prefix frontend`
- Build the Vite app:
  - `npm run build --prefix frontend`
- Run the Playwright E2E flow:
  - `npm run test:e2e --prefix frontend`

Playwright starts the real Node API with `mongodb-memory-server` and Vite with `VITE_API_BASE_URL` pointed at that temporary API. Local machines may need Chromium and its native dependencies installed once after npm dependencies are installed:

```
npx playwright install chromium
```


