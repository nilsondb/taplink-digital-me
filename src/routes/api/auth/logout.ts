import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const [{ destroySession }, { json, noStoreHeaders }] = await Promise.all([
          import("@/server/auth"),
          import("@/server/http"),
        ]);
        return json(
          { ok: true },
          200,
          { ...noStoreHeaders, "Set-Cookie": destroySession(request) },
        );
      },
    },
  },
});
