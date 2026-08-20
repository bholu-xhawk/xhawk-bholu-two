# Shared Expense App

This repo contains a Splitwise-style shared expense product with an Express + MongoDB API and a Vite React frontend. Users register or log in, create groups, add members, enter equal or custom-split expenses, view simplified balances, record settlements, and receive in-app settlement reminders.

The older FastAPI hello-world services remain in `app/` and `api/`, but the product implementation lives in `node_api/` and `frontend/`.

## Architecture

- `node_api/`: Express API backed by MongoDB through Mongoose.
- `frontend/`: Mobile-first React single-page app.
- `docker-compose.yml`: Local MongoDB service for manual development.
- `node_api/test/`: Jest + Supertest integration tests using `mongodb-memory-server`, so tests do not require Docker.

## Mongo collections

The Node API models the expense-sharing domain explicitly:

- `users`: authenticated accounts with normalized email, password hash, default currency, and notification preferences.
- `groups`: group metadata, base currency, member references, and roles.
- `expenses`: payer, participants, split type, shares, original currency, FX rate, and converted minor-unit amount.
- `balances`: materialized simplified pairwise debts for each group.
- `settlements`: repayments between group members.
- `notifications`: unread/read in-app reminder events.
- `exchangerates`: optional stored/manual rates for cross-currency expenses.

All money is represented as integer minor units plus a currency code. Balance math recomputes deterministically from expenses and settlements.

## Environment variables

Copy the example file and adjust values:

```bash
cp node_api/.env.example node_api/.env
```

Required/commonly used values:

- `MONGODB_URI` — defaults to `mongodb://localhost:27017/node_api`.
- `JWT_SECRET` — required for authenticated flows; use a long random secret outside local development.
- `JWT_EXPIRES_IN` — JWT lifetime, default `7d`.
- `DEFAULT_CURRENCY` — default account/group currency, default `USD`.
- `EXCHANGE_RATE_API_URL` and `EXCHANGE_RATE_API_KEY` — optional future live-rate provider settings. The current app works with same-currency or manually stored rates.

If running the API in a container on the same Docker network as Mongo, use `MONGODB_URI=mongodb://mongo:27017/node_api`.

## Local development

Install dependencies:

```bash
npm install --prefix node_api
npm install --prefix frontend
```

Start MongoDB for manual development:

```bash
docker-compose up -d mongo
```

Run the API and frontend in separate terminals:

```bash
npm start --prefix node_api
npm run dev --prefix frontend
```

The API defaults to `http://localhost:3000`. The frontend uses `VITE_API_BASE_URL` when set, otherwise it calls `http://localhost:3000`.

## API endpoints

- `GET /` and `GET /health` — API identity and health.
- `POST /auth/register` — create account and receive JWT.
- `POST /auth/login` — authenticate and receive JWT.
- `GET /me` and `GET /users/me` — current profile.
- `PATCH /users/me` — update current profile settings.
- `GET /groups` / `POST /groups` — list and create groups.
- `GET /groups/:groupId` — group detail for members.
- `POST /groups/:groupId/members` — owner-only member add by email.
- `GET /groups/:groupId/expenses` / `POST /groups/:groupId/expenses` — list and create expenses.
- `GET /groups/:groupId/balances` — simplified balances.
- `POST /groups/:groupId/balances/recompute` — force recomputation.
- `GET /groups/:groupId/settlements` / `POST /groups/:groupId/settlements` — list and record repayments.
- `POST /groups/:groupId/notifications/reminders` — create in-app reminders for unsettled balances.
- `GET /notifications` — list current user's notifications.
- `PATCH /notifications/:notificationId/read` — mark a notification read.

All product endpoints except registration/login/root/health require `Authorization: Bearer <token>`. Group-scoped routes also require group membership.

## Tests and build

Run the backend integration tests:

```bash
npm test --prefix node_api
```

Build the frontend:

```bash
npm run build --prefix frontend
```

The root scripts used by the final gate are also available:

```bash
npm test
npm run build
```

