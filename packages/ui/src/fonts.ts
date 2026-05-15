import { Instrument_Serif, Manrope, JetBrains_Mono } from "next/font/google";

export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Convenience: the className string an app should set on <html> to register
 * all three font CSS variables in one shot.
 */
export const fontVariables = [serif.variable, sans.variable, mono.variable].join(" ");
