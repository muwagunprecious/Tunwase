"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Sparkles,
  TrendingUp,
  Heart,
  MessageSquare,
  Share2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function SocialIntelPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSocialData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/social");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 text-xs">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Computing engagement analytics & voice profile...</span>
        </div>
      </div>
    );
  }

  const { metrics, highPerformers, regularPosts, styleProfile } = data || {};

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            Social Intelligence & Voice Lab
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Pattern Analysis & Voice Lab</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Historical engagement patterns, fatigue detection, and evolving style profile.
          </p>
        </div>

        <button
          onClick={fetchSocialData}
          className="px-4 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#262c37] text-neutral-300 text-xs font-medium flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Fatigue Warning if present */}
      {metrics?.fatigueWarning && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
              Content Fatigue Advisory
            </span>
            <p className="text-xs text-amber-200/90 mt-0.5 leading-relaxed">
              {metrics.fatigueWarning}
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#13161c] border border-[#222834]">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            Analyzed Posts
          </span>
          <span className="text-xl font-bold text-neutral-100">{metrics?.totalPosts || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13161c] border border-[#222834]">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            Avg Engagement
          </span>
          <span className="text-xl font-bold text-amber-400">{metrics?.avgEngagement || "0%"}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13161c] border border-[#222834]">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            Total Reactions
          </span>
          <span className="text-xl font-bold text-blue-400">{metrics?.totalLikes || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#13161c] border border-[#222834]">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
            Total Comments
          </span>
          <span className="text-xl font-bold text-emerald-400">{metrics?.totalComments || 0}</span>
        </div>
      </div>

      {/* Writing Style Profile & Voice Guard */}
      <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-5">
        <div className="flex items-center justify-between border-b border-[#202530] pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-200">
              Adetunwase Voice Profile & Rules
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            Strict Zero Em Dashes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#161a22] border border-[#242b36] space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Core Tone & Rhythm
            </span>
            <p className="text-neutral-200 leading-relaxed font-medium">
              {styleProfile?.tone}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#161a22] border border-[#242b36] space-y-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Prohibited Patterns & Banned Words
            </span>
            <p className="text-neutral-200 leading-relaxed font-medium">
              {styleProfile?.prohibitedRules}
            </p>
          </div>
        </div>

        {/* Proven Hooks */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block">
            Proven Opening Hooks (Derived from High-Engagement Posts)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {styleProfile?.hookPatterns?.map((hook: string, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#161a22] border border-[#242b36] text-xs text-neutral-300 font-medium"
              >
                "{hook}"
              </div>
            ))}
          </div>
        </div>

        {/* Learned Preferences from User Edits */}
        {styleProfile?.learnedRules && styleProfile.learnedRules.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[10px] uppercase font-bold text-amber-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Learned Preferences from User Edits
            </span>
            <div className="space-y-1.5">
              {styleProfile.learnedRules.map((rule: string, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#151921] border border-[#232936] text-xs text-neutral-300"
                >
                  • {rule}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* High-Performing Posts Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            High-Performing Content Analysis
          </h2>
          <span className="text-xs text-neutral-400">
            Posts that generated exceptional organic engagement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {highPerformers?.map((post: any) => (
            <div
              key={post.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-amber-500/30 flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {post.platform}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-bold">
                    {post.engagementRate}% Engagement
                  </span>
                </div>

                <div className="text-xs text-neutral-200 leading-relaxed bg-[#161a22] p-3.5 rounded-xl border border-[#242b36]">
                  <MarkdownRenderer content={post.content} />
                </div>

                <div className="text-[11px] text-amber-500">{post.hashtags}</div>
              </div>

              <div className="pt-3 border-t border-[#202530] flex items-center gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  {post.comments}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  {post.shares}
                </span>
                <span className="text-neutral-500 text-[10px] ml-auto">
                  {new Date(post.postedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
