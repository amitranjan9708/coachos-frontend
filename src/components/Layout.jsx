import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, UserPlus, Users, BookOpen, Layers, GraduationCap,
  CalendarCheck, CalendarRange, FileText, ClipboardList, BookCheck,
  Wallet, MessageSquare, BarChart3, Award, Megaphone, Building2,
  Boxes, Settings, ScanLine, LogOut, Menu, X, Search, Bell, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { apiState } from "@/lib/api";
import { Loader2 } from "lucide-react";
import Chatbot from "./Chatbot";

function TopLoader() {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    return apiState.subscribe(setLoading);
  }, []);

  if (!loading) return null;
  return <Loader2 size={16} className="animate-spin text-indigo-600 ml-3" />;
}

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard", roles: "all" },
  { to: "/leads", label: "Admissions CRM", icon: UserPlus, key: "admissions_crm", roles: ["super_admin","owner","branch_manager","counselor"] },
  { to: "/students", label: "Students", icon: Users, key: "student_management", roles: ["super_admin","owner","branch_manager","counselor","teacher"] },
  { to: "/courses", label: "Courses", icon: BookOpen, key: "course_batch", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/batches", label: "Batches", icon: Layers, key: "course_batch", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/faculty", label: "Faculty", icon: GraduationCap, key: "faculty", roles: ["super_admin","owner","branch_manager"] },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, key: "attendance", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/timetable", label: "Timetable", icon: CalendarRange, key: "timetable", roles: "all" },
  { to: "/assignments", label: "Assignments", icon: FileText, key: "assignments_lms", roles: "all" },
  { to: "/question-papers", label: "Question Papers", icon: ClipboardList, key: "question_papers", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/tests", label: "Scheduled Tests", icon: ClipboardList, key: "online_tests", roles: "all" },
  { to: "/practice", label: "Practice Portal", icon: Award, key: "online_tests", roles: "all" },
  { to: "/question-bank", label: "Question Bank", icon: BookCheck, key: "question_bank", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/fees", label: "Fees", icon: Wallet, key: "fees", roles: ["super_admin","owner","branch_manager","counselor"] },
  { to: "/communications", label: "Comms Hub", icon: MessageSquare, key: "communication", roles: ["super_admin","owner","branch_manager","counselor","teacher"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, key: "analytics", roles: ["super_admin","owner","branch_manager"] },
  { to: "/scholarship", label: "Scholarship", icon: Award, key: "scholarship_exam", roles: ["super_admin","owner","branch_manager","counselor"] },
  { to: "/omr", label: "OMR Evaluation", icon: ScanLine, key: "omr", roles: ["super_admin","owner","branch_manager","teacher"] },
  { to: "/referrals", label: "Referrals", icon: Megaphone, key: "referral", roles: ["super_admin","owner","branch_manager","counselor"] },
  { to: "/inventory", label: "Inventory & HR", icon: Boxes, key: "inventory_hr", roles: ["super_admin","owner","branch_manager"] },
  { to: "/parent-portal", label: "Child's Progress", icon: Building2, key: "parent_portal", roles: ["parent","super_admin","owner"] },
  { to: "/settings", label: "Settings", icon: Settings, key: "settings", roles: ["super_admin","owner"] },
];

export default function Layout({ children, modules = {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const role = user?.role || "student";
  const visibleNav = NAV.filter((n) => {
    const moduleOk = n.key === "dashboard" || n.key === "settings" || modules[n.key] !== false;
    const roleOk = n.roles === "all" || (Array.isArray(n.roles) && n.roles.includes(role));
    return moduleOk && roleOk;
  });

  const initials = (user?.name || user?.email || "U").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-900 text-white grid place-items-center font-black text-sm tracking-tighter">CO</div>
            <div>
              <div className="font-display font-black text-lg leading-none tracking-tight">CoachOS</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Operating System</div>
            </div>
          </div>
          <button data-testid="sidebar-close" className="lg:hidden text-slate-500" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname === item.to || (item.to !== "/dashboard" && item.to !== "/" && loc.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 px-3 py-2 my-0.5 text-sm font-medium rounded-sm ${active ? "nav-item-active" : "nav-item"}`}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-slate-900 text-white grid place-items-center font-bold text-xs">{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name || "User"}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 truncate">{user?.role?.replace("_", " ")}</div>
            </div>
            <button
              data-testid="logout-button"
              onClick={async () => { await logout(); navigate("/login"); }}
              className="text-slate-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 px-4 lg:px-8 flex items-center gap-4">
          <button data-testid="sidebar-toggle" className="lg:hidden text-slate-700" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <Search size={16} className="text-slate-400" />
            <input
              data-testid="topbar-search"
              placeholder="Search students, leads, batches…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
          <TopLoader />
          <div className="flex-1 md:hidden" />
          <Button variant="outline" size="sm" data-testid="topbar-notifications" className="rounded-sm">
            <Bell size={14} />
          </Button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span className="text-xs uppercase tracking-wider font-bold text-slate-700">{user?.role?.replace("_", " ")}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
      
      {/* AI Chatbot for Students */}
      {role === "student" && <Chatbot />}
    </div>
  );
}
