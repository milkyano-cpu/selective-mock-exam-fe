const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Helper to fetch data from Backend via Next.js API Route (Server-Side).
 */
export async function fetchFromBackend(req: Request, path: string, options: RequestInit = {}) {
  // Trace ID propagation
  const traceId = req.headers.get("x-trace-id") || "";

  // Build headers
  const defaultHeaders: Record<string, string> = {
    "X-Trace-Id": traceId,
    "Content-Type": "application/json",
  };

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  } as Record<string, string>;

  // Send request to backend
  const url = `${NEXT_PUBLIC_API_URL}${path}`;

  console.log(`[ServerBackend] ${options.method || "GET"} ${url} | TraceID: ${traceId}`);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    return res;
  } catch (error) {
    console.error(`[ServerBackend] Network Error | TraceID: ${traceId}`, error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Gagal menghubungi Backend Server.",
        traceId,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
        },
      }
    );
  }
}
