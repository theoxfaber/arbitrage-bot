from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, text
from config import settings
import datetime

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

class DBTrade(Base):
    __tablename__ = "trades"
    
    id = Column(String, primary_key=True)
    timestamp = Column(DateTime, nullable=False, primary_key=True) # Composite for timescale
    symbol = Column(String)
    strategy = Column(String)
    exchange = Column(String)
    volume = Column(Float)
    profit = Column(Float)
    status = Column(String)
    executionTime = Column(String)
    explanation = Column(String)

class DBPerformance(Base):
    __tablename__ = "performance"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, primary_key=True)
    profit = Column(Float)
    tradeCount = Column(Integer)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Create TimescaleDB Hypertables
        try:
            await conn.execute(text("SELECT create_hypertable('trades', 'timestamp', if_not_exists => TRUE);"))
            await conn.execute(text("SELECT create_hypertable('performance', 'timestamp', if_not_exists => TRUE);"))
        except Exception as e:
            # Postgres might not have timescale extension loaded or already created
            print(f"Timescale setup note: {e}")

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
