"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { PerformanceMetrics } from "@/lib/types"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import { updateRiskSettings } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Shield, AlertTriangle, Percent } from "lucide-react"

interface RiskManagementPanelProps {
  metrics: PerformanceMetrics | null
}

export default function RiskManagementPanel({ metrics }: RiskManagementPanelProps) {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [maxPositionSize, setMaxPositionSize] = useState(20)
  const [stopLossPercentage, setStopLossPercentage] = useState(1)
  const [maxCapitalPerExchange, setMaxCapitalPerExchange] = useState(20)
  const [useKellyCriterion, setUseKellyCriterion] = useState(true)
  const [useHedging, setUseHedging] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await updateRiskSettings({
        maxPositionSize,
        stopLossPercentage,
        maxCapitalPerExchange,
        useKellyCriterion,
        useHedging,
      })

      toast({
        title: t("success.settings_saved"),
        description: t("success.settings_saved_description"),
      })
    } catch (error) {
      toast({
        title: t("error.settings_save_failed"),
        description: t("error.settings_save_failed_description"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">{t("risk.current_exposure")}</div>
              <div className="font-medium">{formatCurrency(metrics?.currentExposure || 0)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center">
            <Percent className="h-5 w-5 mr-2 text-green-500" />
            <div>
              <div className="text-sm text-muted-foreground">{t("risk.win_rate")}</div>
              <div className="font-medium">{formatPercentage(metrics?.winRate || 0)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            <div>
              <div className="text-sm text-muted-foreground">{t("risk.max_drawdown")}</div>
              <div className="font-medium">{formatPercentage(metrics?.maxDrawdown || 0)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("risk.max_position_size")}</Label>
            <span className="text-sm text-muted-foreground">{maxPositionSize}%</span>
          </div>
          <Slider
            value={[maxPositionSize]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => setMaxPositionSize(value[0])}
          />
          <p className="text-xs text-muted-foreground">{t("risk.max_position_size_description")}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("risk.stop_loss")}</Label>
            <span className="text-sm text-muted-foreground">{stopLossPercentage}%</span>
          </div>
          <Slider
            value={[stopLossPercentage]}
            min={0.1}
            max={5}
            step={0.1}
            onValueChange={(value) => setStopLossPercentage(value[0])}
          />
          <p className="text-xs text-muted-foreground">{t("risk.stop_loss_description")}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t("risk.max_capital_per_exchange")}</Label>
            <span className="text-sm text-muted-foreground">{maxCapitalPerExchange}%</span>
          </div>
          <Slider
            value={[maxCapitalPerExchange]}
            min={5}
            max={100}
            step={5}
            onValueChange={(value) => setMaxCapitalPerExchange(value[0])}
          />
          <p className="text-xs text-muted-foreground">{t("risk.max_capital_per_exchange_description")}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t("risk.kelly_criterion")}</Label>
            <p className="text-xs text-muted-foreground">{t("risk.kelly_criterion_description")}</p>
          </div>
          <Switch checked={useKellyCriterion} onCheckedChange={setUseKellyCriterion} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{t("risk.hedging")}</Label>
            <p className="text-xs text-muted-foreground">{t("risk.hedging_description")}</p>
          </div>
          <Switch checked={useHedging} onCheckedChange={setUseHedging} />
        </div>

        <Button className="w-full" onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? t("actions.saving") : t("actions.save_settings")}
        </Button>
      </div>
    </div>
  )
}
