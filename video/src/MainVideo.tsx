import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { COLORS, FPS, SCENES } from "./constants";
import { HookScene } from "./scenes/HookScene";
import { ProductScene } from "./scenes/ProductScene";
import { SetupScene } from "./scenes/SetupScene";
import { Life1Scene } from "./scenes/Life1Scene";
import { DestroyScene } from "./scenes/DestroyScene";
import { Life2Scene } from "./scenes/Life2Scene";
import { WalkthroughScene } from "./scenes/WalkthroughScene";
import { TreasuryScene } from "./scenes/TreasuryScene";
import { BaseScene } from "./scenes/BaseScene";
import { CloseScene } from "./scenes/CloseScene";
const F = (s: number) => Math.round(s * FPS);
export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Series>
      <Series.Sequence durationInFrames={F(SCENES.hook)}><HookScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.product)}><ProductScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.setup)}><SetupScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.life1)}><Life1Scene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.destroy)}><DestroyScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.life2)}><Life2Scene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.walkthrough)}><WalkthroughScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.treasury)}><TreasuryScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.base)}><BaseScene /></Series.Sequence>
      <Series.Sequence durationInFrames={F(SCENES.close)}><CloseScene /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);
