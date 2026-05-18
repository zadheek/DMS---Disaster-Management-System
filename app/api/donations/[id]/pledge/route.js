import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DonationPledgeSchema } from "@/schemas/donation.schema";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const pledges = await prisma.donationPledge.findMany({
      where: { driveId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ success: true, data: { pledges } });
  } catch (err) {
    console.error("Pledge GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load pledges" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = DonationPledgeSchema.safeParse({
      ...body,
      amount: body.amount === null || body.amount === "" || body.amount === undefined ? null : Number(body.amount),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid pledge" }, { status: 400 });
    }
    const pledge = await prisma.donationPledge.create({ data: { ...parsed.data, driveId: id } });
    return NextResponse.json({ success: true, data: pledge }, { status: 201 });
  } catch (err) {
    console.error("Pledge POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to record pledge" }, { status: 500 });
  }
}
