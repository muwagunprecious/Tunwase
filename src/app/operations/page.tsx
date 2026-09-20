"use client";

import { useEffect, useState } from "react";
import {
  Crown,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderKanban,
  Zap,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Plus,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";

export default function OperationsPage() {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("tasks");

  const fetchOperationsData = async () => {
    try {
      setIsLoading(true);
      const [opsRes, tasksRes] = await Promise.all([
        fetch("/api/operations"),
        fetch("/api/tasks")
      ]);
      const opsData = await opsRes.json();
      const tasksData = await tasksRes.json();
      setData(opsData);
      setTasks(tasksData.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    try {
      setIsAddingTask(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naturalInput: newTaskInput.trim() })
      });
      if (res.ok) {
        setNewTaskInput("");
        fetchOperationsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus })
      });
    } catch (err) {
      console.error(err);
      fetchOperationsData();
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
      fetchOperationsData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 text-xs">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Operations...</span>
        </div>
      </div>
    );
  }

  const { whatToDoNow, projects = [] } = data || {};

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 bg-slate-50 min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Operations Hub</h1>
          <p className="text-xs text-slate-600 mt-1">
            Priorities, deliverables, and active milestones across Animation Hub and Foundation.
          </p>
        </div>

        <button
          onClick={fetchOperationsData}
          className="px-3.5 py-2 rounded-xl bg-[#151921] hover:bg-[#1e2430] border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-2 transition-all self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* "WHAT SHOULD I DO NOW?" Hero Focus Card */}
      {whatToDoNow && (
        <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              Highest-Leverage Focus Right Now
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Priority
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {whatToDoNow.topAction}
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
              {whatToDoNow.whyThisIsImportant}
            </p>
          </div>

          {whatToDoNow.nextSteps && whatToDoNow.nextSteps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-xs">
              {whatToDoNow.nextSteps.map((step: string, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-[#181d26] text-slate-800 text-xs">
                  <span className="text-amber-400 font-bold block mb-0.5">Step {idx + 1}</span>
                  <span className="leading-snug">{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fast Task Capture Bar */}
      <form onSubmit={handleAddTask} className="relative flex items-center shadow-md">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          placeholder="Add a task naturally (e.g. Follow up with FirstBank CSR tomorrow)..."
          className="w-full bg-[#13161c] border border-[#252c38] focus:border-amber-500 rounded-2xl px-4 py-3.5 pr-28 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-all"
        />
        <button
          type="submit"
          disabled={isAddingTask || !newTaskInput.trim()}
          className="absolute right-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingTask ? "Adding..." : "Add Task"}</span>
        </button>
      </form>

      {/* Tabs: Tasks vs Projects */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === "tasks" ? "bg-[#1f2533] text-white" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Tasks Checklist ({tasks.filter((t) => t.status !== "COMPLETED").length} Open)
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === "projects" ? "bg-[#1f2533] text-white" : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Active Projects ({projects.length})
          </button>
        </div>

        {/* Tab 1: Tasks Checklist */}
        {activeTab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#12151c] border border-[#202633] text-xs text-slate-500">
                All tasks are cleared.
              </div>
            ) : (
              tasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-xs ${
                      isCompleted
                        ? "bg-[#111317]/50 border-[#1c2027] text-slate-500"
                        : "bg-[#13161c] border-slate-200 text-slate-800 hover:border-[#2f3747]"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className="text-slate-600 hover:text-amber-400 shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="truncate">
                        <span className={`font-medium block truncate ${isCompleted ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-[11px] text-slate-500 block truncate">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {task.entity && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-[#181d26] text-slate-600">
                          {task.entity === "ANIMATION_HUB" ? "Animation Hub" : "Foundation"}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Projects Overview */}
        {activeTab === "projects" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((proj: any) => (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-[#13161c] border border-slate-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#181d26] text-slate-600 font-bold uppercase">
                      {proj.entity === "ANIMATION_HUB" ? "Animation Hub" : "Foundation"}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{proj.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
                    {proj.healthScore}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{proj.objective}</p>

                {proj.milestones && proj.milestones.length > 0 && (
                  <div className="pt-2 border-t border-[#1f2533] space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Milestones
                    </span>
                    {proj.milestones.slice(0, 3).map((m: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className={m.completed ? "text-slate-500 line-through" : "text-slate-700"}>
                          {m.title}
                        </span>
                        <span className="text-slate-500 text-[10px]">{m.targetDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
