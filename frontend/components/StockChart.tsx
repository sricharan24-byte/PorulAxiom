"use client";

import React, { useEffect, useState, useRef } from "react";
import { ApiClient, Candle } from "../lib/api";
import { Maximize2, Activity } from "lucide-react";

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
      <div className="glass-panel" style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Activity className="animate-spin" size={20} />
          Loading {symbol} chart...
        </div>
      </div>
    );
  }

  // Calculate high/low for SVG bounds
  const prices = candles.flatMap((c) => [c.high, c.low]);
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;
  const priceRange = maxPrice - minPrice || 1;

  const chartHeight = 280;
  const chartWidth = 700;
  const candleWidth = Math.max(3, (chartWidth / candles.length) * 0.7);

  const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const latest = hoveredCandle || candles[candles.length - 1];
  const isPositive = latest ? latest.close >= latest.open : true;

  return (
    <div className="glass-panel" style={{ padding: "20px" }}>
      {/* Header with controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <h2 style={{ fontSize: "1.6rem" }}>{symbol}</h2>
            {latest && (
              <span className="mono" style={{ fontSize: "1.4rem", fontWeight: 700, color: isPositive ? "var(--color-up)" : "var(--color-down)" }}>
                ₹{latest.close.toFixed(2)}
              </span>
            )}
          </div>
          {latest && (
            <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              <span>O: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{latest.open.toFixed(2)}</strong></span>
              <span>H: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{latest.high.toFixed(2)}</strong></span>
              <span>L: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{latest.low.toFixed(2)}</strong></span>
              <span>C: <strong className="mono" style={{ color: "var(--text-primary)" }}>₹{latest.close.toFixed(2)}</strong></span>
              <span>Vol: <strong className="mono" style={{ color: "var(--text-primary)" }}>{latest.volume.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* Timeframe and Type Toggle */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ display: "flex", background: "rgba(30, 38, 51, 0.5)", borderRadius: "var(--radius-sm)", padding: "2px" }}>
            {(["1D", "1W", "1M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  background: timeframe === tf ? "var(--color-brand)" : "transparent",
                  color: timeframe === tf ? "#000" : "var(--text-secondary)",
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", background: "rgba(30, 38, 51, 0.5)", borderRadius: "var(--radius-sm)", padding: "2px" }}>
            <button
              onClick={() => setChartType("candlestick")}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: chartType === "candlestick" ? "rgba(255, 255, 255, 0.15)" : "transparent",
                color: chartType === "candlestick" ? "#fff" : "var(--text-muted)",
              }}
            >
              Candles
            </button>
            <button
              onClick={() => setChartType("line")}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                background: chartType === "line" ? "rgba(255, 255, 255, 0.15)" : "transparent",
                color: chartType === "line" ? "#fff" : "var(--text-muted)",
              }}
            >
              Line
            </button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div style={{ width: "100%", height: "300px", position: "relative" }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: "100%", height: "100%", overflow: "visible" }}
          onMouseLeave={() => setHoveredCandle(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const p = minPrice + priceRange * (1 - pct);
            const y = chartHeight * pct;
            return (
              <g key={i}>
                <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" />
                <text x={chartWidth - 5} y={y - 4} fill="var(--text-muted)" fontSize="9" textAnchor="end" className="mono">
                  ₹{p.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Chart Rendering */}
          {chartType === "candlestick" ? (
            candles.map((c, idx) => {
              const x = (idx / (candles.length - 1 || 1)) * (chartWidth - 20) + 10;
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const isUp = c.close >= c.open;
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const color = isUp ? "#10b981" : "#f43f5e";

              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredCandle(c)}
                  style={{ cursor: "crosshair" }}
                >
                  {/* Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" opacity="0.85" />
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                </g>
              );
            })
          ) : (
            // Line Chart with Gradient Fill
            <g>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                points={`
                  10,${chartHeight} 
                  ${candles.map((c, idx) => `${(idx / (candles.length - 1 || 1)) * (chartWidth - 20) + 10},${getY(c.close)}`).join(" ")} 
                  ${chartWidth - 10},${chartHeight}
                `}
                fill="url(#lineGrad)"
              />
              <polyline
                points={candles.map((c, idx) => `${(idx / (candles.length - 1 || 1)) * (chartWidth - 20) + 10},${getY(c.close)}`).join(" ")}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
