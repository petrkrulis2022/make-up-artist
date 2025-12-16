import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: "./frontend/vite.config.js",
    test: {
      include: ["frontend/**/*.{test,spec}.{js,jsx}"],
      name: "frontend",
      environment: "jsdom",
    },
  },
]);
