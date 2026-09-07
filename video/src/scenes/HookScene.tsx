import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../components/Scene";
import { Label } from "../components/Label";
import { COLORS } from "../constants";
import { SERIF, MONO } from "../fonts";

const Phase: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 14, to - 12, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [from, from + 18], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < from || frame > to) return null;
  return <AbsoluteFill style={{ opacity: o, transform: `translateY(${y}px)`, justifyContent: "center", alignItems: "center" }}>{children}</AbsoluteFill>;
};

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const lossScale = spring({ frame: frame - 118, fps, from: 0.93, to: 1, config: { damping: 18 } });
  return (
    <Scene name="hook" captions={false} vo="vo_hook.wav" background={`radial-gradient(ellipse at 50% 42%, ${COLORS.bg2} 0%, ${COLORS.bg} 62%)`}>
      <Label style={{ position: "absolute", top: 72, left: 80 }}>Controlled loop / Life 01</Label>
      <Phase from={0} to={104}>
        <div style={{ fontFamily: SERIF, fontSize: 84, color: COLORS.paper0, textAlign: "center", lineHeight: 1.1, maxWidth: 1400 }}>
          A treasury agent puts <span style={{ color: COLORS.signal }}>30%</span> into a pool.
        </div>
      </Phase>
      <Phase from={104} to={200}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 72, color: COLORS.paper1 }}>The pool depegs.</div>
          <div style={{ fontFamily: MONO, fontSize: 150, color: COLORS.fault, marginTop: 18, transform: `scale(${lossScale})`, letterSpacing: "-0.02em" }}>-$18,000</div>
        </div>
      </Phase>
      <Phase from={200} to={330}>
        <div style={{ textAlign: "center", lineHeight: 1.15 }}>
          <div style={{ fontFamily: SERIF, fontSize: 76, color: COLORS.paper0 }}>Then the session ends.</div>
          <div style={{ fontFamily: SERIF, fontSize: 76, color: COLORS.paper2, marginTop: 10 }}>And the agent forgets.</div>
        </div>
      </Phase>
    </Scene>
  );
};
