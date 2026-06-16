import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookOpen, Clock, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Courses() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", duration_months: 12, fee: 0, subjects: "" });

  const load = () => api.get("/courses").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.code) { toast.error("Name & code required"); return; }
    const payload = { ...form, duration_months: Number(form.duration_months), fee: Number(form.fee), subjects: form.subjects.split(",").map(s=>s.trim()).filter(Boolean) };
    await api.post("/courses", payload);
    toast.success("Course created");
    setOpen(false); setForm({ name: "", code: "", description: "", duration_months: 12, fee: 0, subjects: "" });
    load();
  };

  const remove = async (id) => { await api.delete(`/courses/${id}`); toast.success("Removed"); load(); };

  return (
    <div data-testid="courses-page">
      <PageHeader
        eyebrow="Academics"
        title="Courses & programs"
        subtitle="Define curricula, subjects, durations and fees."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="course-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> New course</Button></DialogTrigger>
            <DialogContent className="rounded-sm max-w-lg">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Create course</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name"><Input data-testid="course-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Code"><Input data-testid="course-code" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Duration (months)"><Input type="number" value={form.duration_months} onChange={e=>setForm({...form,duration_months:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Fee (₹)"><Input data-testid="course-fee" type="number" value={form.fee} onChange={e=>setForm({...form,fee:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Subjects (comma-separated)" full><Input value={form.subjects} onChange={e=>setForm({...form,subjects:e.target.value})} className="rounded-sm" placeholder="Physics, Chemistry, Math"/></Field>
                <Field label="Description" full><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-sm"/></Field>
              </div>
              <DialogFooter><Button data-testid="course-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(c => (
          <div key={c.id} className="swiss-card p-5" data-testid={`course-card-${c.id}`}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-slate-900 text-white grid place-items-center"><BookOpen size={18}/></div>
              <button onClick={()=>remove(c.id)} className="text-slate-400 hover:text-red-600" data-testid={`course-delete-${c.id}`}><Trash2 size={14}/></button>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mt-4">{c.code}</div>
            <div className="font-display text-xl font-bold tracking-tight mt-1">{c.name}</div>
            <div className="text-sm text-slate-600 mt-2 line-clamp-2">{c.description || "—"}</div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1 text-xs text-slate-600"><Clock size={12}/> {c.duration_months} months</div>
              <div className="font-display font-black text-lg">₹{(c.fee||0).toLocaleString("en-IN")}</div>
            </div>
            {c.subjects?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {c.subjects.map(s => <span key={s} className="pill pill-slate flex items-center gap-1"><Tag size={10}/>{s}</span>)}
              </div>
            )}
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No courses yet</div>}
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
