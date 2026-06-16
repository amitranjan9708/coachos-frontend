import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Bot, BookOpen, CalendarClock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const { user } = useAuth();

  // If already logged in, skip the landing page and go straight to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Decorative Top Gradient Background */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/80 via-white to-slate-50 pointer-events-none z-0"></div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto border-b border-transparent">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-black text-white tracking-tighter shadow-sm shadow-indigo-600/20">CO</div>
          <span className="font-display font-black text-xl tracking-tight text-slate-900">CoachOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link 
            to="/register" 
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10 inline-flex items-center gap-2"
          >
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          Next-Gen Coaching OS
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-slate-900">
          The operating system for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">modern coaching</span>.
        </h1>
        
        <p className="mt-8 text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Manage everything from admissions to secure online testing, empowered by MCO — your intelligent Virtual Coach. Bring your entire institute into the future.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <Link 
            to="/register"
            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            Start your free trial <ArrowRight size={18} />
          </Link>
          <span className="text-sm text-slate-500 font-medium">No credit card required.</span>
        </div>

        {/* Hero Image/Mockup placeholder */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-slate-200/60 bg-white/50 backdrop-blur-sm shadow-2xl shadow-slate-200/50 p-2 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="w-full aspect-[16/9] bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 via-white to-indigo-50/30 opacity-50"></div>
            <img src="/dsp.png" alt="Dashboard Preview" className="w-full h-full object-cover relative z-10" />
          </div>
        </div>
      </main>

      {/* Features SaaS Grid */}
      <section className="relative z-10 bg-white py-24 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight text-slate-900 mb-4">Everything you need to scale</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">We replaced a dozen scattered tools with one unified, incredibly fast platform designed specifically for coaching institutes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="col-span-1 bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white border border-slate-200 text-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <Bot size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Virtual Coach AI</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                A deeply integrated, context-aware AI that helps students with doubts, tracks their practice history, and reminds them of upcoming schedules.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="col-span-1 bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white border border-slate-200 text-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Secure Proctored Tests</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Strict anti-cheating environment that tracks tab switches, forces fullscreen, and disables copy-pasting for online examinations.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="col-span-1 bg-slate-50 border border-slate-100 rounded-3xl p-8 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-white border border-slate-200 text-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-sm">
                <CalendarClock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900">Dynamic Timetable</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Map assignments and materials directly to classes. Interactive schedules automatically resolve conflicts for faculty and students.
              </p>
            </div>

            {/* Feature 4 - Wide Card */}
            <div className="col-span-1 md:col-span-3 bg-indigo-950 rounded-3xl p-8 md:p-12 overflow-hidden relative shadow-xl shadow-indigo-900/10">
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                    Enterprise Ready
                  </div>
                  <h3 className="text-3xl md:text-4xl font-display font-black mb-4 text-white">Complete LMS & ERP</h3>
                  <p className="text-indigo-200 leading-relaxed text-lg mb-8">
                    Manage all your academic operations, from leads and admissions to generating OMR sheets, tracking attendance, and processing fees.
                  </p>
                  <ul className="grid grid-cols-2 gap-4 text-white/80 font-medium">
                    <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-indigo-400"/> Fee Management</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-indigo-400"/> OMR Scanning</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-indigo-400"/> Admissions CRM</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-indigo-400"/> Custom Domains</li>
                  </ul>
                </div>
                <div className="w-full md:w-auto">
                  <Link 
                    to="/register"
                    className="px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-indigo-950 font-bold tracking-wide transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-2"
                  >
                    Get Started <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
              {/* Decorative background element for the larger card */}
              <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-indigo-500/30 rounded-full blur-[100px]"></div>
              <div className="absolute -left-20 top-[-20%] w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center font-black text-white tracking-tighter">CO</div>
          <span className="font-display font-black text-xl tracking-tight text-slate-900">CoachOS</span>
        </div>
        <p>&copy; {new Date().getFullYear()} CoachOS Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
