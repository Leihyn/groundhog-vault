import React from "react";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Callout } from "../components/Callout";
export const TreasuryScene: React.FC = () => (
  <Scene name="treasury" vo="vo_treasury.wav">
    <Screen src="shot_treasury.mp4" zoomFrom={1.0} zoomTo={1.04} origin="50% 40%">
      <Callout title="Your own incident" body="Northstar USD, a real $18,000 loss, stored as a Sibyl policy." enter={80} exit={210} x={1210} y={186} width={560} />
      <Callout title="Fresh session · different name" body="Harbor Yield shares the signature, so the review recommends 5% and cites the policy and incident." enter={300} exit={440} x={140} y={186} width={580} />
    </Screen>
  </Scene>
);
