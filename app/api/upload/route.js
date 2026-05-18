import { NextResponse } from "next/server";
import { handleUpload } from "@/lib/uploadHandler";

export async function POST(req) {
  try {
    const url = await handleUpload(req);
    return NextResponse.json({ success: true, data: { url } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || "Upload failed" }, { status: 400 });
  }
}
