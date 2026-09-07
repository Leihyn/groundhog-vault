import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../constants";
import { SERIF, MONO, SANS } from "../fonts";

// --- shared drawing primitives for the diagram scenes
export const AgentCard: React.FC<{ x: number; y: number; name: string; memory: boolean; delay: number; dying?: number; w?: number }> =
({ x, y, name, memory, delay, dying, w = 420 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, from: 0.94, to: 1, config: { damping: 20 } });
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const die = dying === undefined ? 0 : interpolate(frame, [dying, dying + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o * (1 - die * 0.92), transform: `scale(${p}) translateY(${die * 34}px)`, filter: `blur(${die * 6}px)`, border: `1.5px solid ${memory ? COLORS.signal : COLORS.line1}`, background: COLORS.bg1, padding: "22px 26px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: SERIF, fontSize: 46, color: COLORS.paper0 }}>{name}</div>
        <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: "0.14em", color: memory ? COLORS.signal : COLORS.paper2 }}>MEMORY / {memory ? "ON" : "OFF"}</div>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: COLORS.paper1, marginTop: 10 }}>$100,000</div>
      <div style={{ height: 3, background: COLORS.line0, marginTop: 10 }}><div style={{ width: "100%", height: "100%", background: memory ? COLORS.signal : COLORS.paper1 }} /></div>
      {dying !== undefined && die > 0.2 ? null : null}
    </div>
  );
};

export const Stamp: React.FC<{ x: number; y: number; delay: number; text: string; color?: string }> = ({ x, y, delay, text, color = COLORS.fault }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, from: 1.12, to: 1, config: { damping: 14, stiffness: 200 } });
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `scale(${p}) rotate(-4deg)`, border: `3px solid ${color}`, color, fontFamily: MONO, fontSize: 24, letterSpacing: "0.16em", padding: "8px 16px" }}>{text}</div>
  );
};

export const Sibyl: React.FC<{ x: number; y: number; delay: number; glow?: number; scale?: number }> = ({ x, y, delay, glow = 0, scale = 1 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const p = spring({ frame: frame - delay, fps, from: 0.94, to: 1, config: { damping: 20 } });
  const g = interpolate(frame, [glow, glow + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `scale(${p * scale})`, transformOrigin: "top left" }}>
      <svg width={260} height={230} viewBox="0 0 260 230">
        <defs><filter id="glow"><feGaussianBlur stdDeviation={8 * g} result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <g filter="url(#glow)">
          <ellipse cx={130} cy={40} rx={110} ry={30} fill={COLORS.bg2} stroke={COLORS.signal} strokeWidth={3} />
          <path d="M20 40 V170 A110 30 0 0 0 240 170 V40" fill={COLORS.bg1} stroke={COLORS.signal} strokeWidth={3} />
          <path d="M20 105 A110 30 0 0 0 240 105" fill="none" stroke={COLORS.signal} strokeWidth={2} opacity={0.55} />
        </g>
        <text x={130} y={218} textAnchor="middle" fontFamily={MONO} fontSize={18} letterSpacing={2.5} fill={COLORS.signal}>SIBYL MEMORY</text>
      </svg>
    </div>
  );
};

export const Wire: React.FC<{ d: string; delay: number; color?: string; dashed?: boolean; width?: number }> = ({ d, delay, color = COLORS.line1, dashed, width = 3 }) => {
  const frame = useCurrentFrame();
  const len = 1400;
  const draw = interpolate(frame, [delay, delay + 34], [len, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? `${len} ${len}` : len} strokeDashoffset={draw} strokeLinecap="round" />;
};

export const Chip: React.FC<{ x: number; y: number; delay: number; label: string; value?: string; accent?: string; w?: number }> = ({ x, y, delay, label, value, accent = COLORS.paper1, w = 300 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const p = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: `translateX(${(1 - p) * -22}px)`, border: `1px solid ${COLORS.line1}`, background: COLORS.bg1, padding: "14px 18px" }}>
      <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.14em", color: COLORS.paper2, textTransform: "uppercase" }}>{label}</div>
      {value ? <div style={{ fontFamily: SANS, fontSize: 24, color: accent, marginTop: 4 }}>{value}</div> : null}
    </div>
  );
};

export const Record: React.FC<{ x: number; y: number; delay: number; kind: string; rows: [string, string][]; w?: number; highlight?: number; accent?: string }> =
({ x, y, delay, kind, rows, w = 500, highlight, accent = COLORS.signal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const p = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: o, transform: `translateY(${(1 - p) * 26}px)`, border: `1.5px solid ${COLORS.line1}`, background: COLORS.bg1 }}>
      <div style={{ fontFamily: MONO, fontSize: 18, color: accent, padding: "12px 18px", borderBottom: `1px solid ${COLORS.line0}`, letterSpacing: "0.04em" }}>{kind}</div>
      <div style={{ padding: "10px 18px 14px" }}>
        {rows.map(([k, v], i) => {
          const hot = highlight === i && frame > delay + 20;
          return (
            <div key={k} style={{ display: "flex", gap: 16, fontFamily: MONO, fontSize: 18, lineHeight: 1.7 }}>
              <span style={{ color: COLORS.paper2, minWidth: 150 }}>{k}</span>
              <span style={{ color: hot ? COLORS.signal : COLORS.paper1, background: hot ? "rgba(215,255,63,0.12)" : "transparent", padding: hot ? "0 6px" : 0 }}>{v}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
