import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

export default function Timetable() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [batches, setBatches] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [tests, setTests] = useState([]);
  const [batchId, setBatchId] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ batch_id: "", day: "mon", start_time: "09:00", end_time: "10:00", subject: "", faculty_id: "", classroom: "" });

  const [activeSlot, setActiveSlot] = useState(null);
  const [slotAssignments, setSlotAssignments] = useState([]);

  const handleSlotClick = async (slot) => {
    setActiveSlot(slot);
    setSlotAssignments([]);
    try {
      const res = await api.get(`/assignments?timetable_slot_id=${slot.id}`);
      setSlotAssignments(res.data);
    } catch (e) {
      console.warn("Could not load slot assignments", e);
    }
  };

  const load = () => api.get("/timetable").then(r => setSlots(r.data));
  useEffect(() => {
    load();
    api.get("/batches").then(r => setBatches(r.data));
    api.get("/faculty").then(r => setFaculty(r.data));
    api.get("/tests").then(r => setTests(r.data));
  }, []);

  const create = async () => {
    if (!form.batch_id || !form.subject) { toast.error("Batch & subject required"); return; }
    await api.post("/timetable", form);
    toast.success("Slot added");
    setOpen(false);
    load();
  };

  const remove = async (id) => { await api.delete(`/timetable/${id}`); load(); };

  const filtered = batchId === "all" ? slots : slots.filter(s => s.batch_id === batchId);

  return (
    <div data-testid="timetable-page">
      <PageHeader
        eyebrow="Schedule"
        title="Weekly timetable"
        subtitle="Class, room and faculty mapping across the week."
        actions={
          <>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="rounded-sm w-44" data-testid="timetable-filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {user?.role !== "student" && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button className="rounded-sm bg-slate-950 hover:bg-slate-800" data-testid="timetable-add"><Plus size={16} /> Add slot</Button></DialogTrigger>
                <DialogContent className="rounded-sm">
                  <DialogHeader><DialogTitle className="font-display tracking-tight">Add class slot</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Batch" full>
                      <Select value={form.batch_id} onValueChange={v => setForm({ ...form, batch_id: v })}>
                        <SelectTrigger className="rounded-sm"><SelectValue placeholder="Choose" /></SelectTrigger>
                        <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Day">
                      <Select value={form.day} onValueChange={v => setForm({ ...form, day: v })}>
                        <SelectTrigger className="rounded-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d.toUpperCase()}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Subject"><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="rounded-sm" /></Field>
                    <Field label="Start"><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="rounded-sm" /></Field>
                    <Field label="End"><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="rounded-sm" /></Field>
                    <Field label="Faculty">
                      <Select value={form.faculty_id} onValueChange={v => setForm({ ...form, faculty_id: v })}>
                        <SelectTrigger className="rounded-sm"><SelectValue placeholder="Choose" /></SelectTrigger>
                        <SelectContent>{faculty.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Classroom"><Input value={form.classroom} onChange={e => setForm({ ...form, classroom: e.target.value })} className="rounded-sm" /></Field>
                  </div>
                  <DialogFooter><Button onClick={create} data-testid="timetable-save" className="rounded-sm bg-slate-950 hover:bg-slate-800">Add slot</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </>
        }
      />

      <div className={`bg-white border border-slate-200 overflow-x-auto ${slots.length === 0 ? 'empty-state min-h-[400px]' : ''}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-3 border-b border-r border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-500 text-left w-20">Time</th>
              {DAYS.map(d => <th key={d} className="px-3 py-3 border-b border-r border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-700 text-left">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map(h => (
              <tr key={h}>
                <td className="px-3 py-3 border-b border-r border-slate-100 text-xs font-mono text-slate-500">{h}</td>
                {DAYS.map((d, dIdx) => {
                  const slot = filtered.find(s => s.day === d && s.start_time === h);

                  const dayNum = dIdx + 1;
                  const scheduledTests = tests.filter(t => {
                    if (!t.test_date) return false;
                    if (batchId !== "all" && t.batch_id && t.batch_id !== batchId) return false;
                    const date = new Date(t.test_date);
                    if (date.getDay() !== dayNum) return false;
                    const hr = date.getHours().toString().padStart(2, '0') + ":00";
                    return hr === h;
                  });

                  return (
                    <td key={d} className="px-2 py-2 border-b border-r border-slate-100 align-top h-16 min-w-[120px]">
                      {slot && (
                        <div onClick={() => handleSlotClick(slot)} className="bg-slate-900 text-white p-2 text-xs group relative cursor-pointer hover:bg-slate-800 transition-colors rounded-sm mb-2" data-testid={`slot-${slot.id}`}>
                          <div className="font-bold">{slot.subject}</div>
                          <div className="text-slate-300 text-[10px]">{faculty.find(f => f.id === slot.faculty_id)?.name || ""}</div>
                          <div className="text-slate-400 text-[10px]">{slot.classroom}</div>
                          {user?.role !== "student" && (
                            <button onClick={(e) => { e.stopPropagation(); remove(slot.id) }} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"><Trash2 size={10} /></button>
                          )}
                        </div>
                      )}
                      {scheduledTests.map(t => (
                        <div key={t.id} className="bg-indigo-600 text-white p-2 text-xs rounded-sm mb-2 relative group cursor-default shadow-sm border border-indigo-700">
                          <div className="flex items-center gap-1 mb-1 text-indigo-200">
                            <BookOpen size={10} /> <span className="uppercase tracking-widest text-[8px] font-bold">TEST</span>
                          </div>
                          <div className="font-bold">{t.title}</div>
                          <div className="text-indigo-200 text-[10px] mt-0.5">{t.subject}</div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Class Details Modal */}
      <Dialog open={!!activeSlot} onOpenChange={(o) => { if (!o) setActiveSlot(null); }}>
        <DialogContent className="rounded-sm max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight text-xl">{activeSlot?.subject} Class</DialogTitle>
            <div className="text-sm text-slate-500">
              {activeSlot?.day.toUpperCase()} at {activeSlot?.start_time} &bull; {activeSlot?.classroom} &bull; {faculty.find(f => f.id === activeSlot?.faculty_id)?.name || "No Faculty"}
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
              <BookOpen size={16} /> Linked Assignments
            </h4>
            {slotAssignments.length === 0 ? (
              <div className="text-sm text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-sm">
                No assignments linked to this class.
              </div>
            ) : (
              <div className="space-y-3">
                {slotAssignments.map(a => (
                  <div key={a.id} className="p-3 border border-slate-200 rounded-sm bg-slate-50 flex justify-between items-start">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{a.title}</div>
                      <div className="text-xs text-slate-600 line-clamp-1">{a.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-indigo-600">{a.max_marks} marks</div>
                      {a.due_date && <div className="text-[10px] text-slate-500 mt-1">Due: {a.due_date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveSlot(null)} className="rounded-sm">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
