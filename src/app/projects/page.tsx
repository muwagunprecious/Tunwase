"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Clock,
  Sparkles,
  Calendar,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Send,
  User,
  Filter
} from "lucide-react";

export default function ProjectsPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [naturalInput, setNaturalInput] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New Project Modal State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projEntity, setProjEntity] = useState("ANIMATION_HUB");
  const [projObjective, setProjObjective] = useState("");
  const [projPrompt, setProjPrompt] = useState("");
  const [isGeneratingProj, setIsGeneratingProj] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects")
      ]);
      const tasksData = await tasksRes.json();
      const projectsData = await projectsRes.json();
      setTasks(tasksData.tasks || []);
      setProjects(projectsData.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateNaturalTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    try {
      setIsCreatingTask(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naturalInput })
      });

      if (res.ok) {
        setNaturalInput("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleUpdateTaskStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !projObjective.trim()) return;

    try {
      setIsGeneratingProj(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projName,
          entity: projEntity,
          objective: projObjective,
          prompt: projPrompt
        })
      });

      if (res.ok) {
        setShowProjectModal(false);
        setProjName("");
        setProjObjective("");
        setProjPrompt("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingProj(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;
    if (selectedEntity !== "ALL" && t.entity !== selectedEntity) return false;
    return true;
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1e222a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <FolderKanban className="w-4 h-4" />
            Operations & Project Manager
          </div>
          <h1 className="text-2xl font-bold text-neutral-100">Projects & Task Operations</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track milestones, predict deadlines, and capture tasks naturally via conversational prompts.
          </p>
        </div>

        <button
          onClick={() => setShowProjectModal(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Breakdown</span>
        </button>
      </div>

      {/* Natural Language Task Input */}
      <form
        onSubmit={handleCreateNaturalTask}
        className="p-4 rounded-2xl bg-[#13161c] border border-[#222834] flex flex-col sm:flex-row items-center gap-3 shadow-sm"
      >
        <div className="relative flex-1 w-full">
          <Sparkles className="w-4 h-4 text-amber-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={naturalInput}
            onChange={(e) => setNaturalInput(e.target.value)}
            placeholder="Type or speak naturally: 'Remind me to call John tomorrow' or 'Send Animation Hub proposal next Friday'..."
            className="w-full bg-[#171b23] border border-[#262c37] focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-500 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={isCreatingTask || !naturalInput.trim()}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
        >
          <span>{isCreatingTask ? "Parsing Intent..." : "Schedule Task"}</span>
        </button>
      </form>

      {/* Active Projects Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <span>Active Project Milestones</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {projects.length}
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl bg-[#13161c] border border-[#222834] space-y-4 hover:border-[#2e3646] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-800 text-neutral-300">
                    {proj.entity}
                  </span>
                  <h3 className="text-sm font-bold text-neutral-100 mt-1">{proj.name}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{proj.objective}</p>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                    proj.healthScore >= 80
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                      : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                  }`}
                >
                  Health: {proj.healthScore}%
                </span>
              </div>

              {/* Milestones list */}
              {proj.milestones && proj.milestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#202530]">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Milestones
                  </span>
                  <div className="space-y-1">
                    {proj.milestones.map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-neutral-300">
                        <span className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${m.completed ? "text-emerald-400" : "text-neutral-600"}`}
                          />
                          <span className={m.completed ? "line-through text-neutral-500" : ""}>
                            {m.title}
                          </span>
                        </span>
                        <span className="text-[10px] text-neutral-500">{m.targetDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Filters and List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#13161c] border border-[#222834]">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#171b23] p-1 rounded-lg border border-[#262c38] text-xs">
            {["ALL", "INBOX", "IN_PROGRESS", "WAITING", "BLOCKED", "COMPLETED"].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedStatus === s
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {s === "IN_PROGRESS" ? "In Progress" : s}
              </button>
            ))}
          </div>

          {/* Entity Tabs */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-neutral-500 text-[10px] uppercase font-bold">Entity:</span>
            {["ALL", "PERSONAL", "ANIMATION_HUB", "FOUNDATION"].map((e) => (
              <button
                key={e}
                onClick={() => setSelectedEntity(e)}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  selectedEntity === e
                    ? "bg-[#252c38] text-amber-400 border border-amber-500/40"
                    : "bg-[#171b23] text-neutral-400 border border-[#252b36] hover:text-neutral-200"
                }`}
              >
                {e === "PERSONAL" ? "Personal" : e === "ANIMATION_HUB" ? "Animation Hub" : e === "FOUNDATION" ? "Foundation" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#13161c] border border-[#222834] text-neutral-500 text-xs">
            No tasks found in this view.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((t) => {
              const isCompleted = t.status === "COMPLETED";
              const isBlocked = t.status === "BLOCKED";
              const isCritical = t.priority === "CRITICAL";

              return (
                <div
                  key={t.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isBlocked
                      ? "bg-[#1a1417] border-rose-900/40"
                      : isCompleted
                      ? "bg-[#121419] border-[#1d222b] opacity-60"
                      : "bg-[#14171e] border-[#222834] hover:border-[#2b3342]"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => handleUpdateTaskStatus(t.id, isCompleted ? "IN_PROGRESS" : "COMPLETED")}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isCompleted
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "border-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold ${
                            isCompleted ? "line-through text-neutral-500" : "text-neutral-100"
                          }`}
                        >
                          {t.title}
                        </span>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                              : t.priority === "HIGH"
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800/40"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {t.priority}
                        </span>

                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-medium">
                          {t.entity}
                        </span>

                        {t.projectName && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1c222c] text-neutral-300">
                            {t.projectName}
                          </span>
                        )}
                      </div>

                      {t.description && (
                        <p className="text-xs text-neutral-400 leading-snug">{t.description}</p>
                      )}

                      {t.notes && (
                        <p className="text-[11px] text-amber-400/90 font-mono">Note: {t.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {t.deadline && (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1 mr-2">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {new Date(t.deadline).toLocaleDateString()}
                      </span>
                    )}

                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                      className="bg-[#181d26] border border-[#272f3e] text-neutral-300 text-[11px] rounded-lg px-2 py-1 outline-none"
                    >
                      <option value="INBOX">Inbox</option>
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING">Waiting</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="COMPLETED">Completed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#14171f] border border-[#242b38] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-amber-500" />
                Create New Project Breakdown
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-neutral-500 hover:text-neutral-300 text-xs font-medium"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. 2D Animated Folktale Series: Oya's Storm"
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Entity
                </label>
                <select
                  value={projEntity}
                  onChange={(e) => setProjEntity(e.target.value)}
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none"
                >
                  <option value="ANIMATION_HUB">Animation Hub</option>
                  <option value="FOUNDATION">Foundation</option>
                  <option value="PERSONAL">Personal Brand</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  Core Objective
                </label>
                <textarea
                  rows={2}
                  required
                  value={projObjective}
                  onChange={(e) => setProjObjective(e.target.value)}
                  placeholder="e.g. Produce and license a 6-episode African folklore animated series."
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 uppercase mb-1">
                  AI Architecture Prompt (Optional)
                </label>
                <textarea
                  rows={2}
                  value={projPrompt}
                  onChange={(e) => setProjPrompt(e.target.value)}
                  placeholder="Let the AI Project Manager generate 4 milestones and risk mitigations..."
                  className="w-full bg-[#181d26] border border-[#272f3e] focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-neutral-100 outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#181d26] hover:bg-[#202733] border border-[#262f3e] text-neutral-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingProj || !projName.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingProj ? "animate-spin" : ""}`} />
                  <span>{isGeneratingProj ? "Generating Breakdown..." : "Create Project"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
