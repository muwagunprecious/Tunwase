"use client";

import { useEffect, useState } from "react";
import {
  Search,
  UserCheck,
  Building2,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Send,
  UserPlus,
  RefreshCw,
  Clock,
  AlertTriangle,
  Layers,
  BookOpen,
  Award,
  GraduationCap,
  TrendingUp,
  X
} from "lucide-react";

export default function PeopleSearchPage() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"profile" | "activity" | "company" | "meeting" | "outreach">("profile");

  // Actions state
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [isFindingContact, setIsFindingContact] = useState(false);
  const [meetingBrief, setMeetingBrief] = useState<any>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState<any>(null);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/people");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) return;

    try {
      setIsSearching(true);
      setSearchResult(null);
      setActiveProfile(null);
      setContactSaved(false);
      setActiveTab("profile");
      setMeetingBrief(null);
      setOutreachDraft(null);

      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", query: q })
      });

      const data = await res.json();
      setSearchResult(data);

      if (data.status === "SINGLE_MATCH" && data.profile) {
        setActiveProfile(data.profile);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResolveCandidate = async (candidate: any) => {
    try {
      setIsSearching(true);
      setSearchResult(null);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", candidate })
      });
      const data = await res.json();
      if (data.profile) {
        setActiveProfile(data.profile);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!activeProfile) return;
    try {
      setIsDeepSearching(true);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deep_search", profile: activeProfile })
      });
      const data = await res.json();
      if (data.profile) {
        setActiveProfile(data.profile);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeepSearching(false);
    }
  };

  const handleFindContact = async () => {
    if (!activeProfile) return;
    try {
      setIsFindingContact(true);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find_contact", profile: activeProfile })
      });
      const data = await res.json();
      if (data.profile) {
        setActiveProfile(data.profile);
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFindingContact(false);
    }
  };

  const handlePrepareMeetingBrief = async () => {
    if (!activeProfile) return;
    setActiveTab("meeting");
    if (meetingBrief) return;
    try {
      setIsGeneratingBrief(true);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "meeting_brief", profile: activeProfile })
      });
      const data = await res.json();
      setMeetingBrief(data.brief);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleDraftOutreach = async () => {
    if (!activeProfile) return;
    setActiveTab("outreach");
    if (outreachDraft) return;
    try {
      setIsGeneratingOutreach(true);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft_outreach", profile: activeProfile })
      });
      const data = await res.json();
      setOutreachDraft(data.outreach);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  const handleSaveContact = async () => {
    if (!activeProfile || contactSaved) return;
    try {
      setIsSavingContact(true);
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_contact", profile: activeProfile })
      });
      if (res.ok) {
        setContactSaved(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleCopyContactCard = () => {
    if (!activeProfile) return;
    const p = activeProfile.personalInfo;
    const c = activeProfile.contactInfo;
    const email = c.emails?.[0]?.email || "Not publicly listed";
    const phone = c.phones?.[0]?.number || "Office switchboard only";
    const linkedin = activeProfile.socialMedia?.find((s: any) => s.platform === "LinkedIn")?.url || "N/A";

    const card = `${p.name}\n${p.currentRole} at ${p.company}\nLocation: ${p.countryRegion}\nEmail: ${email}\nPhone: ${phone}\nLinkedIn: ${linkedin}\nCompany Website: ${c.companyWebsite || "N/A"}`;
    handleCopy(card, "Full Contact Card");
  };

  const loadPreviousDossier = async (id: string) => {
    try {
      setIsSearching(true);
      const res = await fetch(`/api/people?id=${id}`);
      const data = await res.json();
      if (data.profile) {
        setActiveProfile(data.profile);
        setSearchResult({ status: "SINGLE_MATCH", profile: data.profile });
        setActiveTab("profile");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
      {/* 1. HERO SEARCH INPUT (Requirement 1 & 20) */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Autonomous Executive People Research Agent
        </div>
        <h1 className="text-3xl font-bold text-neutral-100 tracking-tight">
          Who are you looking for?
        </h1>
        <p className="text-xs text-neutral-400">
          Enter a person's name. The AI searches public sources, verifies identities, and extracts confirmed professional contact info.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative flex items-center shadow-lg"
        >
          <Search className="w-5 h-5 text-neutral-400 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter a person's name..."
            className="w-full bg-[#14171f] border border-[#262e3d] focus:border-amber-500 rounded-2xl pl-12 pr-28 py-4 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="absolute right-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow"
          >
            {isSearching ? "Researching..." : "Research"}
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-neutral-500 text-[11px]">Example:</span>
          {["Iyinoluwa Aboyeji", "David Adeleke", "Tosin Oshinowo", "CEO of Paystack"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                handleSearch(item);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#151922] hover:bg-[#1f2533] border border-[#232a38] text-neutral-400 hover:text-neutral-200 text-[11px] transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      {isSearching && (
        <div className="p-10 text-center rounded-2xl bg-[#12151c] border border-[#202633] space-y-3">
          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-neutral-300 font-medium">
            Conducting multi-source web research across public directories, company filings & interviews...
          </p>
        </div>
      )}

      {/* 3. DISAMBIGUATION: "WHICH [NAME]?" (Requirement 3 & 22) */}
      {searchResult?.status === "AMBIGUOUS" && !isSearching && (
        <div className="p-6 rounded-2xl bg-[#141820] border border-amber-500/40 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            WHICH {searchResult.query.toUpperCase().replace(/^(FIND|RESEARCH|WHO IS)\s+/i, "")}?
          </div>
          <p className="text-xs text-neutral-400">
            {searchResult.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {searchResult.candidates?.map((cand: any) => (
              <div
                key={cand.id}
                className="p-4 rounded-xl bg-[#181d26] border border-[#283140] hover:border-amber-500/60 flex flex-col justify-between space-y-3 transition-all"
              >
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-2">
                    {cand.name}
                    {cand.knownName && (
                      <span className="text-[10px] text-amber-400 font-normal">
                        ({cand.knownName})
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{cand.role} • {cand.company}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{cand.location} • {cand.industry}</p>
                  <p className="text-[11px] text-neutral-400 mt-2 line-clamp-2">{cand.snippet}</p>
                </div>

                <button
                  onClick={() => handleResolveCandidate(cand)}
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                >
                  Select This Person
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SEARCH RESULTS: PERSON FOUND & PROFILE (Requirements 4 - 14) */}
      {activeProfile && !isSearching && (
        <div className="space-y-6">
          {/* 26. NATURAL AI RESPONSE SUMMARY */}
          <div className="p-4 rounded-2xl bg-[#141822] border border-amber-500/30 text-xs text-neutral-200 leading-relaxed font-medium">
            {activeProfile.aiDebrief}
          </div>

          <div className="p-6 md:p-8 rounded-3xl bg-[#12151c] border border-[#222834] space-y-6 shadow-xl">
            {/* Header: PERSON FOUND (Requirement 14) */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#1f2533] pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 inline-block mb-1">
                  PERSON FOUND
                </span>
                <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
                  {activeProfile.personalInfo.name}
                  {activeProfile.personalInfo.knownName && (
                    <span className="text-sm font-normal text-amber-400">
                      ("{activeProfile.personalInfo.knownName}")
                    </span>
                  )}
                </h2>
                <p className="text-sm font-semibold text-neutral-200">
                  {activeProfile.personalInfo.currentRole} • {activeProfile.personalInfo.company}
                </p>
                <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                  {activeProfile.personalInfo.countryRegion} • {activeProfile.personalInfo.industry}
                </p>
              </div>

              {/* 24. REFRESH & SAVE TO CONTACTS */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSearch(activeProfile.personalInfo.name)}
                  className="px-3 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2430] border border-[#262c37] text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                  title={`Last researched: ${activeProfile.lastResearched}`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleSaveContact}
                  disabled={isSavingContact || contactSaved}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    contactSaved
                      ? "bg-emerald-950/80 border border-emerald-800/60 text-emerald-300"
                      : "bg-amber-600 hover:bg-amber-500 text-white"
                  }`}
                >
                  {contactSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved to Contacts</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Save to Contacts</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 7, 8, 9. CONTACT SECTION (Requirements 7-14) */}
            <div className="p-4 rounded-2xl bg-[#161a23] border border-[#252c3b] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" />
                  CONTACT
                </span>
                {/* 17. "COPY CONTACT CARD" */}
                <button
                  onClick={handleCopyContactCard}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedItem === "Full Contact Card" ? "Copied!" : "Copy contact card"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 7 & 8: Work Email (Primary / Secondary) */}
                <div className="p-3 rounded-xl bg-[#11141a] border border-[#212735] flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                      Email
                    </span>
                    {activeProfile.contactInfo.emails?.[0] && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          activeProfile.contactInfo.emails[0].confidence === "High"
                            ? "text-emerald-400 bg-emerald-950/50"
                            : activeProfile.contactInfo.emails[0].confidence === "Medium"
                            ? "text-blue-400 bg-blue-950/50"
                            : "text-amber-400 bg-amber-950/50"
                        }`}
                      >
                        {activeProfile.contactInfo.emails[0].confidence} Confidence
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-200 font-mono text-xs truncate max-w-[170px]">
                      {activeProfile.contactInfo.emails?.[0]?.email || "Not publicly verified"}
                    </span>
                    {activeProfile.contactInfo.emails?.[0]?.email && (
                      <button
                        onClick={() => handleCopy(activeProfile.contactInfo.emails[0].email, "email")}
                        className="text-neutral-400 hover:text-white p-1"
                        title="Copy email"
                      >
                        {copiedItem === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* 8. Anti-Guess Inferred Pattern Warning */}
                  {activeProfile.contactInfo.emails?.[0]?.isPattern && (
                    <span className="text-[10px] text-amber-400 block font-medium">
                      Possible email pattern (Not verified)
                    </span>
                  )}
                  {activeProfile.contactInfo.emails?.[0]?.source && (
                    <span className="text-[9px] text-neutral-500 block">
                      Source: {activeProfile.contactInfo.emails[0].source}
                    </span>
                  )}
                </div>

                {/* 9: Business Phone */}
                <div className="p-3 rounded-xl bg-[#11141a] border border-[#212735] flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                      Phone
                    </span>
                    {activeProfile.contactInfo.phones?.[0] && (
                      <span className="text-[9px] text-neutral-400">
                        {activeProfile.contactInfo.phones[0].type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-200 font-mono text-xs truncate max-w-[170px]">
                      {activeProfile.contactInfo.phones?.[0]?.number || "Office switchboard only"}
                    </span>
                    {activeProfile.contactInfo.phones?.[0]?.number && (
                      <button
                        onClick={() => handleCopy(activeProfile.contactInfo.phones[0].number, "phone")}
                        className="text-neutral-400 hover:text-white p-1"
                        title="Copy phone"
                      >
                        {copiedItem === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {activeProfile.contactInfo.phones?.[0]?.source && (
                    <span className="text-[9px] text-neutral-500 block">
                      Source: {activeProfile.contactInfo.phones[0].source}
                    </span>
                  )}
                </div>

                {/* Website & LinkedIn */}
                <div className="p-3 rounded-xl bg-[#11141a] border border-[#212735] flex flex-col justify-between space-y-1.5">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Website & LinkedIn
                  </span>

                  <div className="flex items-center gap-2 pt-1">
                    {activeProfile.socialMedia?.find((s: any) => s.platform === "LinkedIn") && (
                      <a
                        href={activeProfile.socialMedia.find((s: any) => s.platform === "LinkedIn").url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {activeProfile.companyOverview?.website && (
                      <a
                        href={activeProfile.companyOverview.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-neutral-300 hover:underline flex items-center gap-1 pl-2 border-l border-[#242b38]"
                      >
                        <Globe className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 15 & 16. DEDICATED ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2 border-b border-[#1f2533]">
              {/* 16. "FIND CONTACT" */}
              <button
                onClick={handleFindContact}
                disabled={isFindingContact}
                className="px-3.5 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2533] border border-[#262e3d] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Mail className={`w-3.5 h-3.5 text-amber-500 ${isFindingContact ? "animate-spin" : ""}`} />
                <span>{isFindingContact ? "Investigating Contacts..." : "Find contact"}</span>
              </button>

              {/* 15. "SEARCH DEEPER" */}
              <button
                onClick={handleDeepSearch}
                disabled={isDeepSearching}
                className="px-3.5 py-2 rounded-xl bg-[#161a22] hover:bg-[#1e2533] border border-[#262e3d] text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <Layers className={`w-3.5 h-3.5 text-amber-500 ${isDeepSearching ? "animate-spin" : ""}`} />
                <span>{isDeepSearching ? "Searching Deeper..." : "Search deeper"}</span>
              </button>

              {/* 18. "PREPARE MEETING BRIEF" */}
              <button
                onClick={handlePrepareMeetingBrief}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "meeting"
                    ? "bg-[#1f2533] text-white border border-amber-500/50"
                    : "bg-[#161a22] hover:bg-[#1e2533] border border-[#262e3d] text-neutral-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Prepare meeting brief</span>
              </button>

              {/* 28. "DRAFT OUTREACH" */}
              <button
                onClick={handleDraftOutreach}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                  activeTab === "outreach"
                    ? "bg-[#1f2533] text-white border border-emerald-500/50"
                    : "bg-[#161a22] hover:bg-[#1e2533] border border-[#262e3d] text-neutral-200"
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Draft outreach</span>
              </button>
            </div>

            {/* SECTIONS TABS */}
            <div className="flex items-center gap-2 border-b border-[#202530] pb-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "profile" ? "bg-[#1f2533] text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                PROFESSIONAL PROFILE
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "activity" ? "bg-[#1f2533] text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                RECENT ACTIVITY
              </button>
              <button
                onClick={() => setActiveTab("company")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "company" ? "bg-[#1f2533] text-white" : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                COMPANY & SOURCES
              </button>
            </div>

            {/* 5. PROFESSIONAL PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-5 text-xs text-neutral-300 leading-relaxed">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Professional Biography
                  </span>
                  <p className="whitespace-pre-line">{activeProfile.personalInfo.bio}</p>
                </div>

                {/* 6. SOCIAL MEDIA VERIFIED */}
                {activeProfile.socialMedia?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                      SOCIAL MEDIA
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeProfile.socialMedia.map((soc: any, idx: number) => (
                        <a
                          key={idx}
                          href={soc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#161a22] border border-[#242b36] hover:border-amber-500/40 text-neutral-200 text-xs flex items-center gap-1.5 transition-colors"
                        >
                          {soc.platform === "LinkedIn" && <Linkedin className="w-3.5 h-3.5 text-blue-400" />}
                          {soc.platform === "X" && <Twitter className="w-3.5 h-3.5 text-sky-400" />}
                          {soc.platform === "Instagram" && <Instagram className="w-3.5 h-3.5 text-pink-400" />}
                          {soc.platform === "YouTube" && <Youtube className="w-3.5 h-3.5 text-rose-500" />}
                          <span>{soc.platform}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements & Credentials */}
                {activeProfile.professionalInfo.achievements?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                      Achievements & Projects
                    </span>
                    <div className="space-y-1">
                      {activeProfile.professionalInfo.achievements.map((a: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-[#151922] text-neutral-200 flex items-center justify-between">
                          <span>• {a.fact}</span>
                          <span className="text-[9px] text-neutral-500">{a.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Potential Connection to Adetunwase */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Connection & Synergy with Adetunwase
                  </span>
                  <p className="text-neutral-200">{activeProfile.whyMattersToAdetun}</p>
                </div>
              </div>
            )}

            {/* 14. RECENT ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="space-y-3 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                  Latest News & Public Appearances
                </span>
                {activeProfile.recentActivity?.latestNews?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] flex items-start justify-between gap-2">
                    <span className="text-neutral-200">📰 {item.fact}</span>
                    <span className="text-[10px] text-neutral-500 shrink-0">{item.source}</span>
                  </div>
                ))}
                {activeProfile.recentActivity?.recentInterviews?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] flex items-start justify-between gap-2">
                    <span className="text-neutral-200">🎙️ Interview: {item.fact}</span>
                    <span className="text-[10px] text-neutral-500 shrink-0">{item.source}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 14. COMPANY & SOURCES TAB */}
            {activeTab === "company" && (
              <div className="space-y-5 text-xs text-neutral-300">
                {activeProfile.companyOverview && (
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-neutral-100 text-sm">
                      {activeProfile.companyOverview.name}
                    </h3>
                    <p>{activeProfile.companyOverview.overview}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                    SOURCES USED ({activeProfile.sources?.length || 0})
                  </span>
                  <div className="space-y-1">
                    {activeProfile.sources?.map((s: any, idx: number) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-[#151922] hover:bg-[#1a1f2a] flex items-center justify-between text-neutral-300 transition-colors"
                      >
                        <span className="truncate pr-2">{s.title}</span>
                        <span className="text-[10px] text-neutral-500 shrink-0">{s.sourceName} • {s.date}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 18. PREPARE MEETING BRIEF TAB */}
            {activeTab === "meeting" && (
              <div className="space-y-4 text-xs">
                {isGeneratingBrief ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-neutral-400">Synthesizing executive meeting brief...</p>
                  </div>
                ) : meetingBrief ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-[#161a22] border border-[#242b36] space-y-1">
                      <span className="text-[10px] font-bold uppercase text-amber-400 block">
                        30-Second Summary
                      </span>
                      <p className="text-neutral-200 leading-relaxed">
                        {meetingBrief.thirtySecondSummary}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        What They Care About
                      </span>
                      <p className="text-neutral-300 p-2.5 rounded-lg bg-[#151922]">
                        {meetingBrief.whatTheyDoAndCareAbout}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                        Strategic Talking Points
                      </span>
                      <div className="space-y-1">
                        {meetingBrief.strategicTalkingPoints?.map((pt: string, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#151922] text-neutral-200">
                            💡 {pt}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                        Things to Avoid
                      </span>
                      <div className="space-y-1">
                        {meetingBrief.thingsToAvoid?.map((pt: string, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-rose-950/20 text-rose-300 border border-rose-900/40">
                            ⚠️ {pt}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleCopy(JSON.stringify(meetingBrief, null, 2), "brief")}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Full Brief</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* 28. DRAFT OUTREACH TAB */}
            {activeTab === "outreach" && (
              <div className="space-y-4 text-xs">
                {isGeneratingOutreach ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-neutral-400">Writing personalized outreach (Strict Zero Em Dashes)...</p>
                  </div>
                ) : outreachDraft ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">
                          Email Subject
                        </span>
                        <button
                          onClick={() => handleCopy(outreachDraft.emailSubject, "subj")}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Copy Subject
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] font-semibold text-neutral-100">
                        {outreachDraft.emailSubject}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">
                          Email Body
                        </span>
                        <button
                          onClick={() => handleCopy(outreachDraft.emailBody, "body")}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Copy Email
                        </button>
                      </div>
                      <div className="p-4 rounded-xl bg-[#161a22] border border-[#242b36] text-neutral-200 leading-relaxed whitespace-pre-line">
                        {outreachDraft.emailBody}
                      </div>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-[#202530]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-neutral-500">
                          LinkedIn Connection Note (Under 300 characters)
                        </span>
                        <button
                          onClick={() => handleCopy(outreachDraft.linkedinMessage, "note")}
                          className="text-amber-400 hover:underline text-[11px]"
                        >
                          Copy Note
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-[#161a22] border border-[#242b36] text-neutral-200">
                        {outreachDraft.linkedinMessage}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 23. RECENT RESEARCH HISTORY (Requirement 23) */}
      {history.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-[#1e222a]">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
            RECENT RESEARCH
          </span>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 6).map((h) => (
              <button
                key={h.id}
                onClick={() => loadPreviousDossier(h.id)}
                className="px-3 py-1.5 rounded-lg bg-[#12151c] hover:bg-[#1a1f29] border border-[#202633] text-xs text-neutral-300 transition-colors flex items-center gap-2"
              >
                <span>{h.targetName}</span>
                <span className="text-[10px] text-neutral-500">
                  {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
