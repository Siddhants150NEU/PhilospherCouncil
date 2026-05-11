/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface tiers
        surface: "#121415",
        "surface-bright": "#38393a",
        "surface-dim": "#121415",
        "surface-container-lowest": "#0c0e0f",
        "surface-container-low": "#1a1c1d",
        "surface-container": "#1e2021",
        "surface-container-high": "#282a2b",
        "surface-container-highest": "#333536",
        background: "#121415",
        "on-surface": "#e2e2e3",
        "on-surface-variant": "#d0c5af",
        "on-background": "#e2e2e3",
        // Primary (gold)
        primary: "#d4af37",
        "on-primary": "#3c2f00",
        "primary-container": "#d4af37",
        "on-primary-container": "#554300",
        "primary-fixed": "#ffe088",
        "primary-fixed-dim": "#e9c349",
        "on-primary-fixed": "#241a00",
        "on-primary-fixed-variant": "#574500",
        "inverse-primary": "#735c00",
        "surface-tint": "#e9c349",
        // Outline
        outline: "#99907c",
        "outline-variant": "#4d4635",
        // Tertiary / Secondary (kept from reference, used sparingly)
        secondary: "#ffb3b1",
        tertiary: "#bcd5c0",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem",
        // Tailwind's 'full' would conflict; we use rounded-full for circles via util
        circle: "9999px",
      },
      spacing: {
        gutter: "24px",
        unit: "8px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
      },
      maxWidth: {
        "max-width": "1280px",
      },
      fontFamily: {
        display: ["EB Garamond", "Georgia", "serif"],
        headline: ["EB Garamond", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-mobile": ["36px", { lineHeight: "42px", fontWeight: "600" }],
        "headline-md": ["32px", { lineHeight: "40px", fontWeight: "500" }],
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "500" }],
      },
      animation: {
        "float-card": "floatCard 6s ease-in-out infinite",
        "slide-up": "slideUp 0.4s ease",
        "bob": "bobAnim 2s ease infinite",
        "pulse-soft": "pulseSoft 1s infinite",
        "flicker": "flickerAnim 8s infinite",
      },
      keyframes: {
        floatCard: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-10px) scale(1.03)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        bobAnim: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        flickerAnim: {
          "0%, 100%": { opacity: "1" },
          "93%": { opacity: "0.7" },
          "94%": { opacity: "1" },
          "97%": { opacity: "0.85" },
          "98%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
