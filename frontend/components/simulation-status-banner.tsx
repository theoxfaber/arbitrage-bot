"use client"

import { useTranslation } from "react-i18next"
import { AlertTriangle, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface SimulationStatusBannerProps {
  isSimulation: boolean
  onToggleMode?: (isSimulation: boolean) => void
}

export default function SimulationStatusBanner({ isSimulation = true, onToggleMode }: SimulationStatusBannerProps) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [isChanging, setIsChanging] = useState(false)

  const handleToggleMode = async () => {
    setIsChanging(true)

    try {
      // Simulate API call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onToggleMode) {
        onToggleMode(!isSimulation)
      }

      toast({
        title: isSimulation ? "Switched to Live Mode" : "Switched to Simulation Mode",
        description: isSimulation
          ? "You are now trading with real funds. Be careful!"
          : "You are now in simulation mode. No real funds will be used.",
        variant: isSimulation ? "destructive" : "default",
      })
    } catch (error) {
      toast({
        title: "Failed to switch mode",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsChanging(false)
    }
  }

  if (isSimulation) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 flex items-center justify-between transition-all duration-300 animate-in fade-in">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-500">{t("simulation.active")}</p>
            <p className="text-sm text-muted-foreground">{t("simulation.description")}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 hover:bg-background transition-colors duration-200 whitespace-nowrap ml-4 flex-shrink-0"
          onClick={handleToggleMode}
          disabled={isChanging}
        >
          {isChanging ? (
            <span className="flex items-center">
              <span className="animate-pulse">Switching...</span>
            </span>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("simulation.switch_to_live")}
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 flex items-center justify-between transition-all duration-300 animate-in fade-in">
      <div className="flex items-center">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
        <div>
          <p className="font-medium text-green-500">Live Mode Active</p>
          <p className="text-sm text-muted-foreground">
            You are trading with real funds. All trades are executed on exchanges.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="bg-background/80 hover:bg-background transition-colors duration-200 whitespace-nowrap ml-4 flex-shrink-0"
        onClick={handleToggleMode}
        disabled={isChanging}
      >
        {isChanging ? (
          <span className="flex items-center">
            <span className="animate-pulse">Switching...</span>
          </span>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            {t("simulation.switch_to_simulation")}
          </>
        )}
      </Button>
    </div>
  )
}
