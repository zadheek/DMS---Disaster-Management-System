import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckInSchema } from "@/schemas/camp.schema";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const items = await prisma.campCheckIn.findMany({ where: { campId: id }, orderBy: { checkedInAt: "desc" } });
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("Check-in GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load check-ins" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const parsed = CheckInSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid check-in" }, { status: 400 });
    }
    const result = await prisma.$transaction(async (tx) => {
      const checkIn = await tx.campCheckIn.create({ data: { ...parsed.data, campId: id } });
      const camp = await tx.reliefCamp.update({ where: { id }, data: { currentOccupancy: { increment: 1 } } });
      return { checkIn, camp };
    });
    global.io?.emit("update:campOccupancy", result.camp);
    return NextResponse.json({ success: true, data: result.checkIn }, { status: 201 });
  } catch (err) {
    console.error("Check-in POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to check in" }, { status: 500 });
  }
}
