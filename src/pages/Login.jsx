import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@coachos.io");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };

  const quickFill = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <div className="min-h-screen flex auth-grid-bg">
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 30% 20%, #fff 1px, transparent 1px)", backgroundSize:"24px 24px"}} />
        <div className="relative z-10 p-12 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-slate-950 grid place-items-center font-black tracking-tighter">CO</div>
            <div className="font-display font-black text-2xl tracking-tight">CoachOS</div>
          </div>
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2"><Sparkles size={12}/> Coaching Operating System</div>
            <h1 className="font-display text-5xl xl:text-6xl font-black tracking-tighter leading-[0.95]">
              Run your entire coaching institute<br />
              <span className="text-slate-400">from one</span> command center.
            </h1>
            <p className="text-slate-300 max-w-md">Admissions, students, fees, attendance, tests and analytics — modular, configurable, built for Tier-2 and Tier-3 institutes.</p>
            <div className="flex gap-4 pt-4">
              <Stat n="18" l="Modules" />
              <Stat n="7" l="User roles" />
              <Stat n="1" l="Platform" />
            </div>
          </div>
          <div className="text-xs uppercase tracking-widest text-slate-500">v1.0 · Modular SaaS</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-slate-950 text-white grid place-items-center font-black tracking-tighter">CO</div>
            <div className="font-display font-black text-2xl tracking-tight">CoachOS</div>
          </div>
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">Sign in</div>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tighter leading-none mb-8">Welcome back, operator.</h2>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">Email</Label>
              <Input data-testid="login-email" value={email} onChange={(e)=>setEmail(e.target.value)} required type="email" className="rounded-sm mt-2 h-11" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">Password</Label>
              <Input data-testid="login-password" value={password} onChange={(e)=>setPassword(e.target.value)} required type="password" className="rounded-sm mt-2 h-11" />
            </div>
            {error && <div data-testid="login-error" className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</div>}
            <Button data-testid="login-submit" type="submit" disabled={loading} className="w-full rounded-sm h-11 bg-slate-950 hover:bg-slate-800 group">
              {loading ? "Signing in…" : (<>Sign in <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" /></>)}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-500">
            New to CoachOS? <Link data-testid="login-register-link" to="/register" className="text-slate-950 font-semibold underline underline-offset-4">Create an account</Link>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Quick demo credentials</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["admin@coachos.io","Admin@123","Super Admin"],
                ["counselor@coachos.io","Counselor@123","Counselor"],
                ["teacher@coachos.io","Teacher@123","Teacher"],
                ["student@coachos.io","Student@123","Student"],
              ].map(([e,p,r]) => (
                <button key={e} type="button" data-testid={`quickfill-${r.toLowerCase().replace(/\s/g,"-")}`} onClick={()=>quickFill(e,p)} className="text-left border border-slate-200 px-3 py-2 hover:border-slate-900 hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-900">{r}</div>
                  <div className="text-slate-500 truncate font-mono text-[10px]">{e}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div className="font-display text-3xl font-black tracking-tighter">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">{l}</div>
    </div>
  );
}
