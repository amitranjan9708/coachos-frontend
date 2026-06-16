import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, BookOpen, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Assignments() {
  const [tab, setTab] = useState("assignments");
  return (
    <div data-testid="assignments-page">
      <PageHeader eyebrow="Learning" title="Assignments & LMS" subtitle="Homework, notes, recorded lectures and learning material." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-sm bg-transparent border border-slate-200 p-0 h-auto">
          <TabsTrigger value="assignments" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="tab-assignments">Assignments</TabsTrigger>
          <TabsTrigger value="materials" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="tab-materials">Study materials</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments" className="mt-6"><AssignmentsList/></TabsContent>
        <TabsContent value="materials" className="mt-6"><MaterialsList/></TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentsList() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [batches, setBatches] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [papers, setPapers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ 
    title: "", description: "", batch_id: "", timetable_slot_id: "", 
    subject: "", due_date: "", max_marks: 100, paper_code: "",
    allow_reattempt: false, max_reattempts: 1
  });

  const load = () => api.get("/assignments").then(r => setList(r.data));
  useEffect(() => { 
    load(); 
    api.get("/batches").then(r => setBatches(r.data)); 
    api.get("/question-papers").then(r => setPapers(r.data));
  }, []);

  useEffect(() => {
    if (form.batch_id) {
      api.get("/timetable").then(r => {
        setTimetableSlots(r.data.filter(s => s.batch_id === form.batch_id));
      });
    } else {
      setTimetableSlots([]);
    }
  }, [form.batch_id]);

  const create = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    await api.post("/assignments", { ...form, max_marks: Number(form.max_marks) });
    toast.success("Assignment posted"); setOpen(false); load();
  };

  return (
    <>
      {user?.role !== "student" && (
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="assignment-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> New assignment</Button></DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader><DialogTitle className="font-display tracking-tight">Post assignment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Title"><Input data-testid="assignment-title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Description"><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-sm"/></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Max marks"><Input type="number" value={form.max_marks} onChange={e=>setForm({...form,max_marks:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Due date"><Input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} className="rounded-sm"/></Field>
                <Field label="Batch">
                  <Select value={form.batch_id} onValueChange={v=>setForm({...form,batch_id:v})}>
                    <SelectTrigger className="rounded-sm"><SelectValue placeholder="Choose"/></SelectTrigger>
                    <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Class (Timetable)">
                  <Select value={form.timetable_slot_id} onValueChange={v=>setForm({...form,timetable_slot_id:v})}>
                    <SelectTrigger className="rounded-sm"><SelectValue placeholder="Optional"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {timetableSlots.map(s => <SelectItem key={s.id} value={s.id}>{s.day.toUpperCase()} {s.start_time} - {s.subject}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Question Paper Code">
                  <Select value={form.paper_code} onValueChange={v=>setForm({...form,paper_code:v})}>
                    <SelectTrigger className="rounded-sm"><SelectValue placeholder="Optional (Quiz format)"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {papers.map(p => <SelectItem key={p.id} value={p.paper_code}>{p.title} ({p.paper_code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                {form.paper_code && (
                  <div className="col-span-2 grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-sm">
                    <Field label="Allow Re-attempts?">
                      <Select value={form.allow_reattempt?"yes":"no"} onValueChange={v=>setForm({...form,allow_reattempt:v==="yes"})}>
                        <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    {form.allow_reattempt && (
                      <Field label="Max Re-attempts">
                        <Input type="number" value={form.max_reattempts} onChange={e=>setForm({...form,max_reattempts:Number(e.target.value)})} className="rounded-sm"/>
                      </Field>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter><Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Post</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map(a => (
          <div key={a.id} className="swiss-card p-5" data-testid={`assignment-card-${a.id}`}>
            <div className="flex items-start justify-between">
              <FileText size={20} className="text-slate-700"/>
              {user?.role !== "student" && (
                <button onClick={async()=>{await api.delete(`/assignments/${a.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
              )}
            </div>
            <div className="font-display text-lg font-bold mt-3">{a.title}</div>
            <div className="text-xs text-slate-500 mt-1">{a.subject}</div>
            <div className="text-sm text-slate-600 mt-2 line-clamp-2">{a.description}</div>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
              <span className="flex items-center gap-1 text-slate-600"><Calendar size={11}/> {a.due_date || "—"}</span>
              <span className="font-display font-black text-base">{a.max_marks} marks</span>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No assignments</div>}
      </div>
    </>
  );
}

function MaterialsList() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "pdf", subject: "", url: "", description: "" });

  const load = () => api.get("/study-materials").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title) { toast.error("Title required"); return; }
    await api.post("/study-materials", form);
    toast.success("Material added"); setOpen(false); load();
  };

  return (
    <>
      {user?.role !== "student" && (
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-sm bg-slate-950 hover:bg-slate-800" data-testid="material-add"><Plus size={16}/> Add material</Button></DialogTrigger>
          <DialogContent className="rounded-sm">
            <DialogHeader><DialogTitle className="font-display tracking-tight">Add study material</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Title"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-sm"/></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Select value={form.type} onValueChange={v=>setForm({...form,type:v})}>
                    <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                    <SelectContent>{["pdf","notes","video"].map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>
              </div>
              <Field label="URL"><Input value={form.url} onChange={e=>setForm({...form,url:e.target.value})} className="rounded-sm" placeholder="https://…"/></Field>
              <Field label="Description"><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-sm"/></Field>
            </div>
            <DialogFooter><Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Add</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(m => (
          <div key={m.id} className="swiss-card p-5" data-testid={`material-card-${m.id}`}>
            <div className="flex items-start justify-between">
              <BookOpen size={20} className="text-slate-700"/>
              <span className="pill pill-blue">{m.type}</span>
            </div>
            <div className="font-display text-lg font-bold mt-3">{m.title}</div>
            <div className="text-xs text-slate-500">{m.subject}</div>
            <div className="text-sm text-slate-600 mt-2 line-clamp-2">{m.description}</div>
            {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline mt-3 inline-block">Open material →</a>}
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No materials</div>}
      </div>
    </>
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
