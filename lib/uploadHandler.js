import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Validate file magic bytes to prevent MIME type spoofing
 * @param {Buffer} buffer
 * @returns {boolean}
 */
function validateMagicBytes(buffer) {
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) return true;
  return false;
}
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Handle a file upload from an App Router Request using native formData()
 * @param {Request} request
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function handleUpload(request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file) throw new Error("No file provided");
  if (!ALLOWED_TYPES.includes(file.type))
    throw new Error("Invalid file type. Allowed: jpg, jpeg, png, webp");
  if (file.size > MAX_SIZE) throw new Error("File too large. Max 5MB");

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validateMagicBytes(buffer)) {
    throw new Error("Invalid file type. Allowed: jpg, jpeg, png, webp");
  }

  fs.writeFileSync(filepath, buffer);

  return `/uploads/${filename}`;
}
