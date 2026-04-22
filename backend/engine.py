import asyncio
import ccxt.async_support as ccxt
import time
import uuid
from typing import List, Dict
from datetime import datetime, timedelta
from database import SessionLocal, DBTrade, DBPerformance
from models import Trade, ArbitrageOpportunity, PerformanceData

class ArbitrageEngine:
    def __init__(self):
        self.is_running = False
        self.start_time = None
        self.exchanges = {
            "binance": ccxt.binance(),
            "bybit": ccxt.bybit()
        }
        self.symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]
        self.opportunities: List[ArbitrageOpportunity] = []
        self.last_update = time.time()
        
    async def start(self):
        if self.is_running: return
        self.is_running = True
        self.start_time = datetime.utcnow()
        asyncio.create_task(self._monitor_loop())
        
    async def stop(self):
        self.is_running = False
        if self.start_time:
            self.start_time = None
        for exchange in self.exchanges.values():
            await exchange.close()

    async def _fetch_tickers(self, symbol: str) -> Dict[str, dict]:
        results = {}
        # Fetching concurrently
        fetch_tasks = [
            self._safe_fetch(name, ex, symbol) 
            for name, ex in self.exchanges.items()
        ]
        res = await asyncio.gather(*fetch_tasks)
        for r in res:
            if r:
                results[r[0]] = r[1]
        return results

    async def _safe_fetch(self, name, exchange, symbol):
        try:
            ticker = await exchange.fetch_ticker(symbol)
            return (name, ticker)
        except Exception:
            return None

    async def _monitor_loop(self):
        while self.is_running:
            try:
                new_opportunities = []
                for symbol in self.symbols:
                    tickers = await self._fetch_tickers(symbol)
                    
                    if "binance" in tickers and "bybit" in tickers:
                        # Cross-exchange arbitrage logic (simplified paper trading)
                        binance_bid = tickers["binance"].get("bid")
                        binance_ask = tickers["binance"].get("ask")
                        bybit_bid = tickers["bybit"].get("bid")
                        bybit_ask = tickers["bybit"].get("ask")
                        
                        if not all([binance_bid, binance_ask, bybit_bid, bybit_ask]):
                            continue
                            
                        # Check buy Binance, sell Bybit
                        if bybit_bid > binance_ask:
                            spread = (bybit_bid - binance_ask) / binance_ask
                            if spread > 0.001:  # 0.1% threshold
                                opp = ArbitrageOpportunity(
                                    id=str(uuid.uuid4()),
                                    timestamp=datetime.utcnow().isoformat() + "Z",
                                    symbol=symbol,
                                    strategy="spot-to-spot",
                                    exchanges=["Binance", "Bybit"],
                                    profitPercentage=spread * 100,
                                    expectedProfit=spread * 1000, # Assuming $1000 uniform trade size
                                    confidence=0.92
                                )
                                new_opportunities.append(opp)
                                await self._execute_paper_trade(opp)
                                
                        # Check buy Bybit, sell Binance
                        if binance_bid > bybit_ask:
                            spread = (binance_bid - bybit_ask) / bybit_ask
                            if spread > 0.001:
                                opp = ArbitrageOpportunity(
                                    id=str(uuid.uuid4()),
                                    timestamp=datetime.utcnow().isoformat() + "Z",
                                    symbol=symbol,
                                    strategy="spot-to-spot",
                                    exchanges=["Bybit", "Binance"],
                                    profitPercentage=spread * 100,
                                    expectedProfit=spread * 1000,
                                    confidence=0.91
                                )
                                new_opportunities.append(opp)
                                await self._execute_paper_trade(opp)
                
                # Keep only last 20 opportunities
                self.opportunities = (new_opportunities + self.opportunities)[:20]
                self.last_update = time.time()
                await asyncio.sleep(5)  # Scan every 5 seconds limits API abuse
                
            except Exception as e:
                print(f"Engine Loop Error: {e}")
                await asyncio.sleep(10)
                
    async def _execute_paper_trade(self, opp: ArbitrageOpportunity):
        # Simulate local trade execution and save to sqlite
        db = SessionLocal()
        trade_id = str(uuid.uuid4())
        record = DBTrade(
            id=trade_id,
            timestamp=opp.timestamp,
            symbol=opp.symbol,
            strategy=opp.strategy,
            exchange=" -> ".join(opp.exchanges),
            volume=1000.0,
            profit=opp.expectedProfit * 0.95, # subtract 5% slippage/fees
            status="completed",
            executionTime=(datetime.utcnow() + timedelta(seconds=1)).isoformat() + "Z"
        )
        db.add(record)
        
        # Update daily performance 
        today = datetime.utcnow().strftime("%Y-%m-%d")
        perf = db.query(DBPerformance).filter(DBPerformance.timestamp == today).first()
        if not perf:
            perf = DBPerformance(timestamp=today, profit=0.0, tradeCount=0)
            db.add(perf)
        
        perf.profit += record.profit
        perf.tradeCount += 1
        
        db.commit()
        db.close()

engine_instance = ArbitrageEngine()
