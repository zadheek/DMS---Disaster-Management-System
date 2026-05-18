import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VolunteerUpdateSchema } from "@/schemas/volunteer.schema";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = VolunteerUpdateSchema.safeParse({
      ...body,
      lat: body.lat === undefined ? undefined : Number(body.lat),
      lng: body.lng === undefined ? undefined : Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid volunteer update" }, { status: 400 });
    }
    const item = await prisma.volunteer.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("Volunteer PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update volunteer" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.volunteer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Volunteer DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete volunteer" }, { status: 500 });
  }
}
