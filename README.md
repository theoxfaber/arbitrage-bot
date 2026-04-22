# ⚡ Asymmetric Quant: High-Fidelity Crypto Arbitrage Engine

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build: Passing](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Rust](https://img.shields.io/badge/Rust-tokio--tungstenite-orange)
![Python](https://img.shields.io/badge/Python-FastAPI-blue)
![React](https://img.shields.io/badge/React-Next.js-black)
![Database](https://img.shields.io/badge/Database-TimescaleDB-blue)

A production-grade, asynchronous cryptocurrency arbitrage platform. It combines a zero-latency native Rust orderbook engine with a Python orchestrator, a Machine Learning noise classifier, and a full-duplex Next.js streaming dashboard.

## 🧠 System Architecture

This monorepo is divided into three primary functional domains over 7 engineered layers:

### 1. The Core Rust Price Engine (`/backend/rust-engine`)
Built on `tokio` and `tokio-tungstenite`, the native engine connects permanently to Binance and Bybit websockets. Diffs are processed across `crossbeam` lock-free ring buffers to detect Cross-Exchange arbitrage spreads in real-time, completely bypassing Python's GIL limit. Exposed via **PyO3**.

### 2. The Python Brain (`/backend`)
A `FastAPI` application protected by JWT middleware that orchestrates the compiled Rust FFI.
- **ML Gap Classifier**: Uses a `scikit-learn` RandomForestClassifier to filter out network noise microbursts (<100ms) vs executable arbitrage gaps (>500ms).
- **Explainability Automation**: Deterministic English log generation for every single logged theoretical trade.
- **Timeseries Storage**: All performance arrays and order traces map directly into a PostgreSQL + TimescaleDB instance.

### 3. Duplex Streaming Dashboard (`/frontend`)
Next.js React application utilizing `recharts` for live charting.
- **WebSocket Driven**: Zero HTTP polling. The UI updates instantly via `ws://`.
- **Regime Awareness**: Built-in rolling Average True Range (ATR) & Volume Z-score detectors will dynamically flag `CALM`, `TRENDING`, or `VOLATILE` market states.

---

## 🚀 Quickstart Development

Run the entire cluster with a single command via Docker:

```bash
# Clone the repository
git clone https://github.com/theoxfaber/arbitrage-bot.git
cd arbitrage-bot

# Build the Rust PyO3 Extensions and boot the orchestration containers
make dev
```

### Navigating the Platform
- **Next.js Dashboard**: `http://localhost:3000`
- **FastAPI Specs**: `http://localhost:8000/docs`
- **Postgres Database**: `localhost:5432`

---

## 📸 Backtesting Engine
Included is a local CSV `orderbook` array ingestion pipeline. Execute dry runs across historical flash-crash sequences using the interactive time-scrubbing P&L Recharts tool on the `/backtest` route.

![Project Topology](https://img.shields.io/badge/Architecture-Clean-brightgreen)
