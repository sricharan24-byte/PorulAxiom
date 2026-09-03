"use client";

import React, { useEffect, useState } from "react";
import { ApiClient, Candle } from "../lib/api";
import { Activity } from "lucide-react";

interface StockChartProps {
  symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "1Y">("1D");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartType, setChartType] = useState<"candlestick" | "line">("candlestick");
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCandles = async () => {
      try {
        setLoading(true);
        const data = await ApiClient.getCandles(symbol, timeframe);
        if (isMounted) {
          setCandles(data);
          setHoveredCandle(data[data.length - 1] || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCandles();
    const interval = setInterval(fetchCandles, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol, timeframe]);

  if (candles.length === 0 && loading) {
    return (
      <div className="glass-panel" style={{ height: "360px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity className="animate-spin" size={18} />
          Loading {symbol} intraday chart...
        </div>
      </div>
    );
  }

  // Calculate price and volume bounds
  const prices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const maxVolume = Math.max(...candles.map((c) => c.volume), 1);

  const chartHeight = 240;
  const volumeHeight = 60;
  const totalHeight = chartHeight + volumeHeight;
  const chartWidth = 720;
  const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.7);

  const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  const getVolY = (vol: number) => totalHeight - (vol / maxVolume) * volumeHeight;

  const latest = hoveredCandle || candles[candles.length - 1];
  const isPositive = latest ? latest.close >= latest.open : true;

  return (
    <div className="glass-panel" style={{ padding: "16px", position: "relative" }}>
      {/* Chart Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800 }}>{symbol}</h2>
            {latest && (
              <span className="mono" style={{ fontSize: "1.3rem", fontWeight: 700, color: isPositive ? "var(--color-up)" : "var(--color-down)" }}>
                ₹{latest.close.toFixed(2)}
              </span>
            )}
          </div>
          {latest && (
            <div className="mono" style={{ display: "flex", gap: "14px", marginTop: "4px", fontSize: "0.76rem", color: "var(--text-muted)" }}>
              <span>O: <strong style={{ color: "var(--text-primary)" }}>₹{latest.open.toFixed(2)}</strong></span>
              <span>H: <strong style={{ color: "var(--text-primary)" }}>₹{latest.high.toFixed(2)}</strong></span>
              <span>L: <strong style={{ color: "var(--text-primary)" }}>₹{latest.low.toFixed(2)}</strong></span>
              <span>C: <strong style={{ color: "var(--text-primary)" }}>₹{latest.close.toFixed(2)}</strong></span>
              <span>Vol: <strong style={{ color: "var(--text-primary)" }}>{latest.volume.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Timeframe & View Toggles */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ display: "flex", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-subtle)" }}>
            {(["1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "3px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                  background: timeframe === tf ? "var(--color-primary)" : "transparent",
                  color: timeframe === tf ? "#ffffff" : "var(--text-muted)",
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", background: "var(--bg-input)", borderRadius: "var(--radius-sm)", padding: "2px", border: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setChartType("candlestick")}
              style={{
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
                background: chartType === "candlestick" ? "var(--bg-panel-hover)" : "transparent",
                color: chartType === "candlestick" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "3px 8px",
                fontSize: "0.72rem",
                fontWeight: 600,
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
                background: chartType === "line" ? "var(--bg-panel-hover)" : "transparent",
                color: chartType === "line" ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* SVG Candlestick & Volume Canvas */}
      <div style={{ width: "100%", height: "300px" }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${totalHeight}`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Price Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const p = minPrice + priceRange * (1 - pct);
            const y = chartHeight * pct;
            return (
              <g key={i}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <text x={chartWidth - 5} y={y - 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" className="mono">
                  ₹{p.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator */}
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="var(--border-active)" strokeDasharray="2 2" />

          {/* Chart & Volume Rendering */}
          {candles.map((c, idx) => {
            const x = (idx / (candles.length - 1 || 1)) * (chartWidth - 20) + 10;
            const yHigh = getY(c.high);
            const yLow = getY(c.low);
            const yOpen = getY(c.open);
            const yClose = getY(c.close);
            const isUp = c.close >= c.open;
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
            const color = isUp ? "var(--color-up)" : "var(--color-down)";

            // Volume bar Y
            const volY = getVolY(c.volume);
            const volH = totalHeight - volY;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredCandle(c)}
                style={{ cursor: "crosshair" }}
              >
                {/* Volume Bar */}
                <rect
                  x={x - candleWidth / 2}
                  y={volY}
                  width={candleWidth}
                  height={volH}
                  fill={isUp ? "rgba(0, 230, 118, 0.2)" : "rgba(255, 59, 48, 0.2)"}
                />

                {/* Candlestick / Line */}
                {chartType === "candlestick" && (
                  <>
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" opacity="0.85" />
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      rx="1"
                    />
                  </>
                )}
              </g>
            );
          })}

          {chartType === "line" && (
            <g>
              <polyline
                points={candles.map((c, idx) => `${(idx / (candles.length - 1 || 1)) * (chartWidth - 20) + 10},${getY(c.close)}`).join(" ")}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
