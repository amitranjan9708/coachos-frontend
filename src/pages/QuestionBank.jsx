import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, BookCheck } from "lucide-react";
import { toast } from "sonner";

export default function QuestionBank() {
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState({ subject: "", difficulty: "all" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ text: "", type: "mcq", subject: "", topic: "", difficulty: "medium", options: ["", "", "", ""], correct_answer: "", marks: 1, explanation: "", image_url: "" });
  const [imageFile, setImageFile] = useState(null);

  // Generator States
  const [genMode, setGenMode] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genSettings, setGenSettings] = useState({
    title: "", paper_code: `GEN-${Date.now()}`, target_total_marks: 100, duration_minutes: 60
  });
  const [selectedQs, setSelectedQs] = useState({});

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 50;
  const observerTarget = useRef(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (filter.subject) params.append("subject", filter.subject);
    if (filter.difficulty !== "all") params.append("difficulty", filter.difficulty);
    
    api.get(`/questions?${params.toString()}`).then(r => {
      if (r.data && Array.isArray(r.data.items)) {
        setList(prev => page === 1 ? r.data.items : [...prev, ...r.data.items]);
        setTotalPages(r.data.total_pages);
      } else {
        if (page === 1) setList(r.data || []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, [page, filter]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && !loading && page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [loading, page, totalPages]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1, rootMargin: "100px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const create = async () => {
    if (!form.text) { toast.error("Question text required"); return; }
    
    let uploadedImageUrl = form.image_url;
    if (imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      try {
        const res = await api.post("/questions/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data.image_url) {
          uploadedImageUrl = res.data.image_url;
        }
      } catch (e) {
        toast.error("Failed to upload image");
        return;
      }
    }

    await api.post("/questions", { ...form, image_url: uploadedImageUrl, marks: Number(form.marks), options: form.type === "mcq" ? form.options.filter(Boolean) : [] });
    toast.success("Question added"); setOpen(false);
    setForm({ text: "", type: "mcq", subject: "", topic: "", difficulty: "medium", options: ["", "", "", ""], correct_answer: "", marks: 1, explanation: "", image_url: "" });
    setImageFile(null);
    load();
  };

  // Since pagination is now server-side, we render `list` directly without filtering here.
  const filtered = list;

  const toggleQ = (q) => {
    setSelectedQs(prev => {
      const copy = { ...prev };
      if (copy[q.id]) delete copy[q.id];
      else copy[q.id] = q;
      return copy;
    });
  };

  const selList = Object.values(selectedQs);
  let curTotal = 0;
  const curSub = {};
  selList.forEach(q => {
    const marks = Number(q.marks) || 1;
    curTotal += marks;
    const sub = q.subject || "General";
    curSub[sub] = (curSub[sub] || 0) + marks;
  });

  const savePaper = async () => {
    if (!genSettings.title || !genSettings.paper_code) { toast.error("Title and paper code required!"); return; }
    if (selList.length === 0) { toast.error("No questions selected!"); return; }

    const secMap = {};
    selList.forEach((q, idx) => {
      const subName = q.subject || "Mixed";
      if (!secMap[subName]) secMap[subName] = { name: subName, subsections: [{ name: "General", questions: [] }] };
      secMap[subName].subsections[0].questions.push({
        id: `genq_${Date.now()}_${idx}`,
        type: q.type || "mcq_single",
        text: q.text,
        image_url: q.image_url,
        marks: q.marks,
        negative_marks: q.negative_marks || 0,
        options: q.options || ["", "", "", ""],
        correct_answer: q.correct_answer
      });
    });

    try {
      await api.post("/question-papers", {
        title: genSettings.title, subject: "Mixed (Generated)", paper_code: genSettings.paper_code,
        duration_minutes: Number(genSettings.duration_minutes), total_marks: curTotal,
        sections: Object.values(secMap)
      });
      toast.success("Question Paper Generated! You can find it in Question Papers.");
      setGenMode(false); setSelectedQs({});
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to save paper"); }
  };

  return (
    <div data-testid="qb-page">
      <PageHeader
        eyebrow="Library"
        title="Question bank"
        subtitle="Curate, tag and reuse questions across tests."
        actions={
          <div className="flex gap-2">
            {!genMode && (
              <Dialog open={genOpen} onOpenChange={setGenOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white"><BookCheck size={16} className="mr-2"/> Make Question Paper</Button>
                </DialogTrigger>
                <DialogContent className="rounded-sm max-w-xl">
                  <DialogHeader><DialogTitle>Question Paper Generator Settings</DialogTitle></DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Field label="Paper Title"><Input value={genSettings.title} onChange={e=>setGenSettings({...genSettings, title:e.target.value})} className="rounded-sm" /></Field>
                    <Field label="Paper Code"><Input value={genSettings.paper_code} onChange={e=>setGenSettings({...genSettings, paper_code:e.target.value})} className="rounded-sm" /></Field>
                    <Field label="Target Total Marks"><Input type="number" value={genSettings.target_total_marks} onChange={e=>setGenSettings({...genSettings, target_total_marks:Number(e.target.value)})} className="rounded-sm" /></Field>
                    <Field label="Duration (mins)"><Input type="number" value={genSettings.duration_minutes} onChange={e=>setGenSettings({...genSettings, duration_minutes:Number(e.target.value)})} className="rounded-sm" /></Field>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setGenMode(true); setGenOpen(false); }} className="rounded-sm bg-indigo-600 hover:bg-indigo-700 text-white">Start Selecting Questions</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button data-testid="question-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16}/> Add question</Button></DialogTrigger>
              <DialogContent className="rounded-sm max-w-2xl">
                <DialogHeader><DialogTitle className="font-display tracking-tight">Add question</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <Field label="Question text"><Textarea data-testid="question-text" value={form.text} onChange={e=>setForm({...form,text:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Reference Image / Graph (Optional)">
                    <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="rounded-sm" />
                  </Field>
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Type">
                      <Select value={form.type} onValueChange={v=>setForm({...form,type:v})}>
                        <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                        <SelectContent>{["mcq","subjective","coding"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>
                    <Field label="Difficulty">
                      <Select value={form.difficulty} onValueChange={v=>setForm({...form,difficulty:v})}>
                        <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                        <SelectContent>{["easy","medium","hard"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                    <Field label="Marks"><Input type="number" value={form.marks} onChange={e=>setForm({...form,marks:e.target.value})} className="rounded-sm"/></Field>
                  </div>
                  {form.type === "mcq" && (
                    <div>
                      <Label className="text-xs font-bold uppercase tracking-widest">Options</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {form.options.map((o, i) => (
                          <Input key={i} placeholder={`Option ${"ABCD"[i]}`} value={o} onChange={e=>{
                            const opts = [...form.options]; opts[i] = e.target.value; setForm({...form, options: opts});
                          }} className="rounded-sm"/>
                        ))}
                      </div>
                    </div>
                  )}
                  <Field label="Correct answer"><Input value={form.correct_answer} onChange={e=>setForm({...form,correct_answer:e.target.value})} className="rounded-sm" placeholder={form.type === "mcq" ? "Type the correct option text" : "Expected answer"}/></Field>
                  <Field label="Explanation"><Textarea value={form.explanation} onChange={e=>setForm({...form,explanation:e.target.value})} className="rounded-sm"/></Field>
                </div>
                <DialogFooter><Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Save</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {genMode && (
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 rounded-sm shadow-xl flex items-center justify-between mb-6 mx-8">
          <div>
            <div className="font-bold">Generator Active: {genSettings.title || "Untitled Paper"}</div>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-4">
              <span>Selected: {selList.length} Qs</span>
              <span>Total Marks: {curTotal} / {genSettings.target_total_marks}</span>
              {Object.entries(curSub).map(([s, m]) => (
                <span key={s} className="bg-slate-800 px-2 rounded">{s}: {m}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setGenMode(false)} className="rounded-sm">Cancel</Button>
            <Button size="sm" className="rounded-sm bg-indigo-600 hover:bg-indigo-500" onClick={savePaper}>Save Paper</Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <Input data-testid="qb-filter-subject" placeholder="Filter subject…" value={filter.subject} onChange={e=>{setFilter({...filter,subject:e.target.value}); setPage(1);}} className="rounded-sm w-48"/>
        <Select value={filter.difficulty} onValueChange={v=>{setFilter({...filter,difficulty:v}); setPage(1);}}>
          <SelectTrigger className="rounded-sm w-44" data-testid="qb-filter-difficulty"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            {["easy","medium","hard"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((q, idx) => {
          const isSelected = !!selectedQs[q.id];
          return (
          <div key={q.id} className={`swiss-card p-5 ${isSelected ? "border-indigo-500 bg-indigo-50/20 shadow-sm" : ""}`} data-testid={`question-${q.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                {genMode && (
                  <div className="pt-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleQ(q)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                  </div>
                )}
                <div className="font-mono text-xs text-slate-400 mt-1">Q{idx+1}</div>
                <div className="flex-1">
                  <div className="font-medium prose prose-slate max-w-none prose-p:my-0 prose-pre:my-0 prose-li:my-0">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.text}</ReactMarkdown>
                  </div>
                  {q.image_url && (
                    <div className="mt-2">
                      <img src={api.defaults.baseURL + q.image_url.replace('/api', '')} alt="Question Reference" className="max-h-48 rounded border border-slate-200" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="pill pill-slate">{q.type}</span>
                    <span className={`pill ${q.difficulty==='easy'?'pill-green':q.difficulty==='hard'?'pill-red':'pill-amber'}`}>{q.difficulty}</span>
                    {q.subject && <span className="pill pill-blue">{q.subject}</span>}
                    <span className="text-xs text-slate-500">· {q.marks} marks</span>
                  </div>
                  {q.options?.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mt-3 text-sm">
                      {q.options.map((o, i) => (
                        <div key={i} className={`px-2 py-1 border ${o === q.correct_answer ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold" : "border-slate-200"}`}>
                          {"ABCD"[i]}. <ReactMarkdown className="inline-block" remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{o}</ReactMarkdown>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={async()=>{await api.delete(`/questions/${q.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
          </div>
          );
        })}
        {filtered.length === 0 && !loading && <div className="empty-state text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No questions</div>}
        
        {/* Intersection Observer Target */}
        <div ref={observerTarget} className="h-10 w-full flex items-center justify-center">
          {loading && <div className="text-sm text-slate-400">Loading more...</div>}
        </div>
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
