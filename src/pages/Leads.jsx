import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Phone, Mail, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { key: "new", label: "New", color: "#94a3b8" },
  { key: "contacted", label: "Contacted", color: "#0ea5e9" },
  { key: "qualified", label: "Qualified", color: "#002FA7" },
  { key: "counseling", label: "Counseling", color: "#7c3aed" },
  { key: "negotiation", label: "Negotiation", color: "#FFCC00" },
  { key: "converted", label: "Converted", color: "#34C759" },
  { key: "lost", label: "Lost", color: "#FF3B30" },
];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", source: "walk_in", course_interest: "", notes: "" });

  const load = () => api.get("/leads").then(r => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone required"); return; }
    await api.post("/leads", form);
    toast.success("Lead added");
    setOpen(false);
    setForm({ name: "", phone: "", email: "", source: "walk_in", course_interest: "", notes: "" });
    load();
  };

  const moveStage = async (id, stage) => {
    await api.patch(`/leads/${id}/stage`, { stage });
    toast.success(`Moved to ${stage}`);
    load();
  };

  const convert = async (id) => {
    await api.post(`/leads/${id}/convert`);
    toast.success("Converted to student");
    load();
  };

  const grouped = STAGES.map(s => ({ ...s, items: leads.filter(l => l.stage === s.key) }));

  return (
    <div data-testid="leads-page">
      <PageHeader
        eyebrow="Admissions CRM"
        title="Leads pipeline"
        subtitle="Drag prospects through stages. Convert with one click into enrolled students."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="lead-add-button" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> New lead</Button>
            </DialogTrigger>
            <DialogContent className="rounded-sm">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Capture new lead</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Field label="Name"><Input data-testid="lead-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm" /></Field>
                <Field label="Phone"><Input data-testid="lead-phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="rounded-sm" /></Field>
                <Field label="Email"><Input data-testid="lead-email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="rounded-sm" /></Field>
                <Field label="Source">
                  <Select value={form.source} onValueChange={v=>setForm({...form,source:v})}>
                    <SelectTrigger className="rounded-sm" data-testid="lead-source"><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {["walk_in","website","referral","instagram","facebook","phone"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Course interest"><Input data-testid="lead-course" value={form.course_interest} onChange={e=>setForm({...form,course_interest:e.target.value})} className="rounded-sm" /></Field>
                <Field label="Notes"><Textarea data-testid="lead-notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="rounded-sm" /></Field>
              </div>
              <DialogFooter><Button data-testid="lead-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Save lead</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="kanban-board">
        {grouped.map(col => (
          <div key={col.key} className="bg-white border border-slate-200 flex flex-col min-h-[420px]" data-testid={`column-${col.key}`}>
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2" style={{background: col.color}} />
                <span className="text-xs font-bold uppercase tracking-widest">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-slate-500">{col.items.length}</span>
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {col.items.map(l => (
                <div key={l.id} className="border border-slate-200 p-3 bg-white hover:border-slate-900 transition-colors" data-testid={`lead-card-${l.id}`}>
                  <div className="font-semibold text-sm">{l.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone size={11}/> {l.phone}</div>
                  {l.email && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={11}/> {l.email}</div>}
                  {l.course_interest && <div className="text-xs text-slate-700 mt-2 font-medium">{l.course_interest}</div>}
                  <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Source · {l.source}</div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                    <Select onValueChange={(v)=>moveStage(l.id, v)} defaultValue={l.stage}>
                      <SelectTrigger className="h-7 text-xs rounded-sm" data-testid={`lead-stage-${l.id}`}><SelectValue/></SelectTrigger>
                      <SelectContent>{STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                    {l.stage !== "converted" && (
                      <Button size="sm" variant="outline" className="rounded-sm h-7 text-xs" onClick={()=>convert(l.id)} data-testid={`lead-convert-${l.id}`}><ArrowRight size={11}/></Button>
                    )}
                  </div>
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="empty-state text-xs text-slate-400 text-center py-8 border border-dashed border-slate-200">Empty</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest text-slate-700">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
