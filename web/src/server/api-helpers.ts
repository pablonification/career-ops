export type ApiOk<T> = {
  ok: true;
  data: T;
  meta: { requestId: string };
};

export type ApiError = {
  ok: false;
  error: { code: string; message: string };
  meta: { requestId: string };
};

export function getRequestId(headers: Headers): string {
  const incoming = headers.get("x-request-id");
  if (incoming !== null && incoming.length > 0) {
    return incoming;
  }
  return crypto.randomUUID();
}

export function apiOk<T>(data: T, requestId: string, status: number = 200): Response {
  const body: ApiOk<T> = { ok: true, data, meta: { requestId } };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
    },
  });
}

export function apiError(
  code: string,
  message: string,
  requestId: string,
  status: number,
): Response {
  const body: ApiError = { ok: false, error: { code, message }, meta: { requestId } };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "x-request-id": requestId,
    },
  });
}

export function apiUnauthorized(requestId: string): Response {
  return apiError("UNAUTHORIZED", "Authentication required", requestId, 401);
}

export function apiForbidden(requestId: string): Response {
  return apiError("FORBIDDEN", "Forbidden", requestId, 403);
}
