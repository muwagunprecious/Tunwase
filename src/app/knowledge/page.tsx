"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Plus,
  Trash2,
  Lock,
  Eye,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Search,
  Filter,
  AlertCircle
} from "lucide-react";

interface KnowledgeFact {
  id: string;
  fact: string;
  entity: string;
  category: string;
  source: string;
  sourceUrl?: string;
  confidence: string;
  privacy: string;
  lastVerified: string;
}

export default function KnowledgeBasePage() {
  const [facts, setFacts] = useState<KnowledgeFact[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedPrivacy, setSelectedPrivacy] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Add Fact Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFact, setNewFact] = useState("");
  const [newEntity, setNewEntity] = useState("PERSONAL");
  const [newCategory, setNewCategory] = useState("Milestone");
  const [newSource, setNewSource] = useState("");
  const [newPrivacy, setNewPrivacy] = useState("Public");
  const [newConfidence, setNewConfidence] = useState("High");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFacts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedEntity !== "ALL") params.append("entity", selectedEntity);
      if (selectedPrivacy !== "ALL") params.append("privacy", selectedPrivacy);

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      const data = await res.json();
      setFacts(data.facts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFacts();
  }, [selectedEntity, selectedPrivacy]);

  const handleAddFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fact: newFact,
          entity: newEntity,
          category: newCategory,
          source: newSource || "Executive Direct Input",
          confidence: newConfidence,
          privacy: newPrivacy
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewFact("");
        setNewSource("");
        fetchFacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFact = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFacts((prev) => prev.filter((f) => f.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFacts = facts.filter((f) =>
    searchQuery ? f.fact.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            Adetunwase Knowledge Engine
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Multi-Entity Knowledge Base</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Strict isolation between Adetunwase Personally, Animation Hub, and Foundation namespaces.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Fact</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#13161c] border border-[#222834] flex flex-wrap items-center justify-between gap-4">
        {/* Entity Tabs */}
        <div className="flex items-center gap-1 bg-[#171b23] p-1 rounded-lg border border-[#262c38] text-xs">
          {[
            { key: "ALL", label: "All Namespaces" },
            { key: "PERSONAL", label: "Personal Brand" },
            { key: "ANIMATION_HUB", label: "Animation Hub" },
            { key: "FOUNDATION", label: "Foundation" }
          ].map((e) => (
            <button
              key={e.key}
              onClick={() => setSelectedEntity(e.key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                selectedEntity === e.key
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Privacy Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 text-[11px] uppercase font-semibold">Privacy:</span>
          {["ALL", "Public", "Internal", "Private", "Content-ready"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPrivacy(p)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                selectedPrivacy === p
                  ? "bg-neutral-200 text-neutral-900"
                  : "bg-[#171b23] text-neutral-400 border border-[#252b36] hover:text-neutral-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facts..."
            className="w-full bg-[#171b23] border border-[#252b37] focus:border-amber-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none"
          />
        </div>
      </div>

      {/* Facts Grid */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-xs">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading structured knowledge facts...</span>
          </div>
        </div>
      ) : filteredFacts.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#13161c] border border-[#222834] p-8 space-y-2">
          <Database className="w-8 h-8 text-neutral-600 mx-auto" />
          <p className="text-xs text-neutral-400">No knowledge facts match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] flex flex-col justify-between space-y-4 hover:border-[#2e3646] transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {f.entity === "PERSONAL"
                        ? "Personal"
                        : f.entity === "ANIMATION_HUB"
                        ? "Animation Hub"
                        : "Foundation"}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                      {f.category}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-medium border ${
                      f.privacy === "Public"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                        : f.privacy === "Private"
                        ? "bg-rose-950/60 text-rose-400 border-rose-800/40"
                        : "bg-blue-950/60 text-blue-400 border-blue-800/40"
                    }`}
                  >
                    {f.privacy}
                  </span>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                  {f.fact}
                </p>
              </div>

              <div className="pt-3 border-t border-[#202530] flex items-center justify-between text-[11px] text-neutral-500">
                <div className="truncate flex-1 pr-2">
                  <span className="text-neutral-400">Source: {f.source}</span>
                </div>

                <button
                  onClick={() => handleDeleteFact(f.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-neutral-500 transition-all p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Fact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#14171f] border border-[#242b38] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Add Structured Fact to Knowledge Engine
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddFact} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Fact Statement
                </label>
                <textarea
                  rows={3}
                  required
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  placeholder="e.g. Animation Hub launched a new 3D character pipeline honoring Yoruba mythology."
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Entity Namespace
                  </label>
                  <select
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                  >
                    <option value="PERSONAL">Adetunwase (Personal)</option>
                    <option value="ANIMATION_HUB">Animation Hub</option>
                    <option value="FOUNDATION">Foundation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Milestone, Service, Initiative"
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="Official Studio Announcement"
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Privacy Level
                  </label>
                  <select
                    value={newPrivacy}
                    onChange={(e) => setNewPrivacy(e.target.value)}
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal (Company/Studio Only)</option>
                    <option value="Private">Private (Do Not Publish)</option>
                    <option value="Content-ready">Content-ready</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181d26] hover:bg-[#202733] border border-[#262f3e] text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newFact.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
                >
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
