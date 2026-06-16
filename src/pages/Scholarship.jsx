import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Award, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Scholarship() {
  return (
    <div data-testid="scholarship-page">
      <PageHeader eyebrow="Acquisition" title="Scholarship exam system" subtitle="Run scholarship exams, register candidates and award scholarships based on rank." />
      <Tabs defaultValue="exams">
        <TabsList className="rounded-sm bg-transparent border border-slate-200 p-0 h-auto">
          <TabsTrigger value="exams" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold">Exams</TabsTrigger>
          <TabsTrigger value="registrations" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold">Registrations</TabsTrigger>
        </TabsList>
        <TabsContent value="exams" className="mt-6"><Exams/></TabsContent>
        <TabsContent value="registrations" className="mt-6"><Registrations/></TabsContent>
      </Tabs>
    </div>
  );
}

function Exams() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", exam_date: "", registration_fee: 0, max_scholarship_pct: 100, description: "" });

  const load = () => api.get("/scholarship-exams").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    await api.post("/scholarship-exams", { ...form, registration_fee: Number(form.registration_fee), max_scholarship_pct: Number(form.max_scholarship_pct) });
    toast.success("Exam created"); setOpen(false); load();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-sm bg-slate-950 hover:bg-slate-800" data-testid="scholarship-exam-add"><Plus size={16}/> New exam</Button></DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader><DialogTitle className="font-display tracking-tight">Create scholarship exam</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Title" full><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Date"><Input type="date" value={form.exam_date} onChange={e=>setForm({...form,exam_date:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Registration fee (₹)"><Input type="number" value={form.registration_fee} onChange={e=>setForm({...form,registration_fee:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Max scholarship %" full><Input type="number" value={form.max_scholarship_pct} onChange={e=>setForm({...form,max_scholarship_pct:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Description" full><Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-sm"/></Field>
            </div>
            <DialogFooter><Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(e => (
          <div key={e.id} className="swiss-card p-5">
            <div className="flex items-start justify-between">
              <Award size={20}/>
              <button onClick={async()=>{await api.delete(`/scholarship-exams/${e.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
            <div className="font-display text-lg font-bold mt-3">{e.title}</div>
            <div className="text-xs text-slate-500 mt-1">{e.exam_date}</div>
            <div className="text-sm text-slate-600 mt-2">{e.description}</div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span>Fee <b className="font-mono">₹{e.registration_fee}</b></span>
              <span>Max <b>{e.max_scholarship_pct}%</b></span>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No exams</div>}
      </div>
    </>
  );
}

function Registrations() {
  const [list, setList] = useState([]);
  const [exams, setExams] = useState([]);
  const [form, setForm] = useState({ exam_id: "", name: "", phone: "", email: "" });

  const load = () => api.get("/scholarship-registrations").then(r => setList(r.data));
  useEffect(() => { load(); api.get("/scholarship-exams").then(r => setExams(r.data)); }, []);

  const create = async () => {
    if (!form.exam_id || !form.name || !form.phone) { toast.error("Exam, name, phone required"); return; }
    await api.post("/scholarship-registrations", form);
    toast.success("Registered"); setForm({ exam_id: "", name: "", phone: "", email: "" }); load();
  };

  return (
    <>
      <div className="swiss-card p-5 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <Field label="Exam">
          <select value={form.exam_id} onChange={e=>setForm({...form,exam_id:e.target.value})} className="rounded-sm border border-slate-300 px-3 py-2 text-sm w-full">
            <option value="">Pick…</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </Field>
        <Field label="Name"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Phone"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-sm"/></Field>
        <Field label="Email"><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="rounded-sm"/></Field>
        <Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={14}/> Register</Button>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 font-bold">Name</th>
            <th className="px-4 py-3 font-bold">Phone</th>
            <th className="px-4 py-3 font-bold">Email</th>
            <th className="px-4 py-3 font-bold text-right">Score</th>
            <th className="px-4 py-3 font-bold text-right">Rank</th>
            <th className="px-4 py-3 font-bold text-right">Scholarship</th>
          </tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.phone}</td>
                <td className="px-4 py-3 text-slate-600">{r.email || "—"}</td>
                <td className="px-4 py-3 text-right font-mono">{r.score ?? "—"}</td>
                <td className="px-4 py-3 text-right">{r.rank ?? "—"}</td>
                <td className="px-4 py-3 text-right">{r.scholarship_pct != null ? <span className="pill pill-green">{r.scholarship_pct}%</span> : "—"}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="empty-state text-center text-sm text-slate-500 py-10">No registrations</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs font-bold uppercase tracking-widest">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
