"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  MessageSquare, User, Search, Phone, Clock, Send, Trash2, ShieldAlert, ArrowLeft
} from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/useSocket";

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/admin/chat/conversations?limit=50&query=${encodeURIComponent(search)}`);
      if (data.success) {
        setConversations(data.data.items || []);
      }
    } catch {
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (id) => {
    setMessagesLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/chat/conversations/${id}/messages?limit=100`);
      if (data.success) {
        setMessages(data.data.messages || []);
        window.dispatchEvent(new CustomEvent("dms:chat-read"));
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
      // Mark as read locally for the active conversation
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unreadCount: 0 } : c));
    } else {
      setMessages([]);
    }
  }, [activeId, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current && !messagesLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, messagesLoading]);

  useSocket("chat:newConversation", useCallback(() => fetchConversations(), [fetchConversations]));
  useSocket("chat:newMessage", useCallback((msg) => {
    if (activeId && msg.conversationId === activeId) {
      fetchMessages(activeId);
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unreadCount: 0 } : c));
      return;
    }
    fetchConversations();
  }, [activeId, fetchConversations, fetchMessages]));
  useSocket("chat:messageUnsent", useCallback((data) => {
    fetchConversations();
    if (activeId && data.conversationId === activeId) {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    }
  }, [activeId, fetchConversations]));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !activeId || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post("/api/admin/chat/conversations", {
        conversationId: activeId,
        message: reply.trim(),
      });
      if (data.success) {
        setMessages(prev => [...prev, {
          id: data.data.messageId,
          sender: "ADMIN",
          body: reply.trim(),
          createdAt: new Date().toISOString(),
        }]);
        setReply("");
      }
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleUnsend = async (msgId) => {
    try {
      const { data } = await axios.post(`/api/admin/chat/messages/${msgId}/unsend`);
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        toast.success("Reply unsent");
      }
    } catch {
      toast.error("Failed to unsend");
    }
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Inbox">
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border)] rounded-full px-2 py-1 items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--safe)] animate-pulse"></span>
            <span className="text-xs text-[var(--text-muted)] font-medium mr-2">Coordination Desk Active</span>
          </div>
        </TopBar>
        <main className="flex-1 overflow-hidden p-5 flex items-start justify-start">
          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-xl flex overflow-hidden h-[calc(100vh-7.5rem)] shadow-sm">
            
            {/* Left Sidebar - Chat List */}
            <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0 ${activeId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
                <div className="relative">
                  <label htmlFor="chat-search" className="sr-only">Search conversations</label>
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                  <Input 
                    id="chat-search"
                    value={search} onChange={(e)=>setSearch(e.target.value)} 
                    placeholder="Search public id, name..."
                    className="pl-9 h-9 bg-white border-slate-200 text-slate-900 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-[1px] p-2">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full bg-[var(--bg-surface)] rounded-lg" />
                  ))
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] py-10 opacity-50">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p className="text-xs">No conversations found.</p>
                  </div>
                ) : (
                  conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors border border-transparent ${activeId === c.id ? 'bg-white border-slate-200 shadow-sm' : 'hover:bg-white/70'} text-left relative`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[var(--accent)]/10 flex items-center justify-center shrink-0 border border-[var(--accent)]/20 text-[var(--accent)] mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="font-semibold text-[13px] text-slate-950 truncate">{c.name}</p>
                          {c.lastMessageAt && (
                            <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                              {new Date(c.lastMessageAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-600 truncate max-w-[18ch]">{c.lastMessagePreview || "New Conversation"}</p>
                          {c.unreadCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[9px] flex items-center justify-center font-bold">{c.unreadCount > 9 ? '9+' : c.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right Side - Active Thread */}
            <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${!activeId ? 'hidden md:flex' : 'flex'}`}>
               {!activeId ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pb-10 gap-3 opacity-30">
                   <ShieldAlert className="w-12 h-12 text-[var(--text-muted)]" />
                   <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Select a channel to view dispatch link</p>
                 </div>
               ) : (
                 <>
                   <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
                     <div className="flex items-center gap-3">
                       <button
                         onClick={() => setActiveId(null)}
                         aria-label="Back to conversations"
                         className="md:hidden p-1.5 -ml-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"
                       >
                         <ArrowLeft className="w-5 h-5" />
                       </button>
                       <User className="w-8 h-8 p-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]" />
                       <div className="flex flex-col min-w-0">
                         {conversations.find(c => c.id === activeId)?.publicId && (
                            <span className="text-[10px] font-mono text-[var(--accent)] tracking-wider">#{conversations.find(c => c.id === activeId)?.publicId}</span>
                         )}
                         <span className="font-semibold text-sm text-slate-950">{conversations.find(c => c.id === activeId)?.name || 'Unknown'}</span>
                       </div>
                     </div>
                     {conversations.find(c => c.id === activeId)?.phone && (
                       <a href={`tel:${conversations.find(c => c.id === activeId)?.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--border)] rounded text-xs text-[var(--text-primary)] transition-colors border border-[var(--border)]">
                         <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                         {conversations.find(c => c.id === activeId)?.phone}
                       </a>
                     )}
                   </div>
                   
                   <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
                     {messagesLoading ? (
                       <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin"></div></div>
                     ) : messages.length === 0 ? (
                       <p className="text-center text-xs text-[var(--text-muted)] mt-10">No messages in thread yet.</p>
                     ) : (
                       messages.map((m) => {
                         const isAdmin = m.sender === "ADMIN";
                         return (
                           <div key={m.id} className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"} group`}>
                             <div className={`max-w-[70%] sm:max-w-[65%] rounded-2xl p-3 relative shadow-sm border ${
                               isAdmin ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-900"
                             }`}>
                               <p className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isAdmin ? "text-white" : "text-slate-900"}`}>
                                 {m.body}
                               </p>
                               <div className={`flex justify-end items-center gap-1.5 mt-2 ${isAdmin ? "text-blue-100" : "text-slate-500"}`}>
                                 <span className="text-[10px] font-mono">{new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
                               </div>
                               {isAdmin && (
                                 <button
                                   onClick={() => handleUnsend(m.id)}
                                   aria-label="Unsend message"
                                   className="absolute -left-9 top-1/2 -translate-y-1/2 p-2 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--critical)] opacity-100 md:opacity-0 focus-visible:opacity-100 group-hover:opacity-100 transition-opacity rounded-md"
                                   title="Unsend message"
                                 >
                                   <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                               )}
                             </div>
                           </div>
                         );
                       })
                     )}
                   </div>
                   
                   <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-end gap-2 shrink-0 z-10 shadow-[0_-4px_10px_rgba(15,23,42,0.04)]">
                     <label htmlFor="reply-input" className="sr-only">Type reply</label>
                     <textarea
                       id="reply-input"
                       value={reply}
                       onChange={(e) => setReply(e.target.value)}
                       placeholder="Send official reply..."
                       className="flex-1 max-h-32 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none"
                       rows={1}
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleSend(e);
                         }
                       }}
                     />
                     <Button type="submit" aria-label="Send reply" disabled={!reply.trim() || sending} className="w-[44px] h-[44px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 flex items-center justify-center shrink-0 p-0 text-white transition-all shadow-md active:scale-95 disabled:opacity-50">
                       <Send className="w-5 h-5 ml-0.5" />
                     </Button>
                   </form>
                 </>
               )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

