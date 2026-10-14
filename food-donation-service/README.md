# Food Donation Service (Service 1)

Microservice responsible for managing food supplier authentication, surplus food donations, shelf-life and expiry validation, and atomic reservation locking.

## Port & Database
- **Default Port**: `5001`
- **Database**: `FoodRescueDonations` (MongoDB Atlas)

## Endpoints
- `GET /health` - Health check & DB connection status
- `POST /api/auth/register` - User registration (Supplier or Requester)
- `POST /api/auth/login` - User authentication & JWT generation
- `GET /api/auth/me` - Authenticated user details
- `PUT /api/auth/profile` - Update user profile
- `GET /api/donations` - Retrieve all donations (supports `status`, `category`, `search`)
- `GET /api/donations/available` - Unexpired donations with status `Available`
- `GET /api/donations/stats` - Total meals rescued and impact metrics
- `POST /api/donations` - Create new surplus donation
- `GET /api/donations/:id` - Fetch donation by ID
- `PUT /api/donations/:id` - Update donation (enforces ownership)
- `DELETE /api/donations/:id` - Delete donation (enforces ownership)
- `PATCH /api/donations/:id/reserve` - Atomic reservation lock (invoked by Service 2)
- `PATCH /api/donations/:id/release` - Rollback reservation to Available
- `PATCH /api/donations/:id/collect` - Mark donation as collected

## Run Service
```powershell
npm install
npm run dev
```
