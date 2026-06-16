import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Layers, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Batches() {
  const [list, setList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", course_id: "", faculty_id: "", classroom: "", capacity: 60, schedule: "" });

  const load = () => api.get("/batches").then(r => setList(r.data));
  useEffect(() => {
    load();
    api.get("/courses").then(r => setCourses(r.data));
    api.get("/faculty").then(r => setFaculty(r.data));
  }, []);

  const create = async () => {
    if (!form.name || !form.course_id) { toast.error("Name & course required"); return; }
    await api.post("/batches", { ...form, capacity: Number(form.capacity) });
    toast.success("Batch created");
    setOpen(false); setForm({ name: "", course_id: "", faculty_id: "", classroom: "", capacity: 60, schedule: "" });
    load();
  };

  return (
    <div data-testid="batches-page">
      <PageHeader
        eyebrow="Academics"
        title="Batches & sections"
        subtitle="Group students under faculty, classroom and schedule."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button data-testid="batch-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> New batch</Button></DialogTrigger>
            <DialogContent className="rounded-sm">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Create batch</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Field label="Batch name"><Input data-testid="batch-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Course">
                  <Select value={form.course_id} onValueChange={v=>setForm({...form,course_id:v})}>
                    <SelectTrigger className="rounded-sm" data-testid="batch-course"><SelectValue placeholder="Select course"/></SelectTrigger>
                    <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Faculty">
                  <Select value={form.faculty_id} onValueChange={v=>setForm({...form,faculty_id:v})}>
                    <SelectTrigger className="rounded-sm"><SelectValue placeholder="Assign faculty"/></SelectTrigger>
                    <SelectContent>{faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Classroom"><Input value={form.classroom} onChange={e=>setForm({...form,classroom:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Capacity"><Input type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} className="rounded-sm"/></Field>
                </div>
                <Field label="Schedule (e.g. Mon-Fri 5-7 PM)"><Input value={form.schedule} onChange={e=>setForm({...form,schedule:e.target.value})} className="rounded-sm"/></Field>
              </div>
              <DialogFooter><Button data-testid="batch-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Create batch</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(b => (
          <div key={b.id} className="swiss-card p-5" data-testid={`batch-card-${b.id}`}>
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-slate-100 grid place-items-center"><Layers size={18}/></div>
              <button onClick={async()=>{await api.delete(`/batches/${b.id}`); toast.success("Removed"); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
            <div className="font-display text-xl font-bold mt-4">{b.name}</div>
            <div 
              onClick={() => {
                navigator.clipboard.writeText(b.id);
                toast.success("Batch code copied!");
              }} 
              className="text-[10px] font-mono text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors select-all"
              title="Click to copy batch code"
            >
              Code: {b.id}
            </div>
            <div className="text-xs text-slate-500 mt-1">{courses.find(c=>c.id===b.course_id)?.name || "—"}</div>
            <div className="text-xs text-slate-600 mt-3">{b.schedule || "Schedule TBD"}</div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
              <span>Capacity <b>{b.enrolled || 0}/{b.capacity}</b></span>
              <span>Classroom <b>{b.classroom || "—"}</b></span>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No batches yet</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
