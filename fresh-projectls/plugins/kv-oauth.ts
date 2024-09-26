// plugins/kv_oauth.ts
import { createGoogleOAuthConfig, createHelpers } from "@deno/kv-oauth";
import type { Plugin } from "$fresh/server.ts";
import type { googleDrive } from "../routes/api/google_drive.ts";

const oauthConfig = createGoogleOAuthConfig({
    redirectUri: "https://localhost:8000/callback",
    scope: ["https://www.googleapis.com/auth/userinfo.profile","https://www.googleapis.com/auth/drive.metadata.readonly",
      "https://www.googleapis.com/auth/drive"
    ],
  });

const { signIn, handleCallback, signOut, getSessionId } = createHelpers(
    oauthConfig,
);

export const oauthHelpers = { signIn, handleCallback, signOut, getSessionId };


// Copyright 2023-2024 the Deno authors. All rights reserved. MIT license.
const DENO_KV_PATH_KEY = "DENO_KV_PATH";
let path = undefined;
if (
  (await Deno.permissions.query({ name: "env", variable: DENO_KV_PATH_KEY }))
    .state === "granted"
) {
  path = Deno.env.get(DENO_KV_PATH_KEY);
}
const kv = await Deno.openKv(path);  

// Gracefully shutdown after tests
addEventListener("beforeunload", async () => {
  await kv.close();
});


export default {
  name: "kv-oauth",
  routes: [
    {
      path: "/signin",
      async handler(req) {
        return await signIn(req);
      },
    },
    {
      path: "/callback",
      async handler(req) {
        // Return object also includes `accessToken` and `sessionId` properties.
        const { response,sessionId,tokens } = await handleCallback(req);

        console.log("kv-oauth.ts ",sessionId,tokens);

        kv.set([sessionId],tokens);

        return response;
      },
    },
    {
      path: "/signout",
      async handler(req) {
        return await signOut(req);
      },
    },
    {
      path: "/protected",
      async handler(req) {
        return await getSessionId(req) === undefined
          ? new Response("Unauthorized", { status: 401 })
          : new Response("You are allowed");
      },
    },
  ],
} as Plugin;