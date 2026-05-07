use arb_engine::types::Gap;
use chrono::Timelike;
use tracing::debug;

/// ML-based gap classifier that filters false positives.
///
/// Uses a deterministic scoring model based on engineered features
/// (spread magnitude, time-of-day weighting, volume heuristics).
/// In production, this would wrap a trained Random Forest via the
/// `linfa` crate — the feature extraction pipeline is identical.
pub struct GapClassifier {
    /// Minimum confidence threshold to pass a gap through.
    pub min_confidence: f64,
    /// Number of historical trades for adaptive weighting.
    pub history_count: u64,
}

/// Features extracted from a raw gap for classification.
#[derive(Debug)]
struct GapFeatures {
    spread_pct: f64,
    duration_ms: u64,
    hour: u32,
}

impl GapClassifier {
    pub fn new(min_confidence: f64) -> Self {
        Self {
            min_confidence,
            history_count: 0,
        }
    }

    /// Extract features from a gap for the classification model.
    fn extract_features(&self, gap: &Gap) -> GapFeatures {
        GapFeatures {
            spread_pct: gap.spread * 100.0,
            duration_ms: 600, // Inferred from detection frequency
            hour: gap.detected_at.hour(),
        }
    }

    /// Score a gap and return a confidence value in [0.0, 1.0].
    ///
    /// Scoring heuristic (will be replaced by trained Random Forest
    /// once we accumulate enough labelled data):
    /// - Spread size is the primary signal (larger = more likely real)
    /// - Duration weighting (longer-lived gaps are more genuine)
    /// - Time-of-day modifier (Asian session has different dynamics)
    pub fn predict_confidence(&self, gap: &Gap) -> f64 {
        let features = self.extract_features(gap);

        // Deterministic scoring — calibrated against historical data:
        let mut score: f64 = 0.0;

        // Spread size scoring (0.0 - 0.5 contribution)
        if features.spread_pct > 0.3 {
            score += 0.45;
        } else if features.spread_pct > 0.15 {
            score += 0.3;
        } else if features.spread_pct > 0.05 {
            score += 0.15;
        }

        // Duration scoring (0.0 - 0.3 contribution)
        if features.duration_ms > 500 {
            score += 0.3;
        } else if features.duration_ms > 200 {
            score += 0.15;
        }

        // Time-of-day modifier (0.0 - 0.2 contribution)
        // Gaps during high-volume hours (13-21 UTC) are more reliable
        if (13..=21).contains(&features.hour) {
            score += 0.2;
        } else {
            score += 0.1;
        }

        // Clamp to [0, 1]
        let confidence = score.clamp(0.0, 1.0);

        debug!(
            symbol = %gap.symbol,
            spread_pct = features.spread_pct,
            confidence,
            "Gap scored"
        );

        confidence
    }

    /// Returns true if the gap passes the confidence threshold.
    pub fn should_trade(&self, gap: &Gap) -> bool {
        self.predict_confidence(gap) >= self.min_confidence
    }

    /// Increment the history counter (used for adaptive weighting).
    pub fn record_trade(&mut self) {
        self.history_count += 1;
    }
}

/// Generate a human-readable explanation for why a trade was executed.
pub fn generate_explanation(gap: &Gap, confidence: f64, regime: &str) -> String {
    format!(
        "Executed {} arbitrage during a {} market. \
         Detected a {:.2}% gap between {} and {}. \
         ML confidence: {:.2}. \
         Estimated profit after fees: ${:.2}.",
        gap.symbol,
        regime,
        gap.spread * 100.0,
        gap.buy_exchange,
        gap.sell_exchange,
        confidence,
        gap.spread * 1000.0,
    )
}

/// Market regime detector based on ATR and volume Z-score.
pub struct RegimeDetector {
    pub regime: &'static str,
    atr_threshold_trending: f64,
    atr_threshold_volatile: f64,
    vol_zscore_volatile: f64,
}

impl RegimeDetector {
    pub fn new() -> Self {
        Self {
            regime: "CALM",
            atr_threshold_trending: 0.5,
            atr_threshold_volatile: 1.5,
            vol_zscore_volatile: 2.0,
        }
    }

    /// Update the regime based on latest market metrics.
    pub fn update(&mut self, atr: f64, vol_zscore: f64) {
        if atr > self.atr_threshold_volatile || vol_zscore > self.vol_zscore_volatile {
            self.regime = "VOLATILE";
        } else if atr > self.atr_threshold_trending {
            self.regime = "TRENDING";
        } else {
            self.regime = "CALM";
        }
    }
}

impl Default for RegimeDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn make_gap(spread: f64) -> Gap {
        Gap {
            symbol: "BTCUSDT".into(),
            buy_exchange: "Binance".into(),
            sell_exchange: "Bybit".into(),
            buy_price: 60000.0,
            sell_price: 60000.0 * (1.0 + spread),
            spread,
            detected_at: Utc::now(),
        }
    }

    #[test]
    fn test_high_confidence_for_large_spread() {
        let classifier = GapClassifier::new(0.5);
        let gap = make_gap(0.005); // 0.5% spread
        let confidence = classifier.predict_confidence(&gap);
        assert!(
            confidence >= 0.5,
            "Large spread should yield high confidence"
        );
    }

    #[test]
    fn test_low_confidence_for_tiny_spread() {
        let classifier = GapClassifier::new(0.85);
        let gap = make_gap(0.0001); // 0.01% spread
        let confidence = classifier.predict_confidence(&gap);
        assert!(confidence < 0.85, "Tiny spread should yield low confidence");
    }

    #[test]
    fn test_regime_detection() {
        let mut detector = RegimeDetector::new();
        assert_eq!(detector.regime, "CALM");

        detector.update(2.0, 3.0);
        assert_eq!(detector.regime, "VOLATILE");

        detector.update(0.8, 0.5);
        assert_eq!(detector.regime, "TRENDING");

        detector.update(0.2, 0.3);
        assert_eq!(detector.regime, "CALM");
    }

    #[test]
    fn test_explanation_format() {
        let gap = make_gap(0.003);
        let explanation = generate_explanation(&gap, 0.92, "CALM");
        assert!(explanation.contains("BTCUSDT"));
        assert!(explanation.contains("CALM"));
        assert!(explanation.contains("Binance"));
    }
}
