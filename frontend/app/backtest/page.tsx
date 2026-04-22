"use client"
import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function BacktestPage() {
  const [file, setFile] = useState<File | null>(null)
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Historical Backtesting</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Strategy Replay Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Upload Orderbook CSV Array</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button disabled={!file}>Run Backtest Engine</Button>
        </CardContent>
      </Card>
      
      <div className="h-[400px] bg-muted/50 rounded-lg flex items-center justify-center">
        {/* Scrubbable Time Curve component goes here */}
        <p className="text-muted-foreground">P&L Curve with Time-Scrubber will appear after execution.</p>
      </div>
    </div>
  )
}
