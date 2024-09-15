import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import kvOAuth from "./plugins/kv-oauth.ts";

export default defineConfig({
  plugins: [tailwind(), kvOAuth],
});
