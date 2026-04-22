use pyo3::prelude::*;
use std::sync::Arc;
use crossbeam::queue::ArrayQueue;
use tokio::runtime::Runtime;

use crate::detector::Detector;
use crate::models::{Gap, Ticker};

#[pyclass]
pub struct RustEngine {
    rt: Runtime,
    binance_q: Arc<ArrayQueue<Ticker>>,
    bybit_q: Arc<ArrayQueue<Ticker>>,
    output_q: Arc<ArrayQueue<Gap>>,
}

#[pymethods]
impl RustEngine {
    #[new]
    pub fn new() -> Self {
        RustEngine {
            rt: Runtime::new().unwrap(),
            binance_q: Arc::new(ArrayQueue::new(1000)),
            bybit_q: Arc::new(ArrayQueue::new(1000)),
            output_q: Arc::new(ArrayQueue::new(1000)),
        }
    }

    pub fn start(&self, binance_fee: f64, bybit_fee: f64) {
        let det = Detector::new(
            self.binance_q.clone(),
            self.bybit_q.clone(),
            self.output_q.clone(),
            binance_fee,
            bybit_fee,
        );
        self.rt.spawn(async move {
            det.run().await;
        });
        
        let sym = "BTC/USDT".to_string();
        let bq = self.binance_q.clone();
        self.rt.spawn(async move {
            crate::feed::run_binance_feed(sym, bq).await;
        });
        
        let sym2 = "BTC/USDT".to_string();
        let yq = self.bybit_q.clone();
        self.rt.spawn(async move {
            crate::feed::run_bybit_feed(sym2, yq).await;
        });
    }

    pub fn poll_gaps(&self) -> Vec<(String, String, String, f64, f64, f64)> {
        let mut res = Vec::new();
        while let Some(g) = self.output_q.pop() {
            res.push((g.symbol, g.buy_exchange, g.sell_exchange, g.buy_price, g.sell_price, g.size_pct));
        }
        res
    }
}
