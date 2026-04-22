"use client"

import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { MLPrediction } from "@/lib/types"
import { formatPercentage } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface MLPredictionInsightsProps {
  predictions: MLPrediction[]
}

export default function MLPredictionInsights({ predictions }: MLPredictionInsightsProps) {
  const { t } = useTranslation()

  // Sort predictions by probability in descending order
  const sortedPredictions = [...predictions].sort((a, b) => b.probability - a.probability)

  // Take top 5 predictions
  const topPredictions = sortedPredictions.slice(0, 5)

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />
    }
  }

  const getProgressColor = (probability: number) => {
    if (probability >= 0.7) return "bg-green-500"
    if (probability >= 0.4) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">{t("ml.model_type")}</div>
            <div className="font-medium">LSTM Neural Network</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">{t("ml.last_trained")}</div>
            <div className="font-medium">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t("ml.top_opportunities")}</h3>

        {topPredictions.length > 0 ? (
          topPredictions.map((prediction, index) => (
            <div key={index} className="bg-card rounded-md p-3 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium flex items-center">
                  {prediction.pairSymbol}
                  <span className="text-xs text-muted-foreground ml-2">({prediction.strategyType})</span>
                </div>
                <div className="flex items-center">
                  {getDirectionIcon(prediction.direction)}
                  <span
                    className={`ml-1 text-sm ${
                      prediction.probability >= 0.7
                        ? "text-green-500"
                        : prediction.probability >= 0.4
                          ? "text-yellow-500"
                          : "text-red-500"
                    }`}
                  >
                    {formatPercentage(prediction.probability)}
                  </span>
                </div>
              </div>
              <Progress value={prediction.probability * 100} className={getProgressColor(prediction.probability)} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>
                  {t("ml.expected_profit")}: {formatPercentage(prediction.expectedProfit)}
                </span>
                <span>
                  {t("ml.confidence")}: {prediction.confidence}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">{t("ml.no_predictions")}</div>
        )}
      </div>
    </div>
  )
}
