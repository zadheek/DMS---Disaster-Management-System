import { prisma } from "@/lib/prisma";
import { AlertSchema } from "@/schemas/alert.schema";

function emptyToUndefined(value) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = parseInt(searchParams.get("limit") || "20");
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 20 : rawLimit), 100);
    const rawPage = parseInt(searchParams.get("page") || "1");
    const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
    const skip = (page - 1) * limit;
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const flagged = searchParams.get("flagged") === "true";

    // Build one reusable Prisma filter for public lists, admin flagged lists,
    // pagination, and map data loading.
    const where = {};
    if (status) where.status = status;
    else if (!flagged) where.status = "ACTIVE";
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (flagged) where.flagCount = { gte: 1 };

    const orderBy = flagged
      ? [{ flagCount: "desc" }, { createdAt: "desc" }]
      : [{ severity: "desc" }, { createdAt: "desc" }];

    const [items, total] = await prisma.$transaction([
      prisma.alert.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: { items, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/alerts error:", err);
    return Response.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = AlertSchema.safeParse({
      ...body,
      photoUrl: emptyToUndefined(body.photoUrl),
      expiresAt: emptyToUndefined(body.expiresAt),
    });
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // All incoming data is validated with Zod before writing to the database.
    // This keeps map coordinates, severity, type, and reporter fields reliable.
    const createData = {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    };
    let newAlert = await prisma.alert.create({ data: createData });

    // Auto-escalation: if at least three same-type alerts appear within roughly
    // 500m during six hours, the newest alert becomes CRITICAL.
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const nearby = await prisma.alert.findMany({
      where: {
        type: newAlert.type,
        status: "ACTIVE",
        createdAt: { gte: sixHoursAgo },
        id: { not: newAlert.id },
      },
    });

    const closeAlerts = nearby.filter(
      (a) =>
        Math.abs(a.lat - newAlert.lat) < 0.0045 &&
        Math.abs(a.lng - newAlert.lng) < 0.0045
    );

    if (closeAlerts.length >= 2) {
      newAlert = await prisma.alert.update({
        where: { id: newAlert.id },
        data: { severity: "CRITICAL" },
      });
      if (global.io) {
        global.io.emit("alert:escalated", { alert: newAlert, count: closeAlerts.length + 1 });
      }
    }

    // Realtime fan-out updates the public map/list and the admin live feed.
    if (global.io) {
      global.io.emit("new:alert", newAlert);
      global.io.to("admin").emit("admin:newSubmission", { type: "alert", data: newAlert });
    }

    return Response.json({ success: true, data: newAlert }, { status: 201 });
  } catch (err) {
    console.error("POST /api/alerts error:", err);
    return Response.json({ success: false, error: "Failed to create alert" }, { status: 500 });
  }
}
