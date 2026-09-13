"use client";

import { useEffect, useState } from "react";
import {
  Users2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  Building2,
  Send,
  MessageSquare,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

export default function RelationshipsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [personName, setPersonName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [commitmentsByAdetun, setCommitmentsByAdetun] = useState("");
  const [commitmentsByThem, setCommitmentsByThem] = useState("");
  const [newWaitingOnThem, setNewWaitingOnThem] = useState(false);
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRelationships = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/relationships");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !company.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName,
          company,
          role,
          commitmentsByAdetun,
          commitmentsByThem,
          waitingOnThem: newWaitingOnThem,
          nextFollowUpDate,
          notes
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setPersonName("");
        setCompany("");
        setRole("");
        setCommitmentsByAdetun("");
        setCommitmentsByThem("");
        setNewWaitingOnThem(false);
        setNextFollowUpDate("");
        setNotes("");
        fetchRelationships();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleWaiting = async (id: string, currentWaiting: boolean) => {
    try {
      const res = await fetch("/api/relationships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, waitingOnThem: !currentWaiting })
      });
      if (res.ok) {
        fetchRelationships();
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
          <span>Synchronizing Executive Relationships...</span>
        </div>
      </div>
    );
  }

  const { followUps = [], waitingOnThem = [], myCommitments = [] } = data || {};

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users2 className="w-4 h-4" />
            Executive Relationship & Commitment Intelligence
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Relationships & Commitments</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Proactively monitor what you promised counterparties and track deliverables others owe you.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Interaction</span>
        </button>
      </div>

      {/* Commitments Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Waiting on Others */}
        <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-neutral-200">
                Waiting on Others ({waitingOnThem?.length || 0})
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              External Deliverables
            </span>
          </div>

          <div className="space-y-3">
            {waitingOnThem?.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                No outstanding external deliverables.
              </p>
            ) : (
              waitingOnThem?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#171b23] border border-[#262c37] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200">
                      {item.personName} • {item.company}
                    </span>
                    <button
                      onClick={() => handleToggleWaiting(item.id, true)}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      Mark Received ✓
                    </button>
                  </div>

                  <p className="text-amber-300 leading-snug font-medium">
                    ⏳ Promised: "{item.commitmentsByThem}"
                  </p>

                  {item.nextFollowUpDate && (
                    <span className="text-[10px] text-neutral-500 block">
                      Scheduled check-in: {new Date(item.nextFollowUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* What Adetunwase Promised */}
        <div className="p-6 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-neutral-200">
                What Adetunwase Promised ({myCommitments?.length || 0})
              </h2>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Your Deliverables
            </span>
          </div>

          <div className="space-y-3">
            {myCommitments?.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                All personal commitments fulfilled.
              </p>
            ) : (
              myCommitments?.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#171b23] border border-[#262c37] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200">
                      To {item.personName} ({item.company})
                    </span>
                    <a href="/actions" className="text-[10px] text-blue-400 hover:underline">
                      Queue Action →
                    </a>
                  </div>

                  <p className="text-neutral-200 leading-snug">
                    📌 Promised: "{item.commitmentsByAdetun}"
                  </p>

                  {item.nextFollowUpDate && (
                    <span className="text-[10px] text-neutral-500 block">
                      Target fulfillment: {new Date(item.nextFollowUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Network Relationship List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200">
          Executive Relationship History & Network Timeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {followUps?.map((f: any) => (
            <div
              key={f.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-100">{f.personName}</h3>
                  <p className="text-xs text-neutral-400">
                    {f.role ? `${f.role} • ` : ""}
                    {f.company}
                  </p>
                </div>

                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-medium ${
                    f.waitingOnThem
                      ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                      : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {f.waitingOnThem ? "Waiting on Deliverable" : "In Sync"}
                </span>
              </div>

              {f.notes && (
                <p className="text-neutral-300 leading-relaxed bg-[#161a22] p-2.5 rounded-lg border border-[#242b36]">
                  {f.notes}
                </p>
              )}

              <div className="pt-2 border-t border-[#202530] flex items-center justify-between text-[11px] text-neutral-500">
                <span>Last Met: {new Date(f.lastInteractionDate).toLocaleDateString()}</span>
                {f.nextFollowUpDate && (
                  <span className="text-amber-400 font-medium">
                    Next: {new Date(f.nextFollowUpDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Interaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#14171f] border border-[#242b38] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-amber-500" />
                Log Interaction & Commitments
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Streaming Partner"
                    className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  What You Promised Adetunwase Will Do
                </label>
                <input
                  type="text"
                  value={commitmentsByAdetun}
                  onChange={(e) => setCommitmentsByAdetun(e.target.value)}
                  placeholder="e.g. Send animation character turnarounds and pilot budget"
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  What They Promised To Do
                </label>
                <input
                  type="text"
                  value={commitmentsByThem}
                  onChange={(e) => setCommitmentsByThem(e.target.value)}
                  placeholder="e.g. Send draft co-production term sheet"
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="waitingCheck"
                  checked={newWaitingOnThem}
                  onChange={(e) => setNewWaitingOnThem(e.target.checked)}
                  className="accent-amber-600 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="waitingCheck" className="text-xs text-neutral-300 cursor-pointer">
                  Mark as waiting on their deliverable
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none"
                />
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
                  disabled={isSubmitting || !personName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md"
                >
                  Save Relationship
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
