import React from "react";
import { COLORS } from "../constants";
import { SERIF, MONO } from "../fonts";
export const Wordmark: React.FC<{ size?: number }> = ({ size = 120 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 0.95 }}>
    <div style={{ fontFamily: SERIF, fontSize: size, color: COLORS.paper0, letterSpacing: "-0.01em" }}>Groundhog</div>
    <div style={{ fontFamily: MONO, fontSize: size * 0.78, color: COLORS.signal, letterSpacing: "0.06em", marginTop: 6 }}>VAULT</div>
  </div>
);
