# Arbitrage Engine

High-performance cryptocurrency arbitrage detection system built entirely in Rust. Monitors Binance and Bybit in real-time via WebSocket feeds, detects cross-exchange price discrepancies, and filters noise using an ML confidence classifier.

## Architecture

```
Binance WebSocket ──┐
                    ├──→ [DashMap Orderbook] ──→ [Spread Detector] ──→ [ML Filter] ──→ [Trade DB]
Bybit WebSocket ────┘         (lock-free)          (5ms loop)         (confidence)      (in-mem)
                                                                          │
                                                                    ┌─────▼─────┐
                                                                    │   Axum    │
                                                                    │  Server   │
                                                                    └─────┬─────┘
                                                                          │
                                                              ┌───────────┼───────────┐
                                                              │           │           │
                                                          REST API   WebSocket   Dashboard
                                                                      Feed       (HTML)
```

## Key Features

- **Zero-lock orderbook** — DashMap-backed concurrent storage, sub-millisecond queries
- **Real WebSocket feeds** — Live connections to Binance and Bybit with auto-reconnect
- **ML noise filtering** — Confidence-scored gap classification with feature extraction
- **Market regime detection** — ATR/volume-based regime switching (Calm/Trending/Volatile)
- **Paper trading engine** — Full trade lifecycle with P&L tracking
- **Live dashboard** — Embedded HTML dashboard with WebSocket real-time updates
- **Structured logging** — JSON-formatted tracing output

## Project Structure

```
crates/
├── engine/     Core orderbook, detector, exchange WebSocket feeds
├── ml/         ML classifier, regime detection, trade explanation
├── db/         In-memory trade database (SQLx-ready interface)
└── server/     Axum HTTP/WS server, routes, embedded dashboard
```

## Quick Start

```bash
# Build
cargo build --release

# Run (connects to live exchange WebSockets)
cargo run --release

# With custom config
MIN_CONFIDENCE=0.7 PORT=9000 cargo run --release
```

Visit `http://localhost:8000` to see the live dashboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Live dashboard |
| GET | `/bot/status` | Engine status, metrics, regime |
| POST | `/bot/start` | Start the engine |
| POST | `/bot/stop` | Stop the engine |
| GET | `/trades/history` | Recent trade history |
| GET | `/metrics/performance` | Performance metrics + history |
| GET | `/arbitrage/opportunities` | Current opportunities |
| GET | `/regime` | Market regime classification |
| WS | `/ws/feed` | Real-time opportunity feed |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | HTTP server port |
| `MIN_CONFIDENCE` | `0.65` | ML confidence threshold |
| `RUST_LOG` | `info` | Log level filter |

## Testing

```bash
cargo test          # Unit tests
cargo clippy        # Lint check
cargo bench         # Benchmarks (if configured)
```

## Tech Stack

- **Runtime**: Tokio (async)
- **HTTP**: Axum + Tower
- **WebSocket**: tokio-tungstenite
- **Orderbook**: DashMap (lock-free concurrent hashmap)
- **Serialization**: Serde
- **Logging**: tracing + tracing-subscriber (JSON)
- **ML**: Custom feature-engineered classifier (linfa-ready)

## License

MIT
