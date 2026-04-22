"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ArbitrageOpportunity } from "@/lib/types"
import { fetchArbitrageOpportunities, executeTrade } from "@/lib/api"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { Search, ArrowUpDown, Play, RefreshCw, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import TradeStatusBadge from "@/components/trade-status-badge"
// Import the trade execution feedback component
import TradeExecutionFeedback from "@/components/trade-execution-feedback"

export default function ArbitrageOpportunitiesTable() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof ArbitrageOpportunity>("profitPercentage")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [executingTradeId, setExecutingTradeId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  // Add state for the feedback dialog
  const [executionFeedbackOpen, setExecutionFeedbackOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadOpportunities = useCallback(async () => {
    if (!mounted) return

    setIsRefreshing(true)
    try {
      const data = await fetchArbitrageOpportunities()
      setOpportunities(data)
    } catch (error) {
      console.error("Failed to fetch arbitrage opportunities:", error)
      toast({
        title: t("error.fetch_failed"),
        description: t("error.fetch_failed_description"),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Add a small delay to prevent flickering
      setTimeout(() => {
        setIsRefreshing(false)
      }, 300)
    }
  }, [mounted, t, toast])

  useEffect(() => {
    loadOpportunities()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      if (!isRefreshing && !executingTradeId) {
        loadOpportunities()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [loadOpportunities, isRefreshing, executingTradeId])

  const handleSort = useCallback((field: keyof ArbitrageOpportunity) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"))
        return field
      }
      setSortDirection("asc")
      return field
    })
  }, [])

  // Update the handleExecuteTrade function
  const handleExecuteTrade = useCallback(
    async (opportunity: ArbitrageOpportunity) => {
      if (executingTradeId) return

      setSelectedOpportunity(opportunity)
      setExecutionFeedbackOpen(true)
      setExecutingTradeId(opportunity.id)

      try {
        await executeTrade(opportunity.id)
        // The feedback dialog will show success/error based on its own logic

        // Refresh opportunities after execution
        await loadOpportunities()
      } catch (error) {
        console.error("Failed to execute trade:", error)
        // The feedback dialog will handle the error state
      } finally {
        // Add a small delay to prevent flickering
        setTimeout(() => {
          setExecutingTradeId(null)
        }, 300)
      }
    },
    [executingTradeId, loadOpportunities],
  )

  const filteredOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.exchanges.join(" ").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    if (sortField === "timestamp") {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }

    if (sortField === "profitPercentage" || sortField === "expectedProfit" || sortField === "confidence") {
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    }

    const valueA = String(a[sortField]).toLowerCase()
    const valueB = String(b[sortField]).toLowerCase()
    return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
  })

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "bg-green-500"
    if (confidence >= 0.4) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted/20 rounded-md animate-pulse"></div>
        <div className="rounded-md border">
          <div className="h-64 bg-muted/10 animate-pulse flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted" />
          </div>
        </div>
      </div>
    )
  }

  // Add the feedback component at the end of the component
  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("opportunities.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOpportunities}
            disabled={isRefreshing}
            className="transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("opportunities.refresh")}
          </Button>
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        {t("opportunities.type")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("symbol")} className="cursor-pointer">
                      <div className="flex items-center">
                        {t("opportunities.symbol")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("strategy")} className="cursor-pointer">
                      <div className="flex items-center">
                        {t("opportunities.strategy")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("exchanges")} className="cursor-pointer">
                      <div className="flex items-center">
                        {t("opportunities.exchanges")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("profitPercentage")} className="cursor-pointer text-right">
                      <div className="flex items-center justify-end">
                        {t("opportunities.profit_percentage")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("expectedProfit")} className="cursor-pointer text-right">
                      <div className="flex items-center justify-end">
                        {t("opportunities.expected_profit")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("confidence")} className="cursor-pointer">
                      <div className="flex items-center">
                        {t("opportunities.confidence")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedOpportunities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("opportunities.no_opportunities_found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedOpportunities.map((opportunity) => (
                      <TableRow key={opportunity.id} className="transition-colors duration-200 hover:bg-muted/30">
                        <TableCell>
                          <TradeStatusBadge status="simulated" showTooltip={true} />
                        </TableCell>
                        <TableCell className="font-medium">{opportunity.symbol}</TableCell>
                        <TableCell>{opportunity.strategy}</TableCell>
                        <TableCell>{opportunity.exchanges.join(" → ")}</TableCell>
                        <TableCell className="text-right text-green-500">
                          {formatPercentage(opportunity.profitPercentage)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(opportunity.expectedProfit)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={opportunity.confidence * 100}
                              className={getConfidenceColor(opportunity.confidence)}
                            />
                            <span className="text-sm">{formatPercentage(opportunity.confidence)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={executingTradeId === opportunity.id ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleExecuteTrade(opportunity)}
                            disabled={executingTradeId === opportunity.id}
                            className={`transition-all duration-300 ${
                              executingTradeId === opportunity.id ? "bg-muted" : "bg-primary hover:bg-primary/90"
                            }`}
                          >
                            {executingTradeId === opportunity.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                {t("opportunities.executing")}
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                {t("opportunities.execute")}
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {selectedOpportunity && (
        <TradeExecutionFeedback
          isOpen={executionFeedbackOpen}
          onClose={() => setExecutionFeedbackOpen(false)}
          tradeSymbol={selectedOpportunity.symbol}
          isSimulated={true}
        />
      )}
    </>
  )
}
