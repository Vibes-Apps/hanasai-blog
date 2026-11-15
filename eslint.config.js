import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // cms/worker/auth.js: sveltia-cms-auth'un değiştirilmemiş kopyası (kendi lint kuralları upstream'de).
  { ignores: ["node_modules", "dist", "cms/dist", "cms/.build", "**/.wrangler", "vendor", "cms/worker/auth.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
