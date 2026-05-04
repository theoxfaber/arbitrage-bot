use dashmap::DashMap;

use crate::types::Ticker;

/// Thread-safe, lock-free orderbook that stores the latest best bid/ask
/// per symbol per exchange. Backed by DashMap for concurrent reads/writes
/// without mutex contention — critical for sub-millisecond latency.
#[derive(Debug)]
pub struct OrderBook {
    /// Key: "{exchange}:{symbol}", Value: latest Ticker
    entries: DashMap<String, Ticker>,
}

impl OrderBook {
    pub fn new() -> Self {
        Self {
            entries: DashMap::new(),
        }
    }

    /// Upsert the latest ticker for a given exchange and symbol.
    pub fn update(&self, exchange: &str, ticker: Ticker) {
        let key = format!("{}:{}", exchange, ticker.symbol);
        self.entries.insert(key, ticker);
    }

    /// Retrieve the latest ticker for a given exchange and symbol.
    pub fn get(&self, exchange: &str, symbol: &str) -> Option<Ticker> {
        let key = format!("{exchange}:{symbol}");
        self.entries.get(&key).map(|entry| entry.value().clone())
    }

    /// Get all symbols currently tracked.
    pub fn symbols(&self) -> Vec<String> {
        let mut syms: Vec<String> = self
            .entries
            .iter()
            .map(|entry| entry.value().symbol.clone())
            .collect();
        syms.sort();
        syms.dedup();
        syms
    }

    /// Snapshot the entire book — useful for diagnostics.
    pub fn snapshot(&self) -> Vec<(String, Ticker)> {
        self.entries
            .iter()
            .map(|entry| (entry.key().clone(), entry.value().clone()))
            .collect()
    }
}

impl Default for OrderBook {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_update_and_get() {
        let book = OrderBook::new();
        let ticker = Ticker {
            symbol: "BTCUSDT".into(),
            bid: 60000.0,
            ask: 60001.0,
            timestamp: Utc::now(),
        };

        book.update("binance", ticker.clone());

        let retrieved = book.get("binance", "BTCUSDT").unwrap();
        assert_eq!(retrieved.bid, 60000.0);
        assert_eq!(retrieved.ask, 60001.0);
    }

    #[test]
    fn test_missing_entry() {
        let book = OrderBook::new();
        assert!(book.get("binance", "BTCUSDT").is_none());
    }

    #[test]
    fn test_symbols() {
        let book = OrderBook::new();
        book.update(
            "binance",
            Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60000.0,
                ask: 60001.0,
                timestamp: Utc::now(),
            },
        );
        book.update(
            "bybit",
            Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60100.0,
                ask: 60101.0,
                timestamp: Utc::now(),
            },
        );

        let syms = book.symbols();
        assert_eq!(syms, vec!["BTCUSDT"]);
    }
}
