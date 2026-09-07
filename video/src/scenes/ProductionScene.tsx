import React from "react";
import { Scene } from "../components/Scene";
import { Screen } from "../components/Screen";
import { Callout } from "../components/Callout";
import { COLORS } from "../constants";
export const ProductionScene: React.FC = () => (
  <Scene name="production" vo="vo_production.wav">
    <Screen src="shot_production.mp4" zoomFrom={1.0} zoomTo={1.04} origin="50% 55%">
      <Callout title="Never moves funds" body="The allocation engine is deterministic and the simulation holds no treasury wallet." enter={60} exit={180} x={140} y={210} width={540} accent={COLORS.mustard} />
      <Callout title="What a deployed guardian adds" body="Allowlisted assets, contract-enforced exposure limits, evidence on every recommendation, and human approval." enter={190} exit={310} x={1140} y={210} width={620} accent={COLORS.mustard} />
    </Screen>
  </Scene>
);
