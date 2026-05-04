import axios from "axios"
import type {
  BotStatus,
  PerformanceMetrics,
  Trade,
  ArbitrageOpportunity,
  RiskSettings,
  StrategySettings,
} from "./types"
import { generateRandomId } from "./utils"

// Modify the API creation and interceptors to always use mock data in development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Flag to force using mock data (set to true for development/preview)
const FORCE_MOCK_DATA = false

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle API errors
    console.error("API Error:", error.message || "Unknown error")

    // Always return mock data in development or if forced
    return handleMockResponse(error.config)
  },
)

// Mock data generator for demo purposes
const handleMockResponse = (config: any) => {
  const endpoint = config.url.replace(API_BASE_URL, "")

  // Generate appropriate mock data based on endpoint
  switch (endpoint) {
    case "/bot/status":
      return Promise.resolve({ data: generateMockBotStatus() })
    case "/metrics/performance":
      return Promise.resolve({ data: generateMockPerformanceMetrics() })
    case "/trades/history":
      return Promise.resolve({ data: generateMockTradeHistory() })
    case "/arbitrage/opportunities":
      return Promise.resolve({ data: generateMockArbitrageOpportunities() })
    default:
      return Promise.resolve({ data: { success: true } })
  }
}

// API Functions - Update all to safely handle errors and always return mock data if needed
export async function fetchBotStatus(): Promise<BotStatus> {
  try {
    if (FORCE_MOCK_DATA) {
      return generateMockBotStatus()
    }

    const response = await api.get("/bot/status")
    return response.data
  } catch (error) {
    console.error("Error fetching bot status:", error)
    return generateMockBotStatus()
  }
}

export async function fetchPerformanceMetrics(): Promise<PerformanceMetrics> {
  try {
    if (FORCE_MOCK_DATA) {
      return generateMockPerformanceMetrics()
    }

    const response = await api.get("/metrics/performance")
    return response.data
  } catch (error) {
    console.error("Error fetching performance metrics:", error)
    return generateMockPerformanceMetrics()
  }
}

export async function fetchTradeHistory(): Promise<Trade[]> {
  try {
    if (FORCE_MOCK_DATA) {
      return generateMockTradeHistory()
    }

    const response = await api.get("/trades/history")
    return response.data
  } catch (error) {
    console.error("Error fetching trade history:", error)
    return generateMockTradeHistory()
  }
}

export async function fetchArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
  try {
    if (FORCE_MOCK_DATA) {
      return generateMockArbitrageOpportunities()
    }

    const response = await api.get("/arbitrage/opportunities")
    return response.data
  } catch (error) {
    console.error("Error fetching arbitrage opportunities:", error)
    return generateMockArbitrageOpportunities()
  }
}

export async function startBot(): Promise<{ success: boolean }> {
  try {
    if (FORCE_MOCK_DATA) {
      return { success: true }
    }

    const response = await api.post("/bot/start")
    return response.data
  } catch (error) {
    console.error("Error starting bot:", error)
    return { success: true }
  }
}

export async function stopBot(): Promise<{ success: boolean }> {
  try {
    if (FORCE_MOCK_DATA) {
      return { success: true }
    }

    const response = await api.post("/bot/stop")
    return response.data
  } catch (error) {
    console.error("Error stopping bot:", error)
    return { success: true }
  }
}

export async function executeTrade(opportunityId: string): Promise<{ success: boolean }> {
  try {
    if (FORCE_MOCK_DATA) {
      // Simulate network delay for better UX feedback
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Randomly succeed or fail (80% success rate)
      const isSuccess = Math.random() > 0.2

      if (!isSuccess) {
        throw new Error("Simulated trade execution failure")
      }

      return { success: true }
    }

    const response = await api.post(`/trades/execute/${opportunityId}`)
    return response.data
  } catch (error) {
    console.error("Error executing trade:", error)
    throw error // Re-throw to allow proper error handling
  }
}

export async function updateRiskSettings(settings: RiskSettings): Promise<{ success: boolean }> {
  try {
    if (FORCE_MOCK_DATA) {
      return { success: true }
    }

    const response = await api.post("/settings/risk", settings)
    return response.data
  } catch (error) {
    console.error("Error updating risk settings:", error)
    return { success: true }
  }
}

export async function updateStrategySettings(settings: StrategySettings): Promise<{ success: boolean }> {
  try {
    if (FORCE_MOCK_DATA) {
      return { success: true }
    }

    const response = await api.post("/settings/strategies", settings)
    return response.data
  } catch (error) {
    console.error("Error updating strategy settings:", error)
    return { success: true }
  }
}

// Mock Data Generators
function generateMockBotStatus(): BotStatus {
  return {
    running: Math.random() > 0.3,
    uptime: Math.floor(Math.random() * 86400 * 7), // Up to 7 days in seconds
    startTime: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    systemLoad: Math.random() * 80,
    memoryUsage: Math.random() * 70,
    strategies: {
      triangular: true,
      spotToSpot: true,
      spotToFutures: false,
      statistical: true,
    },
    thresholds: {
      triangular: 0.5,
      spotToSpot: 0.3,
      spotToFutures: 0.4,
      statistical: 0.6,
    },
    alerts: Math.random() > 0.7 ? ["API rate limit warning", "High volatility detected"] : [],
  }
}

function generateMockPerformanceMetrics(): PerformanceMetrics {
  // Generate performance history for the last 30 days
  const performanceHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))

    const dailyProfit = Math.random() * 200 - 50 // Between -50 and 150
    const tradeCount = Math.floor(Math.random() * 20) + 1

    return {
      timestamp: date.toISOString(),
      profit: dailyProfit,
      cumulativeProfit: 0, // Will be calculated later
      tradeCount,
    }
  })

  // Calculate cumulative profit
  let cumulativeProfit = 0
  performanceHistory.forEach((day) => {
    cumulativeProfit += day.profit
    day.cumulativeProfit = cumulativeProfit
  })

  // Generate ML predictions
  const mlPredictions = Array.from({ length: 5 }, () => {
    const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT", "DOT/USDT"]
    const strategies = ["triangular", "spot-to-spot", "spot-to-futures", "statistical"]
    const directions = ["up", "down", "neutral"]

    return {
      pairSymbol: symbols[Math.floor(Math.random() * symbols.length)],
      strategyType: strategies[Math.floor(Math.random() * strategies.length)],
      probability: Math.random() * 0.9 + 0.1, // Between 0.1 and 1.0
      expectedProfit: Math.random() * 5, // Between 0 and 5%
      confidence: Math.random() * 0.9 + 0.1, // Between 0.1 and 1.0
      direction: directions[Math.floor(Math.random() * directions.length)],
    }
  })

  return {
    totalProfit: cumulativeProfit,
    profitChange: Math.random() * 10 - 3, // Between -3% and 7%
    totalTrades: performanceHistory.reduce((sum, day) => sum + day.tradeCount, 0),
    winRate: Math.random() * 0.4 + 0.5, // Between 50% and 90%
    maxDrawdown: Math.random() * 0.2, // Between 0% and 20%
    currentExposure: Math.random() * 5000, // Between 0 and 5000 USD
    performanceHistory,
    mlPredictions,
  }
}

function generateMockTradeHistory(): Trade[] {
  const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT", "DOT/USDT"]
  const strategies = ["triangular", "spot-to-spot", "spot-to-futures", "statistical"]
  const exchanges = ["Binance", "WazirX", "Binance → WazirX"]
  const statuses = ["completed", "failed", "pending"]

  return Array.from({ length: 20 }, (_, i) => {
    const timestamp = new Date()
    timestamp.setHours(timestamp.getHours() - i * 2)

    const executionTime = new Date(timestamp)
    executionTime.setSeconds(executionTime.getSeconds() + Math.floor(Math.random() * 30))

    const profit = Math.random() * 100 - 20 // Between -20 and 80

    return {
      id: generateRandomId(),
      timestamp: timestamp.toISOString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
      volume: Math.random() * 1000 + 100, // Between 100 and 1100
      profit,
      status: profit > 0 ? "completed" : statuses[Math.floor(Math.random() * statuses.length)],
      executionTime: executionTime.toISOString(),
    }
  })
}

function generateMockArbitrageOpportunities(): ArbitrageOpportunity[] {
  const symbols = ["BTC/USDT", "ETH/USDT", "BNB/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT", "DOT/USDT"]
  const strategies = ["triangular", "spot-to-spot", "spot-to-futures", "statistical"]
  const exchangePairs = [
    ["Binance", "WazirX"],
    ["Binance", "Bybit"],
    ["WazirX", "Binance"],
    ["Binance Spot", "Binance Futures"],
  ]

  return Array.from({ length: 10 }, () => {
    const timestamp = new Date()
    timestamp.setMinutes(timestamp.getMinutes() - Math.floor(Math.random() * 30))

    const profitPercentage = Math.random() * 3 + 0.1 // Between 0.1% and 3.1%
    const expectedProfit = Math.random() * 50 + 5 // Between 5 and 55 USD

    return {
      id: generateRandomId(),
      timestamp: timestamp.toISOString(),
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      exchanges: exchangePairs[Math.floor(Math.random() * exchangePairs.length)],
      profitPercentage: profitPercentage / 100, // Convert to decimal
      expectedProfit,
      confidence: Math.random() * 0.7 + 0.3, // Between 0.3 and 1.0
    }
  })
}
