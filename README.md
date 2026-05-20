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

