import React from "react";
import { COLORS } from "../constants";
import { MONO } from "../fonts";
export const Label: React.FC<{ color?: string; size?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ color = COLORS.paper2, size = 16, style, children }) => (
  <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color, ...style }}>{children}</div>
);
