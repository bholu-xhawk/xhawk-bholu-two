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

## Node.js Hello World API

A separate Node.js Express service is provided under `node_api/` with its own tests.

- Install dependencies:
  - `npm install --prefix node_api`
- Run the server (defaults to port 3000):
  - `npm start --prefix node_api`
- Run tests:
  - `npm test --prefix node_api`

Visit http://127.0.0.1:3000/ to see the Hello World response. You can override the port by setting the `PORT` environment variable.

### MongoDB with docker-compose

A local MongoDB can be started with docker-compose at the repository root:

```
docker-compose up -d mongo
```

This exposes MongoDB on localhost:27017 and persists data in a named volume.

### Environment variables

Copy node_api/.env.example to node_api/.env and adjust if needed.

- MONGODB_URI: MongoDB connection string. Defaults to mongodb://localhost:27017/node_api

### User API endpoints

Once MongoDB is running and MONGODB_URI is set, start the Node API:

```
npm start --prefix node_api
```

Available endpoints:
- GET /users — list users
- GET /users/:id — get a user by ID
- POST /users — create a user (body: { name, email })
- PATCH /users/:id — update a user (body: { name?, email? })
- DELETE /users/:id — delete a user

### Development helpers

- Run with auto-reload:
```
npm run dev --prefix node_api
```

- Run tests (uses in-memory MongoDB automatically):
```
npm test --prefix node_api
```

