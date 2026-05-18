import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DonationDriveSchema } from "@/schemas/donation.schema";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const where = includeInactive ? undefined : { isActive: true };
    const [items, total] = await Promise.all([
      prisma.donationDrive.findMany({
        where,
        include: { _count: { select: { pledges: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.donationDrive.count({ where }),
    ]);
    return NextResponse.json({ success: true, data: { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    console.error("Donations GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load donations" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const parsed = DonationDriveSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid donation drive" }, { status: 400 });
    }
    const item = await prisma.donationDrive.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    console.error("Donations POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create donation drive" }, { status: 500 });
  }
}
