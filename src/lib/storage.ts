import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Local file-system storage for the compliance-vault upload layer.
 *
 * The interface is intentionally storage-agnostic on the outside - swap the
 * body for an S3/R2/MinIO client in production without touching call sites.
 * Free / self-hosted by default (writes under UPLOAD_DIR).
 */

const UPLOAD_ROOT = process.env.UPLOAD_DIR || "./uploads";

function safeRoot(): string {
  const root = path.resolve(process.cwd(), UPLOAD_ROOT);
  return root;
}

/** Reject any path traversal attempt; keep everything under UPLOAD_ROOT. */
function sanitize(rel: string): string {
  const root = safeRoot();
  const full = path.resolve(root, rel);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("Invalid storage path");
  }
  return full;
}

export async function ensureRoot(): Promise<void> {
  await fs.mkdir(safeRoot(), { recursive: true });
}

export async function saveUpload(
  relDir: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storagePath: string; sizeBytes: number; mimeType: string }> {
  const root = safeRoot();
  const dir = sanitize(relDir);
  await fs.mkdir(dir, { recursive: true });
  const disambig = crypto.randomBytes(6).toString("hex");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80);
  const finalName = `${disambig}-${safeName}`;
  const full = path.join(dir, finalName);
  await fs.writeFile(full, Buffer.from(bytes));
  const rel = path.relative(root, full).split(path.sep).join("/");
  return {
    storagePath: rel,
    sizeBytes: bytes.byteLength,
    mimeType: guessMime(safeName),
  };
}

export async function readUpload(storagePath: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const full = sanitize(storagePath);
  try {
    const bytes = await fs.readFile(full);
    return { bytes, mimeType: guessMime(storagePath) };
  } catch {
    throw new Error("File not found");
  }
}

export async function deleteUpload(storagePath: string): Promise<void> {
  const full = sanitize(storagePath);
  try {
    await fs.unlink(full);
  } catch {
    /* idempotent */
  }
}

function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".csv")) return "text/csv";
  return "application/octet-stream";
}

/** Allowed mime types for the compliance vault. */
export const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MiB, matches next.config bodySizeLimit

/**
 * Magic-number check — verifies the file's actual bytes match its declared
 * MIME type. Defense-in-depth: the UA-supplied content-type can be spoofed,
 * and `saveUpload` only guesses from the extension, so this is the only thing
 * that stops a renamed .txt from landing in the vault as a "PDF".
 */
export function hasValidMagic(bytes: Uint8Array, declaredType: string): boolean {
  const b = bytes.subarray(0, 16);
  if (b.length < 4) return false;
  const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47; // .PNG
  const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; // \xFFD8FF
  const isWebp =
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50; // WEBP
  if (declaredType === "application/pdf") return isPdf;
  if (declaredType === "image/png") return isPng;
  if (declaredType === "image/jpeg") return isJpeg;
  if (declaredType === "image/webp") return isWebp;
  if (declaredType === "application/octet-stream") return isPdf || isPng || isJpeg || isWebp;
  return false;
}
