import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Phone, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Faculty() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", subjects: "", qualification: "", salary: 0, experience_years: 0 });

  const load = () => api.get("/faculty").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.phone) { toast.error("Name & phone required"); return; }
    const payload = {
      ...form,
      salary: Number(form.salary),
      experience_years: Number(form.experience_years),
      subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean),
      email: form.email || null,
    };
    await api.post("/faculty", payload);
    toast.success("Faculty added");
    setOpen(false); setForm({ name: "", phone: "", email: "", subjects: "", qualification: "", salary: 0, experience_years: 0 });
    load();
  };

  return (
    <div data-testid="faculty-page">
      <PageHeader
        eyebrow="People"
        title="Faculty management"
        subtitle="Teachers, salaries, performance and assignments."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="faculty-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> Add faculty</Button></DialogTrigger>
            <DialogContent className="rounded-sm">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Add faculty member</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"><Input data-testid="faculty-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Phone"><Input data-testid="faculty-phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Email" full><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Subjects (comma)" full><Input value={form.subjects} onChange={e=>setForm({...form,subjects:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Qualification"><Input value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Experience (yrs)"><Input type="number" value={form.experience_years} onChange={e=>setForm({...form,experience_years:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Salary (₹)" full><Input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} className="rounded-sm"/></Field>
              </div>
              <DialogFooter><Button data-testid="faculty-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Add</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(f => (
          <div key={f.id} className="swiss-card p-5" data-testid={`faculty-card-${f.id}`}>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-slate-900 text-white grid place-items-center font-bold text-sm">{f.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
              <button onClick={async()=>{await api.delete(`/faculty/${f.id}`); toast.success("Removed"); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
            <div className="font-display text-xl font-bold mt-4">{f.name}</div>
            <div className="text-xs text-slate-500">{f.qualification} · {f.experience_years} yrs</div>
            <div className="mt-3 text-xs space-y-1 text-slate-600">
              <div className="flex items-center gap-1"><Phone size={11}/> {f.phone}</div>
              {f.email && <div className="flex items-center gap-1"><Mail size={11}/> {f.email}</div>}
            </div>
            <div className="flex flex-wrap gap-1 mt-3 border-t border-slate-100 pt-3">
              {f.subjects?.map(s => <span key={s} className="pill pill-blue">{s}</span>)}
            </div>
            <div className="mt-3 font-display font-black text-lg">₹{(f.salary||0).toLocaleString("en-IN")}<span className="text-xs text-slate-500 font-normal font-sans"> / month</span></div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No faculty yet</div>}
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
