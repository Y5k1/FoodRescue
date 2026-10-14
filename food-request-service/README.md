# Food Request & Matching Service (Service 2)

Microservice responsible for managing food requests from shelters/NGOs, evaluating algorithmic compatibility against Service 1 surplus records, coordinating cross-service reservation locks, and live dispatch tracking.

## Port & Database
- **Default Port**: `5002`
- **Database**: `FoodRescueRequests` (MongoDB Atlas)

## Endpoints
- `GET /health` - Health check & DB connection status
- `GET /api/requests` - Retrieve food requests (supports `status`, `foodCategory`, `search`)
- `POST /api/requests` - Submit new food request
- `GET /api/requests/stats` - Summary statistics & beneficiary metrics
- `GET /api/requests/matches/feed` - Feed of live compatibility pairings
- `GET /api/requests/:id` - Fetch request by ID
- `PUT /api/requests/:id` - Update request
- `DELETE /api/requests/:id` - Delete request
- `GET /api/requests/:id/matches` - Algorithmic evaluation of compatible donations from Service 1
- `POST /api/requests/:id/accept-match` - Safe atomic reservation lock in Service 1 with rollback
- `POST /api/requests/:id/fulfill` - Mark request fulfilled & donation collected
- `POST /api/requests/:id/cancel` - Cancel request & release reserved donation
- `POST /api/requests/auto-match` - Trigger automated matching engine
- `GET /api/requests/events` - Live REST API event stream logs

## Run Service
```powershell
npm install
npm run dev
```
