"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Search,
  CheckSquare,
  PenTool,
  Settings,
  Share2,
  Sparkles,
  Menu,
  X
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const navContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            A
          </div>
          <div>
            <span className="font-semibold tracking-tight text-slate-900 text-sm block">
              Adetunwase AI
            </span>
            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Executive Assistant
            </span>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          Workspace
        </div>

        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-amber-50 text-amber-900 font-semibold shadow-xs border border-amber-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-600" : "text-slate-500"}`}
              />
              <div className="min-w-0">
                <span className="text-xs block leading-tight truncate">{item.label}</span>
                <span
                  className={`text-[10px] block leading-tight mt-0.5 truncate ${
                    isActive ? "text-amber-700/80" : "text-slate-600"
                  }`}
                >
                  {item.desc}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Footer */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        <Link
          href="/settings"
          onClick={() => setIsMobileOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${
            pathname === "/settings"
              ? "bg-amber-50 text-amber-900 font-semibold border border-amber-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Settings & Guardrails</span>
        </Link>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[11px] font-bold border border-slate-300">
            AA
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">Adetunwase Adenle</div>
            <div className="text-[10px] text-slate-600 truncate">Animation Hub & Foundation</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sticky Mobile Header (< md) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
            A
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-900 text-xs block">
              Adetunwase AI
            </span>
            <span className="text-[9px] text-amber-600 font-medium">Chief of Staff</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop Sidebar (>= md) */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 flex-col h-screen shrink-0 bg-white">
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Panel */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
