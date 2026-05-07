use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{Html, IntoResponse};
use axum::Json;
use chrono::Utc;
use serde::Serialize;

use crate::state::AppState;

// ── Status Endpoint ──────────────────────────────────────────────────

#[derive(Serialize)]
pub struct BotStatusResponse {
    pub running: bool,
    pub uptime_secs: i64,
    pub start_time: Option<String>,
    pub regime: String,
    pub opportunities_count: usize,
    pub total_trades: usize,
    pub total_profit: f64,
    pub win_rate: f64,
}

pub async fn get_status(State(state): State<AppState>) -> Json<BotStatusResponse> {
    let is_running = *state.is_running.read().await;
    let start_time = *state.start_time.read().await;
    let regime = state.regime.read().await;
    let opps = state.opportunities.read().await;
    let metrics = state.db.metrics().await;

    let uptime = start_time
        .map(|s| (Utc::now() - s).num_seconds())
        .unwrap_or(0);

    Json(BotStatusResponse {
        running: is_running,
        uptime_secs: uptime,
        start_time: start_time.map(|s| s.to_rfc3339()),
        regime: regime.regime.to_string(),
        opportunities_count: opps.len(),
        total_trades: metrics.total_trades,
        total_profit: metrics.total_profit,
        win_rate: metrics.win_rate,
    })
}

// ── Start / Stop ─────────────────────────────────────────────────────

pub async fn start_bot(State(state): State<AppState>) -> impl IntoResponse {
    let mut running = state.is_running.write().await;
    if *running {
        return (
            StatusCode::CONFLICT,
            Json(serde_json::json!({"error": "Already running"})),
        );
    }
    *running = true;
    *state.start_time.write().await = Some(Utc::now());
    (StatusCode::OK, Json(serde_json::json!({"success": true})))
}

pub async fn stop_bot(State(state): State<AppState>) -> impl IntoResponse {
    let mut running = state.is_running.write().await;
    *running = false;
    *state.start_time.write().await = None;
    (StatusCode::OK, Json(serde_json::json!({"success": true})))
}

// ── Trade History ────────────────────────────────────────────────────

pub async fn get_trades(State(state): State<AppState>) -> impl IntoResponse {
    let trades = state.db.recent_trades(50).await;
    Json(trades)
}

// ── Performance Metrics ──────────────────────────────────────────────

pub async fn get_performance(State(state): State<AppState>) -> impl IntoResponse {
    let history = state.db.performance_history().await;
    let metrics = state.db.metrics().await;

    Json(serde_json::json!({
        "total_profit": metrics.total_profit,
        "total_trades": metrics.total_trades,
        "win_rate": metrics.win_rate,
        "max_drawdown": metrics.max_drawdown,
        "performance_history": history,
    }))
}

// ── Opportunities ────────────────────────────────────────────────────

pub async fn get_opportunities(State(state): State<AppState>) -> impl IntoResponse {
    let opps = state.opportunities.read().await;
    Json(opps.clone())
}

// ── Regime ───────────────────────────────────────────────────────────

pub async fn get_regime(State(state): State<AppState>) -> impl IntoResponse {
    let regime = state.regime.read().await;
    Json(serde_json::json!({
        "regime": regime.regime,
        "timestamp": Utc::now().to_rfc3339(),
    }))
}

// ── Dashboard ────────────────────────────────────────────────────────

pub async fn dashboard() -> Html<&'static str> {
    Html(include_str!("dashboard.html"))
}
