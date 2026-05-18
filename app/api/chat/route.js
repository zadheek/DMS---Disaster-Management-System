import { prisma } from "@/lib/prisma";
import { ChatGetMessagesSchema, ChatSendSchema } from "@/schemas/chat.schema";
import { generateToken, hashToken, verifyToken } from "@/lib/chatToken";

function publicMessageSelect() {
  return {
    id: true,
    sender: true,
    body: true,
    isUnsent: true,
    createdAt: true,
  };
}

async function findVerifiedConversation(conversationId, conversationToken) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation || !verifyToken(conversationToken, conversation.tokenHash)) {
    return null;
  }
  return conversation;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = ChatGetMessagesSchema.safeParse({
      conversationId: searchParams.get("conversationId") ?? undefined,
      conversationToken: searchParams.get("conversationToken") ?? undefined,
    });

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const conversation = await findVerifiedConversation(
      parsed.data.conversationId,
      parsed.data.conversationToken
    );
    if (!conversation) {
      return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id, isUnsent: false },
      orderBy: { createdAt: "asc" },
      select: publicMessageSelect(),
    });

    return Response.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          publicId: conversation.publicId,
          name: conversation.name,
          phone: conversation.phone,
          isOpen: conversation.isOpen,
        },
        messages,
      },
    });
  } catch (err) {
    console.error("GET /api/chat error:", err);
    return Response.json({ success: false, error: "Failed to load chat" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = ChatSendSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, phone, message, conversationId, conversationToken } = parsed.data;
    const now = new Date();
    let conversation;
    let rawToken = conversationToken;

    if (conversationId && conversationToken) {
      conversation = await findVerifiedConversation(conversationId, conversationToken);
      if (!conversation) {
        return Response.json({ success: false, error: "Conversation not found" }, { status: 404 });
      }
      if (!conversation.isOpen) {
        return Response.json({ success: false, error: "Conversation is closed" }, { status: 400 });
      }
    } else {
      rawToken = generateToken();
      conversation = await prisma.chatConversation.create({
        data: {
          name,
          phone: phone || null,
          tokenHash: hashToken(rawToken),
          lastMessageAt: now,
        },
      });
    }

    const [chatMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          sender: "PUBLIC",
          body: message,
        },
        select: publicMessageSelect(),
      }),
      prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          name,
          phone: phone || null,
          lastMessageAt: now,
        },
      }),
    ]);

    if (global.io) {
      global.io.to("admin").emit("chat:newConversation", { conversationId: conversation.id });
      global.io.to("admin").emit("chat:newMessage", {
        conversationId: conversation.id,
        id: chatMessage.id,
        sender: "PUBLIC",
        body: chatMessage.body,
        createdAt: chatMessage.createdAt,
      });
      global.io.emit("chat:newMessage", {
        conversationId: conversation.id,
        id: chatMessage.id,
        sender: "PUBLIC",
        body: chatMessage.body,
        createdAt: chatMessage.createdAt,
      });
    }

    return Response.json(
      {
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            publicId: conversation.publicId,
            name,
            phone: phone || null,
            isOpen: conversation.isOpen,
          },
          conversationToken: rawToken,
          message: chatMessage,
        },
      },
      { status: conversationId ? 200 : 201 }
    );
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return Response.json({ success: false, error: "Failed to send message" }, { status: 500 });
  }
}
