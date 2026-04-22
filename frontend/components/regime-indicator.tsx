import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

export default function RegimeIndicator() {
  const [regime, setRegime] = useState<any>(null)

  useEffect(() => {
    // In the real impl, this would connect to the websocket
    const fetchRegime = async () => {
      try {
        const res = await fetch("http://localhost:8000/regime")
        const data = await res.json()
        setRegime(data)
      } catch (e) {
        console.error(e)
      }
    }
    fetchRegime()
    const interval = setInterval(fetchRegime, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!regime) return null

  const color = regime.regime === "VOLATILE" ? "destructive" : 
               regime.regime === "TRENDING" ? "default" : "secondary"

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Market Regime:</span>
      <Badge variant={color as any}>{regime.regime}</Badge>
      <span className="text-xs text-muted-foreground">{regime.reason}</span>
    </div>
  )
}
