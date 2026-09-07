import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../constants";
import { MONO, SANS } from "../fonts";
export const Callout: React.FC<{ title: string; body?: string; enter: number; exit: number; x: number; y: number; width?: number; accent?: string }> =
({ title, body, enter, exit, x, y, width = 460, accent = COLORS.signal }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enter, fps, config: { damping: 20, stiffness: 140 } });
  const out = interpolate(frame, [exit - 12, exit], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(p, [0, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * out;
  if (frame < enter || opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width, opacity, transform: `translateY(${(1 - p) * 14}px)`, background: "rgba(9,10,8,0.92)", border: `1.5px solid ${accent}`, padding: "16px 20px", boxShadow: "0 18px 50px rgba(0,0,0,0.55)" }}>
      <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 500, color: accent, letterSpacing: "0.02em" }}>{title}</div>
      {body ? <div style={{ fontFamily: SANS, fontSize: 19, color: COLORS.paper1, marginTop: 6, lineHeight: 1.35 }}>{body}</div> : null}
    </div>
  );
};
