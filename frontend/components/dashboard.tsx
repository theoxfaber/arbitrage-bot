"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BotStatus, PerformanceMetrics } from "@/lib/types"
import PerformanceChart from "@/components/charts/performance-chart"
import TradeHistoryTable from "@/components/tables/trade-history-table"
import ArbitrageOpportunitiesTable from "@/components/tables/arbitrage-opportunities-table"
import StatusCards from "@/components/status-cards"
import StrategyControls from "@/components/strategy-controls"
import MLPredictionInsights from "@/components/ml-prediction-insights"
import RiskManagementPanel from "@/components/risk-management-panel"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { fetchPerformanceMetrics, fetchTradeHistory, fetchArbitrageOpportunities } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
// Import the simulation banner component
import SimulationStatusBanner from "@/components/simulation-status-banner"

interface DashboardProps {
  botStatus: BotStatus | null
  metrics: PerformanceMetrics | null
  sidebarOpen: boolean
}

export default function Dashboard({ botStatus, metrics, sidebarOpen }: DashboardProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [mounted, setMounted] = useState(false)
  // Add state for simulation mode
  const [isSimulationMode, setIsSimulationMode] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      // Refresh data based on active tab
      if (activeTab === "overview") {
        await fetchPerformanceMetrics()
      } else if (activeTab === "trades") {
        await fetchTradeHistory()
      } else if (activeTab === "opportunities") {
        await fetchArbitrageOpportunities()
      }

      toast({
        title: t("success.data_refreshed"),
        description: t("success.data_refreshed_description"),
      })
    } catch (error) {
      toast({
        title: t("error.refresh_failed"),
        description: t("error.refresh_failed_description"),
        variant: "destructive",
      })
    } finally {
      // Add a small delay to prevent flickering
      setTimeout(() => {
        setIsRefreshing(false)
      }, 300)
    }
  }, [activeTab, isRefreshing, t, toast])

  if (!mounted) {
    return <div className="p-4 animate-pulse">Loading dashboard...</div>
  }

  return (
    <div
      className={`container mx-auto p-4 pb-20 space-y-6 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : ""}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {t("dashboard.refresh")}
        </Button>
      </div>
      <SimulationStatusBanner isSimulation={isSimulationMode} onToggleMode={setIsSimulationMode} />

      <StatusCards botStatus={botStatus} metrics={metrics} />

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-md mb-4">
          <TabsTrigger value="overview" className="transition-colors duration-200">
            {t("dashboard.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="trades" className="transition-colors duration-200">
            {t("dashboard.tabs.trades")}
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="transition-colors duration-200">
            {t("dashboard.tabs.opportunities")}
          </TabsTrigger>
          <TabsTrigger value="settings" className="transition-colors duration-200">
            {t("dashboard.tabs.settings")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("dashboard.performance.title")}</CardTitle>
                <CardDescription>{t("dashboard.performance.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={metrics?.performanceHistory || []} />
              </CardContent>
            </Card>

            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("dashboard.ml_insights.title")}</CardTitle>
                <CardDescription>{t("dashboard.ml_insights.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <MLPredictionInsights predictions={metrics?.mlPredictions || []} />
              </CardContent>
            </Card>
          </div>

          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("dashboard.strategies.title")}</CardTitle>
              <CardDescription>{t("dashboard.strategies.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <StrategyControls botStatus={botStatus} />
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("dashboard.risk.title")}</CardTitle>
              <CardDescription>{t("dashboard.risk.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <RiskManagementPanel metrics={metrics} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="mt-0">
          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("dashboard.trade_history.title")}</CardTitle>
              <CardDescription>{t("dashboard.trade_history.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <TradeHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-0">
          <Card className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("dashboard.opportunities.title")}</CardTitle>
              <CardDescription>{t("dashboard.opportunities.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ArbitrageOpportunitiesTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("dashboard.bot_settings.title")}</CardTitle>
                <CardDescription>{t("dashboard.bot_settings.description")}</CardDescription>
              </CardHeader>
              <CardContent>{/* Bot settings form will be implemented here */}</CardContent>
            </Card>

            <Card className="transition-shadow duration-200 hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("dashboard.security.title")}</CardTitle>
                <CardDescription>{t("dashboard.security.description")}</CardDescription>
              </CardHeader>
              <CardContent>{/* Security settings will be implemented here */}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
