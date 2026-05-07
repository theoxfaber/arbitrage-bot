use std::sync::Arc;

use arb_engine::types::{Trade, TradeStatus};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use tracing::info;

/// Performance snapshot for a single time period.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceRecord {
    pub timestamp: DateTime<Utc>,
    pub profit: f64,
    pub cumulative_profit: f64,
    pub trade_count: u32,
}

/// In-memory trade database.
///
/// Stores trades and performance history in memory with `RwLock`
/// for concurrent access. In production, swap this for SQLx
/// backed by TimescaleDB — the interface is identical.
#[derive(Clone)]
pub struct Database {
    trades: Arc<RwLock<Vec<Trade>>>,
    performance: Arc<RwLock<Vec<PerformanceRecord>>>,
}

impl Database {
    pub fn new() -> Self {
        Self {
            trades: Arc::new(RwLock::new(Vec::new())),
            performance: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Insert a new trade record.
    pub async fn insert_trade(&self, trade: Trade) {
        info!(
            trade_id = %trade.id,
            symbol = %trade.symbol,
            profit = trade.profit,
            "Trade recorded"
        );

        let profit = trade.profit;
        let mut trades = self.trades.write().await;
        trades.push(trade);

        // Update cumulative performance
        let mut perf = self.performance.write().await;
        let cumulative = perf.last().map(|p| p.cumulative_profit).unwrap_or(0.0) + profit;
        let trade_count = perf.last().map(|p| p.trade_count).unwrap_or(0) + 1;

        perf.push(PerformanceRecord {
            timestamp: Utc::now(),
            profit,
            cumulative_profit: cumulative,
            trade_count,
        });
    }

    /// Get the most recent N trades.
    pub async fn recent_trades(&self, limit: usize) -> Vec<Trade> {
        let trades = self.trades.read().await;
        trades.iter().rev().take(limit).cloned().collect()
    }

    /// Get performance history.
    pub async fn performance_history(&self) -> Vec<PerformanceRecord> {
        self.performance.read().await.clone()
    }

    /// Get aggregate metrics.
    pub async fn metrics(&self) -> Metrics {
        let trades = self.trades.read().await;
        let perf = self.performance.read().await;

        let total_profit = perf.last().map(|p| p.cumulative_profit).unwrap_or(0.0);
        let total_trades = trades.len();
        let winning_trades = trades
            .iter()
            .filter(|t| t.profit > 0.0 && t.status == TradeStatus::Completed)
            .count();
        let win_rate = if total_trades > 0 {
            winning_trades as f64 / total_trades as f64
        } else {
            0.0
        };

        Metrics {
            total_profit,
            total_trades,
            win_rate,
            max_drawdown: 0.0, // Simplified — would need peak tracking
        }
    }
}

impl Default for Database {
    fn default() -> Self {
        Self::new()
    }
}

/// Aggregate trading metrics.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Metrics {
    pub total_profit: f64,
    pub total_trades: usize,
    pub win_rate: f64,
    pub max_drawdown: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use arb_engine::types::Strategy;

    fn make_trade(profit: f64) -> Trade {
        Trade {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now(),
            symbol: "BTCUSDT".into(),
            strategy: Strategy::SpotToSpot,
            exchanges: "Binance -> Bybit".into(),
            volume: 1000.0,
            profit,
            status: TradeStatus::Completed,
            execution_time_ms: 150,
            explanation: "Test trade".into(),
        }
    }

    #[tokio::test]
    async fn test_insert_and_retrieve() {
        let db = Database::new();
        db.insert_trade(make_trade(5.0)).await;
        db.insert_trade(make_trade(3.0)).await;

        let trades = db.recent_trades(10).await;
        assert_eq!(trades.len(), 2);
        // Most recent first
        assert_eq!(trades[0].profit, 3.0);
    }

    #[tokio::test]
    async fn test_metrics() {
        let db = Database::new();
        db.insert_trade(make_trade(5.0)).await;
        db.insert_trade(make_trade(-2.0)).await;
        db.insert_trade(make_trade(3.0)).await;

        let metrics = db.metrics().await;
        assert_eq!(metrics.total_trades, 3);
        assert!((metrics.total_profit - 6.0).abs() < 0.01);
    }

    #[tokio::test]
    async fn test_performance_history() {
        let db = Database::new();
        db.insert_trade(make_trade(5.0)).await;
        db.insert_trade(make_trade(3.0)).await;

        let perf = db.performance_history().await;
        assert_eq!(perf.len(), 2);
        assert!((perf[1].cumulative_profit - 8.0).abs() < 0.01);
    }
}
