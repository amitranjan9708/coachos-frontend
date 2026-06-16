import React, { useEffect, useState } from "react";
import api, { API, getToken } from "@/lib/api";
import { PageHeader, KpiCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ScanLine, Trophy, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function OMR() {
  return (
    <div data-testid="omr-page">
      <PageHeader eyebrow="Offline Tests" title="OMR builder & evaluation" subtitle="Build templates, set answer keys and evaluate offline OMR sheets to produce rankings." />
      <Tabs defaultValue="templates">
        <TabsList className="rounded-sm bg-transparent border border-slate-200 p-0 h-auto">
          <TabsTrigger value="templates" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="omr-tab-templates">Templates</TabsTrigger>
          <TabsTrigger value="upload" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="omr-tab-upload">Upload sheet</TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="omr-tab-bulk">Bulk PDF & Excel</TabsTrigger>
          <TabsTrigger value="evaluate" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="omr-tab-evaluate">Manual evaluate</TabsTrigger>
          <TabsTrigger value="leaderboard" className="rounded-sm data-[state=active]:bg-slate-900 data-[state=active]:text-white px-4 py-2 text-xs uppercase tracking-widest font-bold" data-testid="omr-tab-leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        <TabsContent value="templates" className="mt-6"><Templates/></TabsContent>
        <TabsContent value="upload" className="mt-6"><UploadSheet/></TabsContent>
        <TabsContent value="bulk" className="mt-6"><BulkUpload/></TabsContent>
        <TabsContent value="evaluate" className="mt-6"><Evaluate/></TabsContent>
        <TabsContent value="leaderboard" className="mt-6"><Leaderboard/></TabsContent>
      </Tabs>
    </div>
  );
}

function Templates() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", num_questions: 50, options_per_question: 4, marks_per_question: 1, negative_marking: 0.25, answer_key: "" });

  const load = () => api.get("/omr-templates").then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) { toast.error("Name required"); return; }
    const key = form.answer_key.split(",").map(s=>s.trim().toUpperCase()).filter(Boolean);
    if (key.length === 0) { toast.error("Provide answer key (comma separated A,B,C,D…)"); return; }
    await api.post("/omr-templates", {
      ...form,
      num_questions: Number(form.num_questions),
      options_per_question: Number(form.options_per_question),
      marks_per_question: Number(form.marks_per_question),
      negative_marking: Number(form.negative_marking),
      answer_key: key,
    });
    toast.success("Template saved"); setOpen(false); load();
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="omr-template-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> New template</Button></DialogTrigger>
          <DialogContent className="rounded-sm max-w-lg">
            <DialogHeader><DialogTitle className="font-display tracking-tight">OMR template</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Template name" full><Input data-testid="omr-name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Questions"><Input type="number" value={form.num_questions} onChange={e=>setForm({...form,num_questions:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Options/Q"><Input type="number" value={form.options_per_question} onChange={e=>setForm({...form,options_per_question:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Marks per Q"><Input type="number" step="0.5" value={form.marks_per_question} onChange={e=>setForm({...form,marks_per_question:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Negative marking"><Input type="number" step="0.25" value={form.negative_marking} onChange={e=>setForm({...form,negative_marking:e.target.value})} className="rounded-sm"/></Field>
              <Field label="Answer key (A,B,C,D…)" full><Input data-testid="omr-key" placeholder="A,B,C,D,A,B,C,D…" value={form.answer_key} onChange={e=>setForm({...form,answer_key:e.target.value})} className="rounded-sm"/></Field>
            </div>
            <DialogFooter><Button data-testid="omr-template-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Save template</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map(t => (
          <div key={t.id} className="swiss-card p-5" data-testid={`omr-template-${t.id}`}>
            <div className="flex items-start justify-between">
              <ScanLine size={20}/>
              <button onClick={async()=>{await api.delete(`/omr-templates/${t.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
            <div className="font-display text-lg font-bold mt-3">{t.name}</div>
            <div className="text-xs text-slate-500 mt-1">{t.num_questions} questions · {t.options_per_question} options</div>
            <div className="mt-3 grid grid-cols-2 text-xs">
              <div><span className="text-slate-500">Marks/Q</span> <b>{t.marks_per_question}</b></div>
              <div><span className="text-slate-500">Negative</span> <b>{t.negative_marking}</b></div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No templates yet</div>}
      </div>
    </>
  );
}

function UploadSheet() {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.get("/omr-templates").then(r => setTemplates(r.data)); }, []);

  const onFile = (f) => {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!templateId) { toast.error("Pick a template"); return; }
    if (!file) { toast.error("Pick an image"); return; }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("template_id", templateId);
      fd.append("student_name", studentName);
      fd.append("roll_no", rollNo);
      fd.append("file", file);
      const res = await fetch(`${API}/omr-sheets/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
      toast.success(`Score: ${data.score} · Rank #${data.rank}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 swiss-card p-5 h-fit">
        <h3 className="font-display text-lg font-bold tracking-tight mb-2">Real OMR scanner</h3>
        <p className="text-xs text-slate-500 mb-4">Upload a photo or scan of a printed OMR sheet. OpenCV detects filled bubbles and computes score against the template's answer key.</p>
        <div className="space-y-3">
          <Field label="Template">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="rounded-sm" data-testid="upload-template"><SelectValue placeholder="Pick template"/></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Student name"><Input value={studentName} onChange={e=>setStudentName(e.target.value)} className="rounded-sm" data-testid="upload-name"/></Field>
            <Field label="Roll no."><Input value={rollNo} onChange={e=>setRollNo(e.target.value)} className="rounded-sm" data-testid="upload-roll"/></Field>
          </div>
          <Field label="OMR sheet image">
            <input data-testid="upload-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onFile(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-slate-900 file:text-white file:text-xs file:uppercase file:tracking-widest file:font-bold" />
          </Field>
          <Button data-testid="upload-submit" disabled={busy} onClick={submit} className="w-full rounded-sm bg-slate-950 hover:bg-slate-800">
            {busy ? "Processing…" : (<><Upload size={14}/> Upload & evaluate</>)}
          </Button>
          {result && (
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-2">
              <div className="font-display text-4xl font-black tracking-tighter">{result.score}</div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Final score · Rank #{result.rank}</div>
              <div className="grid grid-cols-3 text-xs gap-1">
                <span className="pill pill-green justify-center">✓ {result.correct}</span>
                <span className="pill pill-red justify-center">✕ {result.wrong}</span>
                <span className="pill pill-slate justify-center">— {result.unanswered}</span>
              </div>
              {result._debug?.grid_found ? (
                <div className="text-[10px] text-emerald-700 uppercase tracking-widest">✓ Grid detected & warped</div>
              ) : (
                <div className="text-[10px] text-amber-700 uppercase tracking-widest">⚠ Grid not detected — using full image</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!preview && (
          <div className="border border-dashed border-slate-300 p-16 text-center bg-white">
            <ImageIcon size={42} className="mx-auto text-slate-400"/>
            <div className="font-display text-lg font-semibold mt-4">Preview</div>
            <div className="text-xs text-slate-500 mt-1">Pick an OMR image to see it here</div>
          </div>
        )}
        {preview && (
          <div className="bg-white border border-slate-200 p-3">
            <img src={preview} alt="OMR preview" className="w-full max-h-[600px] object-contain"/>
          </div>
        )}
        {result?.answers?.length > 0 && (
          <div className="bg-white border border-slate-200 mt-4 p-4">
            <h4 className="font-display text-sm font-bold uppercase tracking-widest mb-3">Detected answers</h4>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1 text-xs">
              {result.answers.map((a, i) => (
                <div key={i} className="border border-slate-200 px-2 py-1 text-center font-mono">
                  <span className="text-slate-400 text-[10px]">Q{i+1}</span>
                  <div className="font-bold">{a || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Evaluate() {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [student, setStudent] = useState({ student_name: "", roll_no: "" });
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const tpl = templates.find(t => t.id === templateId);

  useEffect(() => { api.get("/omr-templates").then(r => setTemplates(r.data)); }, []);
  useEffect(() => {
    if (tpl) setAnswers(Array(tpl.num_questions).fill(""));
    else setAnswers([]);
  }, [templateId]);

  const setAns = (i, v) => { const a = [...answers]; a[i] = v; setAnswers(a); };

  const simulate = () => {
    if (!tpl) return;
    // Simulate scanning: 70% match the key
    const sim = tpl.answer_key.map((k, i) => Math.random() < 0.7 ? k : ["A","B","C","D"][Math.floor(Math.random()*4)]);
    setAnswers(sim);
    toast.success("Mock scan loaded");
  };

  const submit = async () => {
    if (!templateId) { toast.error("Pick template"); return; }
    const { data } = await api.post("/omr-sheets/evaluate", {
      template_id: templateId,
      student_name: student.student_name,
      roll_no: student.roll_no,
      answers,
    });
    setResult(data);
    toast.success(`Score: ${data.score} (Rank #${data.rank})`);
  };

  const options = ["A","B","C","D","E"].slice(0, tpl?.options_per_question || 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 swiss-card p-5 h-fit sticky top-20">
        <h3 className="font-display text-lg font-bold tracking-tight mb-4">Sheet details</h3>
        <div className="space-y-3">
          <Field label="Template">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="rounded-sm" data-testid="evaluate-template"><SelectValue placeholder="Pick template"/></SelectTrigger>
              <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Student name"><Input value={student.student_name} onChange={e=>setStudent({...student,student_name:e.target.value})} className="rounded-sm"/></Field>
          <Field label="Roll no."><Input value={student.roll_no} onChange={e=>setStudent({...student,roll_no:e.target.value})} className="rounded-sm"/></Field>
          <Button onClick={simulate} variant="outline" className="w-full rounded-sm" data-testid="evaluate-simulate"><Upload size={14}/> Simulate scan</Button>
          <Button onClick={submit} className="w-full rounded-sm bg-slate-950 hover:bg-slate-800" data-testid="evaluate-submit">Evaluate</Button>
          {result && (
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-2">
              <div className="font-display text-4xl font-black tracking-tighter">{result.score}</div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Final score · Rank #{result.rank}</div>
              <div className="grid grid-cols-3 text-xs gap-1">
                <span className="pill pill-green justify-center">✓ {result.correct}</span>
                <span className="pill pill-red justify-center">✕ {result.wrong}</span>
                <span className="pill pill-slate justify-center">— {result.unanswered}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!tpl && <div className="text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">Pick a template to start</div>}
        {tpl && (
          <div className="bg-white border border-slate-200 p-4">
            <h3 className="font-display text-lg font-bold tracking-tight mb-3">Answer grid · {tpl.num_questions} questions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Array.from({length: tpl.num_questions}).map((_, i) => (
                <div key={i} className="border border-slate-200 p-2 flex items-center gap-2" data-testid={`omr-q-${i+1}`}>
                  <div className="font-mono text-xs text-slate-500 w-8">Q{i+1}</div>
                  <div className="flex gap-1">
                    {options.map(o => (
                      <button
                        key={o}
                        onClick={()=>setAns(i, o)}
                        className={`w-6 h-6 text-xs font-bold border ${answers[i] === o ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-500 hover:border-slate-900"}`}
                      >{o}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Leaderboard() {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => { api.get("/omr-templates").then(r => setTemplates(r.data)); }, []);
  useEffect(() => {
    if (!templateId) return;
    api.get(`/omr-sheets/leaderboard/${templateId}`).then(r => setRows(r.data));
  }, [templateId]);

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger className="rounded-sm w-72" data-testid="lb-template"><SelectValue placeholder="Pick template"/></SelectTrigger>
          <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-slate-200">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 font-bold">Rank</th>
            <th className="px-4 py-3 font-bold">Student</th>
            <th className="px-4 py-3 font-bold">Roll</th>
            <th className="px-4 py-3 font-bold text-right">Correct</th>
            <th className="px-4 py-3 font-bold text-right">Wrong</th>
            <th className="px-4 py-3 font-bold text-right">Score</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b border-slate-100" data-testid={`lb-row-${r.id}`}>
                <td className="px-4 py-3 font-display font-black">{r.rank <= 3 && <Trophy size={14} className="inline mr-1" style={{color: r.rank===1?'#FFCC00':r.rank===2?'#94a3b8':'#FF9500'}}/>}#{r.rank}</td>
                <td className="px-4 py-3 font-semibold">{r.student_name || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.roll_no || "—"}</td>
                <td className="px-4 py-3 text-right text-emerald-700 font-mono">{r.correct}</td>
                <td className="px-4 py-3 text-right text-red-600 font-mono">{r.wrong}</td>
                <td className="px-4 py-3 text-right font-display font-black">{r.score}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="empty-state text-center text-sm text-slate-500 py-10">No evaluated sheets</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkUpload() {
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [rosterFile, setRosterFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { api.get("/omr-templates").then(r => setTemplates(r.data)); }, []);

  const downloadRoster = async () => {
    if (!templateId) { toast.error("Pick a template first"); return; }
    try {
      const res = await fetch(`${API}/omr-sheets/roster-template/${templateId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to download roster");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roster_${templateId}.xlsx`;
      a.click();
      toast.success("Roster downloaded");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const downloadResults = async () => {
    if (!templateId) { toast.error("No template selected"); return; }
    try {
      const res = await fetch(`${API}/omr-sheets/results-excel/${templateId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error("Failed to download results");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results_${templateId}.xlsx`;
      a.click();
      toast.success("Results downloaded");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submit = async () => {
    if (!templateId) { toast.error("Pick a template"); return; }
    if (!pdfFile) { toast.error("Pick a PDF file"); return; }
    setBusy(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("template_id", templateId);
      fd.append("pdf", pdfFile);
      if (rosterFile) fd.append("roster", rosterFile);

      const res = await fetch(`${API}/omr-sheets/upload-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      setResult(data);
      toast.success(`Bulk evaluation complete! Processed ${data.pages_processed || 0} pages.`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="swiss-card p-5 h-fit">
        <h3 className="font-display text-lg font-bold tracking-tight mb-2">1. Prepare Roster</h3>
        <p className="text-xs text-slate-500 mb-4">Select a template and download an Excel roster. Fill it with student names in the exact order their OMR sheets will appear in the scanned PDF.</p>
        <div className="space-y-3">
          <Field label="Template">
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="rounded-sm" data-testid="bulk-template"><SelectValue placeholder="Pick template"/></SelectTrigger>
              <SelectContent>
                {templates.length === 0 && <SelectItem value="none" disabled>No templates found</SelectItem>}
                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Button disabled={!templateId} onClick={downloadRoster} className="w-full rounded-sm bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300">
            Download Excel Roster
          </Button>
        </div>
      </div>

      <div className="swiss-card p-5 h-fit">
        <h3 className="font-display text-lg font-bold tracking-tight mb-2">2. Upload & Evaluate</h3>
        <p className="text-xs text-slate-500 mb-4">Upload the completed Excel roster along with a single PDF containing all scanned OMR sheets. The order in the PDF must match the roster.</p>
        <div className="space-y-4">
          <Field label="Filled Excel Roster (Optional)">
            <input type="file" accept=".xlsx" onChange={e=>setRosterFile(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-slate-900 file:text-white file:text-xs file:uppercase file:tracking-widest file:font-bold" />
          </Field>
          <Field label="Scanned Sheets (PDF) (Required)">
            <input type="file" accept="application/pdf" onChange={e=>setPdfFile(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 file:mr-3 file:py-2 file:px-3 file:border-0 file:bg-slate-900 file:text-white file:text-xs file:uppercase file:tracking-widest file:font-bold" />
          </Field>
          <Button disabled={busy} onClick={submit} className="w-full rounded-sm bg-slate-950 hover:bg-slate-800">
            {busy ? "Evaluating..." : (<><Upload size={14} className="inline mr-2"/> Run Bulk Evaluation</>)}
          </Button>

          {result && (
            <div className="border-t border-slate-200 pt-4 mt-2 space-y-3">
              <div className="pill pill-green justify-center w-full">{result.message}</div>
              <Button onClick={downloadResults} className="w-full rounded-sm bg-emerald-700 hover:bg-emerald-800 text-white">
                Download Evaluated Results (Excel)
              </Button>
            </div>
          )}
        </div>
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
