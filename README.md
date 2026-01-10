# AirPulse 🌍

> **Ward-Wise Pollution Monitoring & Governance Command Center**

AirPulse is a high-performance dashboard built to help citizens and government officials track air quality in real time. We built this for the Hack4Delhi 2026 hackathon with a simple goal: make air quality data look as important as financial data. It combines live sensor readings, citizen reports that are verified on-chain, and AI predictions into one premium "Glassmorphic" interface.

---

## 🌐 Live Demo

| Platform | URL |
|----------|-----|
| **Frontend (Vercel)** | [https://air-pulse-one.vercel.app](https://air-pulse-one.vercel.app) |
| **Backend (Render)** | [https://airpulse-server.onrender.com](https://airpulse-server.onrender.com) |

---

## 🚀 Vision

We wanted to build the "Bloomberg Terminal" for Air Quality. A tool that feels professional, responsive, and indispensable for decision making. No more boring charts. We want data that feels alive.

---

## 🌟 Key Features

### 1. Real-Time Command Center
The dashboard aggregates data from thousands of ground stations to provide a live "Pulse" of the city. We overlay this on a map of Delhi to show you exactly which wards are critical right now.

### 2. AI Forecasting & Strategy
It's not enough to know what the air is like now. You need to know what it will be like tomorrow. Our AI model analyzes wind speed, temperature, and historical trends to predict AQI for the next 24 hours. It even suggests specific actions (like invoking GRAP protocols) based on the severity.

### 3. Verifiable Citizen Reporting
Citizens can report pollution sources (like garbage burning or construction dust) directly from the app. We use **Privy** for seamless login and **Zero-Knowledge Proofs (simulated)** to verify report authenticity without revealing the user's identity.

### 4. Sources & Intel
We don't just show you the pollution; we show you where it's coming from. The "Sources" tab breaks down contribution factors (Transport, Industry, Dust), and the "Intel" tab aggregates relevant news and updates.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 15, TailwindCSS, Shadcn/UI, Recharts, Privy Auth |
| **Backend** | Node.js, Express, MongoDB |
| **APIs** | WAQI (Air Quality), OpenWeatherMap (Weather Data) |
| **AI** | TensorFlow.js (Client-Side Predictions) |

---

## ⚙️ Environment Variables

> **IMPORTANT**: You must create `.env` files in both `client/` and `server/` directories before running the app.

### Server (`server/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Port for the server (default: 5000) | `5000` |
| `MONGO_URI` | **Yes** | MongoDB connection string | `mongodb://localhost:27017/airpulse` |
| `WAQI_TOKEN` | **Yes** | API token from [waqi.info](https://aqicn.org/data-platform/token/) | `your_waqi_token` |
| `OPENWEATHER_API_KEY` | No | API key from [OpenWeatherMap](https://openweathermap.org/api) (for weather data) | `your_openweather_key` |
| `PRIVY_APP_ID` | No | Privy App ID (for server-side auth verification) | `your_privy_app_id` |
| `PRIVY_APP_SECRET` | No | Privy App Secret (for backend auth) | `your_privy_secret` |
| `JWT_SECRET` | No | Secret for signing JWT tokens (default: `dev_secret_key_123`) | `your_jwt_secret` |
| `ALLOWED_ORIGIN` | No | CORS origin for production frontend | `https://air-pulse-one.vercel.app` |
| `NODE_ENV` | No | Environment mode (`development` or `production`) | `production` |

**Example `server/.env`:**
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/airpulse
WAQI_TOKEN=your_waqi_token_here
OPENWEATHER_API_KEY=your_openweather_key_here
JWT_SECRET=super_secret_key_for_jwt
ALLOWED_ORIGIN=https://air-pulse-one.vercel.app
NODE_ENV=development
```

---

### Client (`client/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | **Yes** | Your Privy App ID (get one at [privy.io](https://privy.io)) | `your_privy_app_id` |
| `NEXT_PUBLIC_API_URL` | No | Backend API URL (default: `http://localhost:5000`) | `https://airpulse-server.onrender.com` |

**Example `client/.env`:**
```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ⚡ Getting Started

Follow these steps to get AirPulse running locally on your machine.

### Prerequisites
* Node.js (v18 or higher)
* MongoDB installed locally or a cloud URI
* A Privy App ID (get one for free at [privy.io](https://privy.io))
* WAQI API Token (get one at [waqi.info](https://aqicn.org/data-platform/token/))

### 1. Clone the Repository
```bash
git clone <repo_url>
cd AirPulse
```

### 2. Backend Setup
```bash
cd server
npm install
# Create your .env file (see Environment Variables section above)
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
# Create your .env file (see Environment Variables section above)
npm run dev
```

Visit `http://localhost:3000` to see the dashboard live!

---

## 📂 Project Structure

```
AirPulse/
├── client/                 # Next.js Frontend
│   ├── src/app/           # Main pages (Overview, Forecast, Report, Sources, Intel)
│   ├── src/components/    # Reusable UI components
│   └── .env               # Frontend environment variables
│
├── server/                 # Node.js Backend
│   ├── src/controllers/   # API request handlers
│   ├── src/services/      # External API integrations (WAQI, Weather)
│   ├── src/models/        # Mongoose schemas (Reports, Users)
│   └── .env               # Backend environment variables
│
└── README.md
```

---

## 🔑 Getting API Keys

| Service | Link | Notes |
|---------|------|-------|
| **WAQI Token** | [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/) | Required for AQI data |
| **Privy App ID** | [privy.io](https://privy.io) | Required for authentication |
| **OpenWeatherMap** | [openweathermap.org/api](https://openweathermap.org/api) | Optional, for weather data in forecast |

---

## 🚀 Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Backend (Render)
1. Create a new Web Service on [Render](https://render.com)
2. Set root directory to `server`
3. Build command: `npm install`
4. Start command: `npm start` or `node src/index.js`
5. Add all environment variables in Render dashboard

---

*Built with ❤️ for Hack4Delhi 2026*
