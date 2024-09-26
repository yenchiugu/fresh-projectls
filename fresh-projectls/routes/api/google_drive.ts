// routes/api/google_drive.ts
import { oauthHelpers } from "../../plugins/kv-oauth.ts";
import { getThumbnails } from "../../utils/google_drive.ts";

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

export const handler = async (req: Request) => {
  const sessionId = await oauthHelpers.getSessionId(req);
  let accessToken =null;
  const isSignedIn = sessionId !== undefined;
  console.log("google_drive start");    
  
  if (isSignedIn){
    const entries = await kv.get([sessionId]);
    accessToken = entries.value;
    console.log("google_drive",accessToken.accessToken);    
  }  

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    //const files = await listGoogleDriveFiles(accessToken.accessToken);
    const files = await getThumbnails("13QZJ52MK96Gu7jmEzTDud39drgouiQ4o",accessToken.accessToken);
    return new Response(JSON.stringify(files), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Failed to list Google Drive files", { status: 500 });
  }
};
