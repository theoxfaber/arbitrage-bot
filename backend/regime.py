import numpy as np
from datetime import datetime

class MarketRegimeDetector:
    def __init__(self):
        self.current_regime = "CALM"
        self.reason = "Initializing"
        self.atr_history = []
        self.volume_history = []
        
        # In a real impl, we'd keep rolling windows of OHLCV
        # Mocking generic thresholds:
        self.atr_threshold_trending = 0.5
        self.atr_threshold_volatile = 1.5
        
        self.vol_zscore_volatility = 2.0

    def get_regime(self) -> dict:
        return {
            "regime": self.current_regime,
            "reason": self.reason,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    def update_market_data(self, current_atr: float, current_vol_zscore: float):
        if current_atr > self.atr_threshold_volatile or current_vol_zscore > self.vol_zscore_volatility:
            self.current_regime = "VOLATILE"
            self.reason = f"High volatility detected. ATR: {current_atr:.2f}, Vol Z-Score: {current_vol_zscore:.2f}"
            
        elif current_atr > self.atr_threshold_trending:
            self.current_regime = "TRENDING"
            self.reason = f"Directional trend detected. ATR: {current_atr:.2f}"
            
        else:
            self.current_regime = "CALM"
            self.reason = "Market is stable and mean-reverting."

regime_detector = MarketRegimeDetector()
