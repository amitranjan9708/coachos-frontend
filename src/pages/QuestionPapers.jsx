import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, Clock, Trash2, Download, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function QuestionPapers() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: "", subject: "", duration_minutes: 60, total_marks: 100,
    paper_code: "", sections: []
  });

  const load = () => api.get("/question-papers").then(r => setList(r.data));
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
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
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
                    <Button size="sm" variant="outline" onClick={addSection}>+ Add Section</Button>
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
                            newSecs[i].subsections[j].questions.push({ id: `q_${Date.now()}`, type: "mcq_single", text: "New Question", marks: 1, negative_marks: 0, options: ["A", "B", "C", "D"], correct_answer: "A" });
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
                                  <Input placeholder={q.type === "mcq_multiple" ? "Answers (e.g. A,C)" : "Correct Answer"} value={q.correct_answer} onChange={e => {
                                    const newSecs = [...form.sections];
                                    newSecs[i].subsections[j].questions[k].correct_answer = e.target.value;
                                    setForm({...form, sections: newSecs});
                                  }}/>
                                )}
                              </div>
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
                    <Copy size={14} className="mr-1" /> {t.paper_code}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-sm text-xs" onClick={() => downloadPdf(t.paper_code, t.title)}>
                    <Download size={14} /> 
                  </Button>
                </div>
              </div>
            ))}
            {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No question papers yet</div>}
          </div>
        </TabsContent>

        <TabsContent value="local-bank" className="mt-6">
          <LocalQuestionBank />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocalQuestionBank() {
  const subjectsMap = {
    biolog: "Biology",
    chemistri: "Chemistry",
    math: "Math",
    physic: "Physics",
  };
  
  const [subject, setSubject] = useState("biolog");
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const limit = 20;

  useEffect(() => {
    loadQuestions();
  }, [subject, page]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await api.get(`/local-question-bank/${subject}?skip=${skip}&limit=${limit}`);
      setQuestions(res.data.questions);
      setTotal(res.data.total);
    } catch (e) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        {Object.entries(subjectsMap).map(([key, label]) => (
          <Button 
            key={key} 
            variant={subject === key ? "default" : "outline"}
            onClick={() => { setSubject(key); setPage(1); }}
            className="rounded-sm"
          >
            {label}
          </Button>
        ))}
        <div className="ml-auto text-sm text-slate-500">
          Total Questions: <span className="font-bold text-slate-900">{total}</span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading questions...</div>
        ) : (
          questions.map((q, idx) => (
            <div key={idx} className="swiss-card p-5">
              <div className="flex gap-4">
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
          ))
        )}
        {!loading && questions.length === 0 && (
          <div className="text-center py-10 text-slate-500">No questions found.</div>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={page === 1 || loading}
            className="rounded-sm"
          >
            <ChevronLeft size={16} className="mr-2"/> Previous
          </Button>
          <div className="text-sm font-semibold text-slate-600">
            Page {page} of {totalPages}
          </div>
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={page === totalPages || loading}
            className="rounded-sm"
          >
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
