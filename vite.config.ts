import { defineConfig } from 'vite';
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [
            babel({
            include: ["**/*.ts", "**/*.tsx"], 
            exclude: "node_modules/**", 
            plugins: [["@babel/plugin-proposal-decorators", { version: "2023-11" }]]
        })
  ],
  server: {
    proxy: {
      // Intercepts any request starting with "/api"
      '/api': {
        target: 'http://192.168.1.120:80', // Your HTTP backend address
        changeOrigin: true,             // Changes origin header to target URL
        secure: false,                  // Set to false if backend uses self-signed certificates
        // rewrite: (path) => path.replace(/^\/api/, ''), // Removes "/api" before forwarding
      },
    },
  },
});