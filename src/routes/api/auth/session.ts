import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/auth/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [{ getSessionUser }, { json, noStoreHeaders }] = await Promise.all([
          import("@/server/auth"),
          import("@/server/http"),
        ]);
        return json({ user: getSessionUser(request) }, 200, noStoreHeaders);
      },
    },
  },
});
