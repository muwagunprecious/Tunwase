"use client";

import { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Cpu,
  Key,
  Bell,
  Lock,
  Database,
  CheckCircle2,
  Save,
  Radio
} from "lucide-react";

export default function SettingsPage() {
  const [proactiveBriefings, setProactiveBriefings] = useState(true);
  const [fatigueAlerts, setFatigueAlerts] = useState(true);
  const [trendMonitoring, setTrendMonitoring] = useState(true);
  const [strictZeroEmDashes, setStrictZeroEmDashes] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-[#1e222a] pb-6">
        <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          System Settings & Guardrails
        </div>
        <h1 className="text-2xl font-bold text-neutral-100">Executive Engine Settings</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage AI models, privacy boundaries, autonomous intelligence, and voice protection rules.
        </p>
      </div>

      {/* AI Intelligence Provider Box */}
      <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
        <div className="flex items-center justify-between border-b border-[#202530] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-200">LLM Provider & Orchestration</h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-medium">
            Connected
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                Primary Model
              </span>
              <span className="text-neutral-200 font-semibold text-xs">
                Groq Llama-3.3-70b-versatile (Ultra-Fast Inference)
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              High Reasoning
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-400 text-[10px] uppercase font-bold block">
                Groq API Key
              </span>
              <span className="text-neutral-300 font-mono text-xs">
                Configured through GROQ_API_KEY (hidden)
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Strict Voice & Policy Guardrails */}
      <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
        <div className="flex items-center justify-between border-b border-[#202530] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-200">Strict Voice & Style Rules</h2>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Strict Zero Em-Dash Enforcement
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Automatically rejects or converts all em dashes (—) to commas, colons, or clean sentence breaks.
              </span>
            </div>
            <input
              type="checkbox"
              checked={strictZeroEmDashes}
              onChange={(e) => setStrictZeroEmDashes(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Anti-AI Corporate Cliche Eliminator
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Strips robotic phrases like "delve into", "in today's rapidly evolving landscape", and "beacon of hope".
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
              Always Active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Ethical Public B2B Contact Verification
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Restricts research to verified public corporate websites and directories. Never bypasses logins or harvests personal private phone numbers.
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-semibold">
              Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Proactive Intelligence Toggles */}
      <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
        <div className="flex items-center justify-between border-b border-[#202530] pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-neutral-200">
              Proactive Assistant Intelligence
            </h2>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Automated Daily Morning Briefing
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Pre-generates 3 key news, 2 trends, and ready-to-post drafts for review every morning at 7:00 AM.
              </span>
            </div>
            <input
              type="checkbox"
              checked={proactiveBriefings}
              onChange={(e) => setProactiveBriefings(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Content Fatigue Warning System
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Warns when Adetunwase has posted too frequently about one entity or topic in recent days.
              </span>
            </div>
            <input
              type="checkbox"
              checked={fatigueAlerts}
              onChange={(e) => setFatigueAlerts(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-[#161a22] border border-[#242b36] flex items-center justify-between">
            <div>
              <span className="text-neutral-200 font-semibold block">
                Continuous Cultural & Tech Trend Radar
              </span>
              <span className="text-neutral-400 text-[11px] block mt-0.5">
                Evaluates African animation and creative tech developments against Adetunwase's brand fit.
              </span>
            </div>
            <input
              type="checkbox"
              checked={trendMonitoring}
              onChange={(e) => setTrendMonitoring(e.target.checked)}
              className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? "Settings Saved" : "Save Preferences"}</span>
        </button>
      </div>
    </div>
  );
}
