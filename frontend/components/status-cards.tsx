"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import type { BotStatus, PerformanceMetrics } from "@/lib/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { TrendingUp, TrendingDown, Clock, Activity, Cpu } from "lucide-react"
import { useState, useEffect } from "react"

interface StatusCardsProps {
  botStatus: BotStatus | null
  metrics: PerformanceMetrics | null
}

export default function StatusCards({ botStatus, metrics }: StatusCardsProps) {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getUptimeString = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60))
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60))
    const minutes = Math.floor((uptime % (60 * 60)) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6 h-24"></CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{t("status.total_profit")}</p>
            <h3 className="text-2xl font-bold transition-all duration-300">
              {formatCurrency(metrics?.totalProfit || 0)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.profitChange && metrics.profitChange > 0 ? (
                <span className="text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatPercentage(metrics.profitChange)} {t("status.today")}
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {formatPercentage(Math.abs(metrics?.profitChange || 0))} {t("status.today")}
                </span>
              )}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{t("status.uptime")}</p>
            <h3 className="text-2xl font-bold transition-all duration-300">
              {getUptimeString(botStatus?.uptime || 0)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {botStatus?.startTime && (
                <span>
                  {t("status.since")} {new Date(botStatus.startTime).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{t("status.trades_executed")}</p>
            <h3 className="text-2xl font-bold transition-all duration-300">{metrics?.totalTrades || 0}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("status.win_rate")}: {formatPercentage(metrics?.winRate || 0)}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-md transform hover:-translate-y-1">
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">{t("status.system")}</p>
            <h3 className="text-2xl font-bold transition-all duration-300">
              {botStatus?.systemLoad ? `${botStatus.systemLoad.toFixed(1)}%` : "N/A"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t("status.memory")}: {botStatus?.memoryUsage ? `${botStatus.memoryUsage.toFixed(1)}%` : "N/A"}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
