# FastAPI Hello World API

This repository includes a minimal FastAPI application with a single endpoint and basic pytest coverage. It also includes a separate Node.js/Express API backed by MongoDB for users and books.

## FastAPI setup

- Create a virtual environment (optional but recommended)
- Install dependencies:

```
pip install -r requirements.txt
```

## Run the FastAPI server

Start the development server with uvicorn:

```
uvicorn app.main:app --reload
```

Visit http://127.0.0.1:8000/ to see the Hello World response.

## Run FastAPI tests

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
- Local CORS defaults to `http://localhost:5173` for the Vite web app. Override with `CORS_ORIGIN` if your frontend uses a different origin.

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

### Health endpoint

- `GET /` — returns `{ "message": "Hello, World!" }`

Visit http://127.0.0.1:3000/ to see the Node API health response. You can override the port by setting the `PORT` environment variable.

### Book response shape

Book endpoints serialize MongoDB documents with a stable `id` field instead of `_id`:

```json
{
  "id": "64f0c2f0f1f1f1f1f1f1f1f1",
  "name": "The Left Hand of Darkness",
  "details": "A science fiction novel about culture and identity.",
  "authors": ["Ursula K. Le Guin"],
  "starred": false,
  "createdAt": "2026-08-25T09:00:00.000Z",
  "updatedAt": "2026-08-25T09:00:00.000Z"
}
```

### Book API endpoints

- `GET /books` — list all books for the table.
- `GET /books/:id` — fetch one book by id.
- `POST /books` — create a book; body requires `name`, `details`, and `authors`.
- `PATCH /books/:id` — update editable fields; body may include `name`, `details`, or `authors`.
- `PATCH /books/:id/starred` — update only the favorite flag; body requires `{ "starred": true }` or `{ "starred": false }`.
- `DELETE /books/:id` — delete a book.

#### Create a book

Request:

```json
{
  "name": "The Left Hand of Darkness",
  "details": "A science fiction novel about culture and identity.",
  "authors": ["Ursula K. Le Guin"]
}
```

Response: `201 Created` with the serialized book. `starred` defaults to `false` unless a boolean `starred` value is provided.

#### Update editable book fields

Request:

```json
{
  "details": "Updated details",
  "authors": ["Ursula K. Le Guin", "UKLG"]
}
```

Response: `200 OK` with the updated serialized book.

#### Toggle starred

Request:

```json
{
  "starred": true
}
```

Response: `200 OK` with the updated serialized book. Other fields in this request body are ignored; only `starred` changes.

### User API endpoints

- `GET /users` — list all users
- `GET /users/:id` — fetch a user by id
- `POST /users` — create a user; body: `{ name, email }`
- `PATCH /users/:id` — update a user; body may include `{ name, email }`
- `DELETE /users/:id` — delete a user
