// Synced with web/styles/tokens.css
export const COLORS = {
  bg: "#090a08", bg1: "#0f100d", bg2: "#161813",
  paper0: "#f0efe4", paper1: "#c1c0b4", paper2: "#85877d",
  line0: "#30332b", line1: "#525644",
  signal: "#d7ff3f", signalInk: "#0a0b08", mustard: "#d9b342", fault: "#df9b7d",
};
export const FPS = 30;
export const W = 1920;
export const H = 1080;
// Scene lengths in seconds: narration length plus breathing room. Keep in sync with public/vo_*.wav.
export const SCENE_ORDER = ["hook","product","setup","life1","destroy","life2","evidence","walkthrough","treasury","base","production","close"] as const;
export const SCENES: Record<string, number> = {
  hook: 12.4, product: 6.2, setup: 11.9, life1: 9.7, destroy: 13.6, life2: 17.0, evidence: 15.9, walkthrough: 9.6, treasury: 15.9, base: 13.5, production: 13.8, close: 6.0,
};
export const TOTAL_SECONDS = Object.values(SCENES).reduce((a, b) => a + b, 0);
export const REPO = "github.com/Leihyn/groundhog-vault";
export const RECEIPT_TX = "0x532481c39d68fedb7d102407ee819cc19478bcd02ee7bc614ffb8508ad66e0e9";
export const REGISTRY = "0x980ea2442f51f39f7d0b257ec8c3449e630434f4";
