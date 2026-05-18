import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DonationDriveSchema } from "@/schemas/donation.schema";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const parsed = DonationDriveSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid donation drive update" }, { status: 400 });
    }
    const item = await prisma.donationDrive.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("Donation PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update donation drive" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await prisma.donationDrive.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Donation DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete donation drive" }, { status: 500 });
  }
}
