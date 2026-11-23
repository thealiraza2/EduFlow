import type { Config } from "tailwindcss";

/**
 * EduFlow design tokens — see DESIGN.md (single source of truth).
 * Semantic tokens read CSS variables (RGB channels) defined in src/app/globals.css.
 * Tailwind's stock hue scales are remapped onto the DESIGN.md palette so that
 * existing utility classes (slate-*, emerald-*, rose-*, …) inherit the new system.
 */

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Warm stone neutral scale (cream canvas → ink)
const neutral = {
  50: "#FBF7F2",
  100: "#F3EDE5",
  200: "#EAE3DA",
  300: "#D6CCBF",
  400: "#A8A29E",
  500: "#78716C",
  600: "#57534E",
  700: "#44403C",
  800: "#292524",
  900: "#1C1917",
  950: "#0C0A09",
};

// Plum (primary) scale — 600 is the brand primary (key kept as "greenboard" for existing classes)
const greenboard = {
  50: "#FBF4F7",
  100: "#F6E9EE",
  200: "#EBD3DD",
  300: "#D9AFC0",
  400: "#BE7F98",
  500: "#9A4D6B",
  600: "#6D1F3A",
  700: "#561830",
  800: "#43122A",
  900: "#2F0C1D",
  950: "#1F0813",
};

const success = {
  50: "#EEF7F1",
  100: "#E5F3EB",
  200: "#C3E3CF",
  300: "#94CBA9",
  400: "#5BAE7F",
  500: "#2F9360",
  600: "#1E7A4C",
  700: "#17613C",
  800: "#124B2F",
  900: "#0D3822",
  950: "#082616",
};

const danger = {
  50: "#FDF3F2",
  100: "#FBE9E7",
  200: "#F5CBC6",
  300: "#EDA39B",
  400: "#E0705F",
  500: "#CC4334",
  600: "#B3261E",
  700: "#921E18",
  800: "#721813",
  900: "#55120E",
  950: "#3A0C09",
};

const warning = {
  50: "#FDF7EC",
  100: "#FBF0DC",
  200: "#F5DDB0",
  300: "#EDC27A",
  400: "#DDA145",
  500: "#C27F1A",
  600: "#A65F00",
  700: "#854B00",
  800: "#663A00",
  900: "#4A2A00",
  950: "#331D00",
};

const info = {
  50: "#F2F6FB",
  100: "#E6EEF7",
  200: "#C6D7EC",
  300: "#97B6DA",
  400: "#5F8EC2",
  500: "#3870A8",
  600: "#24578F",
  700: "#1C4572",
  800: "#153456",
  900: "#0F253D",
  950: "#0A192A",
};

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        // Remapped stock scales
        slate: neutral,
        gray: neutral,
        zinc: neutral,
        neutral: neutral,
        stone: neutral,
        indigo: greenboard,
        violet: greenboard,
        purple: greenboard,
        teal: greenboard,
        emerald: success,
        green: success,
        red: danger,
        rose: danger,
        amber: warning,
        yellow: warning,
        orange: warning,
        blue: info,
        sky: info,
        greenboard,
        plum: greenboard,

        // Semantic tokens (DESIGN.md §2)
        canvas: v("canvas"),
        surface: {
          DEFAULT: v("surface"),
          sunken: v("surface-sunken"),
        },
        ink: {
          DEFAULT: v("ink"),
          2: v("ink-2"),
          3: v("ink-3"),
        },
        line: {
          DEFAULT: v("line"),
          strong: v("line-strong"),
        },
        primary: {
          DEFAULT: v("primary"),
          hover: v("primary-hover"),
          pressed: v("primary-pressed"),
          tint: v("primary-tint"),
          "tint-strong": v("primary-tint-strong"),
          foreground: v("on-primary"),
        },
        accent: {
          DEFAULT: v("accent"),
          tint: v("accent-tint"),
          foreground: v("on-primary"),
        },
        sidebar: {
          DEFAULT: v("sidebar"),
          ink: v("sidebar-ink"),
          "ink-2": v("sidebar-ink-2"),
          active: v("sidebar-active"),
        },
        status: {
          success: v("success"),
          "success-bg": v("success-bg"),
          warning: v("warning"),
          "warning-bg": v("warning-bg"),
          danger: v("danger"),
          "danger-bg": v("danger-bg"),
          info: v("info"),
          "info-bg": v("info-bg"),
        },

        // shadcn compatibility (used by ui/* primitives)
        border: v("line"),
        input: v("line-strong"),
        ring: v("primary"),
        background: v("canvas"),
        foreground: v("ink"),
        secondary: {
          DEFAULT: v("surface-sunken"),
          foreground: v("ink"),
        },
        destructive: {
          DEFAULT: v("danger"),
          foreground: v("on-primary"),
        },
        muted: {
          DEFAULT: v("surface-sunken"),
          foreground: v("ink-3"),
        },
        popover: {
          DEFAULT: v("surface"),
          foreground: v("ink"),
        },
        card: {
          DEFAULT: v("surface"),
          foreground: v("ink"),
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        // Existing code uses xl/2xl for cards and 3xl for hero frames:
        // fold them onto the DESIGN.md radii (cards 12px, photo frames 20px).
        xl: "12px",
        "2xl": "12px",
        "3xl": "20px",
        photo: "20px",
      },
      boxShadow: {
        1: "0 1px 2px rgba(22,33,30,.06)",
        2: "0 4px 12px -2px rgba(22,33,30,.08), 0 2px 4px -2px rgba(22,33,30,.05)",
        3: "0 16px 40px -8px rgba(22,33,30,.18)",
        focus: "0 0 0 2px rgb(var(--canvas)), 0 0 0 4px rgb(var(--primary))",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-l": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.015em", fontWeight: "600" }],
        "display-m": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "600" }],
        h1: ["1.75rem", { lineHeight: "1.25", fontWeight: "600" }],
        h2: ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.125rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-l": ["1.125rem", { lineHeight: "1.65" }],
        body: ["0.9375rem", { lineHeight: "1.6" }],
        small: ["0.8125rem", { lineHeight: "1.5" }],
        label: ["0.75rem", { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "600" }],
        "data-xl": ["2rem", { lineHeight: "1.1", fontWeight: "600" }],
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(.2,.8,.2,1)",
        drawer: "cubic-bezier(.32,.72,0,1)",
      },
      keyframes: {
        "rise-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "draw-tick": {
          from: { strokeDashoffset: "24" },
          to: { strokeDashoffset: "0" },
        },
        ring: {
          from: { strokeDasharray: "0 100" },
          to: { strokeDasharray: "86 100" },
        },
      },
      animation: {
        "rise-in": "rise-in 320ms cubic-bezier(.2,.8,.2,1) both",
        "draw-tick": "draw-tick 220ms cubic-bezier(.2,.8,.2,1) both",
        ring: "ring 900ms cubic-bezier(.2,.8,.2,1) 400ms both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
