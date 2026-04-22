"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import Dashboard from "@/components/dashboard"
import Sidebar from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { fetchBotStatus, fetchPerformanceMetrics } from "@/lib/api"
import type { BotStatus, PerformanceMetrics } from "@/lib/types"
import LoadingScreen from "@/components/loading-screen"
import { ErrorBoundary } from "react-error-boundary"

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-destructive/10 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-destructive mb-2">{t("error.something_went_wrong")}</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("error.try_again")}
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Handle hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const [statusData, metricsData] = await Promise.all([fetchBotStatus(), fetchPerformanceMetrics()])

        setBotStatus(statusData)
        setMetrics(metricsData)
      } catch (error) {
        console.error("Failed to initialize app:", error)
        toast({
          title: t("error.initialization"),
          description: t("error.initialization_description"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isMounted) {
      initializeApp()
    }
  }, [toast, t, isMounted])

  // Set up polling for real-time updates with debounce to prevent flickering
  useEffect(() => {
    if (!isMounted) return

    let statusTimeout: NodeJS.Timeout
    let metricsTimeout: NodeJS.Timeout

    const updateStatus = async () => {
      if (isUpdating) return

      try {
        setIsUpdating(true)
        const statusData = await fetchBotStatus()
        setBotStatus((prev) => {
          // Only update if there's an actual change to prevent unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(statusData)) {
            return statusData
          }
          return prev
        })
      } catch (error) {
        console.error("Failed to fetch bot status:", error)
      } finally {
        setIsUpdating(false)
        statusTimeout = setTimeout(updateStatus, 5000)
      }
    }

    const updateMetrics = async () => {
      try {
        const metricsData = await fetchPerformanceMetrics()
        setMetrics((prev) => {
          // Only update if there's an actual change
          if (JSON.stringify(prev?.totalProfit) !== JSON.stringify(metricsData.totalProfit)) {
            return metricsData
          }
          return prev
        })
      } catch (error) {
        console.error("Failed to fetch metrics:", error)
      } finally {
        metricsTimeout = setTimeout(updateMetrics, 10000)
      }
    }

    // Start polling
    statusTimeout = setTimeout(updateStatus, 5000)
    metricsTimeout = setTimeout(updateMetrics, 10000)

    return () => {
      clearTimeout(statusTimeout)
      clearTimeout(metricsTimeout)
    }
  }, [isMounted, isUpdating])

  // Handle sidebar state based on screen size
  useEffect(() => {
    if (!isMounted) return

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isMounted])

  if (!isMounted || isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        botStatus={botStatus}
        isUpdating={isUpdating}
      />
      <main className="flex-1 overflow-y-auto relative">
        <Dashboard botStatus={botStatus} metrics={metrics} sidebarOpen={sidebarOpen} />
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
        <AppContent />
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  )
}
