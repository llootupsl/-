import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from "path";

function normalizeId(id) {
  return id.replace(/\\/g, "/");
}

function createManualChunks(id) {
  const normalized = normalizeId(id);

  if (!normalized.includes("/node_modules/")) {
    return undefined;
  }

  if (normalized.includes("/react/") || normalized.includes("/react-dom/")) {
    return "vendor-react";
  }

  if (
    normalized.includes("/three/") ||
    normalized.includes("/@react-three/fiber/") ||
    normalized.includes("/@react-three/drei/")
  ) {
    return "vendor-three";
  }

  if (normalized.includes("/webtorrent/")) {
    return "vendor-webtorrent";
  }

  if (normalized.includes("/@mlc-ai/web-llm/")) {
    return "vendor-llm";
  }

  if (normalized.includes("/sql.js/")) {
    return "vendor-sql";
  }

  if (normalized.includes("/howler/") || normalized.includes("/tone/")) {
    return "vendor-audio";
  }

  if (normalized.includes("/motion/")) {
    return "vendor-motion";
  }

  if (normalized.includes("/zustand/")) {
    return "vendor-state";
  }

  return "vendor-misc";
}

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@storage": path.resolve(__dirname, "./src/storage"),
      "@warmup": path.resolve(__dirname, "./src/warmup"),
      "@bench": path.resolve(__dirname, "./src/bench"),
      "@monitor": path.resolve(__dirname, "./src/monitor"),
      "@citizen": path.resolve(__dirname, "./src/citizen"),
      "@neural": path.resolve(__dirname, "./src/neural"),
      "@economy": path.resolve(__dirname, "./src/economy"),
      "@ai": path.resolve(__dirname, "./src/ai"),
      "@network": path.resolve(__dirname, "./src/network"),
      "@rendering": path.resolve(__dirname, "./src/rendering"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@workers": path.resolve(__dirname, "./src/workers"),
      "@sw": path.resolve(__dirname, "./src/sw"),
      "@auth": path.resolve(__dirname, "./src/auth"),
      "@multimodal": path.resolve(__dirname, "./src/multimodal"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    port: 5173,
    host: true,
  },
  worker: {
    format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
  build: {
    target: "esnext",
    outDir: "release-dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: createManualChunks,
      },
      external: ["@mlc-ai/web-llm", "@mlc.ai/web-llm"],
    },
  },
  optimizeDeps: {
    exclude: ["@mlc-ai/web-llm", "@mlc.ai/web-llm"],
  },
});
