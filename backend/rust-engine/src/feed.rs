use crate::models::Ticker;
use crossbeam::queue::ArrayQueue;
use futures_util::StreamExt;
use std::sync::Arc;
use tokio_tungstenite::connect_async;

pub async fn run_binance_feed(symbol: String, queue: Arc<ArrayQueue<Ticker>>) {
    // In a real implementation this parses WS streams.
    // For demo/sim purposes we simulate connection and pushing.
    // Replace with: connect_async("wss://stream.binance.com:9443/ws/...")
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        // Mock pushing into queue
    }
}

pub async fn run_bybit_feed(symbol: String, queue: Arc<ArrayQueue<Ticker>>) {
    loop {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        // Mock pushing into queue
    }
}
