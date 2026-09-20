import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const { json } = await import("@/server/http");
        return json({
          status: "ok",
          app: "Authera Link Card",
          storage: "sqlite-local",
          time: new Date().toISOString(),
        });
      },
    },
  },
});
