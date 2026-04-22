# Production Arbitrage Architecture

This system relies on a 7-layer pipeline designed for maximum latency optimization, theoretical accuracy, and deterministic explainability.

## 1. The Rust Websocket Core (`backend/rust-engine`)
**Why?** Polling APIs with HTTP Axios causes massive rate limiting and high latency (100ms+), losing the spread. 
We use `tokio` and `tokio-tungstenite` to lock onto the Binance and Bybit Exchange Websocket feeds indefinitely. We push incoming diffs through a `crossbeam` lock-free ring buffer `ArrayQueue` so the detector loop is never blocked by OS I/O.
**PyO3 Integration:** This compiled rust loop is exposed directly as a Python library via the C-API. Python orchestrates it, but the memory-safe execution runs natively.

## 2. Python Orchestration & Middleware
**Why?** Python is excellent for logic, routing, and ML, but slow for raw mathematics. The FastAPI `main.py` is protected by a strict `PyJWT` middleware on all endpoints to prevent unauthorized execution.

## 3. ML Gap Classifier Pipeline
**Why?** Micro-burst network delays can cause a split-second difference where Binance order books arrive 20ms before Bybit. This creates a "fake" arbitrage gap. The `RandomForestClassifier` looks at features (size, depth, time) to intelligently filter out noise. Trades below `MIN_CONFIDENCE=0.85` are dropped.

## 4. Market Regime Detector
**Why?** Arbitrage breaks down if the market is crashing because "slippage" destroys the theoretical spread. The `regime.py` module tracks a rolling `ATR` (Average True Range). If it spikes into `VOLATILE` status, it triggers a kill-switch that pauses the orchestration loops.

## 5. Explainable AI Logs
**Why?** Every "Trade" generates an english string. Instead of just looking at raw JSON numbers, analysts can read the exact rationale for why a simulated trade triggered, making strategy backtesting actually readable.

## 6. Timeseries DB (TimescaleDB)
**Why?** SQLite locks on high concurrency, preventing the dashboard from polling while the engine is writing. We use PostgreSQL patched with TimescaleDB. Using `hypertable` partitioned natively on the `timestamp` column makes querying hundreds of millions of ticks lightning fast for the Recharts UI.

## 7. Frontend Duplex Streaming
**Why?** React frontend polling causes flickering UI. We dropped the Next.js API intercepts in favor of a constant WebSocket (`ws://`) connection pulling delta sets every 500ms, making the `/opportunities` and `/backtest` pages truly reactive.
