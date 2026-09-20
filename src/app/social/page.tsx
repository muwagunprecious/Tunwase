"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  Sparkles,
  Layers,
  BarChart3,
  BookmarkCheck,
  Calendar,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Plus,
  Sliders,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Search,
  ExternalLink,
  BookOpen,
  Send,
  Building2,
  User,
  Lightbulb,
  Shield,
  Tag,
  ArrowRight,
  Flame,
  FileText
} from "lucide-react";
import { ALL_CONTENT_PILLARS, ALL_CAPTION_TYPES, ContentPillar, CaptionType } from "@/lib/social/types";

export default function SocialIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"bank" | "gaps" | "reference" | "brand" | "context" | "settings">("bank");
  
  // Data state
  const [bankItems, setBankItems] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [referenceWriters, setReferenceWriters] = useState<any[]>([]);
  const [voiceProfile, setVoiceProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ready_for_review");
  const [pillarFilter, setPillarFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Detail & Edit modal state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState("");
  const [editTitle, setEditTitle] = useState("");

  // Context input modal state
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [rawContextInput, setRawContextInput] = useState("");
  const [isIngestingContext, setIsIngestingContext] = useState(false);

  // Reference post manual add modal state
  const [isRefPostModalOpen, setIsRefPostModalOpen] = useState(false);
  const [refPostText, setRefPostText] = useState("");
  const [refPostTopic, setRefPostTopic] = useState("");
  const [refPostUrl, setRefPostUrl] = useState("");

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Schedule modal state
  const [schedulingItem, setSchedulingItem] = useState<any | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [bankRes, analyticsRes, writersRes, voiceRes, settingsRes] = await Promise.all([
        fetch(`/api/social/caption-bank?status=${statusFilter}&pillar=${pillarFilter}&type=${typeFilter}&q=${encodeURIComponent(searchQuery)}`),
        fetch("/api/social/analytics"),
        fetch("/api/social/reference-writers"),
        fetch("/api/social/voice-profile"),
        fetch("/api/social/settings")
      ]);

      const [bankData, analyticsData, writersData, voiceData, settingsData] = await Promise.all([
        bankRes.json(),
        analyticsRes.json(),
        writersRes.json(),
        voiceRes.json(),
        settingsRes.json()
      ]);

      setBankItems(bankData.items || []);
      setAnalytics(analyticsData || null);
      setReferenceWriters(writersData.writers || []);
      setVoiceProfile(voiceData.profile || null);
      setSettings(settingsData.settings || null);
    } catch (err) {
      console.error("Failed to load social engine data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [statusFilter, pillarFilter, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadAllData();
  };

  // Copy actions (Distinct buttons)
  const handleCopy = (item: any, type: "CAPTION" | "HASHTAGS" | "ALL") => {
    let text = "";
    if (type === "CAPTION") {
      text = item.caption;
    } else if (type === "HASHTAGS") {
      text = (item.hashtags || []).join(" ");
    } else {
      text = `${item.caption}\n\n${(item.hashtags || []).join(" ")}`;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  // Generate Daily Batch
  const handleGenerateBatch = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch("/api/social/generate-daily-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchSize: settings?.dailyCaptionsCount || 7 })
      });
      const data = await res.json();
      if (data.success) {
        await loadAllData();
      }
    } catch (err) {
      console.error("Batch generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve caption
  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/social/caption-bank/${id}/approve`, { method: "POST" });
      loadAllData();
      if (selectedItem?.id === id) {
        setSelectedItem((prev: any) => ({ ...prev, status: "approved" }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reject caption
  const submitReject = async () => {
    if (!rejectingItem) return;
    try {
      await fetch(`/api/social/caption-bank/${rejectingItem.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason })
      });
      setRejectingItem(null);
      setRejectionReason("");
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule caption
  const submitSchedule = async () => {
    if (!schedulingItem || !scheduledDate) return;
    try {
      await fetch(`/api/social/caption-bank/${schedulingItem.id}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledDate, scheduledTime })
      });
      setSchedulingItem(null);
      setScheduledDate("");
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Regenerate caption
  const handleRegenerate = async (id: string) => {
    try {
      const res = await fetch(`/api/social/caption-bank/${id}/regenerate`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        loadAllData();
        if (selectedItem?.id === id) {
          setSelectedItem(data.item);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Editor Changes (Human Editor Learning Loop)
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    try {
      await fetch("/api/social/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captionBankId: selectedItem.id,
          originalAiCaption: selectedItem.caption,
          editedCaption: editCaption,
          finalCaption: editCaption
        })
      });

      // Update local item
      setSelectedItem((prev: any) => ({ ...prev, caption: editCaption, title: editTitle, status: "approved" }));
      setIsEditing(false);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Raw Context
  const handleSubmitContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawContextInput.trim()) return;
    try {
      setIsIngestingContext(true);
      await fetch("/api/social/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawInput: rawContextInput })
      });
      setRawContextInput("");
      setIsContextModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsIngestingContext(false);
    }
  };

  // Ingest Reference Post
  const handleAddRefPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refPostText.trim() || !referenceWriters[0]) return;
    try {
      await fetch("/api/social/reference-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writerId: referenceWriters[0].id,
          postText: refPostText,
          topic: refPostTopic || "Social Impact Vignette",
          postUrl: refPostUrl || undefined,
          sourceType: "MANUAL_INPUT"
        })
      });
      setRefPostText("");
      setRefPostTopic("");
      setRefPostUrl("");
      setIsRefPostModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Style Analysis
  const handleTriggerAnalysis = async () => {
    if (!referenceWriters[0]) return;
    try {
      await fetch("/api/social/analyze-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ writerId: referenceWriters[0].id })
      });
      loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeBacklog = analytics?.backlog?.activeCount || 0;
  const minBacklog = analytics?.backlog?.targetMinimum || 30;
  const isBacklogHealthy = activeBacklog >= minBacklog;

  return (
    <div className="flex-1 p-3 sm:p-6 md:p-10 max-w-7xl mx-auto w-full space-y-5 sm:space-y-8 bg-slate-50 min-h-screen text-slate-900">
      {/* Header & Backlog Health */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 border-b border-slate-200 pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>LinkedIn Intelligence & CMS</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span>Adetunwase LinkedIn Chief of Staff</span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border w-fit ${
                isBacklogHealthy
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}
            >
              Backlog: {activeBacklog} / {minBacklog} minimum
            </span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Autonomous daily caption bank, reference storytelling analysis, strict brand separation, and human editor learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:flex sm:items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsContextModalOpen(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-500" />
            <span>Add Real Context</span>
          </button>

          <button
            onClick={handleGenerateBatch}
            disabled={isGenerating}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Generating 7 Captions..." : "Generate Daily Batch"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Mobile Horizontally Scrollable with Bleed */}
      <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-px scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { id: "bank", label: "Caption Bank", icon: Layers, badge: bankItems.length },
          { id: "gaps", label: "Pillars & Content Gaps", icon: BarChart3 },
          { id: "reference", label: "Reference Writers & Style Lab", icon: BookOpen },
          { id: "brand", label: "Brand vs SlumArt Knowledge", icon: Building2 },
          { id: "settings", label: "Engine Settings", icon: Sliders }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-medium border-b-2 transition-all shrink-0 whitespace-nowrap ${
                isActive
                  ? "border-amber-600 text-amber-700 font-semibold bg-amber-50/60"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CAPTION BANK */}
      {activeTab === "bank" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full lg:w-auto -mx-1 px-1 sm:flex-wrap sm:overflow-visible">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5 mr-1 shrink-0">
                <Filter className="w-3 h-3 text-amber-500" />
                Status:
              </span>
              {[
                { id: "ready_for_review", label: "Review" },
                { id: "approved", label: "Approved" },
                { id: "scheduled", label: "Scheduled" },
                { id: "published", label: "Published" },
                { id: "rejected", label: "Rejected" },
                { id: "ALL", label: "All" }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all shrink-0 whitespace-nowrap ${
                    statusFilter === s.id
                      ? "bg-amber-500 text-white font-semibold shadow-xs"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Pillar Filter & Search */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 rounded-lg px-3 py-2 sm:py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-xs"
              >
                <option value="ALL">All 20 Pillars</option>
                {ALL_CONTENT_PILLARS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 sm:top-2" />
                <input
                  type="text"
                  placeholder="Search captions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 sm:py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto justify-center px-3.5 py-2 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Caption Cards Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>Loading caption bank...</span>
            </div>
          ) : bankItems.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300 space-y-3 shadow-xs">
              <Layers className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="text-sm font-semibold text-slate-800">No captions found in this view</div>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Generate your first daily batch or add raw field context to kickstart the LinkedIn engine.
              </p>
              <button
                onClick={handleGenerateBatch}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 transition-all shadow-md"
              >
                Generate 7 Captions Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {bankItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Badges & Meta */}
                    <div className="flex items-center justify-between gap-2 flex-wrap text-[11px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-medium">
                          {item.contentPillar}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {item.contentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.priority === "HIGH" && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 border border-rose-300 text-rose-700 text-[10px] font-bold">
                            HIGH
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                            item.status === "approved"
                              ? "bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold"
                              : item.status === "scheduled"
                              ? "bg-sky-50 border border-sky-200 text-sky-700 font-semibold"
                              : item.status === "rejected"
                              ? "bg-slate-100 text-slate-500 border border-slate-200 font-semibold"
                              : "bg-amber-50 border border-amber-200 text-amber-800 font-semibold"
                          }`}
                        >
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug break-words">{item.title}</h3>

                    {/* Caption Preview */}
                    <p className="text-xs text-slate-700 leading-relaxed line-clamp-5 whitespace-pre-line font-normal break-words">
                      {item.caption}
                    </p>

                    {/* Hashtags Preview */}
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.hashtags.map((h: string, idx: number) => (
                          <span key={idx} className="text-[11px] text-amber-700 font-mono font-medium">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Distinct Mobile-Friendly Copy Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
                      <button
                        onClick={() => handleCopy(item, "CAPTION")}
                        className="w-full sm:w-auto justify-center px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs"
                        title="Copy only the caption text"
                      >
                        {copiedId === item.id && copiedType === "CAPTION" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="text-emerald-600 truncate">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">Caption</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(item, "HASHTAGS")}
                        className="w-full sm:w-auto justify-center px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs"
                        title="Copy only hashtags"
                      >
                        {copiedId === item.id && copiedType === "HASHTAGS" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="text-emerald-600 truncate">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">Tags</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(item, "ALL")}
                        className="w-full sm:w-auto justify-center px-2 sm:px-2.5 py-2 sm:py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 sm:gap-1.5 transition-all shadow-xs"
                        title="Copy caption and hashtags together"
                      >
                        {copiedId === item.id && copiedType === "ALL" ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="text-emerald-600 truncate">Copied!</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate">Both</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Operational Management Actions */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setEditTitle(item.title);
                            setEditCaption(item.caption);
                            setIsEditing(false);
                          }}
                          className="text-slate-600 hover:text-amber-600 transition-colors flex items-center gap-1.5 font-medium py-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                          <span>Open / Edit</span>
                        </button>

                        <button
                          onClick={() => handleRegenerate(item.id)}
                          className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium py-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">Regenerate</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        {item.status !== "approved" && (
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-semibold text-xs transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSchedulingItem(item);
                            setScheduledDate(new Date().toISOString().split("T")[0]);
                          }}
                          className="p-1.5 sm:p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Schedule for date"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>

                        {item.status !== "rejected" && (
                          <button
                            onClick={() => setRejectingItem(item)}
                            className="p-1.5 sm:p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Reject caption"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PILLARS & GAPS */}
      {activeTab === "gaps" && (
        <div className="space-y-5 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              Content Gaps & Overuse Intelligence
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              The engine balances 20 distinct storytelling pillars to ensure Adetunwase's LinkedIn presence is multifaceted.
              Overused topics are deprioritized while underrepresented pillars are given priority in the next daily batch.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">
                  Pillars Due for More Stories (Underrepresented)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analytics?.contentGaps?.underrepresentedPillars?.map((p: string) => (
                    <span key={p} className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 text-xs font-medium shadow-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider block">
                  Frequently Covered Pillars (Overrepresented)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {analytics?.contentGaps?.overusedPillars?.map((p: string) => (
                    <span key={p} className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 text-xs shadow-xs">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* All 20 Content Pillars Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">The 20 Brand Pillars Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {ALL_CONTENT_PILLARS.map((p) => {
                const count = analytics?.contentGaps?.pillarCounts?.[p] || 0;
                return (
                  <div key={p} className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
                    <span className="text-xs font-semibold text-slate-800 block truncate">{p}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{count} captions</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFERENCE WRITERS & STYLE LAB */}
      {activeTab === "reference" && (
        <div className="space-y-5 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Reference Writers & Generalized Storytelling Analysis
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Studying high-level structural storytelling principles without copying language or voice.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsRefPostModalOpen(true)}
                  className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium flex items-center gap-2 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Add Public Post</span>
                </button>

                <button
                  onClick={handleTriggerAnalysis}
                  className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-analyze Structure</span>
                </button>
              </div>
            </div>

            {/* Reference Writer Card */}
            {referenceWriters.map((writer) => (
              <div key={writer.id} className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{writer.name}</h3>
                    <a
                      href={writer.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <span>{writer.linkedinUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{writer.bio}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 w-fit shadow-xs">
                    {writer._count?.posts || 0} posts ingested
                  </span>
                </div>

                {/* Generalized Style Extraction Display */}
                {writer.styleProfile && (
                  <div className="p-3.5 sm:p-4 rounded-lg bg-white border border-slate-200 space-y-3 shadow-xs">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                      Extracted Generalized Structural Principles (Zero Phrasing Imitation)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Tones</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.tone?.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Hook Patterns</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.hookPatterns?.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Paragraph Cadence</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.paragraphStyle} (1-2 sentences)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Emotional Arc</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.emotionalProgression}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Closing Style</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.closingStyle}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-semibold">Vocabulary</span>
                        <span className="text-slate-800 font-medium">{writer.styleProfile.vocabularyComplexity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Adetunwase Voice Profile Rules & Learned Loop */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Adetunwase Writing Profile & Human Editor Learning Loop
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rules dynamically derived from real edits made by the social media manager.
              When editors tighten phrasing, remove buzzwords, or add reflection, future generations adapt automatically.
            </p>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                Active Writing Rules:
              </span>
              <div className="space-y-1.5">
                {(voiceProfile?.learnedRules || []).map((rule: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-800 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRAND VS SLUMART KNOWLEDGE */}
      {activeTab === "brand" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* Adetunwase Personal Brand */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
              <User className="w-4 h-4" />
              Personal Brand Knowledge
            </div>
            <h3 className="text-base font-bold text-slate-900">Adetunwase Akanni Adenle</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Artist, art educator, animator, and multiple Guinness World Record holder.
              Focuses on creative excellence, youth mentorship, hands-on hard work, and pioneering African animation.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Verified Records</span>
              <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
                <li>Largest Painting by Numbers (2010): 63.5m x 49.3m, 3,130 sq m</li>
                <li>Most Children Reading Aloud with an Adult (2011): 4,222 children in Oregun, Lagos</li>
                <li>Highest Number of Children Washing Hands Simultaneously (Lifebuoy soap)</li>
                <li>World's Largest Special Stamp (2016): 2.448 sq m for Lagos at 50</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <strong>Personal Entity Rule:</strong> Personal posts focus on craft, leadership lessons, creative philosophy, and mentorship.
              They do not automatically mention SlumArt Foundation unless directly relevant.
            </div>
          </div>

          {/* SlumArt Foundation Knowledge */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              SlumArt Foundation Knowledge
            </div>
            <h3 className="text-base font-bold text-slate-900">Slum Art Foundation (Ijora Badia)</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Empowering children in slum communities through creative arts, animation, design, and environmental sustainability.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Key Initiatives</span>
              <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
                <li>Pet Bottle School & Art Hub in Ijora Badia constructed from recycled PET bottles</li>
                <li>Feature Earth AI Creators Programme in 5,760 schools across Nigeria</li>
                <li>Free visual arts, digital illustration, and animation classes for youth</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>Foundation Entity Rule:</strong> Foundation posts center on the children, educational impact, and community transformation.
              They are never written as Adetunwase's personal trophies.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ENGINE SETTINGS */}
      {activeTab === "settings" && (
        <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6 max-w-2xl">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500" />
            Social Engine Automation Settings
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Daily Captions to Generate</label>
              <input
                type="number"
                value={settings?.dailyCaptionsCount || 7}
                onChange={(e) => setSettings({ ...settings, dailyCaptionsCount: parseInt(e.target.value, 10) })}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 w-full shadow-xs focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-500 text-[11px] mt-1 block">Default: 7 captions per day.</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Minimum Backlog Target</label>
              <input
                type="number"
                value={settings?.minBacklogCount || 30}
                onChange={(e) => setSettings({ ...settings, minBacklogCount: parseInt(e.target.value, 10) })}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 w-full shadow-xs focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-500 text-[11px] mt-1 block">
                The engine maintains at least 30 ready/approved captions in reserve.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Generation Time</label>
                <input
                  type="text"
                  value={settings?.generationTime || "06:00"}
                  onChange={(e) => setSettings({ ...settings, generationTime: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 w-full font-mono shadow-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Timezone</label>
                <input
                  type="text"
                  value={settings?.timezone || "Africa/Lagos"}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 w-full font-mono shadow-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              onClick={async () => {
                await fetch("/api/social/settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(settings)
                });
                alert("Settings saved successfully.");
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-md transition-all text-xs"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* DETAIL / EDIT MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="pr-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  {selectedItem.contentPillar} • {selectedItem.contentType}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">{selectedItem.title}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-800 bg-white">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:bg-white font-medium focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      Caption (Human Edits will update the learning loop)
                    </label>
                    <textarea
                      rows={10}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 font-normal leading-relaxed focus:bg-white whitespace-pre-line focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-800 whitespace-pre-line text-xs font-normal">
                    {selectedItem.caption}
                  </div>

                  {selectedItem.hashtags && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600">Hashtags:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.hashtags.map((h: string, i: number) => (
                          <span key={i} className="text-amber-700 font-mono text-[11px] font-medium">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedItem.context && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                      <span className="text-slate-600 font-semibold uppercase block">Source Context</span>
                      <p className="text-slate-700">{selectedItem.context.topic}: {selectedItem.context.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedItem, "CAPTION")}
                  className="justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Caption</span>
                </button>
                <button
                  onClick={() => handleCopy(selectedItem, "ALL")}
                  className="justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Both</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-2 sm:py-1.5 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
                    >
                      Save & Learn
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 sm:py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Edit</span>
                    </button>
                    {selectedItem.status !== "approved" && (
                      <button
                        onClick={() => handleApprove(selectedItem.id)}
                        className="px-4 py-2 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs"
                      >
                        Approve
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEXT INPUT MODAL */}
      {isContextModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={handleSubmitContext} className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add Real Experience or Field Activity
              </h3>
              <button
                type="button"
                onClick={() => setIsContextModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter quick notes about where you went, what happened, who you met, or lessons learned.
              The engine will structure it into verified context angles.
            </p>

            <textarea
              rows={5}
              placeholder="e.g. 'I visited a school in Ijora Badia today. 30 kids gathered around one tablet learning to sketch animated frames. A 9-year-old girl named Amina showed me her moving character made from recycled plastic.'"
              value={rawContextInput}
              onChange={(e) => setRawContextInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsContextModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isIngestingContext}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 transition-all"
              >
                {isIngestingContext ? "Structuring Context..." : "Save Context"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REFERENCE POST MANUAL ADD MODAL */}
      {isRefPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={handleAddRefPost} className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Add Reference Post for Tunde Onakoya
              </h3>
              <button
                type="button"
                onClick={() => setIsRefPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Paste the public text of a compelling LinkedIn post to extract high-level storytelling architecture.
              Zero sentences or phrases will be cloned.
            </p>

            <input
              type="text"
              placeholder="Topic (e.g. Hope in the Slums, Times Square Record)"
              value={refPostTopic}
              onChange={(e) => setRefPostTopic(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />

            <textarea
              rows={6}
              placeholder="Paste public post text here..."
              value={refPostText}
              onChange={(e) => setRefPostText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRefPostModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-all"
              >
                Save & Analyze
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {schedulingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              Schedule LinkedIn Post
            </h3>
            <p className="text-xs text-slate-600">
              Set calendar target. (Note: Workflow is copy-and-post; no automated LinkedIn credentials required).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Target Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 shadow-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Time (Africa/Lagos)</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono shadow-xs focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button onClick={() => setSchedulingItem(null)} className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-medium">
                Cancel
              </button>
              <button onClick={submitSchedule} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs">
                Set Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-4 sm:p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              Reject Caption
            </h3>
            <textarea
              rows={3}
              placeholder="Reason for rejection (e.g. angle is too corporate, topic overused)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setRejectingItem(null)} className="px-3.5 py-2 text-slate-600 hover:text-slate-900 font-medium">
                Cancel
              </button>
              <button onClick={submitReject} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
