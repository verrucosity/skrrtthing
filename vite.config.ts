import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Port 1420 is what src-tauri/tauri.conf.json expects during `tauri dev`.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_ENV_"],
  build: {
    target: "chrome105",
    sourcemap: false,
  },
});
