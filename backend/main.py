from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, get_db, DBTrade, DBPerformance
from engine import engine_instance
from models import BotStatus, BotStatusStrategies, BotStatusThresholds, PerformanceMetrics, Trade, MLPrediction, PerformanceData
from datetime import datetime, timedelta
import psutil

app = FastAPI(title="Arbitrage Bot Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's a dev dashboard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    init_db()

@app.on_event("shutdown")
async def shutdown_event():
    if engine_instance.is_running:
        await engine_instance.stop()

@app.get("/bot/status", response_model=BotStatus)
def get_status():
    uptime = 0
    start_str = ""
    if engine_instance.start_time:
        uptime = int((datetime.utcnow() - engine_instance.start_time).total_seconds())
        start_str = engine_instance.start_time.isoformat() + "Z"
        
    return BotStatus(
        running=engine_instance.is_running,
        uptime=uptime,
        startTime=start_str,
        systemLoad=psutil.cpu_percent(),
        memoryUsage=psutil.virtual_memory().percent,
        strategies=BotStatusStrategies(
            triangular=True,
            spotToSpot=True,
            spotToFutures=False,
            statistical=False
        ),
        thresholds=BotStatusThresholds(
            triangular=0.5,
            spotToSpot=0.1,  # matches our engine spread logic
            spotToFutures=0.4,
            statistical=0.6
        ),
        alerts=["Live simulation mode active"] if engine_instance.is_running else ["Engine halted"]
    )

@app.post("/bot/start")
async def start_bot():
    await engine_instance.start()
    return {"success": True}

@app.post("/bot/stop")
async def stop_bot():
    await engine_instance.stop()
    return {"success": True}

@app.get("/metrics/performance", response_model=PerformanceMetrics)
def get_performance(db=Depends(get_db)):
    db_perfs = db.query(DBPerformance).order_by(DBPerformance.timestamp.asc()).all()
    
    history = []
    cumulative = 0.0
    for p in db_perfs:
        cumulative += p.profit
        history.append(PerformanceData(
            timestamp=p.timestamp,
            profit=p.profit,
            cumulativeProfit=cumulative,
            tradeCount=p.tradeCount
        ))
        
    total_trades = sum(p.tradeCount for p in db_perfs)
    
    # Fake ML Predictions for the chart
    ml_preds = [
        MLPrediction(
            pairSymbol="BTC/USDT",
            strategyType="spot-to-spot",
            probability=0.85,
            expectedProfit=2.5,
            confidence=0.9,
            direction="up"
        )
    ]
        
    return PerformanceMetrics(
        totalProfit=cumulative,
        profitChange=2.4 if cumulative > 0 else 0.0,
        totalTrades=total_trades,
        winRate=1.0 if total_trades > 0 else 0.0,
        maxDrawdown=0.0,
        currentExposure=1000.0 if engine_instance.is_running else 0.0,
        performanceHistory=history,
        mlPredictions=ml_preds
    )

@app.get("/trades/history", response_model=list[Trade])
def get_trade_history(db=Depends(get_db)):
    trades = db.query(DBTrade).order_by(DBTrade.timestamp.desc()).limit(50).all()
    return [
        Trade(
            id=t.id,
            timestamp=t.timestamp,
            symbol=t.symbol,
            strategy=t.strategy,
            exchange=t.exchange,
            volume=t.volume,
            profit=t.profit,
            status=t.status,
            executionTime=t.executionTime
        ) for t in trades
    ]

@app.get("/arbitrage/opportunities")
def get_opportunities():
    return engine_instance.opportunities
