# Fluffy Guide — Live Sports Fixture Radar

A React 19, TypeScript, Tailwind CSS, and Vite fixture radar configured for **Vercel** deployment. Match schedules are fetched at runtime from ESPN's public scoreboard feed; the app does not ship a hard-coded fixture list.

## 🚀 Key Features

1. **Verified upcoming fixtures:**
   - Fetches scheduled events from ESPN for selected football leagues and the NBA.
   - Filters out events whose kickoff time has passed on the server.
   - Shows the provider, kickoff timestamp, and source link for traceability.

2. **Date and time filters:**
   - Filter by exact UTC date and morning, afternoon, or evening kickoff window.
   - Sorts results by the verified kickoff timestamp.

3. **No invented picks:**
   - Fixtures without a verified odds feed are view-only.
   - No stale fallback fixtures are shown if the live provider is unavailable.

4. **Realistic Paper Trading Simulation Engine:**
   - Real-time simulated fills, leverage selector (1x - 125x), dynamic PnL tracking, margin maintenance checks, liquidation calculations, and interactive order book.
   - Auto-execute mode for signals meeting minimum confluence thresholds.

5. **Deploy Ready for Vercel:**
   - Configured with `vercel.json` for fast SPA routing, clean URLs, and optimized Vite production builds (`npm run build`).

---

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS v4 + Framer Motion
- **Icons:** Lucide React
- **Data Source:** ESPN public scoreboard API via a Vercel serverless function
- **Deployment:** Vercel (or static hosting)

---

## 📦 Local Development

```bash
# Install dependencies
npm install

# Start local development server (runs on port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Build for production
npm run build
```

---

## ⚡ Vercel Deployment Instructions

1. **Push to your GitHub repository:**
   ```bash
   git add .
   git commit -m "feat: perpetual radar with unlimited pair screener, manual analysis studio, and paper trading"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Import your GitHub repository.
   - **Framework Preset:** Vite (or Other).
   - **Build Command:** `npm run build` (or `vite build`).
   - **Output Directory:** `dist`.
   - Click **Deploy**. Vercel will automatically build and publish your project with automated previews on each commit.

---

## 📄 License
MIT License. Free for personal and algorithmic trading research.
