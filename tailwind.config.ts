import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantische tokens via CSS-variabelen (zie globals.css) — RGB-triples
        // zodat Tailwind /alpha-modifiers blijven werken (bg-panel/60 etc.)
        canvas:        "rgb(var(--canvas) / <alpha-value>)",
        panel:         "rgb(var(--panel) / <alpha-value>)",
        pane:          "rgb(var(--pane) / <alpha-value>)",
        sunken:        "rgb(var(--sunken) / <alpha-value>)",
        elevated:      "rgb(var(--elevated) / <alpha-value>)",
        hover:         "rgb(var(--hover) / <alpha-value>)",
        line:          "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        fg:            "rgb(var(--fg) / <alpha-value>)",
        "fg-muted":    "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-dim":      "rgb(var(--fg-dim) / <alpha-value>)",
        "fg-faint":    "rgb(var(--fg-faint) / <alpha-value>)",
        // Accent (Windows-blauw)
        brand:         "rgb(var(--brand) / <alpha-value>)",
        "brand-fg":    "rgb(var(--brand-fg) / <alpha-value>)",
        "brand-bg":    "rgb(var(--brand-bg) / <alpha-value>)",
        // Status
        ok:            "rgb(var(--ok) / <alpha-value>)",
        warn:          "rgb(var(--warn) / <alpha-value>)",
        err:           "rgb(var(--err) / <alpha-value>)",
        // Difficulty
        "diff-easy":   "rgb(var(--diff-easy) / <alpha-value>)",
        "diff-medium": "rgb(var(--diff-medium) / <alpha-value>)",
        "diff-hard":   "rgb(var(--diff-hard) / <alpha-value>)",
        "diff-insane": "rgb(var(--diff-insane) / <alpha-value>)",
        // Terminal (themaonafhankelijk — altijd een donker venster)
        term:          "rgb(var(--term-bg) / <alpha-value>)",
        "term-bar":    "rgb(var(--term-bar) / <alpha-value>)",
        "term-fg":     "rgb(var(--term-fg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Segoe UI Variable"', '"Segoe UI"', "system-ui", "Roboto", "ui-sans-serif", "sans-serif"],
        mono: ['"Cascadia Code"', '"Cascadia Mono"', '"JetBrains Mono"', "ui-monospace", "Consolas", "monospace"],
      },
      borderRadius: {
        // Windows 11 Fluent — zachtere, ruimere hoeken dan een IDE
        none: "0px",
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        // Fluent "depth" — zachte, lage schaduwen
        fluent: "0 2px 4px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.06)",
        "fluent-md": "0 4px 12px rgb(0 0 0 / 0.10), 0 2px 4px rgb(0 0 0 / 0.06)",
        "fluent-lg": "0 8px 28px rgb(0 0 0 / 0.16), 0 4px 8px rgb(0 0 0 / 0.08)",
        flyout: "0 8px 24px rgb(0 0 0 / 0.28)",
      },
      fontSize: {
        "2xs": ["11px", "15px"],
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-up": "slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
