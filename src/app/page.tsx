"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Search,
  Globe,
  Database,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Building2,
  UserCheck,
  ExternalLink,
  Flame,
  Briefcase,
  RotateCcw,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bug,
  Terminal,
  CornerDownLeft
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  rawContent?: string;
  toolsUsed?: string[];
  sources?: Array<{
    title: string;
    url: string;
    sourceName: string;
    date?: string;
    confidence: string;
  }>;
  suggestedActions?: string[];
  contactDossier?: any;
  leads?: any[];
  outreachDrafts?: any[];
  feedback?: "up" | "down" | null;
}

const STARTER_PROMPTS = [
  {
    title: "Today's Content Idea",
    prompt: "Give me an authentic LinkedIn post draft based on our recent work at Animation Hub.",
    icon: Sparkles
  },
  {
    title: "Meeting Preparation",
    prompt: "Prepare me for tomorrow's meeting with a prospective streaming partner. Give me talking points and things to avoid.",
    icon: Briefcase
  },
  {
    title: "Executive Research",
    prompt: "Research this person: Folake Ani-Mumuney, FBN Holdings. Why do they matter to Adetunwase?",
    icon: Search
  },
  {
    title: "Trend Radar Check",
    prompt: "What is trending in creative tech and African animation that I can authentically talk about today?",
    icon: Flame
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `Hello, Adetunwase.

I'm ready to help you research, plan, draft content, or manage contacts across Animation Hub and your Foundation.

What would you like to work on right now?`,
      toolsUsed: ["Adetunwase Knowledge Engine"],
      suggestedActions: []
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contextMode, setContextMode] = useState<"general" | "content" | "research" | "meeting">("general");
  const [campaignLeads, setCampaignLeads] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!messageText) setInput("");
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          contextMode,
          campaignLeads
        })
      });

      if (!res.ok) {
        throw new Error("Failed to process message");
      }

      const data = await res.json();

      if (Array.isArray(data.leads) && data.leads.length > 0) {
        setCampaignLeads(data.leads);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        rawContent: data.rawContent || data.content,
        toolsUsed: data.toolsUsed,
        sources: data.sources,
        suggestedActions: data.suggestedActions,
        contactDossier: data.contactDossier,
        leads: data.leads,
        outreachDrafts: data.outreachDrafts
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I encountered a temporary connection issue while running research. Let's try your question again.",
          toolsUsed: ["Fallback Handler"]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Action 1: Copy
  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Action 2: Regenerate (finds the last user message and re-sends)
  const handleRegenerate = async (msgId: string) => {
    if (isLoading) return;
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    if (msgIndex === -1) return;

    // Find previous user message
    let lastUserText = "";
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserText = messages[i].content;
        break;
      }
    }

    if (!lastUserText) return;

    // Remove the assistant message being regenerated
    setMessages((prev) => prev.slice(0, msgIndex));
    await handleSend(lastUserText);
  };

  // Action 3: Edit / Retry (load into input and focus)
  const handleEdit = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // Action 4: Feedback (thumbs up / down)
  const handleFeedback = (id: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          feedback: m.feedback === type ? null : type
        };
      })
    );
  };

  // Action 5: Share
  const handleShare = async (id: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Adetunwase Executive Briefing",
          text
        });
        return;
      } catch (e) {
        // Fallback to clipboard
      }
    }
    copyText(id, text);
    setSharedId(id);
    setTimeout(() => setSharedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900">
      {/* Executive Header */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white/90 backdrop-blur flex items-center justify-between shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          <div>
            <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Adetunwase Executive Assistant
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Online
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Personal Brand • Animation Hub • Foundation
            </p>
          </div>
        </div>

        {/* Developer / Debug Inspector Toggle & Mode Selector */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDebugMode(!isDebugMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              isDebugMode
                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
            title="Toggle Developer Debug Mode (Raw text, AST inspector, token breakdown)"
          >
            <Bug className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Debug Inspector</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                isDebugMode ? "bg-amber-500 text-black" : "bg-slate-100 text-slate-600"
              }`}
            >
              {isDebugMode ? "On" : "Off"}
            </span>
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {messages.length === 1 && (
          <div className="max-w-3xl mx-auto my-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STARTER_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-left transition-all group shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`max-w-3xl mx-auto flex gap-3.5 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0 mt-1 shadow-2xs">
                  AA
                </div>
              )}

              <div className={`space-y-2.5 ${isUser ? "max-w-xl" : "w-full"}`}>
                {/* Message Container: ChatGPT style, minimal & content-first */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-amber-600 text-white rounded-br-sm shadow-md"
                      : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-xs"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <MarkdownRenderer
                      content={m.content}
                      rawContent={m.rawContent}
                      enableDebugMode={isDebugMode}
                    />
                  )}

                  {/* Assistant Actions Bar: ChatGPT-style */}
                  {!isUser && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      {/* Left: Tools Used */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {m.toolsUsed && m.toolsUsed.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {m.toolsUsed.map((tool, tIdx) => (
                              <span
                                key={tIdx}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                {tool}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Message Actions (Copy, Regenerate, Thumbs, Share) */}
                      <div className="flex items-center gap-1">
                        {/* Copy Button */}
                        <button
                          onClick={() => copyText(m.id, m.content)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 text-slate-500 transition-colors flex items-center gap-1 text-[11px]"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>

                        {/* Regenerate Button */}
                        <button
                          onClick={() => handleRegenerate(m.id)}
                          disabled={isLoading}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 text-slate-500 transition-colors flex items-center gap-1 text-[11px] disabled:opacity-40"
                          title="Regenerate this response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>

                        {/* Thumbs Up Feedback */}
                        <button
                          onClick={() => handleFeedback(m.id, "up")}
                          className={`p-1.5 rounded transition-colors ${
                            m.feedback === "up"
                              ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800/40"
                              : "text-neutral-400 hover:bg-[#1e2531] hover:text-neutral-200"
                          }`}
                          title="Helpful response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Thumbs Down Feedback */}
                        <button
                          onClick={() => handleFeedback(m.id, "down")}
                          className={`p-1.5 rounded transition-colors ${
                            m.feedback === "down"
                              ? "text-rose-400 bg-rose-950/40 border border-rose-800/40"
                              : "text-neutral-400 hover:bg-[#1e2531] hover:text-neutral-200"
                          }`}
                          title="Needs improvement"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShare(m.id, m.content)}
                          className="p-1.5 rounded hover:bg-slate-100 hover:text-slate-900 text-slate-500 transition-colors"
                          title="Share response"
                        >
                          {sharedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Message Action: Edit / Retry */}
                {isUser && (
                  <div className="flex justify-end pr-1">
                    <button
                      onClick={() => handleEdit(m.content)}
                      className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
                      title="Edit this prompt"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                )}

                {/* Researched Contact Dossier Component if present */}
                {!isUser && m.contactDossier && (
                  <div className="p-4 rounded-xl bg-[#11141a] border border-[#232934] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-semibold text-neutral-200">
                          Researched Executive Profile: {m.contactDossier.targetName}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        Public Domain Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-[#161a22] border border-[#252b36]">
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">
                          Organization
                        </span>
                        <span className="text-neutral-200 font-medium">
                          {m.contactDossier.company}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-[#161a22] border border-[#252b36]">
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">
                          Business Email
                        </span>
                        <span className="text-neutral-200 font-medium">
                          {m.contactDossier.contactDetails?.workEmail || "Not publicly listed"}
                        </span>
                        <span className="block text-[9px] text-amber-400/90 mt-0.5">
                          {m.contactDossier.contactDetails?.emailType}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed bg-[#161b23] p-2.5 rounded border border-[#242b37]">
                      <strong className="text-amber-400">Why this matters to Adetunwase: </strong>
                      {m.contactDossier.whyThisPersonMatters}
                    </p>
                  </div>
                )}

                {/* Sources & Citations if present */}
                {!isUser && m.sources && m.sources.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Verified Primary Sources ({m.sources.length})
                    </div>
                    <div className="space-y-1.5">
                      {m.sources.map((s, sIdx) => (
                        <a
                          key={sIdx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs transition-colors group shadow-2xs"
                        >
                          <div className="truncate flex-1 pr-2">
                            <span className="text-slate-800 group-hover:text-amber-700 transition-colors">
                              {s.title}
                            </span>
                            <span className="text-slate-500 text-[10px] ml-2">
                              {s.sourceName} • {s.date}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                s.confidence === "High"
                                    ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {s.confidence} Confidence
                            </span>
                            <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-neutral-300" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Context Actions */}
                {!isUser && m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestedActions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSend(act)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-900 transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{act}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-amber-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 border border-slate-300 font-bold text-xs shrink-0 mt-1">
                  Me
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming & Loading State */}
        {isLoading && (
          <div className="max-w-3xl mx-auto flex gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
              AA
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-700 flex items-center gap-3 shadow-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-slate-500">
                Synthesizing executive context & formatting response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-white/95 backdrop-blur shrink-0 shadow-xs">
        <div className="max-w-3xl mx-auto space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything, request research, or drop today's context..."
              className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-4 py-3 pr-24 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:hover:bg-amber-600 text-white transition-all shadow-sm flex items-center gap-1"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>
                Autonomous Em-Dash Eliminator: <strong className="text-slate-800">Active</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 hidden sm:inline">
                Enter to send
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
