import React from "react";
import { interpolate, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender } from "remotion";
import { COLORS } from "../constants";
import { SANS } from "../fonts";

type Chunk = { text: string; start: number; end: number };
type Track = Record<string, Chunk[]>;

let cache: Track | null = null;

// Terms worth the eye jumping to. Emphasis marks substance, not reading position -
// a bouncing per-word highlight would compete with the dense UI underneath.
const KEY = /^(\$?[\d,.]+%?|thirty|five|eighteen|twelve|Sibyl|MoonPool|SunPool|Sepolia|Base|risk_policy|risk_incident|signature\.?|signature,?)$/i;

export const useCaptions = (): Track => {
  const [track, setTrack] = React.useState<Track | null>(cache);
  const [handle] = React.useState(() => (cache ? null : delayRender("captions")));
  React.useEffect(() => {
    if (cache) return;
    fetch(staticFile("captions.json"))
      .then((r) => r.json())
      .then((data: Track) => { cache = data; setTrack(data); if (handle !== null) continueRender(handle); })
      .catch(() => { if (handle !== null) continueRender(handle); });
  }, [handle]);
  return track ?? {};
};

export const Captions: React.FC<{ scene: string; voDelay?: number }> = ({ scene, voDelay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const track = useCaptions();
  const chunks = track[scene];
  if (!chunks?.length) return null;

  const t = (frame - voDelay) / fps;
  const i = chunks.findIndex((c) => t >= c.start - 0.12 && t < c.end + 0.22);
  if (i < 0) return null;
  const c = chunks[i];
  const inF = (c.start - 0.12) * fps + voDelay;
  const outF = (c.end + 0.22) * fps + voDelay;
  const opacity =
    interpolate(frame, [inF, inF + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [outF - 5, outF], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "flex", justifyContent: "center", opacity, pointerEvents: "none" }}>
      <div style={{ maxWidth: 1240, padding: "11px 26px", background: "rgba(9,10,8,0.82)", borderBottom: `2px solid ${COLORS.signal}`, backdropFilter: "blur(6px)" }}>
        <div style={{ fontFamily: SANS, fontSize: 34, lineHeight: 1.26, color: COLORS.paper0, textAlign: "center", textWrap: "balance" }}>
          {c.text.split(" ").map((w, k) => (
            <span key={k} style={{ color: KEY.test(w.replace(/[.,]$/, "")) ? COLORS.signal : COLORS.paper0 }}>
              {w}{k < c.text.split(" ").length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Progress: React.FC<{ elapsed: number; total: number }> = ({ elapsed, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pct = Math.min(1, (elapsed + frame / fps) / total);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 3, background: "rgba(48,51,43,0.55)" }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: COLORS.signal, opacity: 0.85 }} />
    </div>
  );
};
