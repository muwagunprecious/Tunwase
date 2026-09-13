"use client";

import { useEffect, useState } from "react";
import {
  Search,
  UserCheck,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Globe,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Briefcase,
  AlertTriangle,
  Copy,
  Check,
  BookOpen
} from "lucide-react";

export default function ResearchPage() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [targetName, setTargetName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [targetType, setTargetType] = useState("PERSON");
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<"dossiers" | "contacts">("dossiers");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchResearchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/research");
      const data = await res.json();
      setDossiers(data.dossiers || []);
      setContacts(data.contacts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchData();
  }, []);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetName, companyName, targetType })
      });

      if (res.ok) {
        setTargetName("");
        setCompanyName("");
        fetchResearchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(key);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Search className="w-4 h-4" />
            Executive & Contact Intelligence
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">
            Professional Web & Contact Research
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Legitimate business research, public leadership directories, and meeting prep. Zero scraping of private personal data.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#161a22] p-1 rounded-xl border border-[#252b37] text-xs">
          <button
            onClick={() => setActiveTab("dossiers")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "dossiers"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Research Dossiers ({dossiers.length})
          </button>
          <button
            onClick={() => setActiveTab("contacts")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === "contacts"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Verified Contacts ({contacts.length})
          </button>
        </div>
      </div>

      {/* Research Form Box */}
      <form
        onSubmit={handleResearch}
        className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Launch Live Executive Research
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            Ethical B2B Intelligence Guard: Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Person or Company Name
            </label>
            <input
              type="text"
              required
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              placeholder="e.g. Folake Ani-Mumuney or Netflix Africa"
              className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Company / Affiliation (Optional)
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. FBN Holdings or Animation Studio"
              className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Research Objective
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-neutral-200 outline-none"
            >
              <option value="PERSON">Executive / Decision Maker</option>
              <option value="COMPANY">Company / Studio / Partner</option>
              <option value="MEETING_PREP">Upcoming Meeting Prep</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSearching || !targetName.trim()}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <Search className={`w-3.5 h-3.5 ${isSearching ? "animate-spin" : ""}`} />
            <span>{isSearching ? "Conducting Live Research..." : "Start Research"}</span>
          </button>
        </div>
      </form>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <div className="flex items-center gap-3 text-neutral-400 text-xs">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Accessing public records and business intelligence...</span>
          </div>
        </div>
      ) : activeTab === "dossiers" ? (
        <div className="space-y-6">
          {dossiers.map((d) => {
            const overview = JSON.parse(d.overviewJson || "{}");
            const sources = JSON.parse(d.sourcesJson || "[]");

            return (
              <div
                key={d.id}
                className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-5 hover:border-[#2f3748] transition-all"
              >
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202530] pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {d.targetType}
                      </span>
                      <span className="text-xs text-neutral-400">{d.roleOrIndustry}</span>
                    </div>
                    <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                      {d.targetName}
                      {d.company && (
                        <span className="text-sm font-normal text-neutral-400">
                          • {d.company}
                        </span>
                      )}
                    </h2>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-medium self-start sm:self-center ${
                      d.confidence === "High"
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                        : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                    }`}
                  >
                    Confidence: {d.confidence}
                  </span>
                </div>

                {/* Summary */}
                <p className="text-xs text-neutral-300 leading-relaxed bg-[#161a22] p-4 rounded-xl border border-[#242b36]">
                  {d.summary}
                </p>

                {/* Why This Matters to Adetunwase */}
                <div className="p-4 rounded-xl bg-[#151921] border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                    Strategic Synergy for Adetunwase
                  </span>
                  <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                    {d.whyItMatters}
                  </p>
                </div>

                {/* Meeting Prep Section if available */}
                {overview?.meetingPrep && (
                  <div className="p-4 rounded-xl bg-[#161b23] border border-[#252c38] space-y-3">
                    <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-amber-500" />
                      <span>Executive Meeting Preparation Kit</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1.5">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold">
                          Key Talking Points
                        </span>
                        {overview.meetingPrep.talkingPoints?.map((tp: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-[#181d26] border border-[#262f3e] text-neutral-300"
                          >
                            • {tp}
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-neutral-400 text-[10px] uppercase font-bold">
                          Things to Avoid
                        </span>
                        {overview.meetingPrep.thingsToAvoid?.map((ta: string, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-[#181d26] border border-[#262f3e] text-neutral-300"
                          >
                            ⚠️ {ta}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                {sources.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase font-bold text-neutral-500">
                      Verified Information Sources
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((s: any, idx: number) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] px-2.5 py-1 rounded bg-[#181d26] hover:bg-[#202733] border border-[#262e3d] text-neutral-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
                        >
                          <span>{s.title || s.sourceName}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Contacts List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4 hover:border-[#2f3748] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-neutral-100">{c.name}</h3>
                  <p className="text-xs text-neutral-400">{c.role}</p>
                  <p className="text-xs text-amber-500 font-medium">{c.company}</p>
                </div>

                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-medium ${
                    c.confidence === "High"
                      ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                      : "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                  }`}
                >
                  {c.confidence} Confidence
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {c.email && (
                  <div className="p-2.5 rounded-lg bg-[#171b23] border border-[#242b37] flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-neutral-200 block truncate">{c.email}</span>
                        <span className="text-[9px] text-amber-400/90 block">{c.emailType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => copyText(c.id, c.email)}
                      className="p-1.5 hover:text-white text-neutral-400 transition-colors shrink-0"
                    >
                      {copiedEmail === c.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {c.phone && (
                  <div className="p-2.5 rounded-lg bg-[#171b23] border border-[#242b37] flex items-center gap-2 text-neutral-300">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{c.phone} (Official switchboard)</span>
                  </div>
                )}

                {c.website && (
                  <div className="p-2.5 rounded-lg bg-[#171b23] border border-[#242b37] flex items-center justify-between text-neutral-300">
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{c.website}</span>
                    </div>
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-neutral-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {c.notes && (
                <p className="text-[11px] text-neutral-400 leading-relaxed bg-[#151921] p-2.5 rounded-lg border border-[#232936]">
                  {c.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
