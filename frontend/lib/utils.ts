import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date)
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + "..."
}

export function calculateKellyCriterion(winRate: number, winLossRatio: number): number {
  // Kelly Criterion formula: f* = (p * b - (1 - p)) / b
  // where f* is the fraction of the current bankroll to wager
  // p is the probability of winning
  // b is the net odds received on the wager (winnings/wager)

  if (winRate <= 0 || winLossRatio <= 0) return 0

  const kellyFraction = (winRate * winLossRatio - (1 - winRate)) / winLossRatio

  // Limit the Kelly fraction to a reasonable range (0-50%)
  return Math.max(0, Math.min(0.5, kellyFraction))
}

export function calculateDrawdown(balanceHistory: number[]): number {
  if (balanceHistory.length < 2) return 0

  let maxDrawdown = 0
  let peak = balanceHistory[0]

  for (let i = 1; i < balanceHistory.length; i++) {
    const currentBalance = balanceHistory[i]

    // Update peak if current balance is higher
    if (currentBalance > peak) {
      peak = currentBalance
    } else {
      // Calculate drawdown as percentage
      const drawdown = (peak - currentBalance) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
  }

  return maxDrawdown
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
