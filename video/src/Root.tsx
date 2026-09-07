import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { FPS, H, TOTAL_SECONDS, W } from "./constants";
export const RemotionRoot: React.FC = () => (
  <Composition id="MainVideo" component={MainVideo} durationInFrames={Math.round(TOTAL_SECONDS * FPS)} fps={FPS} width={W} height={H} />
);
