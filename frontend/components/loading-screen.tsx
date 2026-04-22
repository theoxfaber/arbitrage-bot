"use client"

import { useTranslation } from "react-i18next"
import { BarChart3 } from "lucide-react"

export default function LoadingScreen() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center mb-8">
        <BarChart3 className="h-12 w-12 text-primary animate-pulse" />
        <h1 className="text-3xl font-bold ml-2">CryptoArb Pro</h1>
      </div>
      <div className="w-48 h-2 bg-muted rounded-full overflow-hidden relative">
        <div className="h-full bg-primary absolute left-0 top-0 animate-progress"></div>
      </div>
      <p className="mt-4 text-muted-foreground">{t("loading_screen.initializing")}</p>
    </div>
  )
}
