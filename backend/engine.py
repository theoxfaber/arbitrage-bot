import asyncio
import time
import uuid
from typing import List, Dict
from datetime import datetime
from database import AsyncSessionLocal, DBTrade, DBPerformance
from models import Trade, ArbitrageOpportunity
from sqlalchemy.future import select

# We orchestrate the Rust compiled engine natively:
# import rust_engine

from ml.classifier import classifier_instance
from config import settings
import rust_engine

class ArbitrageEngine:
    def __init__(self):
        self.is_running = False
        self.start_time = None
        self.opportunities: List[ArbitrageOpportunity] = []
        # Native compiled FFI hook:
        self.rust_core = rust_engine.RustEngine()
        
    async def start(self):
        if self.is_running: return
        self.is_running = True
        self.start_time = datetime.utcnow()
        self.rust_core.start(0.001, 0.001)  # passing fee schedules
        asyncio.create_task(self._monitor_loop())
        
    async def stop(self):
        self.is_running = False
        if self.start_time:
            self.start_time = None

    async def _monitor_loop(self):
        while self.is_running:
            try:
                gaps = self.rust_core.poll_gaps()
                
                from regime import regime_detector
                # Simulated dynamic regime update
                import random
                regime_detector.update_market_data(random.uniform(0.1, 1.8), random.uniform(0.1, 2.5))
                reg_status = regime_detector.get_regime()
                
                if reg_status["regime"] == "VOLATILE":
                    await asyncio.sleep(1)
                    continue # Pause bot if highly volatile
                
                new_opportunities = []
                for g in gaps:
                    confidence = classifier_instance.predict_confidence({
                        "size_pct": g[5] * 100,
                        "duration": 600,
                        "depth": 50.0,
                        "volume": 20.0
                    }, history_count=getattr(self, 'history_count', 0))
                    
                    if confidence >= settings.MIN_CONFIDENCE:
                        # We inject explanation here into the opp dict for passing it down
                        opp_dict = {
                            "symbol": g[0],
                            "buy_exchange": g[1],
                            "sell_exchange": g[2],
                            "size_pct": g[5] * 100,
                            "expectedProfit": g[5] * 1000,
                            "duration": 600
                        }
                        
                        from explainer import generate_explanation
                        explanation = generate_explanation(opp_dict, confidence, reg_status["regime"])
                        
                        opp = ArbitrageOpportunity(
                            id=str(uuid.uuid4()),
                            timestamp=datetime.utcnow().isoformat() + "Z",
                            symbol=g[0],
                            strategy="spot-to-spot",
                            exchanges=[g[1], g[2]],
                            profitPercentage=g[5] * 100,
                            expectedProfit=g[5] * 1000, 
                            confidence=confidence
                        )
                        # Normally we add it to a trade queue, here we attach dynamic explanations for DB
                        new_opportunities.append(opp)
                        await self._execute_paper_trade(opp, explanation)
                
                if new_opportunities:
                    self.opportunities = (new_opportunities + self.opportunities)[:20]
                    
                await asyncio.sleep(0.5) # Poll Rust FFI
                
            except Exception as e:
                print(f"Orchestration Loop Error: {e}")
                await asyncio.sleep(2)
                
    async def _execute_paper_trade(self, opp: ArbitrageOpportunity, explanation: str = ""):
        async with AsyncSessionLocal() as db:
            trade_id = str(uuid.uuid4())
            record = DBTrade(
                id=trade_id,
                timestamp=datetime.utcnow(),
                symbol=opp.symbol,
                strategy=opp.strategy,
                exchange=" -> ".join(opp.exchanges),
                volume=1000.0,
                profit=opp.expectedProfit * 0.95,
                status="completed",
                executionTime=(datetime.utcnow()).isoformat() + "Z",
                explanation=explanation
            )
            db.add(record)
            
            # Update daily performance 
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            result = await db.execute(select(DBPerformance).where(DBPerformance.timestamp == today))
            perf = result.scalars().first()
            if not perf:
                perf = DBPerformance(timestamp=today, profit=0.0, tradeCount=0)
                db.add(perf)
            
            perf.profit += record.profit
            perf.tradeCount += 1
            
            await db.commit()

engine_instance = ArbitrageEngine()
