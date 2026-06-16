import React, { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, CalendarClock, Trash2, FileSpreadsheet, Play, CheckCircle2, Clock, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Tests() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [offlineOpen, setOfflineOpen] = useState(false);
  
  const [form, setForm] = useState({
    title: "", subject: "", type: "online", paper_code: "", 
    test_date: "", login_window_minutes: 30, batch_id: "",
    allow_reattempt: false, max_reattempts: 1
  });

  const [offlineForm, setOfflineForm] = useState({ paper_code: "", file: null });

  // Submissions data for students
  const [submissions, setSubmissions] = useState([]);

  // Test Taking Mode States
  const [mode, setMode] = useState("list"); // list | taking | result
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({}); // { q_id: answer }
  const [resultScore, setResultScore] = useState(null);
  
  // Sidebar Panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  // Timer for active test
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);

  const [reviewSubmission, setReviewSubmission] = useState(null);

  // Anti-cheating states
  const [tabSwitches, setTabSwitches] = useState(0);
  const [cheatFlags, setCheatFlags] = useState([]);
  const [cheatWarning, setCheatWarning] = useState("");

  const load = async () => {
    try {
      if (user?.role === "student") {
        const [r, subRes] = await Promise.all([
          api.get("/tests"),
          api.get("/test-submissions/my-results")
        ]);
        // Set both states at the same time to avoid UI flicker
        setSubmissions(subRes.data);
        setList(r.data);
      } else {
        const r = await api.get("/tests");
        setList(r.data);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    if (mode === "taking") {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitches(prev => prev + 1);
          setCheatFlags(prev => [...prev, "Switched Tab / Minimized"]);
          setCheatWarning("Warning: You left the test window! This has been recorded as a violation.");
        }
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setCheatFlags(prev => [...prev, "Exited Fullscreen"]);
          setCheatWarning("Warning: You exited fullscreen mode! This is not allowed during the test.");
        }
      };

      const handleKeyDown = (e) => {
        // Prevent Ctrl+C, Ctrl+V, Print, PrintScreen
        if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'p')) {
          e.preventDefault();
          setCheatFlags(prev => [...prev, `Attempted Keyboard Shortcut: Ctrl+${e.key.toUpperCase()}`]);
          toast.error("Keyboard shortcuts are disabled during tests.");
        }
        if (e.key === "PrintScreen") {
          e.preventDefault();
          setCheatFlags(prev => [...prev, "Attempted Print Screen"]);
          toast.error("Screenshots are disabled during tests.");
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "taking" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            submitTestAutomatically();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, timeRemaining]);

  const create = async () => {
    if (!form.title || !form.paper_code) { toast.error("Title and Paper Code required"); return; }
    await api.post("/tests", {
      ...form,
      login_window_minutes: Number(form.login_window_minutes)
    });
    toast.success("Test scheduled"); setOpen(false); load();
  };

  const handleOfflineSubmit = async () => {
    if (!offlineForm.paper_code || !offlineForm.file) {
      toast.error("Paper code and file required"); return;
    }
    const formData = new FormData();
    formData.append("paper_code", offlineForm.paper_code);
    formData.append("file", offlineForm.file);
    try {
      const res = await api.post("/tests/offline-evaluate", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(`Evaluated ${res.data.evaluated} submissions`);
      setOfflineOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Evaluation failed");
    }
  };

  const startOnlineTest = async (test) => {
    try {
      // Fetch paper details
      const paperRes = await api.get(`/question-papers/code/${test.paper_code}`);
      const paper = paperRes.data;

      // Extract all questions with section mapping
      const qList = [];
      let absoluteIndex = 1;
      (paper.sections || []).forEach((sec, sIdx) => {
        const subs = sec.subsections || [{ questions: sec.questions || [] }];
        subs.forEach(sub => {
          (sub.questions || []).forEach(q => {
            qList.push({
              ...q,
              sectionName: sec.name || `Section ${String.fromCharCode(65 + sIdx)}`,
              subsectionName: sub.name || "",
              num: absoluteIndex++
            });
          });
        });
      });

      if (qList.length === 0) {
        toast.error("This test paper has no questions!");
        return;
      }

      setQuestions(qList);
      setActiveTest(test);
      setCurrentIdx(0);
      setResponses({});
      setTimeRemaining(paper.duration_minutes * 60 || 3600);
      setMode("taking");
      setSidePanelOpen(true);
      setTabSwitches(0);
      setCheatFlags([]);
      setCheatWarning("");

      // Attempt to enter fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
      
      toast.success("Test started! Fullscreen mode enforced.");
    } catch (e) {
      toast.error("Failed to load test paper. Make sure paper code exists.");
    }
  };

  const submitTestAutomatically = () => {
    toast.warning("Time is up! Submitting your test.");
    submitTest();
  };

  const submitTest = async () => {
    try {
      const body = {
        student_id: user?.student_id || user?.id,
        batch_id: activeTest.batch_id || "",
        responses: responses,
        time_spent_seconds: (activeTest.duration_minutes * 60 || 3600) - timeRemaining,
        tab_switches: tabSwitches,
        cheat_flags: cheatFlags
      };
      
      // Exit fullscreen if we are in it
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
      }
      
      const res = await api.post(`/tests/${activeTest.id}/submit`, body);
      if (res.data.ok) {
        setResultScore(res.data.submission.score);
        setReviewSubmission(res.data.submission);
        setMode("result");
        toast.success("Test submitted successfully!");
        load(); // Refresh submissions
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to submit test");
    }
  };

  const formatRemainingTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Group questions by section for rendering in the side panel
  const sectionsMap = {};
  questions.forEach((q, idx) => {
    const sec = q.sectionName;
    if (!sectionsMap[sec]) {
      sectionsMap[sec] = [];
    }
    sectionsMap[sec].push({ q, idx });
  });

  return (
    <div data-testid="tests-page">
      {mode === "list" && (
        <>
          <PageHeader
            eyebrow="Assessments"
            title="Scheduled Tests"
            subtitle="Schedule tests using Question Paper codes, and evaluate offline sheets."
            actions={user?.role !== "student" && (
              <div className="flex gap-2">
                <Dialog open={offlineOpen} onOpenChange={setOfflineOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-sm"><FileSpreadsheet size={16} className="mr-2"/> Offline Evaluate</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-sm">
                    <DialogHeader><DialogTitle>Evaluate Offline Responses</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <Field label="Paper Code">
                        <Input value={offlineForm.paper_code} onChange={e=>setOfflineForm({...offlineForm, paper_code:e.target.value})} className="rounded-sm"/>
                      </Field>
                      <Field label="Master Excel (Col 1: Student ID, Col 2+: Responses)">
                        <Input type="file" accept=".xlsx" onChange={e=>setOfflineForm({...offlineForm, file:e.target.files[0]})} className="rounded-sm"/>
                      </Field>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleOfflineSubmit} className="rounded-sm bg-slate-950 hover:bg-slate-800">Evaluate</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="test-add" className="rounded-sm bg-slate-950 hover:bg-slate-800"><Plus size={16} className="mr-2"/> Schedule Test</Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-sm max-w-xl">
                    <DialogHeader><DialogTitle className="font-display tracking-tight">Schedule Test</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                      <Field label="Title"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="rounded-sm"/></Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Subject"><Input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className="rounded-sm"/></Field>
                        <Field label="Type">
                          <Select value={form.type} onValueChange={v=>setForm({...form,type:v})}>
                            <SelectTrigger className="rounded-sm"><SelectValue/></SelectTrigger>
                            <SelectContent>{["online","offline"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Paper Code (From Question Papers)"><Input value={form.paper_code} onChange={e=>setForm({...form,paper_code:e.target.value})} className="rounded-sm font-mono"/></Field>
                        <Field label="Batch ID (Optional)"><Input value={form.batch_id} onChange={e=>setForm({...form,batch_id:e.target.value})} className="rounded-sm"/></Field>
                        <Field label="Test Date & Time"><Input type="datetime-local" value={form.test_date} onChange={e=>setForm({...form,test_date:e.target.value})} className="rounded-sm"/></Field>
                        <Field label="Login Window (mins)"><Input type="number" value={form.login_window_minutes} onChange={e=>setForm({...form,login_window_minutes:e.target.value})} className="rounded-sm"/></Field>
                        <div className="col-span-2 flex items-center gap-4 p-3 bg-slate-50 border border-slate-100 rounded">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <input type="checkbox" checked={form.allow_reattempt} onChange={e=>setForm({...form,allow_reattempt:e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                            Allow Reattempts
                          </label>
                          {form.allow_reattempt && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Max Attempts</Label>
                              <Input type="number" min="2" value={form.max_reattempts} onChange={e=>setForm({...form,max_reattempts:Number(e.target.value)})} className="w-20 rounded-sm h-8" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter><Button data-testid="test-save" onClick={create} className="rounded-sm bg-slate-950 hover:bg-slate-800">Schedule</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(t => {
              const testSubmissions = submissions.filter(s => s.test_id === t.id);
              const attemptCount = testSubmissions.length;
              const hasAttempted = attemptCount > 0;
              const canReattempt = t.allow_reattempt && attemptCount < t.max_reattempts;
              
              return (
              <div key={t.id} className="swiss-card p-5 flex flex-col justify-between" data-testid={`test-card-${t.id}`}>
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-slate-100 grid place-items-center rounded"><CalendarClock size={18}/></div>
                    {user?.role !== "student" && (
                      <button onClick={async()=>{await api.delete(`/tests/${t.id}`); load();}} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                    )}
                  </div>
                  <div className="font-display text-lg font-bold mt-3">{t.title}</div>
                  <div className="text-xs text-slate-500">{t.subject} · {t.type} {t.paper_code && `· Paper Code: ${t.paper_code}`}</div>
                  {t.batch_id && <div className="text-[10px] font-mono text-slate-400 mt-1">Batch Code: {t.batch_id}</div>}
                  {t.test_date && <div className="mt-3 text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                    Scheduled: {new Date(t.test_date).toLocaleString()}
                  </div>}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="pill pill-slate">{t.status}</span>
                    {t.allow_reattempt && <span className="text-[10px] font-medium text-slate-500">Max Attempts: {t.max_reattempts}</span>}
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {t.type === "online" && (!hasAttempted || canReattempt) && user?.role === "student" && (
                    <Button 
                      onClick={() => startOnlineTest(t)} 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 rounded-sm flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Play size={12} /> {hasAttempted ? `Reattempt Test (${t.max_reattempts - attemptCount} left)` : "Start Online Test"}
                    </Button>
                  )}
                  {hasAttempted && user?.role === "student" && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setReviewSubmission(testSubmissions[0]);
                        setMode("review");
                      }} 
                      className="w-full font-medium py-1.5 rounded-sm text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                    >
                      View Latest Result
                    </Button>
                  )}
                  {user?.role !== "student" && t.type === "online" && (
                     <Button 
                     onClick={() => startOnlineTest(t)} 
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 rounded-sm flex items-center justify-center gap-1.5 text-xs"
                   >
                     <Play size={12} /> Preview Test
                   </Button>
                  )}
                </div>
              </div>
            )})}
            {list.length === 0 && <div className="empty-state col-span-full text-center text-sm text-slate-500 py-10 border border-dashed border-slate-300">No scheduled tests</div>}
          </div>
        </>
      )}

      {/* ACTIVE TEST MODE */}
      {mode === "taking" && (
        <div 
          className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto items-start relative select-none"
          onCopy={(e) => { e.preventDefault(); toast.error("Copying is disabled!"); setCheatFlags(prev => [...prev, "Attempted Copy"]); }}
          onPaste={(e) => { e.preventDefault(); toast.error("Pasting is disabled!"); setCheatFlags(prev => [...prev, "Attempted Paste"]); }}
          onContextMenu={(e) => { e.preventDefault(); toast.error("Right-click is disabled!"); setCheatFlags(prev => [...prev, "Attempted Right Click"]); }}
        >
          
          {/* Warning Modal */}
          {cheatWarning && (
            <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Security Violation</h2>
                <p className="text-slate-600">{cheatWarning}</p>
                <Button 
                  className="w-full bg-slate-900 hover:bg-slate-800"
                  onClick={() => {
                    setCheatWarning("");
                    if (document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(err => console.warn(err));
                    }
                  }}
                >
                  Acknowledge & Return to Test
                </Button>
              </div>
            </div>
          )}
          
          {/* Main Question Panel */}
          <div className="flex-1 w-full swiss-card p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {questions[currentIdx]?.sectionName} &middot; {questions[currentIdx]?.subsectionName || "General"}
                </span>
                <h1 className="font-display font-black text-xl text-slate-900 mt-1">{activeTest.title}</h1>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSidePanelOpen(!sidePanelOpen)} 
                  className="rounded-sm flex items-center gap-1.5 text-xs"
                >
                  <Menu size={14} /> {sidePanelOpen ? "Hide Panel" : "Show Panel"}
                </Button>
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-sm font-mono font-bold">
                  <Clock size={16} />
                  <span>Time Left: {formatRemainingTime(timeRemaining)}</span>
                </div>
              </div>
            </div>

            {/* Current Question Display */}
            {questions[currentIdx] && (
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">Question {questions[currentIdx].num} of {questions.length}</span>
                    {questions[currentIdx].difficulty && (
                      <span className={`pill ${questions[currentIdx].difficulty === "easy" ? "pill-green" : questions[currentIdx].difficulty === "hard" ? "pill-red" : "pill-amber"}`}>{questions[currentIdx].difficulty}</span>
                    )}
                    <span className="text-xs text-slate-400">{questions[currentIdx].marks} Marks</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{questions[currentIdx].text}</h3>
                  {questions[currentIdx].image_url && (
                    <div className="mt-4">
                      <img src={api.defaults.baseURL + questions[currentIdx].image_url.replace('/api', '')} alt="Question Reference" className="max-h-64 rounded border border-slate-200" />
                    </div>
                  )}
                </div>

                {/* Options */}
                {questions[currentIdx].options && questions[currentIdx].options.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {questions[currentIdx].options.map((opt, oIdx) => {
                      const isSelected = responses[questions[currentIdx].id] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => setResponses({ ...responses, [questions[currentIdx].id]: opt })}
                          className={`p-4 border rounded-sm text-left transition-all ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold shadow-sm"
                              : "border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          <span className="font-mono text-indigo-600 mr-2">{"ABCD"[oIdx]}.</span> {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 max-w-md">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Answer</Label>
                    <Input
                      placeholder="Enter your short answer"
                      value={responses[questions[currentIdx].id] || ""}
                      onChange={e => setResponses({ ...responses, [questions[currentIdx].id]: e.target.value })}
                      className="rounded-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
              <Button
                variant="outline"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="rounded-sm"
              >
                Previous
              </Button>
              
              {currentIdx < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-sm"
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={submitTest}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-sm"
                >
                  Submit Test
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible Sidebar Navigator Panel */}
          {sidePanelOpen && (
            <div className="w-full md:w-72 swiss-card p-5 space-y-4 max-h-[80vh] overflow-y-auto shrink-0 border border-slate-200">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-900">Question Grid</h3>
                <button onClick={() => setSidePanelOpen(false)} className="text-slate-400 hover:text-slate-600 lg:hidden">
                  <X size={16} />
                </button>
              </div>

              {Object.keys(sectionsMap).map(secName => (
                <div key={secName} className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pt-2">{secName}</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {sectionsMap[secName].map(({ q, idx }) => (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-9 h-9 rounded-sm border text-xs font-bold flex items-center justify-center transition-colors ${
                          currentIdx === idx
                            ? "bg-slate-950 border-slate-950 text-white"
                            : responses[q.id]
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {q.num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-300 rounded-sm" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-white border border-slate-200 rounded-sm" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-slate-950 border border-slate-950 rounded-sm" />
                  <span>Current Question</span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* RESULT FEEDBACK SCREEN */}
      {mode === "result" && (
        <div className="max-w-md mx-auto swiss-card p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 grid place-items-center rounded-full mx-auto">
            <CheckCircle2 size={36} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">Test Submitted!</h2>
            <p className="text-sm text-slate-500 mt-2">Your answers have been calculated successfully.</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Score</div>
            <div className="text-4xl font-black text-indigo-600 mt-2">{resultScore}</div>
            <div className="text-xs text-slate-500 mt-1">Points</div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={() => setMode("list")} variant="outline" className="flex-1 rounded-sm">
              Back to Dashboard
            </Button>
            <Button onClick={() => setMode("review")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm">
              Review Answers
            </Button>
          </div>
        </div>
      )}

      {/* DETAILED REVIEW MODE */}
      {mode === "review" && reviewSubmission && (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" size="sm" onClick={() => setMode("list")} className="mb-2 -ml-3 text-slate-500">
                &larr; Back to Tests
              </Button>
              <h1 className="font-display font-black text-2xl text-slate-900">Result Review</h1>
              <p className="text-slate-500">Attempt #{reviewSubmission.attempt_no}</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-6 py-3 rounded-sm text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Score</div>
              <div className="font-display font-black text-2xl">{reviewSubmission.score} <span className="text-sm text-indigo-400 font-medium">/ {reviewSubmission.max_score}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="swiss-card p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{Object.keys(reviewSubmission.questions_data || {}).length}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Qs</div>
            </div>
            <div className="swiss-card p-4 text-center bg-emerald-50/50 border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600">{reviewSubmission.correct_answers}</div>
              <div className="text-xs text-emerald-600/70 font-medium uppercase tracking-wider">Correct</div>
            </div>
            <div className="swiss-card p-4 text-center bg-red-50/50 border-red-100">
              <div className="text-2xl font-bold text-red-600">{reviewSubmission.wrong_answers}</div>
              <div className="text-xs text-red-600/70 font-medium uppercase tracking-wider">Wrong</div>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <h3 className="font-bold text-lg text-slate-900 border-b pb-2">Question Breakdown</h3>
            {Object.entries(reviewSubmission.questions_data || {}).map(([qId, qData], idx) => {
              const studentAns = reviewSubmission.responses[qId];
              const isCorrect = String(studentAns).trim().toLowerCase() === String(qData.correct_answer).trim().toLowerCase();
              const isAttempted = studentAns !== undefined && studentAns !== "";

              return (
                <div key={qId} className={`swiss-card p-6 border-l-4 ${!isAttempted ? "border-l-slate-300" : isCorrect ? "border-l-emerald-500" : "border-l-red-500"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Q{idx + 1}</span>
                        {!isAttempted ? (
                          <span className="pill pill-slate text-[10px]">Unanswered</span>
                        ) : isCorrect ? (
                          <span className="pill pill-green text-[10px]">Correct</span>
                        ) : (
                          <span className="pill pill-red text-[10px]">Incorrect</span>
                        )}
                        <span className="text-xs text-slate-400">{qData.marks} Marks</span>
                      </div>
                      
                      <div className="font-medium text-slate-900 text-lg">{qData.text}</div>
                      
                      {qData.image_url && (
                        <div className="mt-4">
                          <img src={api.defaults.baseURL + qData.image_url.replace('/api', '')} alt="Question Reference" className="max-h-64 rounded border border-slate-200" />
                        </div>
                      )}

                      {qData.options && qData.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                          {qData.options.map((opt, oIdx) => {
                            const isSelected = studentAns === opt;
                            const isActuallyCorrect = qData.correct_answer === opt;
                            
                            let optClass = "border-slate-200 text-slate-600 bg-white";
                            if (isActuallyCorrect) optClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold";
                            else if (isSelected && !isActuallyCorrect) optClass = "border-red-500 bg-red-50 text-red-800";
                            
                            return (
                              <div key={oIdx} className={`p-3 border rounded-sm text-sm ${optClass} flex items-center justify-between`}>
                                <span><span className="font-mono opacity-50 mr-2">{"ABCD"[oIdx]}.</span> {opt}</span>
                                {isSelected && <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Your Answer</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Subjective/Numeric handling if no options */}
                      {(!qData.options || qData.options.length === 0) && (
                        <div className="mt-4 space-y-2">
                          <div className="p-3 border rounded-sm text-sm bg-slate-50 flex items-center justify-between">
                            <span className="text-slate-500">Your Answer: <span className="font-semibold text-slate-900">{studentAns || "—"}</span></span>
                          </div>
                          <div className="p-3 border border-emerald-200 rounded-sm text-sm bg-emerald-50 flex items-center justify-between">
                            <span className="text-emerald-700">Correct Answer: <span className="font-semibold">{qData.correct_answer}</span></span>
                          </div>
                        </div>
                      )}

                      {qData.explanation && (
                        <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-sm">
                          <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">Explanation</div>
                          <div className="text-sm text-blue-900">{qData.explanation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
