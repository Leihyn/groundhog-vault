import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../components/Scene";
import { Label } from "../components/Label";
import { FadeIn } from "../components/FadeIn";
import { COLORS } from "../constants";
import { SERIF, MONO, SANS } from "../fonts";

const Step: React.FC<{ n: string; title: string; body: string; code: string[]; delay: number; x: number }> =
({ n, title, body, code, delay, x }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const o = spring({ frame: frame - delay, fps, from: 0, to: 1, config: { damping: 30 } });
  const p = spring({ frame: frame - delay, fps, config: { damping: 20 } });
  return (
    <div style={{ position: "absolute", left: x, top: 268, width: 528, opacity: o, transform: `translateY(${(1 - p) * 30}px)`, borderTop: `3px solid ${COLORS.signal}`, paddingTop: 20 }}>
      <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: "0.16em", color: COLORS.signal }}>{n}</div>
      <div style={{ fontFamily: SERIF, fontSize: 50, color: COLORS.paper0, marginTop: 6 }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 21, color: COLORS.paper1, marginTop: 12, lineHeight: 1.4, minHeight: 92 }}>{body}</div>
      <div style={{ marginTop: 18, border: `1px solid ${COLORS.line0}`, background: COLORS.bg1, padding: "14px 16px" }}>
        {code.map((line, i) => {
          const lo = spring({ frame: frame - delay - 12 - i * 7, fps, from: 0, to: 1, config: { damping: 30 } });
          return (
            <div key={i} style={{ fontFamily: MONO, fontSize: 17, color: line.startsWith("#") ? COLORS.paper2 : COLORS.signal, lineHeight: 1.75, opacity: lo, whiteSpace: "nowrap" }}>{line}</div>
          );
        })}
      </div>
    </div>
  );
};

export const WalkthroughScene: React.FC = () => (
  <Scene name="walkthrough" vo="vo_walkthrough.wav">
    <Label style={{ position: "absolute", top: 66, left: 80 }}>Memory is the only variable</Label>
    <FadeIn delay={4} style={{ position: "absolute", top: 96, left: 80 }}>
      <div style={{ fontFamily: SERIF, fontSize: 54, color: COLORS.paper0 }}>Persist. Recall. Decide.</div>
    </FadeIn>
    <Step n="01 PERSIST" title="Persist" x={80} delay={40}
      body="The loss is written as an entity and an append-only event, then promoted into a policy holding a 5% cap."
      code={["# groundhog_vault/memory.py", 'set_entity("risk_incident", id, …)', "write_event(acted=[…])", 'set_entity("risk_policy", signature, …)']} />
    <Step n="02 RECALL" title="Recall" x={696} delay={86}
      body="A new agent and a new Sibyl client look the policy up by risk signature. The protocol name is never used as the key."
      code={["# a fresh session, nothing carried over", "MemoryClient.local(db)", 'get_entity("risk_policy", signature)', "# → max_exposure 5%"]} />
    <Step n="03 DECIDE" title="Decide" x={1312} delay={132}
      body="Exposure drops from 30% to 5% and Groundhog ends $12,300 ahead of the memory-less control."
      code={["# groundhog_vault/agent.py", "policy = memory.recall(opportunity)", "allocation = policy.maximum_exposure", "# 0.30 → 0.05"]} />
  </Scene>
);
