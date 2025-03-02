import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'node:fs';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Set your required port
    https: {
      key: fs.readFileSync('certs/key.pem'),     // Path to your private key
      cert: fs.readFileSync('certs/cert.pem'),   // Path to your certificate
    },
    strictPort: true, // Optional: prevents Vite from switching to another port if unavailable
  },
  publicDir: "./static",
  base: "./",
});
