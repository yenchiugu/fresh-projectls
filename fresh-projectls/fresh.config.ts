import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import kvOAuth from "./plugins/kv-oauth.ts";

const keyPath = "./server.key";
const certPath = "./server.crt";
const key = await Deno.readTextFile(keyPath);
const cert = await Deno.readTextFile(certPath);

export default defineConfig({
  key,
  cert,
  plugins: [tailwind(), kvOAuth],
});
