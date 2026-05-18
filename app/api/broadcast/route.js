import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/adminLog";

const BroadcastSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(500),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  expiresAt: z.string().datetime().optional(),
});

function isAdmin(session) {
  return session?.user?.role === "ADMIN";
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("all") === "true";

    if (includeAll) {
      const session = await getServerSession(authOptions);
      if (!isAdmin(session)) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const broadcasts = await prisma.broadcast.findMany({
      where: includeAll
        ? undefined
        : {
            isActive: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
      orderBy: { createdAt: "desc" },
      take: includeAll ? 100 : 10,
    });

    return NextResponse.json({ success: true, data: broadcasts });
  } catch (err) {
    console.error("Broadcast GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to load broadcasts" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid broadcast" },
        { status: 400 }
      );
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        message: parsed.data.message,
        severity: parsed.data.severity,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    await logAdminAction(session.user.id, "CREATE_BROADCAST", "Broadcast", broadcast.id);
    global.io?.emit("broadcast:message", broadcast);

    return NextResponse.json({ success: true, data: broadcast }, { status: 201 });
  } catch (err) {
    console.error("Broadcast POST error:", err);
    return NextResponse.json({ success: false, error: "Failed to publish broadcast" }, { status: 500 });
  }
}
