// routes/index.tsx

import { oauthHelpers } from "../plugins/kv-oauth.ts";
import { FreshContext } from "$fresh/server.ts";
import GoogleDriveFiles from "../islands/listFiles.tsx";

import * as stereoimg from "npm:stereo-img";

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

export default async function HomePage(req: Request, ctx: FreshContext) {
  
  const sessionId = await oauthHelpers.getSessionId(req);
  const isSignedIn = sessionId !== undefined;
  
  console.log(kv);
  if (isSignedIn){
    const entries = await kv.get([sessionId]);
    if (kv!=null) {
      console.log("index.tsx -> homepage",entries);
    }
  }
    


  return (
    <>
      <script type="module" src="https://stereo-img.steren.fr/stereo-img.js"></script>
      <h1>Welcome to OAuth Example</h1>
      <p>Provider: Google</p>
      <p>Signed in: {isSignedIn ? "Yes" : "No"}</p>

      {!isSignedIn ? (
        <a href="/signin">
          <button>Sign in with Google</button>
        </a>
      ) : (
        <><a href="/signout">
          <button>Sign out</button>
        </a></>
      )}

      <p/>
      <stereo-img src="kandao-qoocam-ego.jpg"></stereo-img>
      <GoogleDriveFiles/>
    </>
  );
}
