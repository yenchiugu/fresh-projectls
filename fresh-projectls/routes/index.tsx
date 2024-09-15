// routes/index.tsx
import { getSessionId } from "@deno/kv-oauth";
import { FreshContext } from "$fresh/server.ts";

export default async function HomePage(req: Request, ctx: FreshContext) {
  const sessionId = await getSessionId(req);
  const isSignedIn = sessionId !== undefined;

  return (
    <>
      <h1>Welcome to OAuth Example</h1>
      <p>Provider: GitHub</p>
      <p>Signed in: {isSignedIn ? "Yes" : "No"}</p>

      {!isSignedIn ? (
        <a href="/signin">
          <button>Sign in with GitHub</button>
        </a>
      ) : (
        <a href="/signout">
          <button>Sign out</button>
        </a>
      )}
    </>
  );
}
