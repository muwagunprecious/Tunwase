"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
  Mail,
  Share2,
  RefreshCw
} from "lucide-react";

export default function ActionCenterPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"NEEDS_APPROVAL" | "AUTO_COMPLETED" | "WAITING">("NEEDS_APPROVAL");
  const [autonomyLevel, setAutonomyLevel] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/actions");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleDecision = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision })
      });
      if (res.ok) {
        fetchActions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 text-xs">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Action Center...</span>
        </div>
      </div>
    );
  }

  const { needsApproval = [], autoCompleted = [], waiting = [] } = data || {};

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            AI Execution & Autonomy Engine
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">AI Action Center</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Review proposed actions requiring authorization and monitor autonomous workflow execution.
          </p>
        </div>

        <button
          onClick={fetchActions}
          className="px-4 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#262c37] text-neutral-300 text-xs font-medium flex items-center gap-2 transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Autonomy Level Selector Card */}
      <div className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Chief of Staff Autonomy Mode
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
            Level {autonomyLevel} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          {[
            { level: 1, title: "Level 1: Suggest Only", desc: "AI advises but executes zero actions automatically." },
            { level: 2, title: "Level 2: Prepare & Ask (Default)", desc: "AI prepares drafts and requests 1-click confirmation." },
            { level: 3, title: "Level 3: Low-Risk Auto", desc: "AI automatically tracks internal tasks, briefs, and reminders." },
            { level: 4, title: "Level 4: Autonomous Workflows", desc: "AI executes approved recurring operational pipelines." }
          ].map((item) => (
            <button
              key={item.level}
              onClick={() => setAutonomyLevel(item.level)}
              className={`p-3 rounded-xl border text-left transition-all ${
                autonomyLevel === item.level
                  ? "bg-[#1f2633] border-amber-500/50 text-neutral-100 shadow-sm"
                  : "bg-[#161a22] border-[#252b36] text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <span className="font-bold block text-xs mb-1">{item.title}</span>
              <span className="text-[11px] leading-snug block opacity-80">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Tabs */}
      <div className="flex items-center gap-1 bg-[#13161c] p-1.5 rounded-xl border border-[#222834] text-xs">
        <button
          onClick={() => setActiveTab("NEEDS_APPROVAL")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === "NEEDS_APPROVAL"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span>Needs Approval</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-bold">
            {needsApproval?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("AUTO_COMPLETED")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === "AUTO_COMPLETED"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span>Auto-Completed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-bold">
            {autoCompleted?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("WAITING")}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === "WAITING"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <span>Waiting on Others</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px] font-bold">
            {waiting?.length || 0}
          </span>
        </button>
      </div>

      {/* Action Items List */}
      <div className="space-y-3">
        {activeTab === "NEEDS_APPROVAL" && (
          needsApproval?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#13161c] border border-[#222834] text-neutral-500 text-xs">
              No pending actions require authorization. You're completely clear.
            </div>
          ) : (
            needsApproval?.map((act: any) => (
              <div
                key={act.id}
                className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] hover:border-[#2e3646] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {act.type}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        act.riskLevel === "HIGH" ? "text-rose-400" : "text-neutral-400"
                      }`}
                    >
                      {act.riskLevel} Risk
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-100">{act.title}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">{act.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleDecision(act.id, "REJECT")}
                    className="px-3 py-1.5 rounded-xl bg-[#1a1f29] hover:bg-[#252c3b] border border-[#293242] text-neutral-400 hover:text-neutral-200 text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>

                  <button
                    onClick={() => handleDecision(act.id, "APPROVE")}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorize & Execute</span>
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === "AUTO_COMPLETED" && (
          autoCompleted?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#13161c] border border-[#222834] text-neutral-500 text-xs">
              No autonomous actions logged yet.
            </div>
          ) : (
            autoCompleted.map((act: any) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-[#13161c] border border-[#222834] flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-neutral-200 block">{act.title}</span>
                    <span className="text-neutral-400 text-[11px] block">{act.description}</span>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))
          )
        )}

        {activeTab === "WAITING" && (
          waiting?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#13161c] border border-[#222834] text-neutral-500 text-xs">
              No outstanding external deliverables being tracked.
            </div>
          ) : (
            waiting.map((act: any) => (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-[#13161c] border border-[#222834] flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-semibold text-neutral-200 block">{act.title}</span>
                    <span className="text-neutral-400 text-[11px] block">
                      Waiting on: <strong className="text-amber-400">{act.waitingOn}</strong> • {act.description}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
