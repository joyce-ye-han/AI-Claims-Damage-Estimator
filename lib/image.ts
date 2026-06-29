import { NormalizedImage } from "./types";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }
  return null;
}

function normalizeMimeType(mimeType: string | null): string | null {
  if (!mimeType) return null;
  const normalized = mimeType.split(";")[0].trim().toLowerCase();
  return isAllowedMimeType(normalized) ? normalized : null;
}

async function normalizeFile(file: File): Promise<NormalizedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Uploaded file must be an image.");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 10MB or smaller.");
  }

  const buffer = await file.arrayBuffer();
  const mimeType =
    normalizeMimeType(file.type) ??
    detectMimeTypeFromBytes(new Uint8Array(buffer));

  if (!mimeType) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
  }

  return {
    base64: bufferToBase64(buffer),
    mimeType,
  };
}

async function normalizeImageUrl(imageUrl: string): Promise<NormalizedImage> {
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    throw new Error("Image URL must be a valid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Image URL must use HTTPS.");
  }

  const response = await fetch(parsed.toString(), {
    headers: { Accept: "image/*" },
  });

  if (!response.ok) {
    throw new Error("Could not fetch image from URL.");
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Image must be 10MB or smaller.");
  }

  const headerMime = normalizeMimeType(response.headers.get("content-type"));
  const sniffedMime = detectMimeTypeFromBytes(new Uint8Array(buffer));
  const mimeType = headerMime ?? sniffedMime;

  if (!mimeType) {
    throw new Error("URL did not point to a supported image type.");
  }

  return {
    base64: bufferToBase64(buffer),
    mimeType,
  };
}

export async function normalizeImageInput(input: {
  file?: File | null;
  imageUrl?: string | null;
}): Promise<NormalizedImage> {
  const hasFile = Boolean(input.file);
  const hasUrl = Boolean(input.imageUrl?.trim());

  if (hasFile && hasUrl) {
    throw new Error("Provide either a file upload or an image URL, not both.");
  }

  if (!hasFile && !hasUrl) {
    throw new Error("Provide a file upload or an image URL.");
  }

  if (input.file) {
    return normalizeFile(input.file);
  }

  return normalizeImageUrl(input.imageUrl!.trim());
}
