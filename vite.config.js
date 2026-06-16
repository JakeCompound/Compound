import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// COMPOUND — Vite + React 18.
// The app was migrated from a Babel-in-browser prototype; see BUILD_TIER_B/RUNBOOK.md.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // expose on LAN so the PWA can be opened from a phone during dev
  },
});
