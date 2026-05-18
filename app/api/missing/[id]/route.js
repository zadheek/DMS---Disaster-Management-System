import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MissingPersonUpdateSchema } from "@/schemas/missing.schema";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = MissingPersonUpdateSchema.safeParse({
      ...body,
      age: body.age === undefined ? undefined : Number(body.age),
      lat: body.lat === undefined ? undefined : Number(body.lat),
      lng: body.lng === undefined ? undefined : Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid update" }, { status: 400 });
    }
    const item = await prisma.missingPerson.update({ where: { id }, data: parsed.data });
    global.io?.emit("update:missingPerson", item);
    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("Missing PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update missing person" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.missingPerson.delete({ where: { id } });
    global.io?.emit("missingPersons:updated");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Missing DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete missing person" }, { status: 500 });
  }
}
