"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Search,
  CheckSquare,
  PenTool,
  Settings,
  ShieldCheck,
  Share2,
  Sparkles
} from "lucide-react";

const MAIN_NAV = [
  { href: "/", label: "Assistant", icon: MessageSquare, desc: "Executive Chat & Actions" },
  { href: "/social", label: "LinkedIn Engine", icon: Share2, desc: "Caption Bank & Strategy" },
  { href: "/people", label: "People Search", icon: Search, desc: "Public Intelligence & Contacts" },
  { href: "/operations", label: "Operations", icon: CheckSquare, desc: "Priorities, Tasks & Projects" },
  { href: "/studio", label: "Content Studio", icon: PenTool, desc: "Social & Brand Writing" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#101216] border-r border-[#1e222a] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e222a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
            A
          </div>
          <div>
            <span className="font-semibold tracking-tight text-neutral-100 text-sm block">
              Adetunwase AI
            </span>
            <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Executive Assistant
            </span>
          </div>
        </div>
      </div>

      {/* Simplified Primary Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
          Workspace
        </div>

        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-[#1c222c] text-white font-semibold shadow-sm border border-[#2b3545]"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-[#161a21]"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-500" : "text-neutral-400"}`} />
              <div>
                <span className="text-xs block leading-tight">{item.label}</span>
                <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                  {item.desc}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Compact Bottom Footer */}
      <div className="p-3 border-t border-[#1e222a] space-y-2">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
            pathname === "/settings"
              ? "bg-[#1c222c] text-neutral-200"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-[#161a21]"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-neutral-400" />
          <span>Settings & Guardrails</span>
        </Link>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-[#14171e] border border-[#202530] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-neutral-700 flex items-center justify-center text-[11px] font-bold text-neutral-200 border border-neutral-600">
            AA
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-neutral-200 truncate">Adetunwase Adenle</div>
            <div className="text-[10px] text-neutral-400 truncate">Animation Hub & Foundation</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
