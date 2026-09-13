"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Flame,
  Globe,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  TrendingUp,
  Building2,
  Users
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fetchBriefing = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/briefing");
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      setBriefing(data.briefing);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const copyDraft = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing today's executive intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sun className="w-4 h-4" />
            Executive Morning Intelligence • {briefing?.date || "Today"}
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Good morning, Adetunwase</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Synthesized across industry news, Animation Hub milestones, and Foundation impact.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2.5 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#262c37] hover:border-amber-500/40 text-neutral-200 text-xs font-medium flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-500" : ""}`} />
          <span>{isRefreshing ? "Researching New Intelligence..." : "Refresh Today's Briefing"}</span>
        </button>
      </div>

      {/* Top Executive Headline Card */}
      {briefing?.executiveHeadline && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171b23] to-[#14171e] border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
            Daily Key Takeaway
          </span>
          <p className="text-base text-neutral-100 font-medium mt-1 leading-snug">
            "{briefing.executiveHeadline}"
          </p>
        </div>
      )}

      {/* Three Things Worth Knowing & Two Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 3 Things Worth Knowing */}
        <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-neutral-200">3 Things Worth Knowing</h2>
          </div>

          <div className="space-y-3">
            {briefing?.threeKeyNews?.map((news: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#171a22] border border-[#242b36] flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">{news}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2 Relevant Trends */}
        <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-200">2 High-Relevance Trends</h2>
          </div>

          <div className="space-y-3">
            {briefing?.twoRelevantTrends?.map((trend: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#171a22] border border-[#242b36] flex items-start gap-3"
              >
                <TrendingUp className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-300 leading-relaxed">{trend}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1 Standout Content Opportunity */}
      {briefing?.oneContentOpp && (
        <div className="p-6 rounded-2xl bg-[#141820] border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Today's Standout Content Opportunity</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Target: {briefing.oneContentOpp.platform || "LinkedIn"}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-[#181d26] border border-[#262e3c]">
              <span className="text-neutral-500 block text-[10px] uppercase font-semibold">
                Recommended Opening Hook
              </span>
              <p className="text-neutral-200 font-medium mt-0.5 text-sm">
                "{briefing.oneContentOpp.hook}"
              </p>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              <strong className="text-neutral-200">Core Angle: </strong>
              {briefing.oneContentOpp.angle}
            </p>
          </div>
        </div>
      )}

      {/* Recommended Platform Drafts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200">
            Recommended Ready-to-Post Drafts (Zero Em Dashes)
          </h2>
          <span className="text-xs text-neutral-400">
            Pre-filtered for human voice & platform mechanics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefing?.recommendedDrafts?.map((draft: any, idx: number) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {draft.platform}
                  </span>
                  <span className="text-[10px] text-amber-500 font-medium">
                    {draft.topic}
                  </span>
                </div>
                <div className="text-xs text-neutral-300 leading-relaxed">
                  <MarkdownRenderer content={draft.content} />
                </div>
              </div>

              <div className="pt-3 border-t border-[#222834] flex items-center justify-between">
                <button
                  onClick={() => copyDraft(idx, draft.content)}
                  className="px-3 py-1.5 rounded-lg bg-[#181d26] hover:bg-[#202733] border border-[#272f3d] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {copiedIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedIdx === idx ? "Copied!" : "Copy Post"}</span>
                </button>

                <a
                  href="/studio"
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
