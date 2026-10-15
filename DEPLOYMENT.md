# 🚀 FoodRescue Production Deployment Guide
### Render (Microservices) + Vercel (Frontend) + MongoDB Atlas

This document outlines the step-by-step instructions to deploy the entire FoodRescue platform to production:
- **Backend Microservice 1 (`food-donation-service`)**: Hosted on [Render](https://render.com) (Node.js Web Service)
- **Backend Microservice 2 (`food-request-service`)**: Hosted on [Render](https://render.com) (Node.js Web Service)
- **Frontend Dashboard**: Hosted on [Vercel](https://vercel.com) (Vite React SPA)
- **Databases**: Hosted on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## 📋 Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              Vercel Deployment                │
                      │   https://foodrescue-frontend.vercel.app      │
                      └──────────────┬─────────────────┬──────────────┘
                                     │                 │
                REST (Bearer JWT)    │                 │  REST (Bearer JWT)
                                     ▼                 ▼
        ┌──────────────────────────────────┐     ┌──────────────────────────────────┐
        │   Render: Food Donation Svc      │     │    Render: Food Request Svc      │
        │   (Port 10000 / :5001)           │     │    (Port 10000 / :5002)          │
        │   https://donation-svc.render... │◄────┤    https://request-svc.render... │
        └─────────────────┬────────────────┘     └─────────────────┬────────────────┘
                          │  REST (/reserve-quantity)              │
                          ▼                                        ▼
             ┌─────────────────────────┐              ┌─────────────────────────┐
             │   MongoDB Atlas (DB 1)  │              │   MongoDB Atlas (DB 2)  │
             │   FoodRescueDonations   │              │   FoodRescueRequests    │
             └─────────────────────────┘              └─────────────────────────┘
```

---

## ⚠️ Pre-Deployment Checklist (MongoDB Atlas)

Before deploying to Render, ensure your MongoDB Atlas cluster allows incoming connections from Render:
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Navigate to **Network Access** under Security in the left sidebar.
3. Click **Add IP Address**.
4. Choose **Allow Access from Anywhere** (`0.0.0.0/0`) and click **Confirm**.
   *(Render free tier utilizes dynamic IP pools, so access from anywhere is required).*

---

## Part 1: Deploy Backend on Render

You can deploy using either **Option A (Render Blueprint - Recommended)** or **Option B (Manual Setup)**.

### Option A: 1-Click Render Blueprint (Recommended)

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** at the top right and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/Y5k1/FoodRescue`.
4. Render will automatically detect [render.yaml](render.yaml) and configure both services.
5. In the Blueprint form:
   - Enter your `MONGODB_URI` for `FoodRescueDonations`.
   - Enter your `MONGODB_URI` for `FoodRescueRequests`.
6. Click **Apply**. Render will build and deploy both microservices simultaneously!

---

### Option B: Manual Web Service Setup on Render

#### Step 1: Deploy `food-donation-service` (Service 1)
1. On [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect your repository: `Y5k1/FoodRescue`.
3. Configure the service settings:
   - **Name**: `foodrescue-donation-service`
   - **Region**: Oregon (or nearest to you)
   - **Branch**: `main`
   - **Root Directory**: `food-donation-service`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Expand **Advanced** and set:
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Port provided by Render |
   | `MONGODB_URI` | `mongodb+srv://.../FoodRescueDonations?...` | Atlas DB 1 URI |
   | `JWT_SECRET` | *(Random 32+ char string)* | Cryptographic signing key |
   | `JWT_EXPIRES_IN` | `7d` | Token lifetime |
6. Click **Create Web Service**.
7. Once deployed, note down your Render URL, e.g.:
   `https://foodrescue-donation-service.onrender.com`

---

#### Step 2: Deploy `food-request-service` (Service 2)
1. On Render Dashboard, click **New +** → **Web Service**.
2. Connect your repository: `Y5k1/FoodRescue`.
3. Configure the service settings:
   - **Name**: `foodrescue-request-service`
   - **Region**: Same region as Service 1 (e.g. Oregon)
   - **Branch**: `main`
   - **Root Directory**: `food-request-service`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Expand **Advanced** and set:
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Port provided by Render |
   | `MONGODB_URI` | `mongodb+srv://.../FoodRescueRequests?...` | Atlas DB 2 URI |
   | `JWT_SECRET` | *(Same secret as Service 1)* | Must match Service 1 for auth |
   | `DONATION_SERVICE_URL` | `https://foodrescue-h3hs.onrender.com` | Your deployed Service 1 Render URL (no trailing slash) |
6. Click **Create Web Service**.
7. Once deployed, note down your Render URL, e.g.:
   `https://foodrescue-1-msbm.onrender.com`

---

## Part 2: Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Select and import your GitHub repository: `Y5k1/FoodRescue`.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build and Output Settings**:
     - Build Command: `npm run build` (Default)
     - Output Directory: `dist` (Default)
     - Install Command: `npm install` (Default)
5. Expand **Environment Variables** and add:
   | Key | Value |
   |---|---|
   | `VITE_DONATION_API_URL` | `https://foodrescue-h3hs.onrender.com` |
   | `VITE_REQUEST_API_URL` | `https://foodrescue-1-msbm.onrender.com` |
   *(Use your actual deployed Render service URLs)*
6. Click **Deploy**.
7. Vercel will install dependencies, build the assets, and deploy to your frontend URL.

---

## 🔍 Verification & Health Checks

Once deployed, verify the endpoints in your browser or with curl:

### 1. Service 1 Health Check
```bash
curl https://foodrescue-h3hs.onrender.com/health
```
**Expected Response:**
```json
{
  "service": "FoodRescue Food Donation Service",
  "status": "healthy",
  "database": "connected"
}
```

### 2. Service 2 Health Check
```bash
curl https://foodrescue-1-msbm.onrender.com/health
```
**Expected Response:**
```json
{
  "service": "FoodRescue Food Request & Matching Service",
  "status": "healthy",
  "database": "connected"
}
```

### 3. Frontend Web Application
Open your Vercel URL in your browser:
- Test user registration with phone number.
- Post a donation as a Food Supplier.
- Switch to Food Requester portal and browse available donations.
- Submit a request and verify direct native dialer button opens phone app.
- Accept request as supplier and verify instant availability decrement.

---

## 💡 Troubleshooting & Production Tips

1. **Render Free Tier Cold Starts**:
   - Render's free tier spins down web services after 15 minutes of inactivity. The first request after idle can take ~30–50 seconds to boot.
   - For 100% uptime without cold starts, upgrade the services to Render's **Starter** plan ($7/mo).
2. **CORS Errors**:
   - Both backend services are pre-configured with `cors({ origin: "*" })` to accept cross-origin requests from Vercel automatically.
3. **SPA Client-Side Routing**:
   - The included [frontend/vercel.json](frontend/vercel.json) routes all subpaths to `/index.html`, preventing 404 errors when refreshing on deep links.
