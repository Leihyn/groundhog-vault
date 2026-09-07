import React from "react";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Callout } from "../components/Callout";
import { COLORS } from "../constants";
export const Life1Scene: React.FC = () => (
  <Scene vo="vo_life1.wav">
    <Screen src="shot_life1.mp4" zoomFrom={1.0} zoomTo={1.05} origin="50% 30%">
      <Callout title="Life 1 · both allocate 30% to MoonPool" body="Same inputs, same logic, same choice." enter={52} exit={150} x={700} y={560} width={520} />
      <Callout title="MoonPool depegs · -$18,000 each" body="Identical by design. Groundhog writes the loss to Sibyl. Amnesiac keeps nothing." enter={152} exit={250} x={700} y={560} width={560} accent={COLORS.fault} />
    </Screen>
  </Scene>
);
