import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Callout } from "../components/Callout";
import { Label } from "../components/Label";
import { COLORS } from "../constants";

const SWAP = 215;
export const BaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stillIn = interpolate(frame, [SWAP - 3, SWAP + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Scene name="base" vo="vo_base.wav">
      <Sequence from={0} durationInFrames={SWAP + 5} layout="none">
        <Screen src="shot_base.mp4" zoomFrom={1.02} zoomTo={1.06} origin="50% 60%">
          <Callout title="User-signed decision receipt" body="Groundhog never holds the key. The wallet signs, the registry stores the decision." enter={70} exit={205} x={1180} y={210} width={560} />
        </Screen>
      </Sequence>
      <AbsoluteFill style={{ opacity: stillIn }}>
        <Sequence from={SWAP - 3} layout="none">
          <Screen src="explorer_crop.png" still zoomFrom={1.0} zoomTo={1.04} origin="30% 30%">
            <Label style={{ position: "absolute", top: 40, right: 80 }} color={COLORS.signal}>Base Sepolia · live transaction</Label>
            <Callout title="Verified on-chain" body="recordDecision · allocation 500 bps · memoryApplied = true · policy and incident hashes stored." enter={22} exit={146} x={1130} y={640} width={650} />
          </Screen>
        </Sequence>
      </AbsoluteFill>
    </Scene>
  );
};
