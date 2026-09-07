import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../constants";
// A recorded UI clip inside a soft frame with a slow push-in, so screen capture never feels static.
export const Screen: React.FC<{ src: string; still?: boolean; zoomFrom?: number; zoomTo?: number; origin?: string; children?: React.ReactNode }> =
({ src, still = false, zoomFrom = 1.0, zoomTo = 1.04, origin = "50% 40%", children }) => {
  const frame = useCurrentFrame(); const { durationInFrames } = useVideoConfig();
  const zoom = interpolate(frame, [0, durationInFrames], [zoomFrom, zoomTo], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const media = still
    ? <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    : <OffthreadVideo src={staticFile(src)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: origin }}>{media}</AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,10,8,0.55) 0%, rgba(9,10,8,0) 22%, rgba(9,10,8,0) 62%, rgba(9,10,8,0.78) 86%, rgba(9,10,8,0.94) 100%)", pointerEvents: "none" }} />
      {children}
    </AbsoluteFill>
  );
};
