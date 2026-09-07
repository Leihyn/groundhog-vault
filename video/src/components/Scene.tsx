import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../constants";
import { Captions } from "./Captions";

// Every scene: crossfade edges, narration, and burned-in captions.
// Title cards pass captions={false} — their display text already is the narration,
// and doubling it makes the viewer read the same sentence twice.
export const Scene: React.FC<{
  name: string; vo?: string; voDelay?: number; captions?: boolean;
  background?: string; children: React.ReactNode;
}> = ({ name, vo, voDelay = 8, captions = true, background = COLORS.bg, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background }}>
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        {children}
        {captions ? <Captions scene={name} voDelay={voDelay} /> : null}
      </AbsoluteFill>
      {vo && frame >= voDelay ? <Audio src={staticFile(vo)} startFrom={0} /> : null}
    </AbsoluteFill>
  );
};
