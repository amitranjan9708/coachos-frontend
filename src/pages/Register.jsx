import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const ROLES = [
  { value: "owner", label: "Institute Owner" },
  { value: "branch_manager", label: "Branch Manager" },
  { value: "counselor", label: "Counselor" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "parent", label: "Parent" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "counselor", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await register(form);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (e) { setError(e.message); toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center auth-grid-bg p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-8 lg:p-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-slate-950 text-white grid place-items-center font-black tracking-tighter">CO</div>
          <div className="font-display font-black text-2xl tracking-tight">CoachOS</div>
        </div>
        <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500 mb-3">Create account</div>
        <h1 className="font-display text-3xl font-black tracking-tighter leading-none mb-8">Onboard your institute.</h1>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest">Full name</Label>
              <Input data-testid="register-name" required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="rounded-sm mt-2 h-11" />
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-widest">Phone</Label>
              <Input data-testid="register-phone" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} className="rounded-sm mt-2 h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Email</Label>
            <Input data-testid="register-email" required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} className="rounded-sm mt-2 h-11" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Password</Label>
            <Input data-testid="register-password" required type="password" minLength={6} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} className="rounded-sm mt-2 h-11" />
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Role</Label>
            <Select value={form.role} onValueChange={(v)=>setForm({...form,role:v})}>
              <SelectTrigger data-testid="register-role" className="rounded-sm mt-2 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {error && <div data-testid="register-error" className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</div>}
          <Button data-testid="register-submit" type="submit" disabled={loading} className="w-full h-11 rounded-sm bg-slate-950 hover:bg-slate-800">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <div className="mt-6 text-sm text-slate-500">Already have an account? <Link data-testid="register-login-link" to="/login" className="font-semibold text-slate-950 underline underline-offset-4">Sign in</Link></div>
      </div>
    </div>
  );
}
