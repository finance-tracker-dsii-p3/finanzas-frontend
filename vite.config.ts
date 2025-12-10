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
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'chart-vendor': ['recharts'],
                    'ui-vendor': ['lucide-react', 'framer-motion'],
                },
            },
        },
    },
});
