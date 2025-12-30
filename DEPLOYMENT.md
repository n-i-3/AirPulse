# 🚀 Deployment Guide for AirPulse

This guide will walk you through deploying the AirPulse **Frontend to Vercel** and **Backend to Render**.

---

## 🏗️ 1. Deploy Backend (Render)

We deploy the backend first because the frontend needs the backend URL to fetch data.

1.  **Push your code to GitHub** (if you haven't already).
2.  Go to [Render Dashboard](https://dashboard.render.com/).
3.  Click **New +** -> **Web Service**.
4.  Connect your `AirPulse` repository.
5.  **Configure the Service**:
    *   **Name**: `airpulse-server` (or similar)
    *   **Root Directory**: `server` (⚠️ Important!)
    *   **Runtime**: Node
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/index.js`
6.  **Environment Variables** (Scroll down to "Environment Variables"):
    *   `MONGO_URI`: `your_mongodb_connection_string` (Use Mongo Atlas for cloud DB)
    *   `WAQI_TOKEN`: `your_waqi_api_token`
    *   `Node Version`: `18` (Optional, good practice)
7.  Click **Create Web Service**.
8.  **Wait for Deployment**: Once live, copy the **Service URL** (e.g., `https://airpulse-server.onrender.com`). You will need this for the frontend.

---

## 🎨 2. Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  Import the `AirPulse` repository.
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (Should auto-detect)
    *   **Root Directory**: Click "Edit" and select `client`. (⚠️ Important!)
5.  **Environment Variables**:
    *   Expand "Environment Variables".
    *   Add Key: `NEXT_PUBLIC_API_URL`
    *   Add Value: The **Render Backend URL** from Step 1 (e.g., `https://airpulse-server.onrender.com`).
        *   *Note: Do not add a trailing slash `/`.*
    *   Add Key: `NEXT_PUBLIC_PRIVY_APP_ID`
    *   Add Value: Your Privy App ID.
6.  Click **Deploy**.

---

## ✅ Final Checks

1.  Open your Vercel App URL.
2.  Check the "System Status" in the top header.
    *   The **AQI API** and **Sources API** lights should turn **Green (Online)**.
    *   If they are red, check the Vercel logs or ensure the Render URL is correct in the environment variables.

**🎉 Congratulations! AirPulse is now live.**
