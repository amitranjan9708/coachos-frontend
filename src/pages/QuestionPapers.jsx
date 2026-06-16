import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, Clock, Trash2, Download, Copy, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";

export default function QuestionPapers() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: "", subject: "", duration_minutes: 60, total_marks: 100,
    paper_code: "", sections: []
  });

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: "", subject: "", type: "online", paper_code: "", 
    test_date: "", login_window_minutes: 30, batch_id: "",
    allow_reattempt: false, max_reattempts: 1
  });
  
  const [batches, setBatches] = useState([]);

  const load = async () => {
    const [qpRes, bRes] = await Promise.all([
      api.get("/question-papers"),
      api.get("/batches")
    ]);
    setList(qpRes.data);
    setBatches(bRes.data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title || !form.paper_code) { toast.error("Title and Paper Code required"); return; }
    await api.post("/question-papers", {
      ...form,
      duration_minutes: Number(form.duration_minutes),
      total_marks: Number(form.total_marks)
    });
    toast.success("Question Paper created"); setOpen(false); load();
  };

  const downloadPdf = async (code, title) => {
    try {
      const res = await api.get(`/question-papers/${code}/pdf`, { responseType: 'blob' });
      const safeTitle = (title || "Question_Paper").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${safeTitle}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error("PDF generation failed");
    }
  };

  const addSection = () => {
    setForm({
      ...form,
      sections: [...form.sections, { name: "New Section", subsections: [] }]
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Paper code copied!");
  };

  const handleScheduleOpen = (paper) => {
    setScheduleForm({
      title: paper.title + " - Exam",
      subject: paper.subject,
      type: "online",
      paper_code: paper.paper_code,
      test_date: "",
      login_window_minutes: 30,
      batch_id: "",
      allow_reattempt: false, max_reattempts: 1
    });
    setScheduleOpen(true);
  };

  const scheduleTest = async () => {
    if (!scheduleForm.title || !scheduleForm.paper_code) { toast.error("Title and Paper Code required"); return; }
    try {
      await api.post("/tests", {
        ...scheduleForm,
        login_window_minutes: Number(scheduleForm.login_window_minutes)
      });
      toast.success("Test successfully scheduled! View it in the Tests tab.");
      setScheduleOpen(false);
    } catch (e) {
      toast.error("Failed to schedule test");
    }
  };

  return (
    <div data-testid="question-papers-page">
      <PageHeader
        eyebrow="Content"
        title="Question Papers"
        subtitle="Create reusable question papers or browse the massive Local Question Bank for JEE."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="paper-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16} className="mr-2"/> New Paper</Button>
            </DialogTrigger>
            <DialogContent className="rounded-sm max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display tracking-tight">Create Question Paper</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <Field label="Title"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-sm"/></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Paper Code (Unique)"><Input value={form.paper_code} onChange={e=>setForm({...form,paper_code:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Duration (mins)"><Input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Total marks"><Input type="number" value={form.total_marks} onChange={e=>setForm({...form,total_marks:e.target.value})} className="rounded-sm"/></Field>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-bold uppercase tracking-widest">Test Structure</Label>
                    <div className="flex gap-2">
                      <Label className="cursor-pointer border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-sm text-xs font-medium flex items-center">
                        <Upload size={14} className="mr-1"/> Auto-Parse PDF
                        <input type="file" accept=".pdf" className="hidden" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const tId = toast.loading("Parsing PDF via AI... this may take up to 30 seconds.");
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            const res = await api.post("/question-papers/parse-pdf", formData, { headers: { "Content-Type": "multipart/form-data" } });
                            if (res.data.questions && res.data.questions.length > 0) {
                              const newSecs = [...form.sections];
                              if (newSecs.length === 0) newSecs.push({ name: "Parsed Questions", subsections: [{ name: "General", questions: [] }] });
                              newSecs[0].subsections[0].questions = [...newSecs[0].subsections[0].questions, ...res.data.questions];
                              setForm({ ...form, sections: newSecs });
                              toast.success("Successfully parsed PDF and added questions!", { id: tId });
                            } else {
                              toast.error("No questions found in PDF.", { id: tId });
                            }
                          } catch (err) {
                            toast.error(err.response?.data?.detail || "Failed to parse PDF. Is GEMINI_API_KEY set?", { id: tId });
                          }
                          e.target.value = null;
                        }} />
                      </Label>
                      <Button size="sm" variant="outline" onClick={addSection}>+ Add Section</Button>
                    </div>
                  </div>
                  {form.sections.map((sec, i) => (
                    <div key={i} className="p-3 border rounded mb-2 bg-slate-50">
                      <Input value={sec.name} onChange={e => {
                        const newSecs = [...form.sections];
                        newSecs[i].name = e.target.value;
                        setForm({...form, sections: newSecs});
                      }} className="mb-2 font-bold" />
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => {
                        const newSecs = [...form.sections];
                        newSecs[i].subsections.push({ name: "Subsection", questions: [] });
                        setForm({...form, sections: newSecs});
                      }}>+ Add Subsection</Button>
                      
                      {sec.subsections.map((sub, j) => (
                        <div key={j} className="ml-4 p-2 border-l-2 border-slate-300 mt-2">
                          <Input value={sub.name} onChange={e => {
                            const newSecs = [...form.sections];
                            newSecs[i].subsections[j].name = e.target.value;
                            setForm({...form, sections: newSecs});
                          }} className="mb-2 text-sm" />
                          <Button size="sm" variant="outline" className="text-xs mb-2" onClick={() => {
                            const newSecs = [...form.sections];
                            newSecs[i].subsections[j].questions.push({ id: `q_${Date.now()}`, type: "mcq_single", text: "New Question", marks: 1, negative_marks: 0, options: ["", "", "", ""], correct_answer: "" });
                            setForm({...form, sections: newSecs});
                          }}>+ Add Question</Button>
                          
                          {sub.questions.map((q, k) => (
                            <div key={k} className="ml-4 p-2 bg-white border rounded mt-1 grid gap-2">
                              <div className="flex gap-2">
                                <Input className="flex-1" value={q.text} placeholder="Question Text" onChange={e => {
                                  const newSecs = [...form.sections];
                                  newSecs[i].subsections[j].questions[k].text = e.target.value;
                                  setForm({...form, sections: newSecs});
                                }}/>
                                <Select value={q.type || "mcq_single"} onValueChange={v => {
                                  const newSecs = [...form.sections];
                                  newSecs[i].subsections[j].questions[k].type = v;
                                  setForm({...form, sections: newSecs});
                                }}>
                                  <SelectTrigger className="w-40 rounded-sm"><SelectValue/></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mcq_single">MCQ (Single)</SelectItem>
                                    <SelectItem value="mcq_multiple">MCQ (Multiple)</SelectItem>
                                    <SelectItem value="integer">Integer</SelectItem>
                                    <SelectItem value="subjective">Subjective</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Input type="number" placeholder="Marks" value={q.marks} onChange={e => {
                                  const newSecs = [...form.sections];
                                  newSecs[i].subsections[j].questions[k].marks = e.target.value;
                                  setForm({...form, sections: newSecs});
                                }}/>
                                <Input type="number" placeholder="Neg Marks" value={q.negative_marks} onChange={e => {
                                  const newSecs = [...form.sections];
                                  newSecs[i].subsections[j].questions[k].negative_marks = e.target.value;
                                  setForm({...form, sections: newSecs});
                                }}/>
                                {q.type !== "subjective" && (
                                  <Input placeholder={q.type === "mcq_multiple" ? "Correct Answers (comma separated)" : "Correct Answer (exact text)"} value={q.correct_answer} onChange={e => {
                                    const newSecs = [...form.sections];
                                    newSecs[i].subsections[j].questions[k].correct_answer = e.target.value;
                                    setForm({...form, sections: newSecs});
                                  }}/>
                                )}
                              </div>
                              {(q.type === "mcq_single" || q.type === "mcq_multiple") && (
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  {(q.options || ["", "", "", ""]).map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-500 w-5">{"ABCD"[oIdx]}.</span>
                                      <Input 
                                        className="h-8 text-sm flex-1" 
                                        placeholder={`Option ${"ABCD"[oIdx]} Text`} 
                                        value={opt} 
                                        onChange={e => {
                                          const newSecs = [...form.sections];
                                          if (!newSecs[i].subsections[j].questions[k].options) {
                                            newSecs[i].subsections[j].questions[k].options = ["", "", "", ""];
                                          }
                                          newSecs[i].subsections[j].questions[k].options[oIdx] = e.target.value;
                                          setForm({...form, sections: newSecs});
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter><Button onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Save Paper</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="my-papers" className="mt-6">
        <TabsList>
          <TabsTrigger value="my-papers">My Question Papers</TabsTrigger>
          <TabsTrigger value="local-bank">Local Question Bank (JEE)</TabsTrigger>
        </TabsList>

        <TabsContent value="my-papers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(t => (
              <div key={t.id} className="swiss-card p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-slate-100 grid place-items-center rounded"><FileText size={18}/></div>
                    <button onClick={async()=>{await api.delete(`/question-papers/${t.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                  </div>
                  <div className="font-display text-lg font-bold mt-3">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.subject}</div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Clock size={11}/> {t.duration_minutes} min</span>
                    <span>{t.total_marks} marks</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1 rounded-sm text-xs font-mono" onClick={() => copyCode(t.paper_code)}>
                    <Copy size={14} className="mr-1" /> Code
                  </Button>
                  <Button size="sm" className="flex-1 rounded-sm text-xs bg-indigo-600 hover:bg-indigo-700" onClick={() => handleScheduleOpen(t)}>
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-sm text-xs" onClick={() => downloadPdf(t.paper_code, t.title)}>
                    <Download size={14} /> 
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
            <DialogContent className="rounded-sm max-w-xl">
              <DialogHeader><DialogTitle>Schedule Test</DialogTitle></DialogHeader>
              <div className="space-y-3 py-4">
                <Field label="Test Title"><Input value={scheduleForm.title} onChange={e=>setScheduleForm({...scheduleForm,title:e.target.value})} className="rounded-sm"/></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Subject"><Input value={scheduleForm.subject} onChange={e=>setScheduleForm({...scheduleForm,subject:e.target.value})} className="rounded-sm"/></Field>
                  <Field label="Target Batch (Optional)">
                    <Select value={scheduleForm.batch_id || "none"} onValueChange={v=>setScheduleForm({...scheduleForm,batch_id:v==="none"?"":v})}>
                      <SelectTrigger className="rounded-sm"><SelectValue placeholder="All Batches / Open" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All Batches / Open</SelectItem>
                        {batches.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Type">
                    <Select value={scheduleForm.type} onValueChange={v=>setScheduleForm({...scheduleForm,type:v})}>
                      <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online (Computer)</SelectItem>
                        <SelectItem value="offline">Offline (OMR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Paper Code (Auto-filled)">
                    <Input value={scheduleForm.paper_code} disabled className="rounded-sm bg-slate-50"/>
                  </Field>
                  <Field label="Date & Time">
                    <Input type="datetime-local" value={scheduleForm.test_date} onChange={e=>setScheduleForm({...scheduleForm,test_date:e.target.value})} className="rounded-sm"/>
                  </Field>
                  <Field label="Login Window (mins)">
                    <Input type="number" value={scheduleForm.login_window_minutes} onChange={e=>setScheduleForm({...scheduleForm,login_window_minutes:e.target.value})} className="rounded-sm"/>
                  </Field>
                </div>
                <div className="flex items-center gap-3 mt-4 p-3 bg-slate-50 border rounded-sm">
                  <input type="checkbox" checked={scheduleForm.allow_reattempt} onChange={e=>setScheduleForm({...scheduleForm,allow_reattempt:e.target.checked})} id="reattempt-check" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <label htmlFor="reattempt-check" className="text-sm font-medium text-slate-700 select-none">Allow Reattempts?</label>
                  {scheduleForm.allow_reattempt && (
                    <Input type="number" min="1" className="w-20 ml-auto h-8 text-sm rounded-sm" value={scheduleForm.max_reattempts} onChange={e=>setScheduleForm({...scheduleForm,max_reattempts:Number(e.target.value)})} />
                  )}
                </div>
              </div>
              <DialogFooter><Button onClick={scheduleTest} className="rounded-sm bg-indigo-600 hover:bg-indigo-700">Schedule Now</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No question papers yet</div>}
        </TabsContent>

        <TabsContent value="local-bank" className="mt-6">
          <LocalQuestionBank load={load} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocalQuestionBank({ load }) {
  const subjectsMap = { biolog: "Biology", chemistri: "Chemistry", math: "Math", physic: "Physics" };
  const [subject, setSubject] = useState("biolog");
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  // Generator States
  const [genMode, setGenMode] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genSettings, setGenSettings] = useState({
    title: "", paper_code: `GEN-${Date.now()}`, target_total_marks: 100, 
    target_physic: 25, target_chemistri: 25, target_math: 25, target_biolog: 25,
    duration_minutes: 60, default_marks: 4, default_neg_marks: 1
  });
  const [selectedQs, setSelectedQs] = useState({});

  useEffect(() => { loadQuestions(); }, [subject, page]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await api.get(`/local-question-bank/${subject}?skip=${skip}&limit=${limit}`);
      setQuestions(res.data.questions);
      setTotal(res.data.total);
    } catch (e) { toast.error("Failed to load questions"); } finally { setLoading(false); }
  };

  const toggleQ = (q) => {
    setSelectedQs(prev => {
      const copy = { ...prev };
      const qId = q._id || q.question.substring(0, 50);
      if (copy[qId]) delete copy[qId];
      else copy[qId] = { ...q, assigned_subject: subject };
      return copy;
    });
  };

  const selList = Object.values(selectedQs);
  let curTotal = 0;
  const curSub = { physic: 0, chemistri: 0, math: 0, biolog: 0 };
  selList.forEach(q => {
    curTotal += genSettings.default_marks;
    if (curSub[q.assigned_subject] !== undefined) curSub[q.assigned_subject] += genSettings.default_marks;
  });

  const savePaper = async () => {
    if (!genSettings.title || !genSettings.paper_code) { toast.error("Title and paper code required!"); return; }
    if (selList.length === 0) { toast.error("No questions selected!"); return; }

    const secMap = {};
    selList.forEach((q, idx) => {
      const subName = subjectsMap[q.assigned_subject];
      if (!secMap[subName]) secMap[subName] = { name: subName, subsections: [{ name: "General", questions: [] }] };
      let cAns = q.correct_answer || q.answer;
      if (!cAns && q.options && q.options.length > 0) cAns = q.options[0]; 

      secMap[subName].subsections[0].questions.push({
        id: `genq_${Date.now()}_${idx}`,
        type: q.type || "mcq_single",
        text: q.question,
        image_url: q.image_url,
        marks: genSettings.default_marks,
        negative_marks: genSettings.default_neg_marks,
        options: q.options || ["", "", "", ""],
        correct_answer: cAns
      });
    });

    try {
      await api.post("/question-papers", {
        title: genSettings.title, subject: "Mixed (Generated)", paper_code: genSettings.paper_code,
        duration_minutes: Number(genSettings.duration_minutes), total_marks: curTotal,
        sections: Object.values(secMap)
      });
      toast.success("Question Paper Generated!");
      setGenMode(false); setSelectedQs({}); if (load) load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed to save paper"); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {genMode && (
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 rounded-sm shadow-xl flex items-center justify-between mb-6">
          <div>
            <div className="font-bold">Generator Active: {genSettings.title || "Untitled Paper"}</div>
            <div className="text-xs text-slate-300 mt-1 flex gap-4">
              <span>Selected: {selList.length} Qs</span>
              <span>Total Marks: {curTotal} / {genSettings.target_total_marks}</span>
              <span>Phys: {curSub.physic}/{genSettings.target_physic}</span>
              <span>Chem: {curSub.chemistri}/{genSettings.target_chemistri}</span>
              <span>Math: {curSub.math}/{genSettings.target_math}</span>
              <span>Bio: {curSub.biolog}/{genSettings.target_biolog}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setGenMode(false)} className="rounded-sm">Cancel</Button>
            <Button size="sm" className="rounded-sm bg-indigo-600 hover:bg-indigo-500" onClick={savePaper}>Save Paper</Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        {Object.entries(subjectsMap).map(([key, label]) => (
          <Button key={key} variant={subject === key ? "default" : "outline"} onClick={() => { setSubject(key); setPage(1); }} className="rounded-sm">
            {label}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <div className="text-sm text-slate-500">Total: <span className="font-bold text-slate-900">{total}</span></div>
          {!genMode && (
            <Dialog open={genOpen} onOpenChange={setGenOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-sm bg-indigo-600 hover:bg-indigo-700">Make Question Paper</Button>
              </DialogTrigger>
              <DialogContent className="rounded-sm max-w-xl">
                <DialogHeader><DialogTitle>Question Paper Generator Settings</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <Field label="Paper Title"><Input value={genSettings.title} onChange={e=>setGenSettings({...genSettings, title:e.target.value})} className="rounded-sm" /></Field>
                  <Field label="Paper Code"><Input value={genSettings.paper_code} onChange={e=>setGenSettings({...genSettings, paper_code:e.target.value})} className="rounded-sm" /></Field>
                  <Field label="Target Total Marks"><Input type="number" value={genSettings.target_total_marks} onChange={e=>setGenSettings({...genSettings, target_total_marks:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Duration (mins)"><Input type="number" value={genSettings.duration_minutes} onChange={e=>setGenSettings({...genSettings, duration_minutes:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Default Q Marks"><Input type="number" value={genSettings.default_marks} onChange={e=>setGenSettings({...genSettings, default_marks:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Default Neg Marks"><Input type="number" value={genSettings.default_neg_marks} onChange={e=>setGenSettings({...genSettings, default_neg_marks:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Target Physics"><Input type="number" value={genSettings.target_physic} onChange={e=>setGenSettings({...genSettings, target_physic:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Target Chemistry"><Input type="number" value={genSettings.target_chemistri} onChange={e=>setGenSettings({...genSettings, target_chemistri:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Target Math"><Input type="number" value={genSettings.target_math} onChange={e=>setGenSettings({...genSettings, target_math:Number(e.target.value)})} className="rounded-sm" /></Field>
                  <Field label="Target Biology"><Input type="number" value={genSettings.target_biolog} onChange={e=>setGenSettings({...genSettings, target_biolog:Number(e.target.value)})} className="rounded-sm" /></Field>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setGenMode(true); setGenOpen(false); }} className="rounded-sm bg-indigo-600 hover:bg-indigo-700">Start Selecting Questions</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? ( <div className="py-10 text-center text-slate-500">Loading questions...</div> ) : (
          questions.map((q, idx) => {
            const qId = q._id || q.question.substring(0, 50);
            const isSelected = !!selectedQs[qId];
            return (
              <div key={idx} className={`swiss-card p-5 flex gap-4 transition-all ${isSelected ? "border-indigo-500 bg-indigo-50/20 shadow-sm" : ""}`}>
                {genMode && (
                  <div className="pt-1">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleQ(q)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                  </div>
                )}
                <div className="flex-1 flex gap-4">
                  <div className="font-bold text-slate-400">Q{(page - 1) * limit + idx + 1}.</div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 mb-3" dangerouslySetInnerHTML={{__html: q.question}}></div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oidx) => (
                        <div key={oidx} className="p-3 bg-slate-50 border border-slate-100 rounded text-sm text-slate-600 flex gap-2">
                          <span className="font-bold text-slate-400">{String.fromCharCode(65 + oidx)}.</span>
                          <span dangerouslySetInnerHTML={{__html: opt}}></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {!loading && questions.length === 0 && <div className="text-center py-10 text-slate-500">No questions found.</div>}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} className="rounded-sm">
            <ChevronLeft size={16} className="mr-2"/> Previous
          </Button>
          <div className="text-sm font-semibold text-slate-600">Page {page} of {totalPages}</div>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading} className="rounded-sm">
            Next <ChevronRight size={16} className="ml-2"/>
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
