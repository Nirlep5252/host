export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  imageCount: number;
  isAdmin: boolean;
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
