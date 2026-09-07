import React from "react";
import { AbsoluteFill, Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Callout } from "../components/Callout";
import { COLORS } from "../constants";

// Clip timeline: 0-160 runs Life 2 and settles; the page then scrolls to the Memory Lift banner.
// The scroll is held back until the narration reaches the result, using a freeze on frame 158.
const HOLD_AT = 158; const HOLD_UNTIL = 300;
const Clip: React.FC<{ startFrom?: number }> = ({ startFrom = 0 }) => (
  <OffthreadVideo src={staticFile("shot_life2.mp4")} muted startFrom={startFrom} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
);
export const Life2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 450], [1.0, 1.05], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene name="life2" vo="vo_life2.wav">
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 35%" }}>
        <Sequence from={0} durationInFrames={HOLD_AT} layout="none"><Clip /></Sequence>
        <Sequence from={HOLD_AT} durationInFrames={HOLD_UNTIL - HOLD_AT} layout="none"><Freeze frame={HOLD_AT}><Clip /></Freeze></Sequence>
        <Sequence from={HOLD_UNTIL} layout="none"><Clip startFrom={HOLD_AT} /></Sequence>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(9,10,8,0.5) 0%, rgba(9,10,8,0) 22%, rgba(9,10,8,0) 70%, rgba(9,10,8,0.7) 100%)" }} />
      <Callout title="Life 2 · SunPool" body="New name. Same incentive-yield, concentrated-liquidity, shallow-exit signature." enter={60} exit={135} x={700} y={560} width={560} />
      <Callout title="Groundhog recalls the policy → 5%" body="A brand new session and a new Sibyl client. The cap is found by signature." enter={138} exit={252} x={380} y={560} width={560} />
      <Callout title="Amnesiac has no memory → 30%" body="Same market, same logic, no channel to the past." enter={256} exit={320} x={1120} y={560} width={520} accent={COLORS.fault} />
      <Callout title="+$12,300 preserved by memory alone" body="Groundhog $79,540 vs Amnesiac $67,240." enter={352} exit={445} x={1180} y={640} width={560} />
    </Scene>
  );
};
