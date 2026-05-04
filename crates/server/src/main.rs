mod routes;
mod state;
mod ws;

use std::sync::Arc;

use arb_engine::detector::Detector;
use arb_engine::exchanges::{binance, bybit};
use arb_engine::orderbook::OrderBook;
use arb_engine::types::{ExchangeConfig, Opportunity, Strategy, Trade, TradeStatus};
use arb_ml::generate_explanation;
use axum::routing::{get, post};
use axum::Router;
use chrono::Utc;
use tokio::sync::mpsc;
use tower_http::cors::{Any, CorsLayer};
use tracing::{info, warn};
use tracing_subscriber::EnvFilter;

use crate::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env if present
    let _ = dotenvy::dotenv();

    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .json()
        .init();

    // Configuration
    let config = ExchangeConfig::default();
    let min_confidence: f64 = std::env::var("MIN_CONFIDENCE")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(0.65);
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(8000);

    info!(
        pairs = ?config.pairs,
        min_confidence,
        port,
        "Starting Arbitrage Engine"
    );

    // Shared state
    let state = AppState::new(min_confidence);

    // Orderbook + detector
    let book = Arc::new(OrderBook::new());
    let (gap_tx, gap_rx) = mpsc::channel(1000);
    let detector = Detector::new(book.clone(), config.clone(), gap_tx);

    // Spawn exchange feeds
    let binance_book = book.clone();
    let binance_symbols = config.pairs.clone();
    tokio::spawn(async move {
        binance::run_binance_feed(binance_book, binance_symbols).await;
    });

    let bybit_book = book.clone();
    let bybit_symbols = config.pairs.clone();
    tokio::spawn(async move {
        bybit::run_bybit_feed(bybit_book, bybit_symbols).await;
    });

    // Spawn detector
    tokio::spawn(async move {
        detector.run().await;
    });

    // Spawn gap processor (orchestrator)
    let orchestrator_state = state.clone();
    tokio::spawn(async move {
        process_gaps(gap_rx, orchestrator_state).await;
    });

    // Build Axum router
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(routes::dashboard))
        .route("/bot/status", get(routes::get_status))
        .route("/bot/start", post(routes::start_bot))
        .route("/bot/stop", post(routes::stop_bot))
        .route("/trades/history", get(routes::get_trades))
        .route("/metrics/performance", get(routes::get_performance))
        .route("/arbitrage/opportunities", get(routes::get_opportunities))
        .route("/regime", get(routes::get_regime))
        .route("/ws/feed", get(ws::ws_handler))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    info!("Dashboard: http://localhost:{port}");
    info!("API: http://localhost:{port}/bot/status");
    info!("WebSocket: ws://localhost:{port}/ws/feed");

    axum::serve(listener, app).await?;
    Ok(())
}

/// Main orchestration loop — consumes gaps from the detector,
/// runs them through ML classification, generates trades.
async fn process_gaps(mut rx: mpsc::Receiver<arb_engine::types::Gap>, state: AppState) {
    while let Some(gap) = rx.recv().await {
        let is_running = *state.is_running.read().await;
        if !is_running {
            continue;
        }

        // Update regime (simulated — in prod, feed real ATR/volume data)
        {
            let mut regime = state.regime.write().await;
            let atr = gap.spread * 100.0 + 0.3; // Proxy metric
            let vol_z = gap.spread * 50.0;
            regime.update(atr, vol_z);

            if regime.regime == "VOLATILE" {
                warn!("Volatile regime — skipping gap");
                continue;
            }
        }

        // ML classification
        let (confidence, should_trade, regime_str) = {
            let classifier = state.classifier.read().await;
            let regime = state.regime.read().await;
            (
                classifier.predict_confidence(&gap),
                classifier.should_trade(&gap),
                regime.regime.to_string(),
            )
        };

        if !should_trade {
            continue;
        }

        let explanation = generate_explanation(&gap, confidence, &regime_str);

        let opportunity = Opportunity {
            id: uuid::Uuid::new_v4().to_string(),
            expected_profit_usd: gap.spread * 1000.0,
            confidence,
            strategy: Strategy::SpotToSpot,
            explanation: explanation.clone(),
            gap: gap.clone(),
        };

        // Store opportunity
        {
            let mut opps = state.opportunities.write().await;
            opps.insert(0, opportunity);
            opps.truncate(20);
        }

        // Execute paper trade
        let trade = Trade {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            symbol: gap.symbol.clone(),
            strategy: Strategy::SpotToSpot,
            exchanges: format!("{} -> {}", gap.buy_exchange, gap.sell_exchange),
            volume: 1000.0,
            profit: gap.spread * 1000.0 * 0.95,
            status: TradeStatus::Completed,
            execution_time_ms: 150,
            explanation,
        };

        state.db.insert_trade(trade).await;

        // Update classifier history
        {
            let mut classifier = state.classifier.write().await;
            classifier.record_trade();
        }
    }
}
