import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/avatar/$file")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const [{ uploadsDir }, fs, path] = await Promise.all([
          import("@/server/db"),
          import("node:fs/promises"),
          import("node:path"),
        ]);

        const filename = path.basename(params.file);
        if (!filename || filename !== params.file) return new Response("Not found", { status: 404 });

        const fullPath = path.join(uploadsDir, filename);
        try {
          const bytes = await fs.readFile(fullPath);
          const ext = path.extname(filename).toLowerCase();
          const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          return new Response(bytes, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-Content-Type-Options": "nosniff",
            },
          });
        } catch {
          return new Response("Not found", { status: 404 });
        }
      },
    },
  },
});
