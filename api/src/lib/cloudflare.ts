interface CustomHostnameResult {
  id: string;
  hostname: string;
  status: string;
  ssl: {
    status: string;
    method: string;
    validation_errors?: Array<{ message: string }>;
    validation_records?: Array<{
      status: string;
      http_url?: string;
      http_body?: string;
      txt_name?: string;
      txt_value?: string;
    }>;
  };
  ownership_verification?: {
    type: string;
    name: string;
    value: string;
  };
  ownership_verification_http?: {
    http_url: string;
    http_body: string;
  };
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
  result: T;
}

export class CloudflareAPI {
  private zoneId: string;
  private apiToken: string;
  private baseUrl = "https://api.cloudflare.com/client/v4";

  constructor(zoneId: string, apiToken: string) {
    this.zoneId = zoneId;
    this.apiToken = apiToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CloudflareResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return response.json() as Promise<CloudflareResponse<T>>;
  }

  async createCustomHostname(hostname: string): Promise<{
    success: boolean;
    hostnameId?: string;
    status?: string;
    sslStatus?: string;
    error?: string;
  }> {
    const response = await this.request<CustomHostnameResult>(
      `/zones/${this.zoneId}/custom_hostnames`,
      {
        method: "POST",
        body: JSON.stringify({
          hostname,
          ssl: {
            method: "http",
            type: "dv",
            settings: {
              min_tls_version: "1.2",
            },
          },
        }),
      }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors[0]?.message || "Failed to create custom hostname",
      };
    }

    return {
      success: true,
      hostnameId: response.result.id,
      status: response.result.status,
      sslStatus: response.result.ssl.status,
    };
  }

  async getCustomHostname(hostnameId: string): Promise<{
    success: boolean;
    hostname?: CustomHostnameResult;
    error?: string;
  }> {
    const response = await this.request<CustomHostnameResult>(
      `/zones/${this.zoneId}/custom_hostnames/${hostnameId}`
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors[0]?.message || "Failed to get custom hostname",
      };
    }

    return {
      success: true,
      hostname: response.result,
    };
  }

  async getCustomHostnameByName(hostname: string): Promise<{
    success: boolean;
    hostname?: CustomHostnameResult;
    error?: string;
  }> {
    const response = await this.request<CustomHostnameResult[]>(
      `/zones/${this.zoneId}/custom_hostnames?hostname=${hostname}`
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors[0]?.message || "Failed to get custom hostname",
      };
    }

    const result = response.result[0];
    if (!result) {
      return {
        success: false,
        error: "Custom hostname not found",
      };
    }

    return {
      success: true,
      hostname: result,
    };
  }

  async deleteCustomHostname(hostnameId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await this.request<{ id: string }>(
      `/zones/${this.zoneId}/custom_hostnames/${hostnameId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.success) {
      return {
        success: false,
        error: response.errors[0]?.message || "Failed to delete custom hostname",
      };
    }

    return { success: true };
  }

  async checkHostnameStatus(hostname: string): Promise<{
    isConfigured: boolean;
    status: string;
    sslStatus: string;
    error?: string;
  }> {
    const result = await this.getCustomHostnameByName(hostname);

    if (!result.success || !result.hostname) {
      return {
        isConfigured: false,
        status: "not_found",
        sslStatus: "not_found",
        error: result.error,
      };
    }

    const isConfigured =
      result.hostname.status === "active" &&
      result.hostname.ssl.status === "active";

    return {
      isConfigured,
      status: result.hostname.status,
      sslStatus: result.hostname.ssl.status,
    };
  }
}
