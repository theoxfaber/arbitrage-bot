use std::sync::Arc;

use chrono::Utc;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use tokio_tungstenite::tungstenite::Message;
use tracing::{error, info, warn};

use crate::orderbook::OrderBook;
use crate::types::Ticker;

/// Bybit WebSocket ticker feed.
///
/// Connects to the Bybit v5 public ticker stream and pushes updates
/// into the shared `OrderBook`. Automatically reconnects on failure.
pub async fn run_bybit_feed(book: Arc<OrderBook>, symbols: Vec<String>) {
    let url = "wss://stream.bybit.com/v5/public/spot";

    loop {
        info!(exchange = "bybit", "Connecting to WebSocket feed...");
        match tokio_tungstenite::connect_async(url).await {
            Ok((mut ws, _)) => {
                info!(
                    exchange = "bybit",
                    "Connected — subscribing to {} symbols",
                    symbols.len()
                );

                // Subscribe to tickers
                let args: Vec<String> = symbols.iter().map(|s| format!("tickers.{s}")).collect();
                let sub_msg = serde_json::json!({
                    "op": "subscribe",
                    "args": args,
                });
                if let Err(e) = ws.send(Message::Text(sub_msg.to_string())).await {
                    error!(exchange = "bybit", error = %e, "Failed to send subscription");
                    continue;
                }

                while let Some(msg) = ws.next().await {
                    match msg {
                        Ok(Message::Text(text)) => {
                            if let Some(ticker) = parse_bybit_ticker(&text) {
                                book.update("bybit", ticker);
                            }
                        }
                        Ok(Message::Ping(data)) => {
                            let _ = ws.send(Message::Pong(data)).await;
                        }
                        Ok(Message::Close(_)) => {
                            warn!(exchange = "bybit", "WebSocket closed by server");
                            break;
                        }
                        Err(e) => {
                            error!(exchange = "bybit", error = %e, "WebSocket error");
                            break;
                        }
                        _ => {}
                    }
                }
            }
            Err(e) => {
                error!(exchange = "bybit", error = %e, "Failed to connect");
            }
        }

        warn!(exchange = "bybit", "Reconnecting in 3 seconds...");
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    }
}

#[derive(Deserialize)]
struct BybitTickerMessage {
    topic: Option<String>,
    data: Option<BybitTickerData>,
}

#[derive(Deserialize)]
struct BybitTickerData {
    symbol: String,
    #[serde(rename = "bid1Price")]
    bid1_price: String,
    #[serde(rename = "ask1Price")]
    ask1_price: String,
}

fn parse_bybit_ticker(raw: &str) -> Option<Ticker> {
    let msg: BybitTickerMessage = serde_json::from_str(raw).ok()?;

    // Only process ticker data messages (not subscription confirmations)
    let _ = msg.topic.as_ref().filter(|t| t.starts_with("tickers."))?;
    let data = msg.data?;

    let bid: f64 = data.bid1_price.parse().ok()?;
    let ask: f64 = data.ask1_price.parse().ok()?;

    // Skip zero-price updates
    if bid == 0.0 || ask == 0.0 {
        return None;
    }

    Some(Ticker {
        symbol: data.symbol,
        bid,
        ask,
        timestamp: Utc::now(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_bybit_ticker() {
        let json = r#"{"topic":"tickers.BTCUSDT","type":"snapshot","data":{"symbol":"BTCUSDT","bid1Price":"60000.00","ask1Price":"60001.50"}}"#;
        let ticker = parse_bybit_ticker(json).unwrap();
        assert_eq!(ticker.symbol, "BTCUSDT");
        assert_eq!(ticker.bid, 60000.0);
        assert_eq!(ticker.ask, 60001.5);
    }

    #[test]
    fn test_ignore_subscription_ack() {
        let json = r#"{"success":true,"ret_msg":"subscribe","op":"subscribe"}"#;
        assert!(parse_bybit_ticker(json).is_none());
    }
}
