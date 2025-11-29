const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://formality.life";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: BodyInit | null;
  headers?: Record<string, string>;
};

export async function apiClient<T>(
  endpoint: string,
  apiKey: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    body,
    headers: {
      "X-API-Key": apiKey,
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  return response.json();
}

export { API_BASE_URL };
