import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../components/Scene";
import { FadeIn } from "../components/FadeIn";
import { Label } from "../components/Label";
import { Wordmark } from "../components/Wordmark";
import { COLORS } from "../constants";
import { SERIF } from "../fonts";

export const ProductScene: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const s = spring({ frame, fps, from: 0.94, to: 1, config: { damping: 22 } });
  return (
    <Scene vo="vo_product.wav" background={`radial-gradient(ellipse at 50% 45%, #1a1d14 0%, ${COLORS.bg} 60%)`}>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ transform: `scale(${s})` }}><Wordmark size={150} /></div>
        <FadeIn delay={22}><div style={{ fontFamily: SERIF, fontSize: 40, color: COLORS.paper1, marginTop: 44 }}>A treasury agent that remembers the cost of failure.</div></FadeIn>
        <FadeIn delay={40}><Label style={{ marginTop: 30 }}>Sibyl memory · Base Sepolia receipts</Label></FadeIn>
      </AbsoluteFill>
    </Scene>
  );
};
