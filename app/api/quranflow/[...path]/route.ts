const DEFAULT_UPSTREAM_API_BASE_URL = "https://quran-flow-1.onrender.com";
const OLD_UPSTREAM_API_BASE_URL = "https://quran-flow.onrender.com";

const configuredUpstreamApiBaseUrl =
  process.env.QURANFLOW_API_BASE_URL ?? DEFAULT_UPSTREAM_API_BASE_URL;
const UPSTREAM_API_BASE_URL =
  configuredUpstreamApiBaseUrl.replace(/\/$/, "") === OLD_UPSTREAM_API_BASE_URL
    ? DEFAULT_UPSTREAM_API_BASE_URL
    : configuredUpstreamApiBaseUrl;

type ProxyContext = {
  params: Promise<{ path: string[] }>;
};

export const dynamic = "force-dynamic";

function proxyHeaders(request: Request) {
  const headers = new Headers();
  const accept = request.headers.get("accept");
  const authorization = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");

  if (accept) headers.set("accept", accept);
  if (authorization) headers.set("authorization", authorization);
  if (contentType) headers.set("content-type", contentType);
  headers.set("user-agent", "Mozilla/5.0 QuranFlow Frontend Proxy");
  return headers;
}

async function proxy(request: Request, context: ProxyContext) {
  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `/${path.join("/")}${requestUrl.search}`,
    UPSTREAM_API_BASE_URL,
  );

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: proxyHeaders(request),
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("connection");
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
