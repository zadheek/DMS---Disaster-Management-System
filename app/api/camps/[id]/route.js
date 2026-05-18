import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampUpdateSchema } from "@/schemas/camp.schema";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = CampUpdateSchema.safeParse({
      ...body,
      lat: body.lat === undefined ? undefined : Number(body.lat),
      lng: body.lng === undefined ? undefined : Number(body.lng),
      capacity: body.capacity === undefined ? undefined : Number(body.capacity),
      currentOccupancy: body.currentOccupancy === undefined ? undefined : Number(body.currentOccupancy),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid camp update" }, { status: 400 });
    }
    const camp = await prisma.reliefCamp.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: camp });
  } catch (err) {
    console.error("Camp PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update camp" }, { status: 500 });
  }
}
