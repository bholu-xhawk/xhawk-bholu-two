# Knowledge base

Common commands
- Python / FastAPI
  - python -m venv .venv && source .venv/bin/activate
  - pip install -r requirements.txt
  - uvicorn app.main:app --reload
  - uvicorn api.app:app --reload --port 8001
  - pytest -q
- Node API
  - npm install --prefix node_api
  - npm start --prefix node_api
  - npm test --prefix node_api
- Frontend
  - npm install --prefix frontend
  - npm run dev --prefix frontend
  - npm run build --prefix frontend
  - npm run preview --prefix frontend
- MongoDB
  - docker-compose up -d mongo
  - docker-compose logs -f mongo
  - docker-compose down

Troubleshooting
- Mongo connection refused
  - Ensure docker-compose up -d mongo is running (port 27017)
  - Check MONGODB_URI env var in node_api (.env or config.js)
- Port conflicts
  - Vite: 5173; Uvicorn: 8000; Node: 3000
  - Kill the process using the port or change the port in start commands
- Node modules issues
  - Remove node_api/node_modules and reinstall with npm install --prefix node_api
  - Clear npm cache if needed (npm cache clean --force)
- Python venv issues
  - Recreate venv; ensure correct interpreter version (Python 3.11+)

Known limitations
- No authentication/authorization implemented
- Minimal error handling and logging by default
- Two separate FastAPI apps with distinct purposes (hello vs. health)

Frequently modified areas
- frontend/src/pages and components
- node_api/src/routes and models
- FastAPI endpoints in app/ and api/
- tests/ for Python; node_api/test for Node API

Integration references
- MongoDB: docker-compose.yml
- FastAPI/Uvicorn: app/main.py, api/app.py
- Jest/Supertest: node_api/test
- Vite/React Router: frontend/src/App.jsx and vite.config.js

If you get stuck
- Check logs and tests first
- Search for existing patterns in the codebase
- Open a draft PR to share context and ask for feedback
