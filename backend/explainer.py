def generate_explanation(opp: dict, confidence: float, regime: str) -> str:
    symbol = opp.get("symbol", "UNKNOWN")
    sz = opp.get("size_pct", 0.0)
    b_ex = opp.get("buy_exchange", "Binance")
    s_ex = opp.get("sell_exchange", "Bybit")
    prof = opp.get("expectedProfit", 0.0)
    dur = opp.get("duration", 550)
    
    explanation = (
        f"Executed {symbol} arbitrage during a {regime} market. "
        f"Detected a {sz:.2f}% gap between {b_ex} and {s_ex}. "
        f"The gap persisted for {dur}ms, yielding an ML confidence of {confidence:.2f}. "
        f"Estimated theoretical profit after standard maker/taker fees is ${prof:.2f}."
    )
    return explanation
