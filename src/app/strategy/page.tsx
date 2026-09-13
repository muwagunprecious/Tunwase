"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Scale,
  Calendar,
  Layers,
  TrendingUp,
  Brain,
  AlertCircle
} from "lucide-react";

export default function StrategyPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decision Room State
  const [topic, setTopic] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [decisionEntity, setDecisionEntity] = useState("PERSONAL");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // Roadmap State
  const [roadmapEntity, setRoadmapEntity] = useState("ANIMATION_HUB");
  const [roadmapObjective, setRoadmapObjective] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const fetchStrategyData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/strategy");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategyData();
  }, []);

  const handleEvaluateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !optionA.trim() || !optionB.trim()) return;

    try {
      setIsEvaluating(true);
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_decision",
          topic,
          optionA,
          optionB,
          entity: decisionEntity
        })
      });
      const json = await res.json();
      setEvaluationResult(json.decision);
      fetchStrategyData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleGenerateRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGeneratingRoadmap(true);
      const res = await fetch("/api/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_roadmap",
          entity: roadmapEntity,
          roadmapObjective
        })
      });
      if (res.ok) {
        setRoadmapObjective("");
        fetchStrategyData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 text-xs">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing Strategic Intelligence...</span>
        </div>
      </div>
    );
  }

  const { decisions = [], roadmaps = [] } = data || {};

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-10">
      {/* Header */}
      <div className="border-b border-[#1e222a] pb-6">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          Strategic Advisory & Institutional Memory
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">Strategy & Decision Room</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Rigorously compare complex strategic tradeoffs, track organizational memory, and generate 12-month roadmaps.
        </p>
      </div>

      {/* SECTION 1: THE DECISION ROOM */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-500" />
            Decision Room: Evaluate Strategic Tradeoffs
          </h2>
          <span className="text-xs text-neutral-400">Multi-criteria comparative analysis</span>
        </div>

        <form
          onSubmit={handleEvaluateDecision}
          className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4 shadow-sm"
        >
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
              Decision Dilemma / Topic
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. In-House Animation Render Farm vs Cloud Rendering Service"
              className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 uppercase mb-1">
                Option A
              </label>
              <textarea
                rows={2}
                required
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                placeholder="e.g. Invest ₦6.5M in four dedicated local GPU render workstations."
                className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-blue-400 uppercase mb-1">
                Option B
              </label>
              <textarea
                rows={2}
                required
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                placeholder="e.g. Use on-demand cloud rendering (AWS Deadline) billed per render minute."
                className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 text-[10px] uppercase font-bold">Scope:</span>
              {["PERSONAL", "ANIMATION_HUB", "FOUNDATION"].map((ent) => (
                <button
                  type="button"
                  key={ent}
                  onClick={() => setDecisionEntity(ent)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                    decisionEntity === ent
                      ? "bg-[#252c38] text-amber-400 border border-amber-500/40"
                      : "bg-[#171b23] text-neutral-400 border border-[#252b36]"
                  }`}
                >
                  {ent === "ANIMATION_HUB" ? "Animation Hub" : ent === "FOUNDATION" ? "Foundation" : "Personal"}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={isEvaluating || !topic.trim()}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Brain className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
              <span>{isEvaluating ? "Evaluating Tradeoffs..." : "Evaluate & Recommend"}</span>
            </button>
          </div>
        </form>

        {/* Live Evaluation Result */}
        {evaluationResult && (
          <div className="p-6 rounded-2xl bg-[#141820] border border-amber-500/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Chief of Staff Strategic Verdict
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Recommended
              </span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-100">{evaluationResult.recommendation}</h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-medium bg-[#171c26] p-3.5 rounded-xl border border-[#252f40]">
                {evaluationResult.rationale}
              </p>
            </div>

            {evaluationResult.criteria && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-2">
                <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36]">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Cost Tradeoff
                  </span>
                  <p className="text-neutral-300 leading-snug">{evaluationResult.criteria.cost}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36]">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Risk & Dependability
                  </span>
                  <p className="text-neutral-300 leading-snug">{evaluationResult.criteria.risk}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36]">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1">
                    Strategic Alignment
                  </span>
                  <p className="text-neutral-300 leading-snug">
                    {evaluationResult.criteria.strategicAlignment}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: 12-MONTH STRATEGIC ROADMAPS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            12-Month Strategic Roadmaps & Milestones
          </h2>
        </div>

        <div className="space-y-6">
          {roadmaps?.map((roadmap: any) => (
            <div
              key={roadmap.id}
              className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202530] pb-4">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {roadmap.entity}
                  </span>
                  <h3 className="text-base font-bold text-neutral-100 mt-1">{roadmap.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{roadmap.objective}</p>
                </div>
              </div>

              {/* 4 Phases */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {roadmap.roadmap12Month?.map((phase: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] space-y-1.5"
                  >
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">
                      {phase.phase}
                    </span>
                    <p className="text-xs text-neutral-300 leading-relaxed">{phase.focus}</p>
                  </div>
                ))}
              </div>

              {/* Next 7 Days Action List */}
              {roadmap.next7Days && roadmap.next7Days.length > 0 && (
                <div className="p-4 rounded-xl bg-[#151921] border border-[#232936] space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                    Immediate 7-Day Velocity Plan
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {roadmap.next7Days.map((act: string, idx: number) => (
                      <div key={idx} className="p-2.5 rounded bg-[#181d26] text-neutral-200">
                        ⚡ {act}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
