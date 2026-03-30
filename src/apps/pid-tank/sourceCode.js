// This file exports the source code as a string for the CodeViewer.
// It's loaded lazily only when the user clicks "View Code".

const sourceCode = `// PID Water Tank Controller v1.6
// Interactive simulation of a PID controller managing water flow in a tank.
// Built with React + Recharts.

import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DEFAULT_TANK_CAPACITY = 1000;
const MAX_FLOW = 10;
const HISTORY_LENGTH = 200;
const DEFAULT_KP = 0.05;
const DEFAULT_KI = 0.005;
const DEFAULT_KD = 0.8;

// --- SliderWithInput: a slider + editable text field combo ---
function SliderWithInput({ label, value, min, max, step, onChange, color, unit = "" }) {
  const [textValue, setTextValue] = useState(String(value));

  useEffect(() => {
    setTextValue(String(Math.round(value * 10000) / 10000));
  }, [value]);

  const handleTextBlur = () => {
    const num = parseFloat(textValue);
    if (!isNaN(num)) onChange(Math.max(min, Math.min(max, num)));
    else setTextValue(String(value));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: color || "#334155" }}>{label}</label>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="text" value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onBlur={handleTextBlur}
            onKeyDown={(e) => e.key === "Enter" && handleTextBlur()}
            style={{ width: 70, padding: "2px 6px", fontSize: 13, border: "1px solid #cbd5e1",
              borderRadius: 4, textAlign: "right", fontFamily: "monospace" }}
          />
          {unit && <span style={{ fontSize: 12, color: "#64748b" }}>{unit}</span>}
        </div>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color || "#3b82f6" }}
      />
    </div>
  );
}

// --- Main PID Controller Component ---
export default function PidTank() {
  const [running, setRunning] = useState(false);
  const [tankCapacity, setTankCapacity] = useState(DEFAULT_TANK_CAPACITY);
  const [level, setLevel] = useState(500);
  const [inflow, setInflow] = useState(5);
  const [setpoint, setSetpoint] = useState(500);
  const [outflow, setOutflow] = useState(5);
  const [kp, setKp] = useState(DEFAULT_KP);
  const [ki, setKi] = useState(DEFAULT_KI);
  const [kd, setKd] = useState(DEFAULT_KD);
  const [simSpeed, setSimSpeed] = useState(10);
  const [maxSlewRate, setMaxSlewRate] = useState(2);
  const [history, setHistory] = useState([]);
  const [time, setTime] = useState(0);

  const pidState = useRef({ integral: 0, prevError: 0, prevOutflow: 5 });
  const paramsRef = useRef({ kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate });

  useEffect(() => {
    paramsRef.current = { kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate };
  }, [kp, ki, kd, inflow, setpoint, level, simSpeed, tankCapacity, maxSlewRate]);

  // Auto-tune: calculates optimal PID gains given tank size and valve slew rate.
  // Keeps discrete-time loop gain (Kp + Kd) at ~0.85 for stability.
  // Caps Kd based on slew rate to prevent limit-cycling.
  // Reduces Ki for slow valves to prevent integral windup.
  const autoTune = useCallback(() => {
    const TOTAL_GAIN = 0.85;
    const scale = Math.sqrt(DEFAULT_TANK_CAPACITY / tankCapacity);
    const newKp = Math.min(0.05 * scale, TOTAL_GAIN * 0.3);
    const maxUsefulKd = maxSlewRate / 0.5;
    const newKd = Math.min(TOTAL_GAIN - newKp, maxUsefulKd);
    const slewFactor = Math.min(1, maxSlewRate / 2);
    const newKi = 0.005 * scale * slewFactor;
    setKp(Math.round(newKp * 10000) / 10000);
    setKi(Math.round(newKi * 10000) / 10000);
    setKd(Math.round(newKd * 10000) / 10000);
    pidState.current = { integral: 0, prevError: 0, prevOutflow: outflow };
  }, [tankCapacity, maxSlewRate, outflow]);

  // Simulation loop: runs PID calculation each tick
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setLevel((prevLevel) => {
        const p = paramsRef.current;
        const error = prevLevel - p.setpoint;

        // PID calculation with anti-windup
        pidState.current.integral += error;
        const maxIntegral = MAX_FLOW / (p.ki || 0.001);
        pidState.current.integral = Math.max(-maxIntegral, Math.min(maxIntegral, pidState.current.integral));
        const derivative = error - pidState.current.prevError;
        pidState.current.prevError = error;

        let pidOutput = p.kp * error + p.ki * pidState.current.integral + p.kd * derivative;
        pidOutput = Math.max(0, Math.min(MAX_FLOW, pidOutput));

        // Slew rate limiting
        const prevOut = pidState.current.prevOutflow;
        pidOutput = Math.max(prevOut - p.maxSlewRate, Math.min(prevOut + p.maxSlewRate, pidOutput));
        pidOutput = Math.max(0, Math.min(MAX_FLOW, pidOutput));
        pidState.current.prevOutflow = pidOutput;

        const newLevel = Math.max(0, Math.min(p.tankCapacity, prevLevel + p.inflow - pidOutput));
        setOutflow(pidOutput);
        // ... update history and time
        return newLevel;
      });
    }, 1000 / simSpeed);
    return () => clearInterval(interval);
  }, [running, simSpeed]);

  // ... render: TankVisualization, controls, chart, status bar
}`;

export default sourceCode;
