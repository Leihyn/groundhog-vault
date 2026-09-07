import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { COLORS, FPS, SCENES, SCENE_ORDER } from "./constants";
import { Progress } from "./components/Captions";
import { HookScene } from "./scenes/HookScene";
import { ProductScene } from "./scenes/ProductScene";
import { SetupScene } from "./scenes/SetupScene";
import { Life1Scene } from "./scenes/Life1Scene";
import { DestroyScene } from "./scenes/DestroyScene";
import { Life2Scene } from "./scenes/Life2Scene";
import { EvidenceScene } from "./scenes/EvidenceScene";
import { WalkthroughScene } from "./scenes/WalkthroughScene";
import { TreasuryScene } from "./scenes/TreasuryScene";
import { BaseScene } from "./scenes/BaseScene";
import { ProductionScene } from "./scenes/ProductionScene";
import { CloseScene } from "./scenes/CloseScene";

const COMPONENTS: Record<string, React.FC> = {
  hook: HookScene, product: ProductScene, setup: SetupScene, life1: Life1Scene,
  destroy: DestroyScene, life2: Life2Scene, evidence: EvidenceScene,
  walkthrough: WalkthroughScene, treasury: TreasuryScene, base: BaseScene,
  production: ProductionScene, close: CloseScene,
};
const F = (s: number) => Math.round(s * FPS);
const TOTAL = SCENE_ORDER.reduce((a, k) => a + SCENES[k], 0);

export const MainVideo: React.FC = () => {
  let elapsed = 0;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Series>
        {SCENE_ORDER.map((key) => {
          const Component = COMPONENTS[key];
          const at = elapsed;
          elapsed += SCENES[key];
          return (
            <Series.Sequence key={key} durationInFrames={F(SCENES[key])}>
              <Component />
              <Progress elapsed={at} total={TOTAL} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};
