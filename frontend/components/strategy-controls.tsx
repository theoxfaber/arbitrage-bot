"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { BotStatus } from "@/lib/types"
import { updateStrategySettings } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Triangle, ArrowLeftRight, TrendingUp, BarChart2, Save } from "lucide-react"

interface StrategyControlsProps {
  botStatus: BotStatus | null
}

export default function StrategyControls({ botStatus }: StrategyControlsProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [strategies, setStrategies] = useState({
    triangular: botStatus?.strategies?.triangular || false,
    spotToSpot: botStatus?.strategies?.spotToSpot || false,
    spotToFutures: botStatus?.strategies?.spotToFutures || false,
    statistical: botStatus?.strategies?.statistical || false,
  })

  const [thresholds, setThresholds] = useState({
    triangular: botStatus?.thresholds?.triangular || 0.5,
    spotToSpot: botStatus?.thresholds?.spotToSpot || 0.3,
    spotToFutures: botStatus?.thresholds?.spotToFutures || 0.4,
    statistical: botStatus?.thresholds?.statistical || 0.6,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleStrategyToggle = (strategy: keyof typeof strategies) => {
    setStrategies({
      ...strategies,
      [strategy]: !strategies[strategy],
    })
  }

  const handleThresholdChange = (strategy: keyof typeof thresholds, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setThresholds({
        ...thresholds,
        [strategy]: numValue,
      })
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateStrategySettings({
        strategies,
        thresholds,
      })

      toast({
        title: t("success.strategies_updated"),
        description: t("success.strategies_updated_description"),
      })
    } catch (error) {
      toast({
        title: t("error.strategies_update_failed"),
        description: t("error.strategies_update_failed_description"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <Triangle className="h-5 w-5 mr-2 text-blue-500" />
              <h3 className="font-medium">{t("strategies.triangular.title")}</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="triangular-strategy">{t("strategies.enable")}</Label>
              <Switch
                id="triangular-strategy"
                checked={strategies.triangular}
                onCheckedChange={() => handleStrategyToggle("triangular")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="triangular-threshold">{t("strategies.profit_threshold")}</Label>
              <div className="flex items-center">
                <Input
                  id="triangular-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={thresholds.triangular}
                  onChange={(e) => handleThresholdChange("triangular", e.target.value)}
                  disabled={!strategies.triangular}
                />
                <span className="ml-2">%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">{t("strategies.triangular.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <ArrowLeftRight className="h-5 w-5 mr-2 text-green-500" />
              <h3 className="font-medium">{t("strategies.spot_to_spot.title")}</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="spot-to-spot-strategy">{t("strategies.enable")}</Label>
              <Switch
                id="spot-to-spot-strategy"
                checked={strategies.spotToSpot}
                onCheckedChange={() => handleStrategyToggle("spotToSpot")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spot-to-spot-threshold">{t("strategies.profit_threshold")}</Label>
              <div className="flex items-center">
                <Input
                  id="spot-to-spot-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={thresholds.spotToSpot}
                  onChange={(e) => handleThresholdChange("spotToSpot", e.target.value)}
                  disabled={!strategies.spotToSpot}
                />
                <span className="ml-2">%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">{t("strategies.spot_to_spot.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
              <h3 className="font-medium">{t("strategies.spot_to_futures.title")}</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="spot-to-futures-strategy">{t("strategies.enable")}</Label>
              <Switch
                id="spot-to-futures-strategy"
                checked={strategies.spotToFutures}
                onCheckedChange={() => handleStrategyToggle("spotToFutures")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="spot-to-futures-threshold">{t("strategies.profit_threshold")}</Label>
              <div className="flex items-center">
                <Input
                  id="spot-to-futures-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={thresholds.spotToFutures}
                  onChange={(e) => handleThresholdChange("spotToFutures", e.target.value)}
                  disabled={!strategies.spotToFutures}
                />
                <span className="ml-2">%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">{t("strategies.spot_to_futures.description")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <BarChart2 className="h-5 w-5 mr-2 text-yellow-500" />
              <h3 className="font-medium">{t("strategies.statistical.title")}</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="statistical-strategy">{t("strategies.enable")}</Label>
              <Switch
                id="statistical-strategy"
                checked={strategies.statistical}
                onCheckedChange={() => handleStrategyToggle("statistical")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="statistical-threshold">{t("strategies.profit_threshold")}</Label>
              <div className="flex items-center">
                <Input
                  id="statistical-threshold"
                  type="number"
                  min="0"
                  step="0.1"
                  value={thresholds.statistical}
                  onChange={(e) => handleThresholdChange("statistical", e.target.value)}
                  disabled={!strategies.statistical}
                />
                <span className="ml-2">%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">{t("strategies.statistical.description")}</p>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full" onClick={handleSaveSettings} disabled={isSaving}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? t("actions.saving") : t("actions.save_strategies")}
      </Button>
    </div>
  )
}
