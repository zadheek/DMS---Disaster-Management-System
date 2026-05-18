import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RoadAlertSchema } from "@/schemas/road.schema";

function emptyToUndefined(value) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

function pageData(searchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = pageData(searchParams);
    const where = {};
    if (searchParams.get("flagged") === "true") where.flagCount = { gt: 0 };
    else if (searchParams.get("status")) where.status = searchParams.get("status");
    const [items, total] = await Promise.all([
      prisma.roadAlert.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.roadAlert.count({ where }),
    ]);
    return NextResponse.json({
      success: true,
      data: { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("Road GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load roads" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = RoadAlertSchema.safeParse({
      ...body,
      photoUrl: emptyToUndefined(body.photoUrl),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid road alert" }, { status: 400 });
    }
    const item = await prisma.roadAlert.create({ data: parsed.data });
    global.io?.emit("new:roadAlert", item);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    console.error("Road POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create road alert" }, { status: 500 });
  }
}
