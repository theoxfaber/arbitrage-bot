use std::sync::Arc;

use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio_tungstenite::tungstenite::Message;
use tracing::{error, info, warn};

use crate::orderbook::OrderBook;
use crate::types::Ticker;

/// Binance WebSocket ticker feed.
///
/// Connects to the Binance spot mini-ticker stream and pushes updates
/// into the shared `OrderBook`. Automatically reconnects on failure.
pub async fn run_binance_feed(book: Arc<OrderBook>, symbols: Vec<String>) {
    let streams: Vec<String> = symbols
        .iter()
        .map(|s| format!("{}@bookTicker", s.to_lowercase()))
        .collect();
    let url = format!("wss://stream.binance.com:9443/stream?streams={}", streams.join("/"));

    loop {
        info!(exchange = "binance", "Connecting to WebSocket feed...");
        match tokio_tungstenite::connect_async(&url).await {
            Ok((mut ws, _)) => {
                info!(exchange = "binance", "Connected — streaming {} symbols", symbols.len());

                while let Some(msg) = ws.next().await {
                    match msg {
                        Ok(Message::Text(text)) => {
                            if let Some(ticker) = parse_binance_ticker(&text) {
                                book.update("binance", ticker);
                            }
                        }
                        Ok(Message::Ping(data)) => {
                            let _ = ws.send(Message::Pong(data)).await;
                        }
                        Ok(Message::Close(_)) => {
                            warn!(exchange = "binance", "WebSocket closed by server");
                            break;
                        }
                        Err(e) => {
                            error!(exchange = "binance", error = %e, "WebSocket error");
                            break;
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                error!(exchange = "binance", error = %e, "Failed to connect");
            }
        }

        warn!(exchange = "binance", "Reconnecting in 3 seconds...");
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    }
}

#[derive(Deserialize)]
struct BinanceStreamWrapper {
    data: BinanceBookTicker,
}

#[derive(Deserialize)]
struct BinanceBookTicker {
    s: String,  // Symbol
    b: String,  // Best bid price
    a: String,  // Best ask price
}

fn parse_binance_ticker(raw: &str) -> Option<Ticker> {
    let wrapper: BinanceStreamWrapper = serde_json::from_str(raw).ok()?;
    let bid: f64 = wrapper.data.b.parse().ok()?;
    let ask: f64 = wrapper.data.a.parse().ok()?;

    Some(Ticker {
        symbol: wrapper.data.s,
        bid,
        ask,
        timestamp: Utc::now(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_binance_ticker() {
        let json = r#"{"stream":"btcusdt@bookTicker","data":{"s":"BTCUSDT","b":"60000.00","a":"60001.50"}}"#;
        let ticker = parse_binance_ticker(json).unwrap();
        assert_eq!(ticker.symbol, "BTCUSDT");
        assert_eq!(ticker.bid, 60000.0);
        assert_eq!(ticker.ask, 60001.5);
    }
}
