import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";
import { AlertUpdateSchema } from "@/schemas/alert.schema";

export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: alert });
  } catch (err) {
    console.error("GET /api/alerts/[id] error:", err);
    return Response.json({ success: false, error: "Failed to fetch alert" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = AlertUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const updateData = { ...parsed.data };
    if (session.user.role === "ADMIN" && body.clearFlags === true) {
      updateData.flagCount = 0;
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: updateData,
    });

    const note = parsed.data.status ? `status: ${parsed.data.status}` : null;
    await logAdminAction(session.user.id, "UPDATE_ALERT", "Alert", id, note);

    if (global.io) {
      global.io.emit("update:alert", alert);
    }

    return Response.json({ success: true, data: alert });
  } catch (err) {
    if (err.code === "P2025") {
      return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }
    console.error("PUT /api/alerts/[id] error:", err);
    return Response.json({ success: false, error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await prisma.alert.delete({ where: { id } });
    await logAdminAction(session.user.id, "DELETE_ALERT", "Alert", id);

    if (global.io) {
      global.io.emit("delete:alert", { id });
    }

    return Response.json({ success: true, data: null });
  } catch (err) {
    if (err.code === "P2025") {
      return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }
    console.error("DELETE /api/alerts/[id] error:", err);
    return Response.json({ success: false, error: "Failed to delete alert" }, { status: 500 });
  }
}
