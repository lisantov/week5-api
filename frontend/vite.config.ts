import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Inside Docker the API is reachable as `http://backend:3000`, locally as
// `http://localhost:3000`. The dev container sets VITE_PROXY_TARGET.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/videos": proxyTarget,
      "/uploads": proxyTarget,
    },
  },
});
