"use client"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OpportunitiesPage() {
  const [ops, setOps] = useState<any[]>([])

  useEffect(() => {
    // Replace heavily polling Axios with standard Singleton WebSockets
    const ws = new WebSocket("ws://localhost:8000/ws/feed")
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "opportunities") {
        setOps(data.payload)
      }
    }
    return () => ws.close()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Live Opportunities</h1>
      <div className="space-y-4">
        {ops.map((op, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{op.symbol}</CardTitle>
              <Badge variant={op.confidence > 0.85 ? "default" : "secondary"}>
                Conf: {(op.confidence * 100).toFixed(1)}%
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {op.explanation || `Detected spread of ${op.profitPercentage}% between ${op.exchanges.join(" -> ")}`}
              </p>
            </CardContent>
          </Card>
        ))}
        {ops.length === 0 && <p>Waiting for real-time order book gaps...</p>}
      </div>
    </div>
  )
}
