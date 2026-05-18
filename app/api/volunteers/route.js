import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VolunteerSchema } from "@/schemas/volunteer.schema";

function toCsv(rows) {
  const header = ["name", "phone", "email", "location", "skills", "status", "createdAt"];
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [header.join(","), ...rows.map((row) => header.map((key) => escape(Array.isArray(row[key]) ? row[key].join("|") : row[key])).join(","))].join("\n");
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const where = {};
    if (searchParams.get("status")) where.status = searchParams.get("status");
    if (searchParams.get("skill")) where.skills = { has: searchParams.get("skill") };
    const all = await prisma.volunteer.findMany({ where, orderBy: { createdAt: "desc" } });
    if (searchParams.get("format") === "csv") {
      return new NextResponse(toCsv(all), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=volunteers.csv",
        },
      });
    }
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const items = all.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ success: true, data: { items, total: all.length, page, totalPages: Math.max(1, Math.ceil(all.length / limit)) } });
  } catch (err) {
    console.error("Volunteers GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load volunteers" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = VolunteerSchema.safeParse({
      ...body,
      lat: Number(body.lat),
      lng: Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0]?.message || "Invalid volunteer" }, { status: 400 });
    }
    const item = await prisma.volunteer.create({ data: parsed.data });
    global.io?.emit("new:volunteer", item);
    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (err) {
    console.error("Volunteers POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to register volunteer" }, { status: 500 });
  }
}
