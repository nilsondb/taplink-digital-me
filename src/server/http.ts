export const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  const out = new Headers(headers);
  out.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers: out });
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Conteúdo inválido");
  }
  return request.json() as Promise<T>;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}
