# 🏸 Courtside Frontend — Anurag University Campus Sports Reservation

[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Design](https://img.shields.io/badge/Styling-Custom%20CSS3-38B2AC.svg?style=flat)](https://www.w3.org/Style/CSS/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat)]()

**Courtside** is a modern, responsive web application designed for students and faculty at **Anurag University**. It provides real-time visibility into sports court availability across campus, live game timers, and instant court reservations.

---

## ✨ Features

- **⚡ Live Availability Grid:** Real-time visual status indicator for 18 courts across 9 sports categories (Badminton, Basketball, Cricket, Football, Tennis, Volleyball, Table Tennis, Carrom, Chess).
  - 🟢 **Available:** Ready to book immediately.
  - 🔴 **Occupied:** Displays current booking code, start/end time, and countdown timer.
- **⏱️ Active Session Banner:** When a student books a court, a high-visibility live session widget appears at the top showing remaining minutes, session details, and an **"End session"** button.
- **🛡️ Concurrency Enforcement:** Prevents multiple simultaneous bookings per student, guaranteeing fair campus-wide access.
- **🎓 Student Portal:** Clean authentication modal for account registration and login with Anurag University institutional emails (`@anurag.edu.in`).
- **🌐 Dynamic Environment Switching:** Intelligent API resolver automatically routes to local development (`http://localhost:8080/api`) or production cloud backends based on `import.meta.env`.

---

## 🛠️ Tech Stack

- **Framework:** React 19 Single Page Application
- **Build Tool:** Vite 8 with Hot Module Replacement (HMR)
- **Styling:** Modular CSS3 with responsive grid layouts, custom CSS variables, and clean typography (`DM Sans` + `Manrope`)
- **Icons & Assets:** Native Unicode sport glyphs and high-resolution institutional branding

---

## 📂 Project Structure

```
frontend/
├── public/
│   ├── anurag-university-logo.png   # Institutional emblem
│   └── favicon.svg
├── src/
│   ├── assets/                      # Hero illustrations and vector icons
│   ├── App.jsx                      # Main UI component & state management
│   ├── App.css                      # Custom theme and responsive layout styles
│   ├── config.js                    # Dynamic API endpoint router
│   ├── index.css                    # Base resets and typography
│   └── main.jsx                     # Application entry point
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
The application will launch at `http://localhost:5173`. When running locally, it automatically communicates with the Spring Boot backend running on `http://localhost:8080/api`.

### 3. Production Build
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready for deployment.

---

## ☁️ Deployment Guide (Vercel / Netlify / Render)

### Deploying to Vercel (Recommended)
1. Push the code to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Select this repository: `sports-court-availability-frontend`.
4. Framework Preset: **Vite**.
5. Add the Environment Variable:
   - `VITE_API_URL`: Your deployed backend API URL (e.g., `https://your-backend.onrender.com/api`).
6. Click **Deploy**.

### Deploying to Render Static Site
1. On [Render](https://render.com), click **New + > Static Site**.
2. Connect `sports-court-availability-frontend`.
3. Build Command: `npm run build`
4. Publish Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
6. Click **Create Static Site**.
