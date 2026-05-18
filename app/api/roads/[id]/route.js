import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RoadAlertUpdateSchema } from "@/schemas/road.schema";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = RoadAlertUpdateSchema.safeParse({
      ...body,
      lat: body.lat === undefined ? undefined : Number(body.lat),
      lng: body.lng === undefined ? undefined : Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid update" }, { status: 400 });
    }
    const item = await prisma.roadAlert.update({ where: { id }, data: parsed.data });
    global.io?.emit("update:roadAlert", item);
    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("Road PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update road alert" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.roadAlert.delete({ where: { id } });
    global.io?.emit("roadAlerts:updated");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Road DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete road alert" }, { status: 500 });
  }
}
