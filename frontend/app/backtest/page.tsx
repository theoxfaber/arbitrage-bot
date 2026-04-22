"use client"
import { useState, useRef, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export default function BacktestPage() {
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<any[]>([])
  const [timelineIndex, setTimelineIndex] = useState([0])
  const [isPlaying, setIsPlaying] = useState(false)

  // CSV Parsing
  const handleFileUpload = (e: any) => {
    const uploaded = e.target.files?.[0]
    if (!uploaded) return
    setFile(uploaded)
    
    // In a real impl using PapaParse
    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result as str
      // Mock generate a generic smooth P&L curve based on file presence
      const mockResult = Array.from({length: 100}).map((_, i) => ({
        time: i,
        pnl: 1000 + (Math.sin(i / 10) * 50) + (i * 2.5) + (Math.random() * 15 - 7.5),
        trades: Math.floor(Math.random() * 3)
      }))
      setData(mockResult)
      setTimelineIndex([100])
    }
    reader.readAsText(uploaded)
  }

  // Playback Engine
  useEffect(() => {
    let interval: any
    if (isPlaying && timelineIndex[0] < data.length - 1) {
      interval = setInterval(() => {
        setTimelineIndex(prev => [Math.min(prev[0] + 1, data.length - 1)])
      }, 50)
    } else if (timelineIndex[0] >= data.length - 1) {
      setIsPlaying(false)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timelineIndex, data])

  const currentData = data.slice(0, timelineIndex[0] + 1)
  const currentPnl = currentData.length > 0 ? currentData[currentData.length - 1].pnl : 0

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Strategy Backtesting Engine</h1>
        <Badge variant={data.length > 0 ? "default" : "secondary"}>
          {data.length > 0 ? "Data Loaded" : "Awaiting Data"}
        </Badge>
      </div>
      
      <Card className="mb-6 border-zinc-800">
        <CardHeader>
          <CardTitle>Historical Replay Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-zinc-400">Orderbook Delta CSV Array</label>
              <Input type="file" onChange={handleFileUpload} className="cursor-pointer" />
            </div>
            <div className="flex items-end space-x-2">
              <Button disabled={!file} onClick={() => {
                setTimelineIndex([0])
                setIsPlaying(true)
              }} className="w-full">
                {isPlaying ? "Running..." : "Execute Replay"}
              </Button>
              <Button variant="outline" onClick={() => setIsPlaying(false)} disabled={!isPlaying}>Pause</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Simulated P&L Curve</CardTitle>
          <div className="text-xl font-mono text-green-400">${currentPnl.toFixed(2)}</div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentData}>
                  <defs>
                    <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis domain={['auto', 'auto']} stroke="#666" tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                    itemStyle={{ color: '#22c55e' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pnl" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorPnl)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg">
                <span className="text-zinc-500">Awaiting Dataset</span>
              </div>
            )}
          </div>
          
          {data.length > 0 && (
            <div className="mt-8 px-4">
              <div className="flex justify-between text-xs text-zinc-500 mb-2 font-mono">
                <span>Start</span>
                <span>Timeline Scrubber</span>
                <span>End</span>
              </div>
              <Slider 
                value={timelineIndex} 
                max={data.length - 1} 
                step={1}
                onValueChange={(val) => {
                  setIsPlaying(false)
                  setTimelineIndex(val)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
