import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Label } from "../components/Label";
import { COLORS } from "../constants";

// The recorded view already names its three columns, so instead of prose callouts
// we draw the link between them. No zoom here: the arrows are pinned to the columns.
const Arrow: React.FC<{ x: number; delay: number }> = ({ x, delay }) => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [delay, delay + 22], [58, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <g opacity={o}>
      <line x1={x - 29} y1={572} x2={x + 29} y2={572} stroke={COLORS.signal} strokeWidth={3}
        strokeDasharray={58} strokeDashoffset={draw} strokeLinecap="round" />
      <path d={`M${x + 16} 562 L${x + 30} 572 L${x + 16} 582`} fill="none" stroke={COLORS.signal} strokeWidth={3}
        strokeLinecap="round" strokeLinejoin="round" opacity={interpolate(frame, [delay + 18, delay + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
    </g>
  );
};

export const EvidenceScene: React.FC = () => (
  <Scene name="evidence" vo="vo_evidence.wav">
    <Screen src="shot_evidence.mp4" zoomFrom={1} zoomTo={1}>
      <AbsoluteFill>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Arrow x={823} delay={70} />
          <Arrow x={1323} delay={104} />
        </svg>
      </AbsoluteFill>
      <Label style={{ position: "absolute", top: 40, right: 80 }} color={COLORS.signal}>Every decision cites its incident</Label>
    </Screen>
  </Scene>
);
