import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../components/Scene";
import { Label } from "../components/Label";
import { FadeIn } from "../components/FadeIn";
import { COLORS } from "../constants";
import { SERIF, MONO, SANS } from "../fonts";

const Step: React.FC<{ n: string; title: string; body: string; big: string; delay: number; x: number }> = ({ n, title, body, big, delay, x }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const p = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div style={{ position: "absolute", left: x, top: 300, width: 520, opacity: o, transform: `translateY(${(1 - p) * 30}px)`, borderTop: `3px solid ${COLORS.signal}`, paddingTop: 22 }}>
      <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: "0.16em", color: COLORS.signal }}>{n}</div>
      <div style={{ fontFamily: SERIF, fontSize: 54, color: COLORS.paper0, marginTop: 8 }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 23, color: COLORS.paper1, marginTop: 14, lineHeight: 1.4, minHeight: 100 }}>{body}</div>
      <div style={{ fontFamily: MONO, fontSize: 44, color: COLORS.signal, marginTop: 26 }}>{big}</div>
    </div>
  );
};
export const WalkthroughScene: React.FC = () => (
  <Scene vo="vo_walkthrough.wav">
    <Label style={{ position: "absolute", top: 72, left: 80 }}>Memory is the only variable</Label>
    <FadeIn delay={4} style={{ position: "absolute", top: 104, left: 80 }}>
      <div style={{ fontFamily: SERIF, fontSize: 58, color: COLORS.paper0 }}>Persist. Recall. Decide.</div>
    </FadeIn>
    <Step n="01 PERSIST" title="Persist" body="The loss becomes a risk_incident entity, an append-only event, and a risk_policy holding a 5% cap." big="loss → policy" delay={52} x={80} />
    <Step n="02 RECALL" title="Recall" body="A fresh agent and a fresh Sibyl client look the policy up by risk signature. The protocol name is irrelevant." big="by signature" delay={92} x={700} />
    <Step n="03 DECIDE" title="Decide" body="Exposure drops from 30% to 5%. Groundhog finishes $12,300 ahead of the memory-less control." big="30% → 5%" delay={160} x={1320} />
  </Scene>
);
