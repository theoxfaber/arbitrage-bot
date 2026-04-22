"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Trade } from "@/lib/types"
import { fetchTradeHistory } from "@/lib/api"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { ChevronDown, ArrowUpDown, Search, MoreHorizontal, FileText, Trash, ExternalLink, Loader2 } from "lucide-react"
import TradeStatusBadge from "@/components/trade-status-badge"

export default function TradeHistoryTable() {
  const { t } = useTranslation()
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<keyof Trade>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadTrades = useCallback(async () => {
    if (!mounted) return

    setIsLoading(true)
    try {
      const data = await fetchTradeHistory()
      setTrades(data)
    } catch (error) {
      console.error("Failed to fetch trade history:", error)
    } finally {
      setIsLoading(false)
    }
  }, [mounted])

  useEffect(() => {
    loadTrades()
  }, [loadTrades])

  const handleSort = useCallback((field: keyof Trade) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"))
        return field
      }
      setSortDirection("asc")
      return field
    })
  }, [])

  const filteredTrades = trades.filter(
    (trade) =>
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.exchange.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (sortField === "timestamp" || sortField === "executionTime") {
      const dateA = new Date(a[sortField]).getTime()
      const dateB = new Date(b[sortField]).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    }

    if (sortField === "profit" || sortField === "volume") {
      return sortDirection === "asc" ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    }

    const valueA = String(a[sortField]).toLowerCase()
    const valueB = String(b[sortField]).toLowerCase()
    return sortDirection === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA)
  })

  const getProfitClass = (profit: number) => {
    if (profit > 0) return "text-green-500"
    if (profit < 0) return "text-red-500"
    return "text-muted-foreground"
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("trade.search_placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="transition-colors duration-200">
              {t("trade.filter")}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSearchQuery("triangular")}>
              {t("strategies.triangular.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery("spot-to-spot")}>
              {t("strategies.spot_to_spot.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery("spot-to-futures")}>
              {t("strategies.spot_to_futures.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery("statistical")}>
              {t("strategies.statistical.title")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery("binance")}>Binance</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchQuery("wazirx")}>WazirX</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort("timestamp")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.timestamp")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("symbol")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.symbol")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("strategy")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.strategy")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("exchange")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.exchange")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("volume")} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      {t("trade.volume")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("profit")} className="cursor-pointer text-right">
                    <div className="flex items-center justify-end">
                      {t("trade.profit")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.status")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer">
                    <div className="flex items-center">
                      {t("trade.type")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      {t("trade.no_trades_found")}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTrades.map((trade) => (
                    <TableRow key={trade.id} className="transition-colors duration-200 hover:bg-muted/30">
                      <TableCell className="font-medium">{formatDateTime(trade.timestamp)}</TableCell>
                      <TableCell>{trade.symbol}</TableCell>
                      <TableCell>{trade.strategy}</TableCell>
                      <TableCell>{trade.exchange}</TableCell>
                      <TableCell className="text-right">{formatCurrency(trade.volume)}</TableCell>
                      <TableCell className={`text-right ${getProfitClass(trade.profit)}`}>
                        {formatCurrency(trade.profit)}
                      </TableCell>
                      <TableCell>
                        <TradeStatusBadge status={trade.status as any} />
                      </TableCell>
                      <TableCell>
                        <TradeStatusBadge status={trade.id.startsWith("sim") ? "simulated" : "live"} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="transition-colors duration-200">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t("actions.open_menu")}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              {t("actions.view_details")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {t("actions.view_on_exchange")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Trash className="mr-2 h-4 w-4" />
                              {t("actions.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  )
}
