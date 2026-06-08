import { API_BASE_URL, ApiError } from "./client";

interface JoinWaitlistRequest {
  email: string;
  name?: string;
  reason?: string;
}

interface JoinWaitlistResponse {
  success: boolean;
  message: string;
  position: number;
}

const WAITLIST_ENDPOINT =
  typeof window === "undefined" ? `${API_BASE_URL}/waitlist` : "/api/waitlist";

export async function joinWaitlist(
  data: JoinWaitlistRequest
): Promise<JoinWaitlistResponse> {
  const response = await fetch(WAITLIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, result.error || "Failed to join waitlist");
  }

  return result;
}
