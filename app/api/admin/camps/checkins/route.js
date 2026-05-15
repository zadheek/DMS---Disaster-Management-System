import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CampCheckInSearchSchema } from "@/schemas/camp.schema";

/**
 * GET /api/admin/camps/checkins
 * Admin-only. Search check-ins across all camps.
 * Query params: query (personName/personId substring), campId, page, limit
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = CampCheckInSearchSchema.safeParse({
      query: searchParams.get("query") ?? undefined,
      campId: searchParams.get("campId") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { query, campId, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {};
    if (campId) where.campId = campId;
    if (query) {
      where.OR = [
        { personName: { contains: query, mode: "insensitive" } },
        { personId: { contains: query, mode: "insensitive" } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.campCheckIn.findMany({
        where,
        orderBy: { checkedInAt: "desc" },
        skip,
        take: limit,
        include: {
          camp: { select: { id: true, name: true, location: true } },
        },
      }),
      prisma.campCheckIn.count({ where }),
    ]);

    return Response.json({
      success: true,
      data: { items, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/admin/camps/checkins error:", err);
    return Response.json({ success: false, error: "Failed to fetch check-ins" }, { status: 500 });
  }
}
