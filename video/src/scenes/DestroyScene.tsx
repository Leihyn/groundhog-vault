import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Label } from "../components/Label";
import { FadeIn } from "../components/FadeIn";
import { AgentCard, Record, Sibyl, Stamp, Wire } from "./Illustrations";
import { COLORS } from "../constants";
import { SERIF } from "../fonts";

export const DestroyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [120, 160], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stampFade = 1 - shift * 0.6;
  return (
    <Scene vo="vo_destroy.wav">
      <Label style={{ position: "absolute", top: 72, left: 80 }}>Between lives</Label>
      <FadeIn delay={4} style={{ position: "absolute", top: 104, left: 80 }}>
        <div style={{ fontFamily: SERIF, fontSize: 58, color: COLORS.paper0 }}>Both runtimes are destroyed.</div>
      </FadeIn>
      <AbsoluteFill style={{ transform: `translateX(${-shift * 760}px)` }}>
        <AgentCard x={900} y={268} name="Groundhog" memory delay={0} dying={30} />
        <AgentCard x={900} y={618} name="Amnesiac" memory={false} delay={0} dying={38} />
        <div style={{ opacity: stampFade }}>
          <Stamp x={960} y={330} delay={34} text="RUNTIME DESTROYED" />
          <Stamp x={960} y={680} delay={44} text="RUNTIME DESTROYED" />
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <Wire d="M1560 620 C 1560 520, 1420 470, 1330 456" delay={0} color={COLORS.line0} width={3} />
        </svg>
        <Sibyl x={1440} y={600} delay={0} glow={80} />
      </AbsoluteFill>
      <FadeIn delay={92} style={{ position: "absolute", left: 80, top: 850, width: 640 }}>
        <div style={{ fontFamily: SERIF, fontSize: 40, color: COLORS.signal, lineHeight: 1.2 }}>The only survivor is the Sibyl database.</div>
      </FadeIn>
      <Record x={1060} y={230} delay={156} kind="entity · risk_incident" rows={[["protocol", "MoonPool"], ["loss", "$18,000"], ["signals", "incentive_yield · concentrated_liquidity · shallow_exit"]]} w={760} />
      <Record x={1060} y={470} delay={204} kind="event · append-only" rows={[["acted", "incident → promoted policy:incentive_yield…"]]} w={760} />
      <Record x={1060} y={620} delay={246} kind="entity · risk_policy" rows={[["key", "signature, not protocol name"], ["max_exposure", "5%"], ["source", "risk_incident (Life 1)"]]} w={760} highlight={0} />
    </Scene>
  );
};
