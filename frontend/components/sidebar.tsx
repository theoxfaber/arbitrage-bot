"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import {
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Settings,
  History,
  Search,
  PieChart,
  AlertTriangle,
  Moon,
  Sun,
  Globe,
  Power,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import type { BotStatus } from "@/lib/types"
import { startBot, stopBot } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  open: boolean
  onToggle: () => void
  botStatus: BotStatus | null
  isUpdating?: boolean
}

export default function Sidebar({ open, onToggle, botStatus, isUpdating = false }: SidebarProps) {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [localBotStatus, setLocalBotStatus] = useState<boolean | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update local bot status to prevent flickering
  useEffect(() => {
    if (botStatus?.running !== undefined && !isStarting && !isStopping) {
      setLocalBotStatus(botStatus.running)
    }
  }, [botStatus?.running, isStarting, isStopping])

  const handleStartBot = useCallback(async () => {
    if (isStarting || isStopping || isUpdating) return

    setIsStarting(true)
    // Immediately update local state to prevent flickering
    setLocalBotStatus(true)

    try {
      await startBot()
      toast({
        title: t("success.bot_started"),
        description: t("success.bot_started_description"),
      })
    } catch (error) {
      // Revert local state on error
      setLocalBotStatus(false)
      toast({
        title: t("error.bot_start_failed"),
        description: t("error.bot_start_failed_description"),
        variant: "destructive",
      })
    } finally {
      setIsStarting(false)
    }
  }, [isStarting, isStopping, isUpdating, t, toast])

  const handleStopBot = useCallback(async () => {
    if (isStarting || isStopping || isUpdating) return

    setIsStopping(true)
    // Immediately update local state to prevent flickering
    setLocalBotStatus(false)

    try {
      await stopBot()
      toast({
        title: t("success.bot_stopped"),
        description: t("success.bot_stopped_description"),
      })
    } catch (error) {
      // Revert local state on error
      setLocalBotStatus(true)
      toast({
        title: t("error.bot_stop_failed"),
        description: t("error.bot_stop_failed_description"),
        variant: "destructive",
      })
    } finally {
      setIsStopping(false)
    }
  }, [isStarting, isStopping, isUpdating, t, toast])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  // Use a stable value for the running state to prevent flickering
  const isRunning = localBotStatus !== null ? localBotStatus : botStatus?.running

  if (!mounted) {
    return <div className="w-16 h-screen bg-sidebar" />
  }

  return (
    <SidebarProvider defaultOpen={open}>
      <ShadcnSidebar className="transition-all duration-300">
        <SidebarHeader className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">CryptoArb Pro</h1>
          </div>
          <div className="mt-4 flex items-center">
            <Badge variant={isRunning ? "success" : "destructive"} className="px-3 py-1 transition-colors duration-300">
              {isRunning ? t("status.running") : t("status.stopped")}
            </Badge>
          </div>
          <div className="mt-4 w-full px-4">
            {isRunning ? (
              <Button
                variant="destructive"
                className="w-full transition-opacity duration-300"
                onClick={handleStopBot}
                disabled={isStopping || isStarting || isUpdating}
              >
                <Power className="mr-2 h-4 w-4" />
                {isStopping ? t("actions.stopping") : t("actions.stop_bot")}
              </Button>
            ) : (
              <Button
                variant="default"
                className="w-full transition-opacity duration-300"
                onClick={handleStartBot}
                disabled={isStarting || isStopping || isUpdating}
              >
                <Power className="mr-2 h-4 w-4" />
                {isStarting ? t("actions.starting") : t("actions.start_bot")}
              </Button>
            )}
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#overview" className="transition-colors duration-200">
                  <PieChart className="h-5 w-5" />
                  <span>{t("sidebar.overview")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#trades" className="transition-colors duration-200">
                  <History className="h-5 w-5" />
                  <span>{t("sidebar.trade_history")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#opportunities" className="transition-colors duration-200">
                  <Search className="h-5 w-5" />
                  <span>{t("sidebar.opportunities")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#alerts" className="transition-colors duration-200">
                  <AlertTriangle className="h-5 w-5" />
                  <span>{t("sidebar.alerts")}</span>
                </a>
              </SidebarMenuButton>
              {botStatus?.alerts && botStatus.alerts.length > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {botStatus.alerts.length}
                </Badge>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#settings" className="transition-colors duration-200">
                  <Settings className="h-5 w-5" />
                  <span>{t("sidebar.settings")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <div className="flex justify-between mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="transition-colors duration-200">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => changeLanguage("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage("hi")}>हिन्दी (Hindi)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="transition-colors duration-200"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button variant="outline" size="icon" className="transition-colors duration-200">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>CryptoArb Pro v1.0.0</p>
            <p className="mt-1">
              {t("sidebar.last_updated")}: {new Date().toLocaleDateString()}
            </p>
          </div>
        </SidebarFooter>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 transition-transform duration-200 hover:bg-sidebar-accent"
          onClick={onToggle}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </ShadcnSidebar>
    </SidebarProvider>
  )
}
