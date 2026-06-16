import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, Save, ScanLine } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [method, setMethod] = useState("manual");
  const [marks, setMarks] = useState({}); // student_id -> status
  const [summary, setSummary] = useState({});

  useEffect(() => {
    api.get("/batches").then(r => setBatches(r.data));
    api.get("/students").then(r => setStudents(r.data));
  }, []);

  useEffect(() => {
    if (!batchId) return;
    api.get(`/attendance?batch_id=${batchId}&date=${date}`).then(r => {
      const m = {};
      r.data.forEach(a => { m[a.student_id] = a.status; });
      setMarks(m);
    });
    api.get(`/attendance/summary?batch_id=${batchId}`).then(r => setSummary(r.data));
  }, [batchId, date]);

  const batchStudents = useMemo(() => {
    if (!batchId) return [];
    return students.filter(s => s.batch_id === batchId);
  }, [students, batchId]);

  const mark = (id, status) => setMarks({ ...marks, [id]: status });

  const allPresent = () => { const m = {}; batchStudents.forEach(s => { m[s.id] = "present"; }); setMarks(m); };

  const save = async () => {
    if (!batchId) { toast.error("Pick a batch"); return; }
    const items = batchStudents.map(s => ({ student_id: s.id, status: marks[s.id] || "absent" }));
    await api.post("/attendance/bulk", { batch_id: batchId, date, method, items });
    toast.success("Attendance saved");
    api.get(`/attendance/summary?batch_id=${batchId}`).then(r => setSummary(r.data));
  };

  return (
    <div data-testid="attendance-page">
      <PageHeader
        eyebrow="Daily ops"
        title="Attendance"
        subtitle="Mark attendance via manual, QR, RFID or face-recognition (mocked). Reports auto-update."
        actions={<Button data-testid="attendance-save" onClick={save} className="rounded-sm bg-slate-950 hover:bg-slate-800"><Save size={16}/> Save attendance</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Marked" value={summary.total ?? 0} accent="slate" />
        <KpiCard label="Present" value={summary.present ?? 0} accent="emerald" />
        <KpiCard label="Absent" value={summary.absent ?? 0} accent="red" />
        <KpiCard label="Rate" value={`${summary.rate ?? 0}%`} accent="blue" />
      </div>

      <div className="swiss-card p-5 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Batch</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger className="rounded-sm mt-2" data-testid="attendance-batch"><SelectValue placeholder="Select batch"/></SelectTrigger>
              <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Date</Label>
            <Input data-testid="attendance-date" type="date" value={date} onChange={e=>setDate(e.target.value)} className="rounded-sm mt-2"/>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-widest">Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="rounded-sm mt-2"><SelectValue/></SelectTrigger>
              <SelectContent>
                {["manual","qr","rfid","face"].map(m => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={allPresent} className="rounded-sm w-full" data-testid="attendance-all-present"><Check size={14}/> Mark all present</Button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-bold">Roll</th>
              <th className="px-4 py-3 font-bold">Student</th>
              <th className="px-4 py-3 font-bold">Phone</th>
              <th className="px-4 py-3 font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {!batchId && <tr><td colSpan={4} className="text-center text-sm text-slate-500 py-10">Pick a batch to mark attendance</td></tr>}
            {batchStudents.map(s => (
              <tr key={s.id} className="border-b border-slate-100" data-testid={`attendance-row-${s.id}`}>
                <td className="px-4 py-3 font-mono text-xs">{s.roll_no || "—"}</td>
                <td className="px-4 py-3 font-semibold">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {[
                      ["present", Check, "emerald"],
                      ["absent", X, "red"],
                      ["late", Clock, "amber"],
                    ].map(([key, Icon, color]) => (
                      <button
                        key={key}
                        data-testid={`attendance-${key}-${s.id}`}
                        onClick={()=>mark(s.id, key)}
                        className={`w-8 h-8 grid place-items-center border ${marks[s.id]===key ? `bg-${color}-600 text-white border-${color}-600` : "border-slate-200 text-slate-400 hover:border-slate-400"}`}
                        style={marks[s.id]===key ? { background: color === "emerald" ? "#34C759" : color === "red" ? "#FF3B30" : "#FFCC00", color: color === "amber" ? "#0f172a" : "white", borderColor: "transparent" } : {}}
                      >
                        <Icon size={14}/>
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {batchId && batchStudents.length === 0 && <tr><td colSpan={4} className="empty-state text-center text-sm text-slate-500 py-10">No students assigned to this batch yet. Assign students from Students page.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
