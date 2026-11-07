import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  headLinkOptions: { preset: "2023" },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: { background: "#F1F3F8" } },
    apple: { ...minimal2023Preset.apple, padding: 0.12, resizeOptions: { background: "#F1F3F8" } },
  },
  images: ["public/icon.svg"],
});
