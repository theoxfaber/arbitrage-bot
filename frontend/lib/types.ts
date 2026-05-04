// Bot Status Types
export interface BotStatus {
  running: boolean
  uptime: number
  startTime: string
  systemLoad: number
  memoryUsage: number
  strategies: {
    triangular: boolean
    spotToSpot: boolean
    spotToFutures: boolean
    statistical: boolean
  }
  thresholds: {
    triangular: number
    spotToSpot: number
    spotToFutures: number
    statistical: number
  }
  alerts: string[]
}

// Performance Metrics Types
export interface PerformanceData {
  timestamp: string
  profit: number
  cumulativeProfit: number
  tradeCount: number
}

export interface MLPrediction {
  pairSymbol: string
  strategyType: string
  probability: number
  expectedProfit: number
  confidence: number
  direction: string
}

export interface PerformanceMetrics {
  totalProfit: number
  profitChange: number
  totalTrades: number
  winRate: number
  maxDrawdown: number
  currentExposure: number
  performanceHistory: PerformanceData[]
  mlPredictions: MLPrediction[]
}

// Trade Types
export interface Trade {
  id: string
  timestamp: string
  symbol: string
  strategy: string
  exchange: string
  volume: number
  profit: number
  status: string
  executionTime: string
}

// Arbitrage Opportunity Types
export interface ArbitrageOpportunity {
  id: string
  timestamp: string
  symbol: string
  strategy: string
  exchanges: string[]
  profitPercentage: number
  expectedProfit: number
  confidence: number
}

// Risk Management Types
export interface RiskSettings {
  maxPositionSize: number
  stopLossPercentage: number
  maxCapitalPerExchange: number
  useKellyCriterion: boolean
  useHedging: boolean
}

// Strategy Settings Types
export interface StrategySettings {
  strategies: {
    triangular: boolean
    spotToSpot: boolean
    spotToFutures: boolean
    statistical: boolean
  }
  thresholds: {
    triangular: number
    spotToSpot: number
    spotToFutures: number
    statistical: number
  }
}
