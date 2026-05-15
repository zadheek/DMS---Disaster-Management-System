import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminChatMessagesSchema } from "@/schemas/chat.schema";

/**
 * GET /api/admin/chat/conversations/[id]/messages
 * Admin-only. List messages for a conversation paginated.
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = AdminChatMessagesSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const conversation = await prisma.chatConversation.findUnique({
      where: { id },
      select: {
        id: true,
        publicId: true,
        name: true,
        phone: true,
        isOpen: true,
        lastMessageAt: true,
        createdAt: true,
      },
    });

    if (!conversation) {
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Opening a conversation marks it as read for admin notification badges.
    const [messages, total] = await prisma.$transaction([
      prisma.chatMessage.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          sender: true,
          body: true,
          isUnsent: true,
          unsentAt: true,
          createdAt: true,
        },
      }),
      prisma.chatMessage.count({ where: { conversationId: id } }),
      prisma.chatConversation.update({
        where: { id },
        data: { adminLastReadAt: new Date() },
      }),
    ]);

    return Response.json({
      success: true,
      data: {
        conversation,
        messages,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/admin/chat/conversations/[id]/messages error:", err);
    return Response.json({ success: false, error: "Failed to fetch messages" }, { status: 500 });
  }
}
