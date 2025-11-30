import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        fs: {
            strict: false,
            allow: ['..'],
        },
        hmr: {
            protocol: 'ws',
            host: 'localhost',
        },
    },
    base: '/',
    resolve: {
        preserveSymlinks: true,
    },
    build: {
        chunkSizeWarningLimit: 1000, // Aumentar límite a 1MB para evitar warnings
    },
});
