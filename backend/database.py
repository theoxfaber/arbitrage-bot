from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

import os

# Set up SQLite database
DB_PATH = "sqlite:///./arbitrage.db"
engine = create_engine(DB_PATH, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class DBTrade(Base):
    __tablename__ = "trades"
    
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(String, index=True)
    symbol = Column(String)
    strategy = Column(String)
    exchange = Column(String)
    volume = Column(Float)
    profit = Column(Float)
    status = Column(String)
    executionTime = Column(String)

class DBPerformance(Base):
    __tablename__ = "performance"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, index=True)
    profit = Column(Float)
    tradeCount = Column(Integer)

def init_db():
    Base.metadata.create_all(bind=engine)
    
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
