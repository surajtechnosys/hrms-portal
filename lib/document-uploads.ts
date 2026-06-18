export const MAX_DOCUMENT_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const IMAGE_UPLOAD_ACCEPT = "image/*";
export const DOCUMENT_UPLOAD_ACCEPT = "image/*,application/pdf";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
]);

const DOCUMENT_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  "application/pdf",
]);

function matchesExtension(fileName: string, extensions: string[]) {
  const lower = fileName.toLowerCase();
  return extensions.some((extension) => lower.endsWith(extension));
}

export function isAllowedUploadFile(file: File, accept: string) {
  const isDocumentUpload = accept.includes("application/pdf");
  const allowedMimeTypes = isDocumentUpload
    ? DOCUMENT_MIME_TYPES
    : IMAGE_MIME_TYPES;

  if (allowedMimeTypes.has(file.type)) {
    return true;
  }

  if (isDocumentUpload) {
    return (
      (file.type.startsWith("image/") &&
        matchesExtension(file.name, [
          ".jpg",
          ".jpeg",
          ".png",
          ".webp",
          ".gif",
          ".bmp",
          ".svg",
          ".heic",
          ".heif",
        ])) ||
      file.type === "application/pdf" ||
      matchesExtension(file.name, [".pdf"])
    );
  }

  return file.type.startsWith("image/") ||
    matchesExtension(file.name, [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".bmp",
      ".svg",
      ".heic",
      ".heif",
    ]);
}

export function isImagePreviewUrl(url: string) {
  const normalized = url.trim().toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes(".jpg") ||
    normalized.includes(".jpeg") ||
    normalized.includes(".png") ||
    normalized.includes(".webp") ||
    normalized.includes(".gif") ||
    normalized.includes(".bmp") ||
    normalized.includes(".svg") ||
    normalized.includes(".heic") ||
    normalized.includes(".heif")
  );
}

export function sanitizeStoredFileUrl(url?: string | null) {
  const normalized = url?.trim() || "";

  if (!normalized) {
    return "";
  }

  if (/^data:[^;]+;base64,/i.test(normalized)) {
    return "";
  }

  return normalized;
}
