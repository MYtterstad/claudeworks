'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


const DEFAULT_TANK_CAPACITY = 1000;
const MAX_FLOW = 10;
const HISTORY_LENGTH = 200;

// Optimal PID defaults for this system (integrator plant, flow 0-10, tank 0-1000)
const DEFAULT_KP = 0.02;
const DEFAULT_KI = 0.002;
const DEFAULT_KD = 0.3;

function SliderWithInput({ label, value, min, max, step, onChange, color, unit = "" }) {
  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(Math.round(value * 10000) / 10000));
  }, [value]);

  const handleTextChange = (e) => {
    setTextValue(e.target.value);
  };

  const handleTextBlur = () => {
    const num = parseFloat(textValue);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)));
    } else {
      setTextValue(String(value));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleTextBlur();
  };

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: color || "#334155" }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="text"
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: 60,
              padding: "2px 4px",
              fontSize: 11,
              border: "1px solid #cbd5e1",
              borderRadius: 4,
              textAlign: "right",
              fontFamily: "monospace",
            }}
          />
          {unit && <span style={{ fontSize: 11, color: "#64748b" }}>{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || "#3b82f6" }}
      />
    </div>
  );
}

function TankVisualization({ level, capacity, inflow, outflow, setpoint }) {
  const fillPercent = (level / capacity) * 100;
  const setpointPercent = (setpoint / capacity) * 100;
  const tankWidth = 160;
  const tankHeight = 260;
  const wallThickness = 4;
  const innerWidth = tankWidth - wallThickness * 2;
  const innerHeight = tankHeight - wallThickness * 2;
  const waterHeight = (fillPercent / 100) * innerHeight;
  const setpointY = tankHeight - wallThickness - (setpointPercent / 100) * innerHeight;

  // Inflow arrow size based on flow rate
  const inflowSize = (inflow / MAX_FLOW) * 30 + 5;
  const outflowSize = (outflow / MAX_FLOW) * 30 + 5;

  return (
    <svg width={260} height={340} viewBox="0 0 260 340">
      {/* Inflow pipe and arrow */}
      <rect x={85} y={0} width={20} height={30} fill="#93c5fd" rx={2} />
      <polygon
        points={`${95},${30} ${95 - inflowSize / 2},${30} ${95},${30 + inflowSize}`}
        fill="#3b82f6"
        opacity={inflow > 0 ? 0.8 : 0.2}
      />
      {inflow > 0 && (
        <>
          <circle cx={88} cy={32 + Math.random() * 10} r={2} fill="#60a5fa" opacity={0.6}>
            <animate attributeName="cy" from="32" to={340 - wallThickness - waterHeight} dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx={98} cy={38 + Math.random() * 10} r={1.5} fill="#60a5fa" opacity={0.5}>
            <animate attributeName="cy" from="38" to={340 - wallThickness - waterHeight} dur="1.8s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      <text x={95} y={-2} textAnchor="middle" fontSize={11} fill="#3b82f6" fontWeight={600}>
        IN: {inflow.toFixed(1)} L/t
      </text>

      {/* Tank body */}
      <g transform={`translate(${50}, ${50})`}>
        {/* Tank walls */}
        <rect x={0} y={0} width={tankWidth} height={tankHeight} fill="#e2e8f0" rx={4} stroke="#94a3b8" strokeWidth={2} />

        {/* Water fill */}
        <rect
          x={wallThickness}
          y={tankHeight - wallThickness - waterHeight}
          width={innerWidth}
          height={waterHeight}
          fill="url(#waterGradient)"
          rx={2}
        />

        {/* Water surface shimmer */}
        {level > 0 && (
          <line
            x1={wallThickness + 2}
            y1={tankHeight - wallThickness - waterHeight}
            x2={tankWidth - wallThickness - 2}
            y2={tankHeight - wallThickness - waterHeight}
            stroke="#60a5fa"
            strokeWidth={2}
            opacity={0.7}
          />
        )}

        {/* Setpoint marker */}
        <line
          x1={-10}
          y1={setpointY}
          x2={tankWidth + 10}
          y2={setpointY}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="6,3"
        />
        <text x={tankWidth + 14} y={setpointY + 4} fontSize={10} fill="#ef4444" fontWeight={600}>
          SP
        </text>

        {/* Level percentage markers */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = tankHeight - wallThickness - (pct / 100) * innerHeight;
          return (
            <g key={pct}>
              <line x1={-6} y1={y} x2={0} y2={y} stroke="#94a3b8" strokeWidth={1} />
              <text x={-10} y={y + 3} textAnchor="end" fontSize={9} fill="#94a3b8">
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Level text in center of tank */}
        <text
          x={tankWidth / 2}
          y={tankHeight / 2}
          textAnchor="middle"
          fontSize={22}
          fontWeight={700}
          fill={fillPercent > 50 ? "#1e3a5f" : "#334155"}
          fontFamily="monospace"
        >
          {Math.round(level)} L
        </text>
        <text
          x={tankWidth / 2}
          y={tankHeight / 2 + 20}
          textAnchor="middle"
          fontSize={12}
          fill={fillPercent > 50 ? "#1e3a5f" : "#64748b"}
        >
          ({fillPercent.toFixed(1)}%)
        </text>
      </g>

      {/* Outflow pipe and arrow */}
      <rect x={145} y={310} width={20} height={30} fill="#93c5fd" rx={2} />
      <polygon
        points={`${155},${320} ${155 - outflowSize / 2},${320} ${155},${320 + outflowSize}`}
        fill="#f59e0b"
        opacity={outflow > 0 ? 0.8 : 0.2}
      />
      {outflow > 0 && (
        <>
          <circle cx={150} cy={320} r={2} fill="#fbbf24" opacity={0.6}>
            <animate attributeName="cy" from="315" to="345" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={158} cy={325} r={1.5} fill="#fbbf24" opacity={0.5}>
            <animate attributeName="cy" from="320" to="345" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}
      <text x={155} y={355} textAnchor="middle" fontSize={11} fill="#f59e0b" fontWeight={600}>
        OUT: {outflow.toFixed(1)} L/t
      </text>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="waterGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function PidTank() {
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('wide');
  const [availHeight, setAvailHeight] = useState(600);
  const [controlTab, setControlTab] = useState('user');

  const [running, setRunning] = useState(false);
  const [tankCapacity, setTankCapacity] = useState(DEFAULT_TANK_CAPACITY);
  const [level, setLevel] = useState(500);
  const [inflow, setInflow] = useState(5);
  const [setpoint, setSetpoint] = useState(500);
  const [outflow, setOutflow] = useState(5);
  const [kp, setKp] = useState(DEFAULT_KP);
  const [ki, setKi] = useState(DEFAULT_KI);
  const [kd, setKd] = useState(DEFAULT_KD);
  const [simSpeed, setSimSpeed] = useState(10); // ticks per second
  const [maxSlewRate, setMaxSlewRate] = useState(2); // max outflow change per tick (L/t per tick)
  const [history, setHistory] = useState([]);
  const [time, setTime] = useState(0);

  // Layout computation
  useEffect(() => {
    const computeLayout = () => {
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const aH = wh - 120;
      setAvailHeight(aH);
      setLayoutMode(ww / wh > 1.2 ? 'wide' : 'tall');
    };

    computeLayout();
    const raf = requestAnimationFrame(computeLayout);
    const timer = setTimeout(computeLayout, 200);
    window.addEventListener('resize', computeLayout);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(computeLayout) : null;
    if (ro && containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', computeLayout);
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (ro) ro.disconnect();
    };
  }, []);

  // PID state stored in refs so the simulation loop always sees current values
  const pidState = useRef({ integral: 0, prevError: 0, prevOutflow: 5, filteredDeriv: 0 });
  const paramsRef = useRef({ kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate });

  useEffect(() => {
    paramsRef.current = { kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate };
  }, [kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate]);

  // When tank capacity changes, clamp level and setpoint
  const handleTankCapacityChange = useCallback((newCap) => {
    setTankCapacity(newCap);
    setLevel((prev) => Math.min(prev, newCap));
    setSetpoint((prev) => Math.min(prev, newCap));
  }, []);

  // Auto-tune: calculate optimal PID gains for the current tank AND slew rate.
  // The slew rate is a physical constraint set by the user — auto-tune reads it
  // and picks gains that work well within that constraint.
  // Key insight: the discrete-time loop gain is (Kp + Kd). For stability this must
  // be < 2, and for well-damped response ~0.85 works well.
  // When the valve is slow (low slew rate), Kd must be reduced because the
  // derivative term would demand changes the valve can't deliver, causing
  // limit-cycling. Ki is also reduced to avoid integral windup.
  const autoTune = useCallback(() => {
    // Target: critically-damped response. For a discrete integrator plant,
    // the closed-loop poles should be at ~0.93 for smooth behaviour.
    // Total loop gain (Kp + Kd) must stay well below 1.0 to avoid oscillation.
    const scale = Math.sqrt(DEFAULT_TANK_CAPACITY / tankCapacity);

    // Kp: proportional to error — keep gentle to avoid ringing
    const newKp = Math.min(0.02 * scale, 0.06);

    // Kd: derivative damps oscillation, but cap to what the valve can deliver.
    // If slew rate is low, large Kd demands changes the valve can't make → limit-cycling.
    const maxUsefulKd = maxSlewRate * 0.4; // conservative: 40% of slew rate
    const newKd = Math.min(0.3 * scale, maxUsefulKd);

    // Ki: very small — just enough to eliminate steady-state offset.
    // Reduce further when slew rate is tight to prevent windup.
    const slewFactor = Math.min(1, maxSlewRate / 2);
    const newKi = 0.002 * scale * slewFactor;

    setKp(Math.round(newKp * 10000) / 10000);
    setKi(Math.round(newKi * 10000) / 10000);
    setKd(Math.round(newKd * 10000) / 10000);
    // Reset PID state to avoid carryover from old tuning
    pidState.current = { integral: 0, prevError: 0, prevOutflow: outflow, filteredDeriv: 0 };
  }, [tankCapacity, maxSlewRate, outflow]);

  const reset = useCallback(() => {
    setRunning(false);
    setTankCapacity(DEFAULT_TANK_CAPACITY);
    setLevel(500);
    setInflow(5);
    setSetpoint(500);
    setOutflow(5);
    setKp(DEFAULT_KP);
    setKi(DEFAULT_KI);
    setKd(DEFAULT_KD);
    setSimSpeed(10);
    setMaxSlewRate(2);
    setHistory([]);
    setTime(0);
    pidState.current = { integral: 0, prevError: 0, prevOutflow: 5, filteredDeriv: 0 };
  }, []);

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setLevel((prevLevel) => {
        const p = paramsRef.current;
        const error = prevLevel - p.setpoint;

        // PID calculation
        pidState.current.integral += error;
        // Anti-windup: clamp integral (tighter bound to prevent overshoot)
        const maxIntegral = (MAX_FLOW * 0.5) / (p.ki || 0.001);
        pidState.current.integral = Math.max(-maxIntegral, Math.min(maxIntegral, pidState.current.integral));

        // Low-pass filtered derivative to suppress noise-driven oscillation
        const rawDerivative = error - pidState.current.prevError;
        const filtAlpha = 0.3; // smoothing factor (0 = ignore new, 1 = no filter)
        pidState.current.filteredDeriv = filtAlpha * rawDerivative + (1 - filtAlpha) * (pidState.current.filteredDeriv || 0);
        pidState.current.prevError = error;

        let pidOutput = p.kp * error + p.ki * pidState.current.integral + p.kd * pidState.current.filteredDeriv;

        // Clamp outflow to valid range
        pidOutput = Math.max(0, Math.min(MAX_FLOW, pidOutput));

        // Slew rate limit: valve can only change this many L/t per tick
        // Scale to a fraction so the valve moves smoothly (max 10% of range per tick at default)
        const prevOut = pidState.current.prevOutflow;
        const maxChange = p.maxSlewRate * 0.1; // 0.1 scale: slew=2 means ±0.2 L/t per tick
        pidOutput = Math.max(prevOut - maxChange, Math.min(prevOut + maxChange, pidOutput));
        pidOutput = Math.max(0, Math.min(MAX_FLOW, pidOutput)); // re-clamp after slew
        pidState.current.prevOutflow = pidOutput;

        // Update level
        const newLevel = Math.max(0, Math.min(p.tankCapacity, prevLevel + p.inflow - pidOutput));

        // Update outflow display and history (via setState batching)
        setOutflow(pidOutput);
        setTime((t) => {
          const newTime = t + 1;
          setHistory((prev) => {
            const entry = {
              t: newTime,
              level: Math.round(newLevel * 10) / 10,
              setpoint: p.setpoint,
              inflow: p.inflow,
              outflow: Math.round(pidOutput * 100) / 100,
            };
            const newHist = [...prev, entry];
            return newHist.length > HISTORY_LENGTH ? newHist.slice(-HISTORY_LENGTH) : newHist;
          });
          return newTime;
        });

        return newLevel;
      });
    }, 1000 / simSpeed);

    return () => clearInterval(interval);
  }, [running, simSpeed]);

  // Computed chart height for wide mode
  const chartHeight = layoutMode === 'wide' ? availHeight - 80 : Math.max(150, availHeight * 0.55 - 40);

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        height: availHeight,
        display: "flex",
        flexDirection: layoutMode === 'wide' ? 'row' : 'column',
        gap: layoutMode === 'wide' ? 16 : 12,
        overflow: "hidden",
      }}
    >
      {/* WIDE MODE: Left Tank + Center Chart + Right Controls */}
      {layoutMode === 'wide' ? (
        <>
          {/* Left: Tank Visualization (fixed width) */}
          <div style={{
            flex: "0 0 280px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            overflow: "hidden",
          }}>
            <TankVisualization
              level={level}
              capacity={tankCapacity}
              inflow={inflow}
              outflow={outflow}
              setpoint={setpoint}
            />
          </div>

          {/* Center: Time History Chart (flex) */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 300,
            overflow: "hidden",
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#334155",
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}>
              Time History
            </div>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" fontSize={10} stroke="#94a3b8" label={{ value: "Time", position: "insideBottomRight", offset: -5, fontSize: 10 }} />
                <YAxis yAxisId="level" domain={[0, tankCapacity]} fontSize={10} stroke="#94a3b8" label={{ value: "Level (L)", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <YAxis yAxisId="flow" orientation="right" domain={[0, MAX_FLOW]} fontSize={10} stroke="#94a3b8" label={{ value: "Flow (L/t)", angle: 90, position: "insideRight", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="level" type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} dot={false} name="Level" />
                <Line yAxisId="level" type="monotone" dataKey="setpoint" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Setpoint" />
                <Line yAxisId="flow" type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Inflow" />
                <Line yAxisId="flow" type="monotone" dataKey="outflow" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Outflow" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Right: Controls Panel (stacked vertically) */}
          <div style={{
            flex: "0 0 280px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "hidden",
          }}>
            {/* Transport Controls */}
            <div style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => setRunning(!running)}
                style={{
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: running ? "#ef4444" : "#22c55e",
                  color: "white",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {running ? "⏸ Pause" : "▶ Start"}
              </button>
              <button
                onClick={reset}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "white",
                  color: "#475569",
                  whiteSpace: "nowrap",
                }}
              >
                Reset
              </button>
              <button
                onClick={autoTune}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #fbbf24",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "#fef3c7",
                  color: "#92400e",
                  transition: "background 0.2s",
                }}
                title="Calculate optimal Kp, Ki, Kd"
              >
                Auto-Tune
              </button>
              <div style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                t={time}
              </div>
            </div>

            {/* User Controls */}
            <div style={{
              background: "#F8F6F0",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #D9D3C7",
              overflow: "auto",
              flex: 1,
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6b5b4f",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                User Controls
              </div>
              <SliderWithInput label="Tank Cap." value={tankCapacity} min={100} max={1000} step={10} onChange={handleTankCapacityChange} color="#0ea5e9" unit="L" />
              <SliderWithInput label="Inflow" value={inflow} min={0} max={10} step={0.1} onChange={setInflow} color="#3b82f6" unit="L/t" />
              <SliderWithInput label="Setpoint" value={setpoint} min={0} max={tankCapacity} step={1} onChange={setSetpoint} color="#ef4444" unit="L" />
              <SliderWithInput label="Sim Speed" value={simSpeed} min={1} max={60} step={1} onChange={setSimSpeed} color="#8b5cf6" unit="ticks/s" />
              <SliderWithInput label="Valve Slew" value={maxSlewRate} min={0.1} max={10} step={0.1} onChange={setMaxSlewRate} color="#6366f1" unit="L/t" />
            </div>

            {/* PID Tuning */}
            <div style={{
              background: "#F8F6F0",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #D9D3C7",
              overflow: "auto",
              flex: 1,
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6b5b4f",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                PID Tuning
              </div>
              <SliderWithInput label="Kp" value={kp} min={0} max={0.5} step={0.001} onChange={setKp} color="#f59e0b" />
              <SliderWithInput label="Ki" value={ki} min={0} max={0.05} step={0.0001} onChange={setKi} color="#f59e0b" />
              <SliderWithInput label="Kd" value={kd} min={0} max={5} step={0.01} onChange={setKd} color="#f59e0b" />
            </div>

            {/* Status Bar */}
            <div style={{
              fontSize: 10,
              color: "#64748b",
              fontFamily: "monospace",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "8px 0",
            }}>
              <span>Level: <b style={{ color: "#3b82f6" }}>{level.toFixed(1)}L</b></span>
              <span>Error: <b style={{ color: Math.abs(level - setpoint) > 10 ? "#ef4444" : "#22c55e" }}>{(level - setpoint).toFixed(1)}L</b></span>
              <span>In/Out: <b style={{ color: "#22c55e" }}>{inflow.toFixed(1)}</b> / <b style={{ color: "#f59e0b" }}>{outflow.toFixed(1)}</b></span>
            </div>
          </div>
        </>
      ) : (
        /* TALL MODE: Tank + Chart on top, Tabbed Controls below */
        <>
          {/* Top: Tank + Chart side by side (or stacked if very narrow) */}
          <div style={{
            flex: "0 0 55%",
            display: "flex",
            gap: 10,
            overflow: "hidden",
          }}>
            {/* Tank */}
            <div style={{
              flex: "0 0 auto",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "center",
            }}>
              <TankVisualization
                level={level}
                capacity={tankCapacity}
                inflow={inflow}
                outflow={outflow}
                setpoint={setpoint}
              />
            </div>

            {/* Chart */}
            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 200,
              overflow: "hidden",
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 2,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}>
                History
              </div>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="t" fontSize={9} stroke="#94a3b8" />
                  <YAxis yAxisId="level" domain={[0, tankCapacity]} fontSize={9} stroke="#94a3b8" width={35} />
                  <YAxis yAxisId="flow" orientation="right" domain={[0, MAX_FLOW]} fontSize={9} stroke="#94a3b8" width={35} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 6 }}
                    formatter={(value, name) => [typeof value === "number" ? value.toFixed(2) : value, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line yAxisId="level" type="monotone" dataKey="level" stroke="#3b82f6" strokeWidth={2} dot={false} name="Level" />
                  <Line yAxisId="level" type="monotone" dataKey="setpoint" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Setpoint" />
                  <Line yAxisId="flow" type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Inflow" />
                  <Line yAxisId="flow" type="monotone" dataKey="outflow" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Outflow" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom: Tabbed Controls + Status */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Transport buttons */}
            <div style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              marginBottom: 8,
              flexWrap: "wrap",
            }}>
              <button
                onClick={() => setRunning(!running)}
                style={{
                  padding: "5px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: running ? "#ef4444" : "#22c55e",
                  color: "white",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                {running ? "⏸" : "▶"}
              </button>
              <button
                onClick={reset}
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "white",
                  color: "#475569",
                  whiteSpace: "nowrap",
                }}
              >
                Reset
              </button>
              <button
                onClick={autoTune}
                style={{
                  padding: "5px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1px solid #fbbf24",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "#fef3c7",
                  color: "#92400e",
                  whiteSpace: "nowrap",
                }}
              >
                Tune
              </button>
              <div style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "#64748b",
                fontFamily: "monospace",
                whiteSpace: "nowrap",
              }}>
                t={time}
              </div>
            </div>

            {/* Tabs */}
            <div style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              borderBottom: "1px solid #e2e8f0",
            }}>
              <button
                onClick={() => setControlTab('user')}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: controlTab === 'user' ? "#3b82f6" : "transparent",
                  color: controlTab === 'user' ? "white" : "#64748b",
                  border: "none",
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                User
              </button>
              <button
                onClick={() => setControlTab('pid')}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: controlTab === 'pid' ? "#f59e0b" : "transparent",
                  color: controlTab === 'pid' ? "white" : "#64748b",
                  border: "none",
                  borderRadius: "6px 6px 0 0",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                PID
              </button>
            </div>

            {/* Tab Content */}
            <div style={{
              flex: 1,
              overflow: "auto",
              background: "#F8F6F0",
              borderRadius: 10,
              padding: 12,
              border: "1px solid #D9D3C7",
            }}>
              {controlTab === 'user' ? (
                <div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6b5b4f",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    User Controls
                  </div>
                  <SliderWithInput label="Tank Cap." value={tankCapacity} min={100} max={1000} step={10} onChange={handleTankCapacityChange} color="#0ea5e9" unit="L" />
                  <SliderWithInput label="Inflow" value={inflow} min={0} max={10} step={0.1} onChange={setInflow} color="#3b82f6" unit="L/t" />
                  <SliderWithInput label="Setpoint" value={setpoint} min={0} max={tankCapacity} step={1} onChange={setSetpoint} color="#ef4444" unit="L" />
                  <SliderWithInput label="Sim Speed" value={simSpeed} min={1} max={60} step={1} onChange={setSimSpeed} color="#8b5cf6" unit="ticks/s" />
                  <SliderWithInput label="Valve Slew" value={maxSlewRate} min={0.1} max={10} step={0.1} onChange={setMaxSlewRate} color="#6366f1" unit="L/t" />
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#6b5b4f",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    PID Tuning
                  </div>
                  <SliderWithInput label="Kp" value={kp} min={0} max={0.5} step={0.001} onChange={setKp} color="#f59e0b" />
                  <SliderWithInput label="Ki" value={ki} min={0} max={0.05} step={0.0001} onChange={setKi} color="#f59e0b" />
                  <SliderWithInput label="Kd" value={kd} min={0} max={5} step={0.01} onChange={setKd} color="#f59e0b" />
                </div>
              )}
            </div>

            {/* Status */}
            <div style={{
              fontSize: 10,
              color: "#64748b",
              fontFamily: "monospace",
              display: "flex",
              gap: 10,
              marginTop: 8,
              flexWrap: "wrap",
            }}>
              <span>Level: <b style={{ color: "#3b82f6" }}>{level.toFixed(1)}L</b></span>
              <span>Error: <b style={{ color: Math.abs(level - setpoint) > 10 ? "#ef4444" : "#22c55e" }}>{(level - setpoint).toFixed(1)}L</b></span>
              <span>In: <b style={{ color: "#22c55e" }}>{inflow.toFixed(1)}</b> Out: <b style={{ color: "#f59e0b" }}>{outflow.toFixed(1)}</b></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}