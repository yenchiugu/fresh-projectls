// routes/api/google_drive.ts
import { getSessionAccessToken } from "@deno/kv-oauth";
import { listGoogleDriveFiles } from "../../utils/google_drive.ts";

export const handler = async (req: Request) => {
  const sessionId = await getSessionId(req);
  const accessToken = sessionId ? await getSessionAccessToken(sessionId) : null;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const files = await listGoogleDriveFiles(accessToken);
    return new Response(JSON.stringify(files), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response("Failed to list Google Drive files", { status: 500 });
  }
};
