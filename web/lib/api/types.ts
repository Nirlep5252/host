export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  imageCount: number;
  isAdmin: boolean;
  hasApiKey?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUser[];
}

export interface AdminCreateUserRequest {
  email: string;
  name?: string;
}

export interface AdminCreateUserResponse {
  id: string;
  email: string;
  name: string | null;
  apiKey: string;
  createdAt: string;
}

export interface AdminDeleteUserResponse {
  success: boolean;
  id: string;
}

export interface AdminRegenerateKeyResponse {
  id: string;
  email: string;
  name: string | null;
  apiKey: string;
  createdAt: string;
}

export interface Image {
  id: string;
  url: string;
  originalName: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  isPrivate: boolean;
  createdAt: string;
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
