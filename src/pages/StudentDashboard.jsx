import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  Wallet, BookOpen, Calendar, ArrowRight, Target, 
  FileText, Clock, Award, Activity, CheckCircle2,
  Sparkles, TrendingUp
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [attendance, setAttendance] = useState({ present: 0, total: 0, rate: 0 });
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const studentId = user?.student_id;
    api.get("/students").then(r => {
      const found = studentId ? r.data.find(s => s.id === studentId) : r.data[0];
      setMe(found);
      if (found) {
        api.get(`/invoices?student_id=${found.id}`).then(r => setInvoices(r.data));
        api.get(`/attendance?student_id=${found.id}`).then(r => {
          const total = r.data.length;
          const present = r.data.filter(a => a.status === "present").length;
          setAttendance({ total, present, rate: total ? Math.round(present * 100 / total) : 0 });
        });
      }
    });
    api.get("/assignments").then(r => setAssignments(r.data));
    api.get("/tests").then(r => setTests(r.data));
    api.get("/study-materials").then(r => setMaterials(r.data));
  }, [user]);

  const due = invoices.reduce((s, i) => s + ((i.amount || 0) - (i.paid_amount || 0)), 0);
  const nextInvoice = invoices.find(i => i.status !== "paid");

  return (
    <div data-testid="student-dashboard" className="space-y-8 pb-12 font-sans bg-slate-50/50 min-h-screen">
      
      {/* 1. Hero Banner with Glassmorphism and Animated Gradient */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl shadow-violet-500/10">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-fuchsia-600/30 rounded-full blur-[100px] mix-blend-screen translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-violet-600/30 rounded-full blur-[100px] mix-blend-screen -translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white/90 text-xs font-semibold uppercase tracking-widest mb-6">
              <Sparkles size={14} className="text-yellow-400" /> 
              Student Portal
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 mb-4 tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className="text-lg text-slate-300 max-w-xl font-medium leading-relaxed">
              {me ? `Roll ${me.roll_no || "—"} • ${me.phone}` : "Keep up the fantastic progress! Ready to crush today's goals?"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link to="/tests" className="group relative px-6 py-3.5 rounded-full bg-white text-slate-900 font-bold text-sm shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:scale-105 transition-all duration-300 flex items-center gap-2 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-100 to-fuchsia-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Target size={18} className="relative z-10 text-violet-600 group-hover:rotate-12 transition-transform duration-300" /> 
              <span className="relative z-10">Take a Test</span>
            </Link>
            <Link to="/assignments" className="group px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white font-bold text-sm transition-all duration-300 flex items-center gap-2">
              <FileText size={18} className="group-hover:-translate-y-1 transition-transform duration-300" /> View Coursework
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Enhanced KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden flex items-center justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-full blur-3xl group-hover:bg-violet-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity size={12}/> Attendance</div>
            <div className="font-display text-4xl font-black text-slate-800 tracking-tight group-hover:text-violet-600 transition-colors">{attendance.rate}%</div>
            <div className="text-sm font-medium text-slate-500 mt-2">{attendance.present}/{attendance.total} classes</div>
          </div>
          <div className="w-20 h-20 relative z-10 drop-shadow-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: attendance.rate }, { value: 100 - attendance.rate }]} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={38} startAngle={90} endAngle={-270} stroke="none" cornerRadius={4}>
                  <Cell fill="#8b5cf6" />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-violet-600">
              <TrendingUp size={18} className="opacity-80" />
            </div>
          </div>
        </div>

        {/* Due Fee Card */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl group-hover:bg-orange-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest flex items-center gap-1.5"><Wallet size={12}/> Fees Due</div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 text-orange-500 shadow-sm border border-orange-100/50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"><Wallet size={18}/></div>
            </div>
            <div className="font-display text-4xl font-black text-slate-800 tracking-tight group-hover:text-orange-500 transition-colors">
              ₹{due.toLocaleString("en-IN")}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400" />
              {nextInvoice ? `Next: ${nextInvoice.due_date || "—"}` : "All clear, great job!"}
            </div>
          </div>
        </div>

        {/* Upcoming Tests */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest flex items-center gap-1.5"><Target size={12}/> Active Tests</div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-500 shadow-sm border border-blue-100/50 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300"><Target size={18}/></div>
            </div>
            <div className="font-display text-4xl font-black text-slate-800 tracking-tight group-hover:text-blue-500 transition-colors">
              {tests.length}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
              <Clock size={14} className="text-slate-400" /> Pending evaluations
            </div>
          </div>
        </div>

        {/* Coursework */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-slate-400 text-[0.65rem] font-bold uppercase tracking-widest flex items-center gap-1.5"><Award size={12}/> Assignments</div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-500 shadow-sm border border-emerald-100/50 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"><Award size={18}/></div>
            </div>
            <div className="font-display text-4xl font-black text-slate-800 tracking-tight group-hover:text-emerald-500 transition-colors">
              {assignments.length}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" /> To be completed
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Assessments Section */}
        <div className="lg:col-span-3 bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-full relative">
          <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-slate-50 relative z-10">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-slate-800 tracking-tight">Assessments</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Your upcoming and active tests</p>
            </div>
            <Link to="/tests" className="px-4 py-2 rounded-full bg-violet-50 text-violet-600 text-sm font-bold hover:bg-violet-600 hover:text-white transition-colors flex items-center gap-1 group">
              View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50/30">
            {tests.slice(0, 5).map((t, idx) => (
              <div key={t.id} className="group flex items-center justify-between p-5 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all duration-300">
                <div className="flex gap-5 items-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${idx % 2 === 0 ? 'bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600' : 'bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600'}`}>
                    <Target size={24} className="group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-800 group-hover:text-violet-600 transition-colors">{t.title}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-3 mt-1.5 font-medium">
                      <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{t.subject}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400"/> {t.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full text-xs font-bold group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all shadow-sm">
                    {t.total_marks} Marks
                  </span>
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <Target size={24} />
                </div>
                <div className="text-slate-500 font-medium text-lg">No upcoming tests</div>
                <div className="text-slate-400 text-sm mt-1">Enjoy your free time!</div>
              </div>
            )}
          </div>
        </div>

        {/* Coursework & Library Col */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Assignments */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
              <h2 className="font-display font-bold text-xl text-slate-800">Coursework</h2>
              <Link to="/assignments" className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="p-4 space-y-3 bg-slate-50/30">
              {assignments.slice(0, 3).map(a => (
                <div key={a.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">{a.title}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar size={12} className="text-emerald-500/70"/> Due {a.due_date || "—"}
                      </div>
                    </div>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 border border-slate-200 hover:border-emerald-200 flex items-center justify-center transition-all">
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-10 font-medium">All caught up! 🎉</div>
              )}
            </div>
          </div>

          {/* Library */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
              <h2 className="font-display font-bold text-xl text-slate-800">Library</h2>
              <Link to="/study-materials" className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                Browse <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="p-4 bg-slate-50/30">
              <div className="grid grid-cols-2 gap-4">
                {materials.slice(0, 4).map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 cursor-pointer group flex flex-col items-start">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <BookOpen size={18} />
                    </div>
                    <div className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-1" title={m.title}>{m.title}</div>
                    <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 mt-auto">{m.type}</div>
                  </div>
                ))}
                {materials.length === 0 && <div className="col-span-2 text-sm text-slate-500 font-medium text-center py-8">No materials yet</div>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
