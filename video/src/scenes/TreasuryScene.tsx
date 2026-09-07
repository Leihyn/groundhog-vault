import React from "react";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Callout } from "../components/Callout";
export const TreasuryScene: React.FC = () => (
  <Scene vo="vo_treasury.wav">
    <Screen src="shot_treasury.mp4" zoomFrom={1.0} zoomTo={1.04} origin="50% 40%">
      <Callout title="Your own incident" body="Northstar USD, a real $18,000 loss, stored as a Sibyl policy." enter={80} exit={200} x={380} y={880} width={520} />
      <Callout title="Fresh session · different name" body="Harbor Yield shares the signature, so the review recommends 5% and cites the policy and incident." enter={280} exit={410} x={1180} y={820} width={600} />
    </Screen>
  </Scene>
);
