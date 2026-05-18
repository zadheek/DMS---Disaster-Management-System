import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MissingPersonSchema } from "@/schemas/missing.schema";

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
    if (searchParams.get("search")) {
      where.OR = [
        { name: { contains: searchParams.get("search"), mode: "insensitive" } },
        { lastSeenLocation: { contains: searchParams.get("search"), mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.missingPerson.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.missingPerson.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("Missing GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load missing persons" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = MissingPersonSchema.safeParse({
      ...body,
      age: Number(body.age),
      lat: Number(body.lat),
      lng: Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid report" }, { status: 400 });
    }
    const person = await prisma.missingPerson.create({ data: parsed.data });
    global.io?.emit("new:missingPerson", person);
    return NextResponse.json({ success: true, data: person }, { status: 201 });
  } catch (err) {
    console.error("Missing POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to create missing person report" }, { status: 500 });
  }
}
