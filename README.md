# AirPulse 🌍
> **Ward-Wise Pollution Monitoring & Governance Command Center**

AirPulse is a high-performance dashboard built to help citizens and government officials track air quality in real time. We built this for the Hack4Delhi 2026 hackathon with a simple goal: make air quality data look as important as financial data. It combines live sensor readings, citizen reports that are verified on-chain, and AI predictions into one premium "Glassmorphic" interface.

## 🚀 Vision
We wanted to build the "Bloomberg Terminal" for Air Quality. A tool that feels professional, responsive, and indispensable for decision making. No more boring charts. We want data that feels alive.

## 🌟 Key Features

### 1. Real-Time Command Center
The dashboard aggregates data from thousands of ground stations to provide a live "Pulse" of the city. We overlay this on a map of Delhi to show you exactly which wards are critical right now.

### 2. AI Forecasting & Strategy
It's not enough to know what the air is like now. You need to know what it will be like tomorrow. Our AI model analyzes wind speed, temperature, and historical trends to predict AQI for the next 24 hours. It even suggests specific actions (like invoking GRAP protocols) based on the severity.

### 3. Verifiable Citizen Reporting
Citizens can report pollution sources (like garbage burning or construction dust) directly from the app. We use **Privy** for seamless login and **Zero-Knowledge Proofs (simulated)** to verify report authenticity without revealing the user's identity.

### 4. Sources & Intel
We don't just show you the pollution; we show you where it's coming from. The "Sources" tab breaks down contribution factors (Transport, Industry, Dust), and the "Intel" tab aggregates relevant news and updates.

## 🛠️ Tech Stack

**Frontend (Client)**
*   **Next.js 15**: The React framework for the web.
*   **TailwindCSS + Shadcn/UI**: For that sleek, glass-like premium feel.
*   **Recharts**: For dynamic, beautiful data visualization.
*   **Privy**: For incredibly easy Web3 authentication and wallet management.

**Backend (Server)**
*   **Node.js + Express**: Fast and reliable REST API.
*   **MongoDB**: Stores user reports, profile metadata, and historical records.
*   **TensorFlow.js**: Powering our client-side prediction models.

## ⚡ Getting Started

Follow these steps to get AirPulse running locally on your machine.

### Prerequisites
*   Node.js (v18 or higher)
*   MongoDB installed locally or a cloud URI
*   A Privy App ID (get one for free at privy.io)
*   WAQI API Token (get one at waqi.info)

### 1. Clone the Repository
```bash
git clone <repo_url>
cd AirPulse
```

### 2. Backend Setup
The backend handles data aggregation and report storage.

```bash
cd server
npm install
```

**Create a `.env` file in the `server` directory:**
You need to create a file named `.env` and add the following keys.

```env
# Port for the server to run on
PORT=5000

# Your MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/airpulse

# API Token from World Air Quality Index (WAQI)
WAQI_TOKEN=your_token_here
```

**Start the Server:**
```bash
npm run dev
```

### 3. Frontend Setup
The frontend is the visual command center.

```bash
cd client
npm install
```

**Create a `.env` file in the `client` directory:**
You need to create a file named `.env` and add the following keys.

```env
# Your Privy App ID for Auth
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

**Start the Client:**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the dashboard live!

## 📂 Project Structure

*   **/client**: All the Next.js frontend code.
    *   `src/app`: The main pages (Overview, Forecast, Report, Sources).
    *   `src/components`: Reusable UI components like the Glass Cards and Charts.
*   **/server**: The Node.js backend.
    *   `src/controllers`: Logic for handling API requests.
    *   `src/models`: Mongoose schemas for Reports and Users.

---
*Built with ❤️ for Hack4Delhi 2026*
