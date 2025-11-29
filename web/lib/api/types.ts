export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  imageCount: number;
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
