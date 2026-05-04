use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Raw ticker update from an exchange WebSocket feed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticker {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
    pub timestamp: DateTime<Utc>,
}

/// A detected price gap between two exchanges.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Gap {
    pub symbol: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: f64,
    pub sell_price: f64,
    /// Net spread after fees, as a fraction (e.g. 0.0015 = 0.15%).
    pub spread: f64,
    pub detected_at: DateTime<Utc>,
}

/// A fully qualified arbitrage opportunity that passed ML filtering.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Opportunity {
    pub id: String,
    pub gap: Gap,
    pub confidence: f64,
    pub expected_profit_usd: f64,
    pub strategy: Strategy,
    pub explanation: String,
}

/// Market regime classification.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum MarketRegime {
    Calm,
    Trending,
    Volatile,
}

impl std::fmt::Display for MarketRegime {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Calm => write!(f, "CALM"),
            Self::Trending => write!(f, "TRENDING"),
            Self::Volatile => write!(f, "VOLATILE"),
        }
    }
}

/// Supported arbitrage strategies.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Strategy {
    SpotToSpot,
    Triangular,
    SpotToFutures,
    Statistical,
}

impl std::fmt::Display for Strategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SpotToSpot => write!(f, "spot-to-spot"),
            Self::Triangular => write!(f, "triangular"),
            Self::SpotToFutures => write!(f, "spot-to-futures"),
            Self::Statistical => write!(f, "statistical"),
        }
    }
}

/// Configuration for exchange connections.
#[derive(Debug, Clone, Deserialize)]
pub struct ExchangeConfig {
    pub binance_fee: f64,
    pub bybit_fee: f64,
    pub pairs: Vec<String>,
    pub min_spread_pct: f64,
}

impl Default for ExchangeConfig {
    fn default() -> Self {
        Self {
            binance_fee: 0.001,
            bybit_fee: 0.001,
            pairs: vec![
                "BTCUSDT".into(),
                "ETHUSDT".into(),
                "SOLUSDT".into(),
            ],
            min_spread_pct: 0.05,
        }
    }
}

/// Paper trade record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub symbol: String,
    pub strategy: Strategy,
    pub exchanges: String,
    pub volume: f64,
    pub profit: f64,
    pub status: TradeStatus,
    pub execution_time_ms: u64,
    pub explanation: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TradeStatus {
    Completed,
    Failed,
    Pending,
}
