/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Synced with constants/Colors.ts. If you change that file, mirror updates here (cannot import TS directly in this JS config without a build step).
      colors: {
        // Light theme tokens
        light: {
          text: '#11181C',
          background: '#FFFFFF',
          tint: '#0a7ea4',
          icon: '#687076',
          tabIconDefault: '#687076',
          tabIconSelected: '#0a7ea4',
        },
        // Dark theme tokens
        dark: {
          text: '#FCFCFC',
          background: '#1A1A1A',
          tint: '#723FEB',
          icon: '#FCFCFC',
          tabIconDefault: '#B1B1B1',
          tabIconSelected: '#FCFCFC',
        },
      },
    },
  },
  plugins: [],
}