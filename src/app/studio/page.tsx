"use client";

import { useEffect, useState } from "react";
import {
  PenTool,
  Sparkles,
  Copy,
  Check,
  Filter,
  Plus,
  Trash2,
  Calendar,
  Send,
  Wand2,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Building2,
  Users,
  UserCheck
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Draft {
  id: string;
  platform: string;
  entity: string;
  topic: string;
  hook?: string;
  content: string;
  visualSuggestion?: string;
  cta?: string;
  hashtags?: string;
  status: string;
  createdAt: string;
}

export default function ContentStudioPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Generation Modal/Form state
  const [showGenModal, setShowGenModal] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genPlatform, setGenPlatform] = useState("LINKEDIN");
  const [genEntity, setGenEntity] = useState("PERSONAL");
  const [genContext, setGenContext] = useState("");

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedPlatform !== "ALL") params.append("platform", selectedPlatform);
      if (selectedStatus !== "ALL") params.append("status", selectedStatus);
      if (selectedEntity !== "ALL") params.append("entity", selectedEntity);

      const res = await fetch(`/api/content?${params.toString()}`);
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [selectedPlatform, selectedStatus, selectedEntity]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genTopic.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic: genTopic,
          platform: genPlatform,
          entity: genEntity,
          context: genContext
        })
      });

      if (res.ok) {
        setShowGenModal(false);
        setGenTopic("");
        setGenContext("");
        fetchDrafts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePolish = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) {
        fetchDrafts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchDrafts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyDraft = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4" />
            Executive Content Studio
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Content Pipeline</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Multi-platform generation tailored for Adetunwase's authentic voice. Strictly no em dashes.
          </p>
        </div>

        <button
          onClick={() => setShowGenModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Post</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#13161c] border border-[#222834] flex flex-wrap items-center justify-between gap-4">
        {/* Platform Tabs */}
        <div className="flex items-center gap-1 bg-[#171b22] p-1 rounded-lg border border-[#262c38] text-xs">
          {["ALL", "LINKEDIN", "X", "INSTAGRAM", "FACEBOOK"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlatform(p)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedPlatform === p
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Entity Tabs */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 text-[11px] uppercase font-semibold">Entity:</span>
          {["ALL", "PERSONAL", "ANIMATION_HUB", "FOUNDATION"].map((e) => (
            <button
              key={e}
              onClick={() => setSelectedEntity(e)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedEntity === e
                  ? "bg-[#252c38] text-amber-400 border border-amber-500/40"
                  : "bg-[#161a22] text-neutral-400 border border-[#242b36] hover:text-neutral-200"
              }`}
            >
              {e === "PERSONAL" ? "Personal" : e === "ANIMATION_HUB" ? "Animation Hub" : e === "FOUNDATION" ? "Foundation" : "All"}
            </button>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-500 text-[11px] uppercase font-semibold">Status:</span>
          {["ALL", "Draft", "Approved", "Scheduled", "Published"].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedStatus === s
                  ? "bg-neutral-200 text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Drafts Grid */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-xs">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading content pipeline...</span>
          </div>
        </div>
      ) : drafts.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#13161c] border border-[#222834] p-8 space-y-3">
          <PenTool className="w-8 h-8 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-300">No content drafts found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Click "Generate New Post" or ask your assistant in Chat to create a high-impact thought piece.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] flex flex-col justify-between space-y-4 hover:border-[#2f3747] transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {d.platform}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-[#1a202a] text-amber-400 border border-[#27303e]">
                      {d.entity === "PERSONAL"
                        ? "Personal"
                        : d.entity === "ANIMATION_HUB"
                        ? "Animation Hub"
                        : "Foundation"}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                      d.status === "Approved"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                        : d.status === "Published"
                        ? "bg-blue-950/60 text-blue-400 border-blue-800/40"
                        : "bg-neutral-800/60 text-neutral-400 border-neutral-700/40"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-neutral-200">{d.topic}</h3>

                <div className="text-xs text-neutral-300 leading-relaxed bg-[#161a22] p-3.5 rounded-xl border border-[#242b36]">
                  <MarkdownRenderer content={d.content} />
                </div>

                {d.visualSuggestion && (
                  <div className="p-2.5 rounded-lg bg-[#151921] border border-[#232936] text-[11px] text-neutral-400">
                    <strong className="text-neutral-300">Visual Concept: </strong>
                    {d.visualSuggestion}
                  </div>
                )}

                {d.hashtags && (
                  <div className="text-[11px] text-amber-500 font-medium">{d.hashtags}</div>
                )}
              </div>

              {/* Polish & Action Buttons */}
              <div className="space-y-3 pt-3 border-t border-[#222834]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase mr-1">
                    Polish:
                  </span>
                  <button
                    onClick={() => handlePolish(d.id, "make-human")}
                    className="text-[10px] px-2 py-1 rounded bg-[#181d26] hover:bg-[#222936] border border-[#272f3e] text-neutral-300 transition-colors flex items-center gap-1"
                  >
                    <Wand2 className="w-2.5 h-2.5 text-amber-400" />
                    Make More Human
                  </button>
                  <button
                    onClick={() => handlePolish(d.id, "remove-em-dashes")}
                    className="text-[10px] px-2 py-1 rounded bg-[#181d26] hover:bg-[#222936] border border-[#272f3e] text-neutral-300 transition-colors flex items-center gap-1"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                    Zero Em Dashes
                  </button>
                  <button
                    onClick={() => handlePolish(d.id, "shorten")}
                    className="text-[10px] px-2 py-1 rounded bg-[#181d26] hover:bg-[#222936] border border-[#272f3e] text-neutral-300 transition-colors"
                  >
                    Shorten
                  </button>
                  <button
                    onClick={() => handlePolish(d.id, "personalize")}
                    className="text-[10px] px-2 py-1 rounded bg-[#181d26] hover:bg-[#222936] border border-[#272f3e] text-neutral-300 transition-colors"
                  >
                    Add Story
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(d.id, "Approved")}
                      className="px-2.5 py-1 rounded-md bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-[11px] font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(d.id, "Published")}
                      className="px-2.5 py-1 rounded-md bg-blue-900/40 hover:bg-blue-900/60 border border-blue-800/50 text-blue-300 text-[11px] font-medium transition-colors"
                    >
                      Mark Published
                    </button>
                  </div>

                  <button
                    onClick={() => copyDraft(d.id, d.content)}
                    className="px-3 py-1.5 rounded-lg bg-[#1a1f29] hover:bg-[#242b38] border border-[#293242] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === d.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === d.id ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#14171f] border border-[#242b38] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Autonomous Content Generator
              </h3>
              <button
                onClick={() => setShowGenModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Topic or Core Message
                </label>
                <input
                  type="text"
                  required
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Training 100 new animators in Lagos or breaking world records"
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Platform
                  </label>
                  <select
                    value={genPlatform}
                    onChange={(e) => setGenPlatform(e.target.value)}
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                  >
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="X">X (Twitter)</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Entity Namespace
                  </label>
                  <select
                    value={genEntity}
                    onChange={(e) => setGenEntity(e.target.value)}
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                  >
                    <option value="PERSONAL">Adetunwase (Personal)</option>
                    <option value="ANIMATION_HUB">Animation Hub</option>
                    <option value="FOUNDATION">Foundation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Additional Personal Context (Optional)
                </label>
                <textarea
                  rows={3}
                  value={genContext}
                  onChange={(e) => setGenContext(e.target.value)}
                  placeholder="e.g. Had a meeting today with a streaming executive; mention our focus on original African folklore IP."
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181d26] hover:bg-[#202733] border border-[#262f3e] text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !genTopic.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>{isGenerating ? "Writing Post..." : "Generate Draft"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
