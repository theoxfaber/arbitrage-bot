from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class BotStatusStrategies(BaseModel):
    triangular: bool
    spotToSpot: bool
    spotToFutures: bool
    statistical: bool

class BotStatusThresholds(BaseModel):
    triangular: float
    spotToSpot: float
    spotToFutures: float
    statistical: float

class BotStatus(BaseModel):
    running: bool
    uptime: int
    startTime: str
    systemLoad: float
    memoryUsage: float
    strategies: BotStatusStrategies
    thresholds: BotStatusThresholds
    alerts: List[str]

class PerformanceData(BaseModel):
    timestamp: str
    profit: float
    cumulativeProfit: float
    tradeCount: int

class MLPrediction(BaseModel):
    pairSymbol: str
    strategyType: str
    probability: float
    expectedProfit: float
    confidence: float
    direction: str

class PerformanceMetrics(BaseModel):
    totalProfit: float
    profitChange: float
    totalTrades: int
    winRate: float
    maxDrawdown: float
    currentExposure: float
    performanceHistory: List[PerformanceData]
    mlPredictions: List[MLPrediction]

class Trade(BaseModel):
    id: str
    timestamp: str
    symbol: str
    strategy: str
    exchange: str
    volume: float
    profit: float
    status: str
    executionTime: str
    explanation: Optional[str] = None

class ArbitrageOpportunity(BaseModel):
    id: str
    timestamp: str
    symbol: str
    strategy: str
    exchanges: List[str]
    profitPercentage: float
    expectedProfit: float
    confidence: float

class RiskSettings(BaseModel):
    maxPositionSize: float
    stopLossPercentage: float
    maxCapitalPerExchange: float
    useKellyCriterion: bool
    useHedging: bool
