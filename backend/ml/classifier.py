import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from datetime import datetime

class GapClassifier:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        
        # Mock initial training data for the problem requirement:
        # Features: [size_pct, duration_ms, depth, volume, hour]
        # Label: 1 (real, >500ms), 0 (noise, <100ms)
        X_mock = np.array([
            [1.5, 600, 50.0, 10.0, 14],
            [2.1, 800, 100.0, 20.0, 15],
            [0.1, 50, 5.0, 1.0, 2],
            [0.2, 80, 2.0, 0.5, 3]
        ])
        y_mock = np.array([1, 1, 0, 0])
        
        self.train(X_mock, y_mock)

    def extract_features(self, gap_data: dict) -> np.ndarray:
        # Example gap_data: size_pct, order_book_depth, volume, hour
        size_pct = gap_data.get("size_pct", 0.0)
        duration_ms = gap_data.get("duration", 550) # Inferred or passed from rust
        depth = gap_data.get("depth", 50.0)
        volume = gap_data.get("volume", 5.0)
        hour = datetime.utcnow().hour
        
        return np.array([[size_pct, duration_ms, depth, volume, hour]])

    def train(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)
        self.is_trained = True

    def predict_confidence(self, gap_data: dict) -> float:
        if not self.is_trained:
            return 0.5
            
        features = self.extract_features(gap_data)
        probabilities = self.model.predict_proba(features)
        
        # probabilities[0][1] is the confidence of class 1 (Real Gap)
        return float(probabilities[0][1])

classifier_instance = GapClassifier()
