import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      activeAlerts,
      totalAlerts,
      missingPersons,
      foundPersons,
      activeCamps,
      totalCampOccupancy,
      totalVolunteers,
      deployedVolunteers,
      flaggedAlerts,
      flaggedRoads,
      flaggedMissing,
      recentAlertsByType,
    ] = await prisma.$transaction([
      prisma.alert.count({ where: { status: "ACTIVE" } }),
      prisma.alert.count(),
      prisma.missingPerson.count({ where: { status: "MISSING" } }),
      prisma.missingPerson.count({ where: { status: "FOUND" } }),
      prisma.reliefCamp.count({ where: { status: "ACTIVE" } }),
      prisma.reliefCamp.aggregate({
        _sum: { currentOccupancy: true },
        where: { status: "ACTIVE" },
      }),
      prisma.volunteer.count(),
      prisma.volunteer.count({ where: { status: "DEPLOYED" } }),
      prisma.alert.count({ where: { flagCount: { gte: 3 } } }),
      prisma.roadAlert.count({ where: { flagCount: { gte: 3 } } }),
      prisma.missingPerson.count({ where: { flagCount: { gte: 3 } } }),
      prisma.alert.groupBy({
        by: ["type"],
        _count: { type: true },
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    return Response.json({
      success: true,
      data: {
        alerts: {
          active: activeAlerts,
          total: totalAlerts,
          flagged: flaggedAlerts,
        },
        missing: {
          missing: missingPersons,
          found: foundPersons,
          flagged: flaggedMissing,
        },
        camps: {
          active: activeCamps,
          totalOccupancy: totalCampOccupancy._sum.currentOccupancy ?? 0,
        },
        volunteers: {
          total: totalVolunteers,
          deployed: deployedVolunteers,
        },
        roads: {
          flagged: flaggedRoads,
        },
        recentAlertsByType,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return Response.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
