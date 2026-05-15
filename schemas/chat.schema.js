import { z } from "zod";

export const ChatSendSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7).max(20).optional(),
  message: z.string().min(1, "Message is required").max(1000),
  conversationId: z.string().optional(),
  conversationToken: z.string().optional(),
});

export const ChatUnsendSchema = z.object({
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  conversationToken: z.string().min(1),
});

export const AdminChatListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isOpen: z.enum(["true", "false"]).optional(),
  query: z.string().max(200).optional(),
});

export const AdminChatMessagesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const AdminReplySendSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
});

export const ChatGetMessagesSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID required"),
  conversationToken: z.string().min(1, "Token required"),
});
