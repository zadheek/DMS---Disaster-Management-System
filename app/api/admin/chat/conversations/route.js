import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminChatListSchema, AdminReplySendSchema } from "@/schemas/chat.schema";

/**
 * GET /api/admin/chat/conversations
 * Admin-only. List all conversations paginated.
 * Query: page, limit, isOpen
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = AdminChatListSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      isOpen: searchParams.get("isOpen") ?? undefined,
      query: searchParams.get("query") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { page, limit, isOpen, query } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {};
    if (isOpen !== undefined) where.isOpen = isOpen === "true";
    if (query && query.trim()) {
      const q = query.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { publicId: { contains: q, mode: "insensitive" } },
      ];
    }

    // Conversations include recent messages so the API can return the preview
    // text and unread badge count without a second frontend request.
    const [items, total] = await prisma.$transaction([
      prisma.chatConversation.findMany({
        where,
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          publicId: true,
          name: true,
          isOpen: true,
          lastMessageAt: true,
          adminLastReadAt: true,
          createdAt: true,
          // phone intentionally included for admin view only
          phone: true,
          _count: { select: { messages: true } },
          messages: {
            where: { isUnsent: false },
            orderBy: { createdAt: "desc" },
            take: 25,
            select: {
              sender: true,
              body: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.chatConversation.count({ where }),
    ]);

    // Unread means public messages newer than the timestamp stored when an
    // admin opened the conversation. Count from the database so larger active
    // conversations do not under-report badges.
    const unreadCounts = await Promise.all(
      items.map((conversation) =>
        prisma.chatMessage.count({
          where: {
            conversationId: conversation.id,
            sender: "PUBLIC",
            isUnsent: false,
            createdAt: { gt: conversation.adminLastReadAt ?? new Date(0) },
          },
        })
      )
    );

    const mappedItems = items.map((conversation, index) => {
      const latestMessage = conversation.messages[0];
      const unreadCount = unreadCounts[index] ?? 0;

      const { messages, ...rest } = conversation;
      return {
        ...rest,
        unreadCount,
        lastMessagePreview: latestMessage?.body || "New Conversation",
      };
    });

    const totalUnread = mappedItems.reduce((sum, item) => sum + item.unreadCount, 0);

    return Response.json({
      success: true,
      data: { items: mappedItems, total, totalUnread, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("GET /api/admin/chat/conversations error:", err);
    return Response.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 });
  }
}

/**
 * POST /api/admin/chat/conversations
 * Admin-only. Send a reply to a conversation identified by conversationId in body.
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const conversationId = body?.conversationId;
    if (!conversationId || typeof conversationId !== "string") {
      return Response.json({ success: false, error: "conversationId required" }, { status: 400 });
    }

    const msgParsed = AdminReplySendSchema.safeParse(body);
    if (!msgParsed.success) {
      return Response.json(
        { success: false, error: msgParsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const conversation = await prisma.chatConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    if (!conversation.isOpen) {
      return Response.json({ success: false, error: "Conversation is closed" }, { status: 400 });
    }

    // Admin replies are persisted and broadcast to the public chat client in
    // realtime through the same Socket.IO channel used by public messages.
    const now = new Date();
    const [chatMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId,
          sender: "ADMIN",
          body: msgParsed.data.message,
        },
      }),
      prisma.chatConversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now, adminLastReadAt: now },
      }),
    ]);

    if (global.io) {
      global.io.to("admin").emit("chat:newMessage", {
        conversationId,
        id: chatMessage.id,
        sender: "ADMIN",
        body: msgParsed.data.message,
        createdAt: chatMessage.createdAt,
      });
    }

    return Response.json(
      { success: true, data: { messageId: chatMessage.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/admin/chat/conversations error:", err);
    return Response.json({ success: false, error: "Failed to send reply" }, { status: 500 });
  }
}
