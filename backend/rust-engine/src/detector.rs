use crate::models::{Gap, Ticker};
use crossbeam::queue::ArrayQueue;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

pub struct Detector {
    binance_q: Arc<ArrayQueue<Ticker>>,
    bybit_q: Arc<ArrayQueue<Ticker>>,
    output_q: Arc<ArrayQueue<Gap>>,
    pub binance_fee: f64,
    pub bybit_fee: f64,
}

impl Detector {
    pub fn new(
        binance_q: Arc<ArrayQueue<Ticker>>,
        bybit_q: Arc<ArrayQueue<Ticker>>,
        output_q: Arc<ArrayQueue<Gap>>,
        binance_fee: f64,
        bybit_fee: f64,
    ) -> Self {
        Detector {
            binance_q,
            bybit_q,
            output_q,
            binance_fee,
            bybit_fee,
        }
    }

    pub async fn run(&self) {
        let mut last_binance = Ticker { symbol: String::new(), bid: 0.0, ask: 0.0 };
        let mut last_bybit = Ticker { symbol: String::new(), bid: 0.0, ask: 0.0 };

        loop {
            let mut processed = false;
            while let Some(t) = self.binance_q.pop() {
                last_binance = t;
                processed = true;
            }
            while let Some(t) = self.bybit_q.pop() {
                last_bybit = t;
                processed = true;
            }

            if processed && !last_binance.symbol.is_empty() && !last_bybit.symbol.is_empty() {
                // Buy Binance, Sell Bybit
                if last_bybit.bid > last_binance.ask {
                    let spread = (last_bybit.bid - last_binance.ask) / last_binance.ask;
                    let real_spread = spread - self.binance_fee - self.bybit_fee;
                    if real_spread > 0.0 {
                        let _ = self.output_q.push(Gap {
                            symbol: last_binance.symbol.clone(),
                            buy_exchange: "Binance".to_string(),
                            sell_exchange: "Bybit".to_string(),
                            buy_price: last_binance.ask,
                            sell_price: last_bybit.bid,
                            size_pct: real_spread,
                        });
                    }
                }
                
                // Buy Bybit, Sell Binance
                if last_binance.bid > last_bybit.ask {
                    let spread = (last_binance.bid - last_bybit.ask) / last_bybit.ask;
                    let real_spread = spread - self.bybit_fee - self.binance_fee;
                    if real_spread > 0.0 {
                        let _ = self.output_q.push(Gap {
                            symbol: last_binance.symbol.clone(),
                            buy_exchange: "Bybit".to_string(),
                            sell_exchange: "Binance".to_string(),
                            buy_price: last_bybit.ask,
                            sell_price: last_binance.bid,
                            size_pct: real_spread,
                        });
                    }
                }
            }
            // Small sleep to yield executor, making it highly responsive
            sleep(Duration::from_millis(5)).await;
        }
    }
}
