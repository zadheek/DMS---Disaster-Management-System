"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { MessageSquare, Send, ShieldAlert } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/hooks/useSocket";

const STORAGE_KEY = "dms-public-chat";

function readStoredChat() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState(null);
  const [conversationToken, setConversationToken] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadMessages = useCallback(async (id, token) => {
    if (!id || !token) return;
    try {
      const { data } = await axios.get(
        `/api/chat?conversationId=${encodeURIComponent(id)}&conversationToken=${encodeURIComponent(token)}`
      );
      if (data.success) {
        setConversation(data.data.conversation);
        setMessages(data.data.messages || []);
      }
    } catch {
      toast.error("Failed to load chat messages");
    }
  }, []);

  useEffect(() => {
    const stored = readStoredChat();
    if (!stored?.conversationId || !stored?.conversationToken) return;
    setConversationToken(stored.conversationToken);
    loadMessages(stored.conversationId, stored.conversationToken);
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useSocket(
    "chat:newMessage",
    useCallback(
      (msg) => {
        if (!conversation?.id || msg.conversationId !== conversation.id) return;
        setMessages((prev) => {
          if (prev.some((item) => item.id === msg.id)) return prev;
          return [...prev, msg];
        });
      },
      [conversation?.id]
    )
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || sending) return;
    if (!conversation && !name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSending(true);
    try {
      const { data } = await axios.post("/api/chat", {
        name: name.trim() || conversation?.name,
        phone: phone.trim() || conversation?.phone || undefined,
        message: message.trim(),
        conversationId: conversation?.id,
        conversationToken: conversation ? conversationToken : undefined,
      });

      if (data.success) {
        setConversation(data.data.conversation);
        setConversationToken(data.data.conversationToken);
        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            conversationId: data.data.conversation.id,
            conversationToken: data.data.conversationToken,
          })
        );
        setMessages((prev) => {
          if (prev.some((item) => item.id === data.data.message.id)) return prev;
          return [...prev, data.data.message];
        });
        setMessage("");
        toast.success("Message sent to admin");
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Contact Admin" />
        <main className="flex-1 overflow-hidden p-5">
          <div className="flex h-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Admin Support Chat</h2>
                  {conversation?.publicId && (
                    <p className="text-xs font-mono text-slate-500">Reference #{conversation.publicId}</p>
                  )}
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Open
              </span>
            </div>

            {!conversation && (
              <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="chat-name">Your Name</Label>
                  <Input
                    id="chat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chat-phone">Phone</Label>
                  <Input
                    id="chat-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 p-4">
              {messages.length === 0 ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-slate-500">
                  <MessageSquare className="mb-3 h-9 w-9 text-slate-300" />
                  <p className="text-sm font-medium">Send a message and an admin will see it in the inbox.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((item) => {
                    const fromAdmin = item.sender === "ADMIN";
                    return (
                      <div key={item.id} className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[78%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                            fromAdmin
                              ? "border-slate-200 bg-white text-slate-900"
                              : "border-blue-600 bg-blue-600 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-6">{item.body}</p>
                          <p className={`mt-2 text-[10px] ${fromAdmin ? "text-slate-400" : "text-blue-100"}`}>
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
              <Label htmlFor="chat-message" className="sr-only">Message</Label>
              <Textarea
                id="chat-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="min-h-[44px] flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button type="submit" disabled={sending || !message.trim()} className="h-11 bg-blue-600 text-white hover:bg-blue-700">
                <Send className="mr-2 h-4 w-4" />
                Send
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
