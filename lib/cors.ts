export const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "x-powered-by": "pure stupidity",
};

export function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, { ...init, headers: { ...CORS, ...(init.headers ?? {}) } });
}

export function preflight() {
  return new Response(null, { status: 204, headers: CORS });
}
