import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: { "sodium-native": "sodium-javascript" },
  },
});
