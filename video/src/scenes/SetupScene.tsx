import React from "react";
import { AbsoluteFill } from "remotion";
import { Scene } from "../components/Scene";
import { Label } from "../components/Label";
import { FadeIn } from "../components/FadeIn";
import { AgentCard, Chip, Sibyl, Wire } from "./Illustrations";
import { COLORS } from "../constants";
import { SERIF } from "../fonts";

export const SetupScene: React.FC = () => (
  <Scene vo="vo_setup.wav">
    <Label style={{ position: "absolute", top: 72, left: 80 }}>Controlled experiment</Label>
    <FadeIn delay={4} style={{ position: "absolute", top: 104, left: 80 }}>
      <div style={{ fontFamily: SERIF, fontSize: 58, color: COLORS.paper0 }}>Two agents. One variable.</div>
    </FadeIn>
    <AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* shared inputs fan out to both agents */}
        <Wire d="M400 396 C 600 396, 700 330, 900 330" delay={44} />
        <Wire d="M400 396 C 600 396, 700 680, 900 680" delay={44} />
        <Wire d="M400 520 C 600 520, 700 360, 900 360" delay={56} />
        <Wire d="M400 520 C 600 520, 700 710, 900 710" delay={56} />
        <Wire d="M400 644 C 600 644, 700 390, 900 390" delay={68} />
        <Wire d="M400 644 C 600 644, 700 740, 900 740" delay={68} />
        {/* the one difference: recall wire from Sibyl into Groundhog only */}
        <Wire d="M1560 620 C 1560 520, 1420 470, 1330 456" delay={185} color={COLORS.signal} width={4} />
      </svg>
    </AbsoluteFill>
    <Chip x={100} y={352} delay={24} label="Capital" value="$100,000 each" />
    <Chip x={100} y={476} delay={34} label="Decision logic" value="Identical, deterministic" />
    <Chip x={100} y={600} delay={44} label="Market inputs" value="Same pools, same outcomes" />
    <AgentCard x={900} y={268} name="Groundhog" memory delay={60} />
    <AgentCard x={900} y={618} name="Amnesiac" memory={false} delay={72} />
    <Sibyl x={1440} y={600} delay={180} glow={200} />
    <FadeIn delay={205} style={{ position: "absolute", left: 1400, top: 860, width: 420 }}>
      <div style={{ fontFamily: SERIF, fontSize: 30, color: COLORS.signal, lineHeight: 1.25 }}>Only Groundhog can read a persisted risk policy.</div>
    </FadeIn>
  </Scene>
);
