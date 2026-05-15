import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/admin/chat/messages/[id]/unsend
 * Admin-only. Soft-unsend any message (PUBLIC or ADMIN) in any conversation.
 */
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const msg = await prisma.chatMessage.findUnique({ where: { id } });
    if (!msg) {
      return Response.json({ success: false, error: "Message not found" }, { status: 404 });
    }
    if (msg.isUnsent) {
      return Response.json({ success: false, error: "Message already unsent" }, { status: 400 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { isUnsent: true, unsentAt: new Date() },
    });

    if (global.io) {
      global.io.to("admin").emit("chat:messageUnsent", {
        conversationId: msg.conversationId,
        messageId: id,
        unsentAt: updated.unsentAt,
      });
    }

    return Response.json({ success: true, data: { messageId: id } });
  } catch (err) {
    console.error("POST /api/admin/chat/messages/[id]/unsend error:", err);
    return Response.json({ success: false, error: "Failed to unsend message" }, { status: 500 });
  }
}
