use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Ticker {
    pub symbol: String,
    pub bid: f64,
    pub ask: f64,
}

#[derive(Debug, Clone)]
pub struct Gap {
    pub symbol: String,
    pub buy_exchange: String,
    pub sell_exchange: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub size_pct: f64,
}
