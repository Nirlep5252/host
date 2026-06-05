export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  role: "user" | "admin";
  imageCount: number;
  isAdmin: boolean;
  apiKeyCount?: number;
  storageBytes: number;
  storageLimitBytes: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  imageCount: number;
  storageBytes: number;
  storageLimitBytes: number | null;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminCreateUserRequest {
  email: string;
  name?: string;
}

export interface AdminCreateUserResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  apiKey: string;
}

export interface AdminDeleteUserResponse {
  success: boolean;
  id: string;
}

export interface AdminCreateKeyResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  apiKey: string;
}

export interface Image {
  id: string;
  url: string;
  originalName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  isPrivate: boolean;
  createdAt: string;
  domain: string;
}

export interface ImagesListResponse {
  images: Image[];
  limit: number;
  offset: number;
}

export interface UploadResponse {
  url: string;
  id: string;
}

export interface UpdateImageResponse {
  success: boolean;
  id: string;
  isPrivate: boolean;
}

export interface DeleteImageResponse {
  success: boolean;
  id: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt: string | null;
}

export interface WaitlistStats {
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminWaitlistResponse {
  entries: WaitlistEntry[];
  stats: WaitlistStats;
}

export interface AdminApproveWaitlistResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  apiKey: string;
}

export interface AdminRejectWaitlistResponse {
  success: boolean;
}

export interface AdminDeleteWaitlistResponse {
  success: boolean;
}

export interface AdminDomain {
  id: string;
  domain: string;
  isDefault: boolean;
  isActive: boolean;
  isWorkerDomain: boolean;
  isConfigured: boolean;
  status: string;
  sslStatus: string;
  createdAt: string;
  ownerId: string | null;
  ownerEmail: string | null;
  visibility: string;
  isApproved: boolean;
}

export interface AdminDomainsResponse {
  domains: AdminDomain[];
}
