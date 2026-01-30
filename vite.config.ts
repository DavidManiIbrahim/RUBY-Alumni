import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 2030,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['wchs logo-white.png', 'doodle.webp'],
      manifest: {
        name: 'AFCS - AirForce Comprehensive yola Ex Airborne',
        short_name: 'AFCS',
        description: 'Connect with AFCS Alumni',
        theme_color: '#142340',
        background_color: '#142340',
        icons: [
          {
            src: '/wchs%20logo-white.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/wchs%20logo-white.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
