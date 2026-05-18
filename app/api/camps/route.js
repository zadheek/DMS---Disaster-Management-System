import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { ReliefCampSchema } from "@/schemas/camp.schema";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const where = {};
    if (searchParams.get("qrCode")) where.qrCode = searchParams.get("qrCode");
    if (searchParams.get("status")) where.status = searchParams.get("status");
    const camps = await prisma.reliefCamp.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data: camps });
  } catch (err) {
    console.error("Camps GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load camps" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = ReliefCampSchema.safeParse({
      ...body,
      lat: Number(body.lat),
      lng: Number(body.lng),
      capacity: Number(body.capacity),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid camp" }, { status: 400 });
    }
    const camp = await prisma.reliefCamp.create({ data: { ...parsed.data, qrCode: uuidv4() } });
    return NextResponse.json({ success: true, data: camp }, { status: 201 });
  } catch (err) {
    console.error("Camps POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create camp" }, { status: 500 });
  }
}
