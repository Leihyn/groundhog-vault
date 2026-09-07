import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadSans } from "@remotion/google-fonts/IBMPlexSans";
export const { fontFamily: SERIF } = loadSerif("normal", { weights: ["400", "500"], subsets: ["latin"] });
export const { fontFamily: MONO } = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] });
export const { fontFamily: SANS } = loadSans("normal", { weights: ["400", "500"], subsets: ["latin"] });
