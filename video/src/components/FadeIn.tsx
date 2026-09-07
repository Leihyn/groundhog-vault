import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
export const FadeIn: React.FC<{ delay?: number; from?: "up" | "down" | "left" | "right" | "none"; distance?: number; style?: React.CSSProperties; children: React.ReactNode }> =
({ delay = 0, from = "up", distance = 28, style, children }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 120 } });
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const t = { up: `translateY(${(1 - p) * distance}px)`, down: `translateY(${(1 - p) * -distance}px)`, left: `translateX(${(1 - p) * distance}px)`, right: `translateX(${(1 - p) * -distance}px)`, none: "" }[from];
  return <div style={{ opacity: o, transform: t, ...style }}>{children}</div>;
};
