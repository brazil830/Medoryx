/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050B1A",
        surface: "#0A1226",
        surfaceElevated: "#0E1A38",
        surfaceBorder: "#1E293B",
        healthGreen: "#10B981",
        warningAmber: "#F59E0B",
        criticalRed: "#EF4444",
        electricCyan: "#06B6D4",
        bricsBlue: "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Sora", "sans-serif"],
      },
      boxShadow: {
        glowGreen: "0 0 25px -5px rgba(16, 185, 129, 0.4)",
        glowAmber: "0 0 25px -5px rgba(245, 158, 11, 0.4)",
        glowRed: "0 0 25px -5px rgba(239, 68, 68, 0.5)",
        glowCyan: "0 0 25px -5px rgba(6, 182, 212, 0.4)",
      },
      animation: {
        pulseSlow: "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        }
      }
    },
  },
  plugins: [],
};
