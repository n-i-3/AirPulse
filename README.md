# AirPulse 🌍
> **Ward-Wise Pollution Monitoring & Governance Command Center**

AirPulse is a next-generation, premium-grade dashboard designed to empower citizens and governance bodies with real-time, hyper-local air quality intelligence. Built for the Hack4Delhi 2026, it merges high-fidelity visualization, verifiable citizen reporting (Web3), and AI-driven predictive analytics into a seamless "Glassmorphic" experience.

## 🚀 Vision
To create a "Bloomberg Terminal" for Air Quality—a tool that feels expensive, responsive, and indispensable for decision-making.

## 🛠️ Tech Stack
### Frontend (Client)
- **Framework**: Next.js 15 (App Router)
- **Styling**: TailwindCSS + Shadcn/UI (Glassmorphism Design System)
- **Visualization**: React-Leaflet (Custom Dark Mode), Framer Motion (Animations)
- **Web3 Identity**: Privy (Embedded Wallets, Social Login)

### Backend (Server)
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB (Metadata & User Profiles)
- **Storage**: Lighthouse / IPFS (Immutable Evidence)
- **AI/ML**: TensorFlow.js (Time-series Forecasts)

## 📂 Repository Structure
- `/client`: Next.js Frontend Application
- `/server`: Express.js Backend Service

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB URI
- Privy App ID
- WAQI API Token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo_url>
   cd AirPulse
   ```

2. **Backend Setup**
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```

## 🌟 Key Features
- **Ward Heatmap**: Live AQI visualization overlaid on Delhi Ward polygons.
- **Verifiable Reporting**: Sign pollution reports with Privy wallets; store on IPFS.
- **AI Advisor**: Real-time "GRAP" (Graded Response Action Plan) recommendations.

---
*Built with ❤️ for Hack4Delhi 2026*
