import React from "react";
import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { FadeIn } from "../components/FadeIn";
import { Label } from "../components/Label";
import { Wordmark } from "../components/Wordmark";
import { COLORS, REPO } from "../constants";
import { SERIF, MONO } from "../fonts";
export const CloseScene: React.FC = () => (
  <Scene name="close" captions={false} vo="vo_close.wav" background={`radial-gradient(ellipse at 50% 45%, #1a1d14 0%, ${COLORS.bg} 60%)`}>
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn delay={0}><Wordmark size={120} /></FadeIn>
      <FadeIn delay={26}><div style={{ fontFamily: SERIF, fontSize: 44, color: COLORS.paper0, marginTop: 40 }}>Don't pay for the same lesson twice.</div></FadeIn>
      <FadeIn delay={54}><div style={{ fontFamily: MONO, fontSize: 26, color: COLORS.signal, marginTop: 36 }}>{REPO}</div></FadeIn>
      <FadeIn delay={70}><Label style={{ marginTop: 18 }}>@leihyn on Farcaster · built for the Sibyl hackathon · Base Sepolia</Label></FadeIn>
    </AbsoluteFill>
  </Scene>
);
