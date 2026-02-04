/**
 * Upload service for document upload functionality
 * Handles presigned URL generation and S3 upload
 */

import { apiService } from './apiService';

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  vertical: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  documentId: string;
  fields?: Record<string, string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Get presigned URL from backend
 */
export const getPresignedUrl = async (
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> => {
  const response = await apiService.post<PresignedUrlResponse>('/upload', request);
  return response;
};

/**
 * Upload file to S3 using presigned URL
 */
export const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });

    // Handle completion
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed due to network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });

    // Send the request
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
};

/**
 * Complete upload flow: get presigned URL and upload to S3
 */
export const uploadDocument = async (
  file: File,
  vertical: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  // Extract file extension from file name
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Step 1: Get presigned URL
  const presignedData = await getPresignedUrl({
    fileName: file.name,
    fileType: fileExtension,
    fileSize: file.size,
    vertical,
  });

  // Step 2: Upload to S3
  await uploadToS3(file, presignedData.uploadUrl, onProgress);

  // Step 3: Return document ID
  return presignedData.documentId;
};

export const uploadService = {
  getPresignedUrl,
  uploadToS3,
  uploadDocument,
};
