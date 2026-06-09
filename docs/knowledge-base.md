# Knowledge Base

Common commands
- Python APIs
  - Install: pip install -r requirements.txt
  - Run: uvicorn app.main:app --reload; uvicorn api.app:app --reload --port 8001
  - Test: pytest tests/test_app.py tests/api/test_health.py -q
- Node API
  - Install: npm install --prefix node_api
  - Dev: npm run dev --prefix node_api
  - Test: npm test --prefix node_api
  - Real DB: docker-compose up -d mongo; copy node_api/.env.example → node_api/.env
- Frontend
  - Install: npm install --prefix frontend
  - Dev: npm run dev --prefix frontend
  - Build: npm run build --prefix frontend

Troubleshooting
- Port conflicts: choose alternate ports with --port for uvicorn or Vite
- Mongo connection errors: ensure docker-compose mongo is up; verify connection string in .env
- Node tests failing: run npm install --prefix node_api first; ensure in-memory Mongo setup matches tests
- Python import errors: ensure dependencies installed (pip install -r requirements.txt)

Known limitations
- No global lint/type-check enforced by CI yet
- No authentication/authorization in sample services
- No formal migration framework for Mongo; use scripts and document

Frequently modified areas
- node_api/src/routes/users.js — CRUD and validation tweaks
- frontend/src/pages and components — UI flows
- app/main.py and api/app.py — sample FastAPI endpoints

Integration references
- FastAPI: https://fastapi.tiangolo.com/
- Express: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- React: https://react.dev/
- Vite: https://vitejs.dev/
