use crate::models::Ticker;
use crossbeam::queue::ArrayQueue;
use std::sync::Arc;

pub async fn run_binance_feed(symbol: String, queue: Arc<ArrayQueue<Ticker>>) {
    // Mock pushing into queue
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        let _ = queue.push(Ticker {
            symbol: symbol.clone(),
            bid: 60000.0,
            ask: 60001.0,
        });
    }
}

pub async fn run_bybit_feed(symbol: String, queue: Arc<ArrayQueue<Ticker>>) {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
        let _ = queue.push(Ticker {
            symbol: symbol.clone(),
            // Bybit prices are artificially higher to trigger the gap (buy binance ask, sell bybit bid)
            bid: 60100.0,
            ask: 60101.0,
        });
    }
}
