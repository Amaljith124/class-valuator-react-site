import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Forward API and Socket.IO calls to the Node server so a single tunnel URL
// (for example ngrok pointing at port 5173) serves both the site and the API.
const nodeServer = "http://localhost:3000";

export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        allowedHosts: true,
        proxy: {
            "/api": { target: nodeServer, changeOrigin: true },
            "/socket.io": { target: nodeServer, changeOrigin: true, ws: true }
        }
    }
});
