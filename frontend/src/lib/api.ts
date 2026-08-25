const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  if (typeof body.error === "string") return body.error;
  if (body.error && typeof body.error === "object") {
    const firstField = Object.values(body.error)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === "string") return firstField[0];
  }
  return res.statusText;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  /** multipart/form-data POST — used for file uploads. No Content-Type override, the browser sets the boundary. */
  postForm: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      throw new ApiError(res.status, await parseErrorMessage(res));
    }
    return res.json() as Promise<T>;
  },
};
