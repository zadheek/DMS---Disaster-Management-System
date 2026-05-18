import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(req, { params }) {
  try {
    const { id, checkInId } = await params;
    const result = await prisma.$transaction(async (tx) => {
      await tx.campCheckIn.delete({ where: { id: checkInId } });
      return tx.reliefCamp.update({
        where: { id },
        data: { currentOccupancy: { decrement: 1 } },
      });
    });
    global.io?.emit("update:campOccupancy", result);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Check-in DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to remove check-in" }, { status: 500 });
  }
}
