"use client";

import { useEffect, useState } from "react";
import {
  Radio,
  Flame,
  Search,
  Sparkles,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  Percent,
  RefreshCw,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Trend {
  id: string;
  title: string;
  category: string;
  summary: string;
  relevanceAdetun: number;
  relevanceAnimationHub: number;
  relevanceFoundation: number;
  timelinessScore: number;
  brandFitScore: number;
  angles: string[];
  source: string;
  sourceUrl?: string;
  discoveredAt: string;
}

export default function TrendRadarPage() {
  const router = useRouter();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchTrends = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/trends");
      const data = await res.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  const handleAnalyzeNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    try {
      setIsAnalyzing(true);
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: newTopic })
      });

      if (res.ok) {
        setNewTopic("");
        fetchTrends();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4" />
            Strategic Trend Radar
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Industry & Cultural Radar</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time trend analysis filtered through Adetunwase's brand, Animation Hub, and Foundation relevance.
          </p>
        </div>

        <button
          onClick={fetchTrends}
          className="px-4 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#262c37] text-neutral-300 text-xs font-medium flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Real-time Trend Scanner Box */}
      <form
        onSubmit={handleAnalyzeNew}
        className="p-4 rounded-2xl bg-[#13161c] border border-[#222834] flex flex-col sm:flex-row items-center gap-3 shadow-sm"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Scan custom topic or emerging headline (e.g., 'African comic book festival' or 'AI in 3D rigging')..."
            className="w-full bg-[#171b23] border border-[#252b37] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isAnalyzing || !newTopic.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
          <span>{isAnalyzing ? "Analyzing Trend Fit..." : "Analyze & Calculate Angles"}</span>
        </button>
      </form>

      {/* Trends List */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-xs">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Scanning global publications and social radar...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {trends.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-5 hover:border-[#2f3748] transition-all"
            >
              {/* Trend Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202530] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.category}
                    </span>
                    <span className="text-xs text-neutral-400">Source: {t.source}</span>
                  </div>
                  <h2 className="text-base font-semibold text-neutral-100">{t.title}</h2>
                </div>

                {/* Relevance Scores Matrix */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-center px-3 py-1.5 rounded-xl bg-[#171b23] border border-[#262c37]">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Adetunwase
                    </span>
                    <span className="text-xs font-bold text-amber-400">{t.relevanceAdetun}%</span>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-[#171b23] border border-[#262c37]">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Animation Hub
                    </span>
                    <span className="text-xs font-bold text-blue-400">
                      {t.relevanceAnimationHub}%
                    </span>
                  </div>
                  <div className="text-center px-3 py-1.5 rounded-xl bg-[#171b23] border border-[#262c37]">
                    <span className="text-[9px] uppercase font-bold text-neutral-400 block">
                      Foundation
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      {t.relevanceFoundation}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trend Summary */}
              <p className="text-xs text-neutral-300 leading-relaxed">{t.summary}</p>

              {/* 3 Actionable Perspectives */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  3 Authentic Angles Adetunwase Can Speak About (Zero Em Dashes)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {t.angles?.map((angle, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex flex-col justify-between space-y-3"
                    >
                      <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                        "{angle}"
                      </p>
                      <button
                        onClick={() => router.push("/studio")}
                        className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 pt-1 self-start transition-colors"
                      >
                        <span>Draft Post from Angle</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
