import { prisma } from "@/lib/prisma";
import { z } from "zod";

const FlagSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
  reporterName: z.string().min(1, "Your name is required").max(100),
  reporterPhone: z.string().min(7, "Valid phone required").max(20),
});

export async function POST(request, { params }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const parsed = FlagSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const [, updated] = await prisma.$transaction([
      prisma.flagReport.create({
        data: { targetType: "ALERT", targetId: id, ...parsed.data },
      }),
      prisma.alert.update({
        where: { id },
        data: { flagCount: { increment: 1 } },
      }),
    ]);

    return Response.json(
      { success: true, data: { flagCount: updated.flagCount } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/alerts/[id]/flag error:", err);
    return Response.json({ success: false, error: "Failed to submit flag" }, { status: 500 });
  }
}
