use std::sync::Arc;

use chrono::Utc;
use tokio::sync::mpsc;
use tracing::{debug, info};

use crate::orderbook::OrderBook;
use crate::types::{ExchangeConfig, Gap};

/// Continuously compares best bid/ask across exchanges and emits `Gap`s
/// whenever a profitable spread is detected after fees.
pub struct Detector {
    book: Arc<OrderBook>,
    config: ExchangeConfig,
    gap_tx: mpsc::Sender<Gap>,
}

impl Detector {
    pub fn new(
        book: Arc<OrderBook>,
        config: ExchangeConfig,
        gap_tx: mpsc::Sender<Gap>,
    ) -> Self {
        Self {
            book,
            config,
            gap_tx,
        }
    }

    /// Run the detection loop. Polls the orderbook every 5ms for cross-exchange
    /// price discrepancies. This is the hot path — kept allocation-free.
    pub async fn run(&self) {
        info!("Detector started — scanning {} pairs", self.config.pairs.len());

        loop {
            for symbol in &self.config.pairs {
                self.check_pair(symbol).await;
            }
            tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;
        }
    }

    async fn check_pair(&self, symbol: &str) {
        let binance = match self.book.get("binance", symbol) {
            Some(t) => t,
            None => return,
        };
        let bybit = match self.book.get("bybit", symbol) {
            Some(t) => t,
            None => return,
        };

        // Direction 1: Buy on Binance (ask), Sell on Bybit (bid)
        if bybit.bid > binance.ask {
            let gross_spread = (bybit.bid - binance.ask) / binance.ask;
            let net_spread = gross_spread - self.config.binance_fee - self.config.bybit_fee;

            if net_spread > self.config.min_spread_pct / 100.0 {
                let gap = Gap {
                    symbol: symbol.to_string(),
                    buy_exchange: "Binance".into(),
                    sell_exchange: "Bybit".into(),
                    buy_price: binance.ask,
                    sell_price: bybit.bid,
                    spread: net_spread,
                    detected_at: Utc::now(),
                };
                debug!(
                    symbol,
                    spread = net_spread * 100.0,
                    "Gap detected: buy Binance, sell Bybit"
                );
                let _ = self.gap_tx.send(gap).await;
            }
        }

        // Direction 2: Buy on Bybit (ask), Sell on Binance (bid)
        if binance.bid > bybit.ask {
            let gross_spread = (binance.bid - bybit.ask) / bybit.ask;
            let net_spread = gross_spread - self.config.bybit_fee - self.config.binance_fee;

            if net_spread > self.config.min_spread_pct / 100.0 {
                let gap = Gap {
                    symbol: symbol.to_string(),
                    buy_exchange: "Bybit".into(),
                    sell_exchange: "Binance".into(),
                    buy_price: bybit.ask,
                    sell_price: binance.bid,
                    spread: net_spread,
                    detected_at: Utc::now(),
                };
                debug!(
                    symbol,
                    spread = net_spread * 100.0,
                    "Gap detected: buy Bybit, sell Binance"
                );
                let _ = self.gap_tx.send(gap).await;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_gap_detection() {
        let book = Arc::new(OrderBook::new());
        let config = ExchangeConfig {
            binance_fee: 0.001,
            bybit_fee: 0.001,
            pairs: vec!["BTCUSDT".into()],
            min_spread_pct: 0.01,
        };
        let (tx, mut rx) = mpsc::channel(100);
        let detector = Detector::new(book.clone(), config, tx);

        // Set up a profitable spread: Bybit bid > Binance ask
        book.update(
            "binance",
            crate::types::Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60000.0,
                ask: 60001.0,
                timestamp: Utc::now(),
            },
        );
        book.update(
            "bybit",
            crate::types::Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60200.0,
                ask: 60201.0,
                timestamp: Utc::now(),
            },
        );

        detector.check_pair("BTCUSDT").await;

        let gap = rx.try_recv().expect("Should have detected a gap");
        assert_eq!(gap.buy_exchange, "Binance");
        assert_eq!(gap.sell_exchange, "Bybit");
        assert!(gap.spread > 0.0);
    }

    #[tokio::test]
    async fn test_no_gap_when_spread_too_small() {
        let book = Arc::new(OrderBook::new());
        let config = ExchangeConfig {
            binance_fee: 0.001,
            bybit_fee: 0.001,
            pairs: vec!["BTCUSDT".into()],
            min_spread_pct: 0.5,
        };
        let (tx, mut rx) = mpsc::channel(100);
        let detector = Detector::new(book.clone(), config, tx);

        // Prices too close — no profitable spread after fees
        book.update(
            "binance",
            crate::types::Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60000.0,
                ask: 60001.0,
                timestamp: Utc::now(),
            },
        );
        book.update(
            "bybit",
            crate::types::Ticker {
                symbol: "BTCUSDT".into(),
                bid: 60002.0,
                ask: 60003.0,
                timestamp: Utc::now(),
            },
        );

        detector.check_pair("BTCUSDT").await;

        assert!(rx.try_recv().is_err(), "Should NOT detect a gap");
    }
}
