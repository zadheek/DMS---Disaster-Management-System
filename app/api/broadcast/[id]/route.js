import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

const BroadcastUpdateSchema = z.object({
  message: z.string().trim().min(1).max(500).optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

function isAdmin(session) {
  return session?.user?.role === "ADMIN";
}

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BroadcastUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid broadcast update" }, { status: 400 });
    }

    const { id } = await params;
    const data = { ...parsed.data };
    if ("expiresAt" in data) {
      data.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const broadcast = await prisma.broadcast.update({
      where: { id },
      data,
    });

    await logAdminAction(session.user.id, "UPDATE_BROADCAST", "Broadcast", broadcast.id);
    global.io?.emit("broadcasts:updated");

    return NextResponse.json({ success: true, data: broadcast });
  } catch (err) {
    console.error("Broadcast PUT error:", err);
    return NextResponse.json({ success: false, error: "Failed to update broadcast" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.broadcast.delete({ where: { id } });
    await logAdminAction(session.user.id, "DELETE_BROADCAST", "Broadcast", id);
    global.io?.emit("broadcasts:updated");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Broadcast DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete broadcast" }, { status: 500 });
  }
}
