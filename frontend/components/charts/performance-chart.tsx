"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PerformanceData } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import Chart from "chart.js/auto"

interface PerformanceChartProps {
  data: PerformanceData[]
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const { t } = useTranslation()
  const { theme, resolvedTheme } = useTheme()
  const chartRef = useRef<HTMLCanvasElement | null>(null)
  const chartInstance = useRef<Chart | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activePeriod, setActivePeriod] = useState("week")

  useEffect(() => {
    setMounted(true)
  }, [])

  const createChart = (period: string) => {
    if (!chartRef.current || !mounted) return

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Filter data based on selected period
    const filteredData = filterDataByPeriod(data, period)

    // Prepare chart data
    const labels = filteredData.map((item) => new Date(item.timestamp).toLocaleDateString())
    const profitData = filteredData.map((item) => item.profit)
    const cumulativeProfitData = filteredData.map((item, index) => {
      const previousTotal = index > 0 ? filteredData[index - 1].cumulativeProfit : 0
      return previousTotal + item.profit
    })

    // Set chart colors based on theme
    const currentTheme = resolvedTheme || theme
    const textColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
    const gridColor = currentTheme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

    // Create chart
    const ctx = chartRef.current.getContext("2d")
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: t("chart.profit"),
              data: profitData,
              backgroundColor: "rgba(34, 197, 94, 0.2)",
              borderColor: "rgba(34, 197, 94, 1)",
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.2,
            },
            {
              label: t("chart.cumulative_profit"),
              data: cumulativeProfitData,
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
              pointRadius: 3,
              tension: 0.2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 300, // Faster animations
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: textColor,
                font: {
                  family: "'Inter', sans-serif",
                },
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
              },
              backgroundColor: currentTheme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
              titleColor: currentTheme === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
              bodyColor: currentTheme === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
              borderColor: gridColor,
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              usePointStyle: true,
            },
          },
          scales: {
            x: {
              grid: {
                color: gridColor,
                drawBorder: false,
              },
              ticks: {
                color: textColor,
                font: {
                  family: "'Inter', sans-serif",
                },
                maxRotation: 45,
                minRotation: 45,
              },
            },
            y: {
              grid: {
                color: gridColor,
                drawBorder: false,
              },
              ticks: {
                color: textColor,
                font: {
                  family: "'Inter', sans-serif",
                },
                callback: (value) => formatCurrency(value as number),
              },
              beginAtZero: false,
            },
          },
        },
      })
    }
  }

  const filterDataByPeriod = (data: PerformanceData[], period: string) => {
    if (!data || data.length === 0) {
      return []
    }

    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "day":
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "year":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7) // Default to week
    }

    return data.filter((item) => new Date(item.timestamp) >= startDate)
  }

  useEffect(() => {
    if (mounted && data.length > 0) {
      createChart(activePeriod)
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, theme, resolvedTheme, mounted, activePeriod])

  const handlePeriodChange = (period: string) => {
    setActivePeriod(period)
    createChart(period)
  }

  if (!mounted) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md animate-pulse">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
        <p className="text-muted-foreground">{t("chart.no_data")}</p>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Tabs defaultValue="week" onValueChange={handlePeriodChange}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="day" className="transition-colors duration-200">
                {t("chart.periods.day")}
              </TabsTrigger>
              <TabsTrigger value="week" className="transition-colors duration-200">
                {t("chart.periods.week")}
              </TabsTrigger>
              <TabsTrigger value="month" className="transition-colors duration-200">
                {t("chart.periods.month")}
              </TabsTrigger>
              <TabsTrigger value="year" className="transition-colors duration-200">
                {t("chart.periods.year")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="h-[300px] relative">
            <canvas ref={chartRef} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-muted rounded-md p-3 transition-colors duration-200">
              <div className="text-sm text-muted-foreground">{t("chart.total_profit")}</div>
              <div className="text-2xl font-bold">
                {formatCurrency(data.reduce((sum, item) => sum + item.profit, 0))}
              </div>
            </div>
            <div className="bg-muted rounded-md p-3 transition-colors duration-200">
              <div className="text-sm text-muted-foreground">{t("chart.trade_count")}</div>
              <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.tradeCount, 0)}</div>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
