use std::sync::Arc;

use arb_db::Database;
use arb_engine::types::Opportunity;
use arb_ml::{GapClassifier, RegimeDetector};
use tokio::sync::RwLock;

/// Shared application state available to all Axum handlers.
#[derive(Clone)]
pub struct AppState {
    pub db: Database,
    pub classifier: Arc<RwLock<GapClassifier>>,
    pub regime: Arc<RwLock<RegimeDetector>>,
    pub opportunities: Arc<RwLock<Vec<Opportunity>>>,
    pub is_running: Arc<RwLock<bool>>,
    pub start_time: Arc<RwLock<Option<chrono::DateTime<chrono::Utc>>>>,
}

impl AppState {
    pub fn new(min_confidence: f64) -> Self {
        Self {
            db: Database::new(),
            classifier: Arc::new(RwLock::new(GapClassifier::new(min_confidence))),
            regime: Arc::new(RwLock::new(RegimeDetector::new())),
            opportunities: Arc::new(RwLock::new(Vec::new())),
            is_running: Arc::new(RwLock::new(false)),
            start_time: Arc::new(RwLock::new(None)),
        }
    }
}
